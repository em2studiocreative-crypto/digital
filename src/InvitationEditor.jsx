import { useEffect, useRef, useState } from 'react'

const palettes = [
  { id: 'forest', label: 'Rimbun', paper: '#f3eddf', ink: '#263c30', accent: '#b8935b' },
  { id: 'ivory', label: 'Gading', paper: '#f7f4ec', ink: '#544b3e', accent: '#a7895e' },
  { id: 'sage', label: 'Sage', paper: '#e8eee5', ink: '#3e5a48', accent: '#b08b58' },
  { id: 'rose', label: 'Mawar', paper: '#f2e8e5', ink: '#694d52', accent: '#b78477' },
]

const menuItems = [
  { id: 'acara', label: 'Acara' },
  { id: 'keluarga', label: 'Keluarga' },
  { id: 'peta', label: 'Peta' },
  { id: 'doa', label: 'Doa' },
]

const orderedMenu = (order) => {
  const ids = Array.isArray(order) ? order : menuItems.map((item) => item.id)
  return [...ids.filter((id) => menuItems.some((item) => item.id === id)), ...menuItems.map((item) => item.id).filter((id) => !ids.includes(id))]
}

function Field({ id, label, value, onChange, type = 'text', placeholder, required = false, multiline = false }) {
  const Tag = multiline ? 'textarea' : 'input'
  return <label className={`unified-field ${value ? 'has-value' : ''}`} htmlFor={id}>
    <span>{label}{required && <i>Wajib</i>}</span>
    <Tag id={id} type={multiline ? undefined : type} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
  </label>
}

export default function InvitationEditor({ form, setForm, onBack, onSave, initialPanel = 'data', Icon, VenueMapPicker }) {
  const [activePanel, setActivePanel] = useState(initialPanel)
  const [mapStatus, setMapStatus] = useState('')
  const [mapError, setMapError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [formError, setFormError] = useState('')
  const photoInput = useRef(null)
  const audioInput = useRef(null)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const palette = palettes.find((item) => item.id === form.palette) || palettes[0]
  const menuOrder = orderedMenu(form.menuOrder)
  const save = () => {
    const required = [
      ['groom', 'nama lengkap mempelai pria'],
      ['bride', 'nama lengkap mempelai wanita'],
      ['eventDate', 'tanggal pernikahan'],
    ]
    const missing = required.find(([key]) => !form[key]?.trim())
    if (missing) {
      setFormError(`Lengkapi ${missing[1]} terlebih dahulu.`)
      document.getElementById(missing[0] === 'eventDate' ? 'event-date' : missing[0])?.focus()
      return
    }
    setFormError('')
    if (onSave() === false) setFormError('Batas rancangan tercapai. Kembali ke beranda dan buka rancangan untuk mengedit.')
  }

  useEffect(() => {
    const address = form.address?.trim()
    if (!address || address.length < 5) {
      setMapStatus('')
      return undefined
    }
    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setMapStatus('Mencari lokasi…')
      try {
        const query = [address, form.venue, form.city, 'Indonesia'].filter(Boolean).join(', ')
        const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'id' })
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Layanan pencarian alamat merespons ${response.status}`)
        const [result] = await response.json()
        if (controller.signal.aborted) return
        const latitude = Number(result?.lat)
        const longitude = Number(result?.lon)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setMapStatus('Alamat belum ditemukan. Pilih titik langsung di peta.')
          return
        }
        update('latitude', latitude)
        update('longitude', longitude)
        update('mapLink', `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
        setMapStatus('Titik peta diperbarui dari alamat.')
        setMapError('')
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Gagal mencari alamat pada peta:', error)
        setMapStatus('Pencarian alamat gagal. Kamu tetap dapat memilih titik di peta.')
      }
    }, 1000)
    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [form.address, form.city, form.venue])

  const handlePhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Pilih foto berformat JPG, PNG, atau WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran foto maksimal 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setUploadError('Foto tidak dapat dibaca. Coba pilih file lain.')
        return
      }
      update('photo', reader.result)
      setUploadError('')
    }
    reader.onerror = () => setUploadError('Foto tidak dapat dibaca. Coba pilih file lain.')
    reader.readAsDataURL(file)
  }

  const handleAudio = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      setUploadError('Pilih file musik dengan format audio.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran musik maksimal 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setUploadError('File musik tidak dapat dibaca.')
        return
      }
      update('musicData', reader.result)
      update('musicName', file.name)
      update('music', 'custom')
      setUploadError('')
    }
    reader.onerror = () => setUploadError('File musik tidak dapat dibaca.')
    reader.readAsDataURL(file)
  }

  const chooseLocation = (latitude, longitude) => {
    update('latitude', latitude)
    update('longitude', longitude)
    update('mapLink', `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
    setMapStatus('Titik lokasi berhasil diperbarui.')
  }

  const moveMenu = (index, direction) => {
    const next = [...menuOrder]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    update('menuOrder', next)
  }

  return <section className="plain-screen unified-editor" style={{ '--invite-paper': palette.paper, '--invite-ink': palette.ink, '--invite-accent': palette.accent, '--invite-font': form.fontColor || palette.ink }}>
    <header className="unified-editor-header">
      <button className="icon-button" onClick={onBack} aria-label="Kembali ke beranda"><Icon name="back" /></button>
      <div className="unified-editor-brand"><img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" /><span><small>UNDANGANKU</small><strong>Undangan Pernikahan</strong></span></div>
      <button className="unified-save-button" type="button" onClick={save}>Simpan</button>
    </header>

    <div className="unified-editor-content">
      <section className={`unified-cover layout-${form.layout || 'gate'}`} aria-label="Pratinjau sampul undangan">
        {form.photo ? <img src={form.photo} alt="Foto pasangan" /> : <div className="unified-cover-art" aria-hidden="true"><span>✦</span></div>}
        <div className="unified-cover-copy">
          <span>UNDANGAN PERNIKAHAN</span>
          <h1>{form.groomNickname || form.groom || 'Nama Mempelai'} <i>&amp;</i> {form.brideNickname || form.bride || 'Nama Mempelai'}</h1>
          <p>{form.eventDate ? new Date(`${form.eventDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal pernikahan'}</p>
        </div>
        <button type="button" className="unified-audio-toggle" onClick={() => setActivePanel('music')} aria-label="Atur musik undangan"><Icon name="play" size={14} /></button>
      </section>

      <nav className="unified-invitation-nav" aria-label="Bagian undangan">
        {menuOrder.map((id) => <span key={id}>{menuItems.find((item) => item.id === id)?.label}</span>)}
      </nav>

      <div className="unified-editor-intro">
        <p className="eyebrow">Ruang penyuntingan</p>
        <h1>Rangkai undanganmu.</h1>
        <p>Isi cerita, sesuaikan tampilannya, lalu lihat hasilnya sebelum dibagikan.</p>
      </div>

      <div className="unified-panel-tabs" role="tablist" aria-label="Pengaturan undangan">
        {[
          ['data', 'Isi data', 'file'],
          ['appearance', 'Tampilan', 'palette'],
          ['music', 'Musik', 'play'],
        ].map(([id, label, icon]) => <button key={id} type="button" role="tab" aria-selected={activePanel === id} className={activePanel === id ? 'active' : ''} onClick={() => setActivePanel(id)}><Icon name={icon} size={17} />{label}</button>)}
      </div>

      {activePanel === 'data' && <div className="unified-panel" role="tabpanel">
        <section className="unified-section">
          <header><span>01</span><div><h2>Nama pasangan</h2><p>Nama yang akan tampil di undangan.</p></div></header>
          <div className="unified-fields two">
            <Field id="groom-nickname" label="Nama panggilan pria" value={form.groomNickname} onChange={(value) => update('groomNickname', value)} placeholder="Contoh: Dimas" />
            <Field id="bride-nickname" label="Nama panggilan wanita" value={form.brideNickname} onChange={(value) => update('brideNickname', value)} placeholder="Contoh: Laras" />
            <Field id="groom" label="Nama lengkap pria" value={form.groom} onChange={(value) => update('groom', value)} placeholder="Nama lengkap mempelai pria" required />
            <Field id="bride" label="Nama lengkap wanita" value={form.bride} onChange={(value) => update('bride', value)} placeholder="Nama lengkap mempelai wanita" required />
          </div>
        </section>
        <section className="unified-section">
          <header><span>02</span><div><h2>Hari dan acara</h2><p>Atur jadwal Akad dan Resepsi.</p></div></header>
          <div className="unified-fields two">
            <Field id="event-date" label="Tanggal pernikahan" type="date" value={form.eventDate} onChange={(value) => update('eventDate', value)} required />
            <Field id="akad-time" label="Waktu Akad" type="time" value={form.akadTime} onChange={(value) => update('akadTime', value)} />
            <Field id="reception-date" label="Tanggal Resepsi" type="date" value={form.receptionDate} onChange={(value) => update('receptionDate', value)} />
            <Field id="reception-time" label="Waktu Resepsi" type="time" value={form.receptionTime} onChange={(value) => update('receptionTime', value)} />
            <Field id="reception-venue" label="Tempat Resepsi (opsional)" value={form.receptionVenue} onChange={(value) => update('receptionVenue', value)} placeholder="Kosongkan jika di tempat yang sama" />
            <Field id="reception-address" label="Alamat Resepsi (opsional)" value={form.receptionAddress} onChange={(value) => update('receptionAddress', value)} placeholder="Alamat lengkap lokasi resepsi" />
          </div>
        </section>
        <section className="unified-section">
          <header><span>03</span><div><h2>Tempat acara</h2><p>Titik peta akan mengikuti alamat yang kamu isi.</p></div></header>
          <div className="unified-fields two">
            <Field id="venue" label="Nama tempat" value={form.venue} onChange={(value) => update('venue', value)} placeholder="Nama gedung atau lokasi" />
            <Field id="city" label="Kota" value={form.city} onChange={(value) => update('city', value)} placeholder="Kota acara" />
            <div className="wide-field"><Field id="address" label="Alamat lengkap" value={form.address} onChange={(value) => update('address', value)} placeholder="Jalan, nomor, kelurahan, kecamatan" multiline /></div>
          </div>
          {mapStatus && <p className="map-status" role="status">{mapStatus}</p>}
          {VenueMapPicker && <div className="unified-map-wrap"><VenueMapPicker latitude={form.latitude} longitude={form.longitude} onPick={chooseLocation} /></div>}
          <button type="button" className="map-location-button" onClick={() => {
            if (!navigator.geolocation) { setMapError('Browser tidak mendukung akses lokasi.'); return }
            navigator.geolocation.getCurrentPosition(({ coords }) => chooseLocation(coords.latitude, coords.longitude), (error) => {
              const messages = { 1: 'Izin lokasi belum diberikan.', 2: 'Lokasi perangkat tidak tersedia.', 3: 'Pencarian lokasi terlalu lama.' }
              setMapError(messages[error.code] || 'Lokasi perangkat tidak dapat ditemukan.')
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
          }}><Icon name="pin" size={17} /> Gunakan lokasi saya</button>
          {mapError && <p className="field-error" role="alert">{mapError}</p>}
          {form.mapLink && <a className="map-link-value" href={form.mapLink} target="_blank" rel="noreferrer">Buka titik lokasi di Google Maps</a>}
        </section>
        <section className="unified-section">
          <header><span>04</span><div><h2>Keluarga</h2><p>Nama orang tua kedua mempelai.</p></div></header>
          <div className="unified-fields">
            <Field id="groom-parents" label="Orang tua mempelai pria" value={form.groomParents} onChange={(value) => update('groomParents', value)} placeholder="Nama ayah dan ibu" />
            <Field id="bride-parents" label="Orang tua mempelai wanita" value={form.brideParents} onChange={(value) => update('brideParents', value)} placeholder="Nama ayah dan ibu" />
          </div>
        </section>
        <section className="unified-section">
          <header><span>05</span><div><h2>Kata dan doa</h2><p>Tambahkan pesan yang ingin disampaikan.</p></div></header>
          <div className="unified-fields">
            <Field id="poetic" label="Kata pengantar" value={form.poetic} onChange={(value) => update('poetic', value)} placeholder="Tuliskan pesan singkat tentang hari bahagia kalian." multiline />
            <Field id="prayer" label="Doa untuk pasangan" value={form.prayer} onChange={(value) => update('prayer', value)} placeholder="Tuliskan doa atau harapan." multiline />
          </div>
        </section>
        <section className="unified-section">
          <header><span>06</span><div><h2>Pesan undangan</h2><p>Personalisasi sapaan ketika membagikan link.</p></div></header>
          <div className="unified-fields">
            <Field id="guest-name" label="Nama tamu" value={form.guestName} onChange={(value) => update('guestName', value)} placeholder="Nama tamu undangan" />
            <Field id="guest-message" label="Pesan untuk tamu" value={form.guestMessage} onChange={(value) => update('guestMessage', value)} placeholder="Contoh: Dengan hormat, kami mengundang..." multiline />
          </div>
        </section>
      </div>}

      {activePanel === 'appearance' && <div className="unified-panel" role="tabpanel">
        <section className="unified-section">
          <header><span>01</span><div><h2>Foto sampul</h2><p>Tambahkan foto atau gunakan ornamen tanpa foto.</p></div></header>
          <input ref={photoInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
          <button type="button" className="unified-upload" onClick={() => photoInput.current?.click()}><Icon name="camera" size={20} /><span><strong>{form.photo ? 'Ganti foto pasangan' : 'Unggah foto pasangan'}</strong><small>JPG, PNG, WebP · maksimal 5 MB</small></span><Icon name="chevron" size={18} /></button>
          {form.photo && <button className="unified-remove" type="button" onClick={() => update('photo', '')}>Hapus foto</button>}
          {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
        </section>
        <section className="unified-section">
          <header><span>02</span><div><h2>Tata letak</h2><p>Pilih susunan sampul, tanpa galeri template terpisah.</p></div></header>
          <div className="layout-options" role="group" aria-label="Tata letak sampul">
            {[['gate', 'Gapura'], ['full', 'Foto penuh'], ['circle', 'Lingkar']].map(([value, label]) => <button key={value} type="button" className={form.layout === value ? 'active' : ''} aria-pressed={form.layout === value} onClick={() => update('layout', value)}><span className={`layout-sample sample-${value}`} aria-hidden="true" /><strong>{label}</strong></button>)}
          </div>
        </section>
        <section className="unified-section">
          <header><span>03</span><div><h2>Warna undangan</h2><p>Palet lembut dengan identitas krem, hijau, dan emas.</p></div></header>
          <div className="palette-options" role="group" aria-label="Pilih warna undangan">
            {palettes.map((item) => <button type="button" key={item.id} className={palette.id === item.id ? 'active' : ''} aria-pressed={palette.id === item.id} onClick={() => setForm((current) => ({ ...current, palette: item.id, fontColor: item.ink }))}><span style={{ '--swatch-paper': item.paper, '--swatch-ink': item.ink, '--swatch-accent': item.accent }} /><strong>{item.label}</strong></button>)}
          </div>
          <label className="unified-select-label">Warna tulisan<select value={form.fontColor || palette.ink} onChange={(event) => update('fontColor', event.target.value)}><option value={palette.ink}>Hijau / warna utama</option><option value="#765b4a">Cokelat klasik</option><option value="#414442">Abu arang</option><option value="#743f49">Merah marun</option></select></label>
        </section>
        <section className="unified-section">
          <header><span>04</span><div><h2>Gaya tulisan dan tombol</h2><p>Pilih karakter tipografi dan bentuk tombol.</p></div></header>
          <div className="unified-choice-row"><label>Gaya huruf<select value={form.fontStyle || 'anggun'} onChange={(event) => update('fontStyle', event.target.value)}><option value="anggun">Anggun</option><option value="klasik">Klasik</option><option value="modern">Modern</option></select></label><label>Bentuk tombol<select value={form.buttonStyle || 'capsule'} onChange={(event) => update('buttonStyle', event.target.value)}><option value="capsule">Kapsul</option><option value="square">Kotak</option><option value="icon">Ikon</option></select></label></div>
        </section>
        <section className="unified-section">
          <header><span>05</span><div><h2>Urutan menu</h2><p>Atur susunan bagian yang dilihat tamu.</p></div></header>
          <ol className="menu-order-list">{menuOrder.map((id, index) => <li key={id}><span>{index + 1}</span><strong>{menuItems.find((item) => item.id === id)?.label}</strong><button type="button" aria-label={`Pindahkan ${id} ke atas`} disabled={index === 0} onClick={() => moveMenu(index, -1)}>↑</button><button type="button" aria-label={`Pindahkan ${id} ke bawah`} disabled={index === menuOrder.length - 1} onClick={() => moveMenu(index, 1)}>↓</button></li>)}</ol>
        </section>
      </div>}

      {activePanel === 'music' && <div className="unified-panel" role="tabpanel">
        <section className="unified-section">
          <header><span>♪</span><div><h2>Musik undangan</h2><p>Tambahkan lagu milikmu untuk diputar saat undangan dibuka.</p></div></header>
          <div className="music-choice">
            <label><input type="radio" name="music" checked={(form.music || 'none') === 'none'} onChange={() => { update('music', 'none'); update('musicData', ''); update('musicName', '') }} /><span><strong>Tanpa musik</strong><small>Undangan dibuka tanpa suara.</small></span></label>
            <label><input type="radio" name="music" checked={form.music === 'custom'} onChange={() => audioInput.current?.click()} /><span><strong>Lagu sendiri</strong><small>{form.musicName || 'Pilih file musik dari perangkat.'}</small></span></label>
          </div>
          <input ref={audioInput} className="visually-hidden" type="file" accept="audio/*" onChange={handleAudio} />
          {form.musicData && <audio className="unified-audio-player" controls src={form.musicData}>Browser tidak mendukung pemutar audio.</audio>}
          {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
          <p className="unified-note">File musik maksimal 10 MB dan tersimpan bersama rancangan pada sesi ini.</p>
        </section>
      </div>}
      {formError && <p className="field-error unified-form-error" role="alert">{formError}</p>}
    </div>

    <footer className="unified-editor-footer">
      <button type="button" className="unified-secondary-button" onClick={() => setActivePanel(activePanel === 'appearance' ? 'data' : 'appearance')}><Icon name="palette" size={17} /> Atur tema</button>
      <button type="button" className="unified-primary-button" onClick={save}><Icon name="eye" size={17} /> Pratinjau undangan</button>
    </footer>
  </section>
}
