import { useEffect, useRef, useState } from 'react'

function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function makeMapsSearchLink(location, city) {
  const query = [location, city].filter(Boolean).join(', ')
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : ''
}

export default function WeddingInvitation({ couple, draft, opened, onMusicSettings, onChoosePhoto, rsvp, onRsvp }) {
  const musicPlayer = useRef(null)
  const sectionTrigger = useRef(null)
  const sectionBackButton = useRef(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const palettes = {
    forest: ['#f3eddf', '#263c30', '#b8935b'],
    ivory: ['#f7f4ec', '#544b3e', '#a7895e'],
    sage: ['#e8eee5', '#3e5a48', '#b08b58'],
    rose: ['#f2e8e5', '#694d52', '#b78477'],
  }
  const [paper, ink, accent] = palettes[draft?.palette] || palettes.forest
  const [activeSection, setActiveSection] = useState(null)
  const style = {
    '--invite-paper': paper,
    '--invite-ink': ink,
    '--invite-accent': accent,
    ...(draft?.fontColor ? { '--invite-font-color': draft.fontColor } : {}),
  }
  const hasReception = Boolean(draft?.receptionDate || draft?.receptionTime || draft?.receptionVenue || draft?.receptionAddress)
  const events = [
    { title: 'Akad Nikah', date: draft?.eventDate, time: draft?.akadTime, venue: draft?.venue, address: draft?.address, mapLink: draft?.mapLink || makeMapsSearchLink(draft?.address || draft?.venue, draft?.city) },
    ...(hasReception ? [{ title: 'Resepsi', date: draft?.receptionDate, time: draft?.receptionTime, venue: draft?.receptionVenue || draft?.venue, address: draft?.receptionAddress || draft?.address, mapLink: makeMapsSearchLink(draft?.receptionAddress || draft?.receptionVenue || draft?.address || draft?.venue, draft?.city) }] : []),
  ]
  const firstName = draft?.groomNickname || draft?.groom?.split(/\s+/)[0] || 'M'
  const secondName = draft?.brideNickname || draft?.bride?.split(/\s+/)[0] || 'M'
  const initials = `${firstName[0] || 'M'} & ${secondName[0] || 'M'}`
  const menu = Array.isArray(draft?.menuOrder) ? draft.menuOrder : ['acara', 'keluarga', 'peta', 'doa']
  const menuLabels = { acara: 'Acara', keluarga: 'Keluarga', peta: 'Peta', doa: 'Doa' }
  const toggleMusic = async () => {
    if (!draft?.musicData) {
      onMusicSettings?.()
      return
    }
    if (!musicPlayer.current) return
    try {
      if (musicPlaying) {
        musicPlayer.current.pause()
        setMusicPlaying(false)
      } else {
        await musicPlayer.current.play()
        setMusicPlaying(true)
      }
    } catch (error) {
      console.error('Gagal memutar musik undangan:', error)
    }
  }
  const openSection = (event, item) => {
    event.preventDefault()
    sectionTrigger.current = event.currentTarget
    setActiveSection(item)
  }
  const closeSection = () => {
    setActiveSection(null)
    sectionTrigger.current?.focus()
  }
  useEffect(() => {
    if (!activeSection) return undefined
    sectionBackButton.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeSection()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeSection])
  const sectionTitles = { acara: 'Acara', keluarga: 'Keluarga Mempelai', peta: 'Lokasi', doa: 'Doa dan Harapan' }
  const eventDaysRemaining = () => {
    if (!draft?.eventDate) return null
    const eventDay = new Date(`${draft.eventDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.round((eventDay.getTime() - today.getTime()) / 86400000)
  }
  const sectionContent = () => {
    if (activeSection === 'acara') {
      const daysRemaining = eventDaysRemaining()
      return <>
        <p className="wedding-sheet-date">{formatDate(draft?.eventDate) || 'Tanggal acara belum diatur'}</p>
        <div className="wedding-sheet-event-list">{events.map((event) => <section className="wedding-sheet-event" key={event.title}>
          <strong>{event.title}</strong>
          {event.date && event.date !== draft?.eventDate && <p>{formatDate(event.date)}</p>}
          <p>{event.time ? `Pukul ${event.time} WIB` : 'Waktu belum diatur'}</p>
          <p>{event.venue || 'Tempat belum diatur'}</p>
          {(event.address || draft?.city) && <p>{[event.address, draft?.city].filter(Boolean).join(', ')}</p>}
        </section>)}</div>
        {daysRemaining !== null && daysRemaining >= 0 && <p className="wedding-sheet-countdown">{daysRemaining ? `${daysRemaining} hari lagi` : 'Hari ini'}</p>}
      </>
    }

    if (activeSection === 'keluarga') return <div className="wedding-sheet-event-list">
      {[['Mempelai wanita', draft?.bride, draft?.brideParents], ['Mempelai pria', draft?.groom, draft?.groomParents]].map(([label, name, parents]) => <section className="wedding-sheet-event" key={label}>
        <strong>{name || label}</strong>
        <p>{parents || label}</p>
      </section>)}
    </div>

    if (activeSection === 'peta') return <div className="wedding-sheet-event-list">
      {events.map((event) => {
        const mapLink = event.mapLink || makeMapsSearchLink(event.address || event.venue, draft?.city)
        return <section className="wedding-sheet-event" key={event.title}>
          <strong>{event.title}</strong>
          <p>{event.venue || 'Tempat belum diatur'}</p>
          {(event.address || draft?.city) && <p>{[event.address, draft?.city].filter(Boolean).join(', ')}</p>}
          {mapLink && <a className="wedding-sheet-link" href={mapLink} target="_blank" rel="noreferrer">Buka di Google Maps</a>}
        </section>
      })}
    </div>

    if (activeSection === 'doa') return <>
      <p className="wedding-sheet-poem">{draft?.poetic || 'Dua langkah yang dulu berjalan sendiri, kini sepakat pulang ke rumah yang sama.'}</p>
      <p className="wedding-sheet-flourish" aria-hidden="true">✦</p>
      <p>{draft?.prayer || 'Semoga hari bahagia ini menjadi awal perjalanan yang penuh kasih dan kebaikan.'}</p>
      <p className="wedding-sheet-countdown">{couple}</p>
    </>

    return null
  }
  const sectionSheet = activeSection && <section className={`wedding-section-sheet ${opened ? 'is-guest-preview' : ''}`} role="dialog" aria-modal="true" aria-labelledby="wedding-sheet-title" style={style}>
    <h2 id="wedding-sheet-title">{sectionTitles[activeSection] || 'Undangan'}</h2>
    <div className="wedding-sheet-content">{sectionContent()}</div>
    <button type="button" className="wedding-sheet-back" ref={sectionBackButton} onClick={closeSection}>Kembali</button>
  </section>

  const designClasses = `layout-${draft?.layout || 'gate'} font-${draft?.fontStyle || 'anggun'} buttons-${draft?.buttonStyle || 'capsule'} ${draft?.fontColor ? 'has-font-color' : ''}`
  return <section className={`wedding-cover ${designClasses}`} style={style}>
    <header className="wedding-cover-heading">
      <span>UNDANGAN<br />PERNIKAHAN</span>
      <button type="button" className={`wedding-cover-music ${draft?.musicData ? 'has-track' : ''}`} onClick={toggleMusic} aria-label={musicPlaying ? 'Jeda musik' : draft?.musicName ? `Putar musik: ${draft.musicName}` : 'Atur musik undangan'}>{musicPlaying ? 'Ⅱ' : '♪'}</button>
    </header>
    <div
      className={`wedding-portrait ${draft?.layout === 'circle' ? 'portrait-circle' : ''} ${draft?.layout === 'full' ? 'layout-full' : ''} ${draft?.photo ? 'has-photo' : ''} ${onChoosePhoto ? 'is-editable' : ''}`}
      onClick={onChoosePhoto}
      onKeyDown={onChoosePhoto ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onChoosePhoto()
        }
      } : undefined}
      role={onChoosePhoto ? 'button' : undefined}
      tabIndex={onChoosePhoto ? 0 : undefined}
      aria-label={onChoosePhoto ? 'Pilih foto pasangan' : undefined}
    >
      {draft?.photo ? <img
        src={draft.photo}
        alt="Foto pasangan"
        style={{
          objectPosition: `${draft.photoX ?? 50}% ${draft.photoY ?? 50}%`,
          transform: `scale(${(draft.photoZoom || 100) / 100})`,
          transformOrigin: `${draft.photoX ?? 50}% ${draft.photoY ?? 50}%`,
        }}
      /> : <div className="wedding-couple-illustration" role="img" aria-label="Ilustrasi pasangan pengantin">
        <span className="portrait-caption">HARI BAHAGIA KAMI</span>
        <i className="portrait-sun" />
        <i className="portrait-person portrait-person-one" />
        <i className="portrait-person portrait-person-two" />
      </div>}
    </div>
    <div className="wedding-cover-names">
      <span className="wedding-cover-initials">{initials}</span>
      <h1>{couple}</h1>
      <p>{formatDate(draft?.eventDate) || 'Tanggal acara'}</p>
    </div>
    <p className="wedding-cover-greeting">{draft?.guestMessage || `Kepada Yth. ${draft?.guestName || 'Nama tamu'}`}</p>
    <nav className="wedding-cover-menu" aria-label="Menu undangan">
      {menu.map((item) => <a key={item} href={`#wedding-${item}`} onClick={(event) => openSection(event, item)}>
        <span aria-hidden="true">{item === 'acara' ? '▦' : item === 'keluarga' ? '♧' : item === 'peta' ? '⌖' : '♡'}</span>
        {menuLabels[item] || item}
      </a>)}
    </nav>
    {draft?.musicData && <audio ref={musicPlayer} src={draft.musicData} loop preload="none" />}
    {sectionSheet}
  </section>
}
