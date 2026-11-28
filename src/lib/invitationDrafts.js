const STORAGE_BUCKET = 'invitation-media'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const MAX_AUDIO_SIZE = 10 * 1024 * 1024

const mediaTypes = {
  photo: new Set(['image/jpeg', 'image/png', 'image/webp']),
  musicData: new Set(['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-wav']),
}

const extensionFor = (contentType, kind) => {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/webm': 'webm',
  }
  const extension = extensions[contentType]
  if (!extension || !mediaTypes[kind].has(contentType)) {
    throw new Error(kind === 'photo' ? 'Format foto tidak didukung.' : 'Format musik tidak didukung.')
  }
  return extension
}

async function uploadMedia(supabase, userId, draftId, value, kind) {
  if (!value) return null
  if (!value.startsWith('data:')) return value

  const blob = await fetch(value).then((response) => response.blob())
  const contentType = blob.type.toLowerCase()
  const maxSize = kind === 'photo' ? MAX_PHOTO_SIZE : MAX_AUDIO_SIZE
  if (blob.size > maxSize) {
    throw new Error(kind === 'photo' ? 'Ukuran foto maksimal 5 MB.' : 'Ukuran musik maksimal 10 MB.')
  }

  const extension = extensionFor(contentType, kind)
  const path = `${userId}/${draftId}/${kind}.${extension}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    contentType,
    upsert: true,
  })
  if (error) {
    console.error(`Gagal mengunggah ${kind === 'photo' ? 'foto' : 'musik'} rancangan:`, error)
    throw new Error(`Tidak dapat mengunggah ${kind === 'photo' ? 'foto' : 'musik'}. Periksa konfigurasi Supabase Storage lalu coba lagi.`)
  }

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function fetchInvitationDrafts(supabase, userId) {
  const { data, error } = await supabase
    .from('invitation_drafts')
    .select('id, groom_name, bride_name, event_date, venue, city, status, content, created_at, updated_at')
    .eq('owner_id', userId)
    .in('status', ['draft', 'selected'])
    .order('updated_at', { ascending: false })
    .limit(2)

  if (error) {
    console.error('Gagal memuat rancangan dari Supabase:', error)
    throw new Error('Rancangan tidak dapat dimuat. Periksa koneksi dan kebijakan akses database, lalu coba lagi.')
  }

  return (data || []).map((row) => {
    const content = row.content || {}
    return {
      ...content,
      id: row.id,
      status: row.status,
      groom: row.groom_name || '',
      bride: row.bride_name || '',
      eventDate: row.event_date || '',
      venue: row.venue || '',
      city: row.city || '',
      photo: content.photoUrl || '',
      musicData: content.musicUrl || '',
    }
  })
}

export async function saveInvitationDraft(supabase, userId, draftId, form) {
  const id = draftId || crypto.randomUUID()
  const [photoUrl, musicUrl] = await Promise.all([
    uploadMedia(supabase, userId, id, form.photo, 'photo'),
    uploadMedia(supabase, userId, id, form.musicData, 'musicData'),
  ])
  const {
    id: _formId,
    status: _formStatus,
    groom,
    bride,
    eventDate,
    venue,
    city,
    photo: _photo,
    musicData: _musicData,
    ...content
  } = form

  const { data, error } = await supabase
    .from('invitation_drafts')
    .upsert({
      id,
      owner_id: userId,
      status: 'draft',
      groom_name: groom.trim() || null,
      bride_name: bride.trim() || null,
      event_date: eventDate || null,
      venue: venue.trim() || null,
      city: city.trim() || null,
      content: { ...content, photoUrl, musicUrl },
    }, { onConflict: 'id' })
    .select('id, groom_name, bride_name, event_date, venue, city, status, content, created_at, updated_at')
    .single()

  if (error) {
    console.error('Gagal menyimpan rancangan ke Supabase:', error)
    if (error.message?.includes('maksimal 2 rancangan')) {
      throw new Error('Kamu sudah memiliki 2 rancangan. Buka rancangan yang tersimpan untuk mengubahnya.')
    }
    throw new Error('Rancangan tidak dapat disimpan ke Supabase. Periksa koneksi dan kebijakan akses database, lalu coba lagi.')
  }

  return {
    ...data.content,
    id: data.id,
    status: data.status,
    groom: data.groom_name || '',
    bride: data.bride_name || '',
    eventDate: data.event_date || '',
    venue: data.venue || '',
    city: data.city || '',
    photo: data.content?.photoUrl || '',
    musicData: data.content?.musicUrl || '',
  }
}
