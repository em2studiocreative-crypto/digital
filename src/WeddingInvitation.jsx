import { useRef, useState } from 'react'

function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function makeMapsSearchLink(location, city) {
  const query = [location, city].filter(Boolean).join(', ')
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : ''
}

export default function WeddingInvitation({ couple, draft, opened, onOpen, onMusicSettings, rsvp, onRsvp }) {
  const musicPlayer = useRef(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const palettes = {
    forest: ['#f3eddf', '#263c30', '#b8935b'],
    ivory: ['#f7f4ec', '#544b3e', '#a7895e'],
    sage: ['#e8eee5', '#3e5a48', '#b08b58'],
    rose: ['#f2e8e5', '#694d52', '#b78477'],
  }
  const [paper, ink, accent] = palettes[draft?.palette] || palettes.forest
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
  const openSection = (event, item) => {
    if (!opened) {
      event.preventDefault()
      onOpen()
      window.setTimeout(() => document.getElementById(`wedding-${item}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
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
  }

  const designClasses = `layout-${draft?.layout || 'gate'} font-${draft?.fontStyle || 'anggun'} buttons-${draft?.buttonStyle || 'capsule'} ${draft?.fontColor ? 'has-font-color' : ''}`
  if (!opened) return <section className={`wedding-cover ${designClasses}`} style={style}>
    <header className="wedding-cover-heading">
      <span>UNDANGAN<br />PERNIKAHAN</span>
      <button type="button" className={`wedding-cover-music ${draft?.musicData ? 'has-track' : ''}`} onClick={toggleMusic} aria-label={musicPlaying ? 'Jeda musik' : draft?.musicName ? `Putar musik: ${draft.musicName}` : 'Atur musik undangan'}>{musicPlaying ? 'Ⅱ' : '♪'}</button>
    </header>
    <div className={`wedding-portrait ${draft?.layout === 'circle' ? 'portrait-circle' : ''} ${draft?.layout === 'full' ? 'layout-full' : ''} ${draft?.photo ? 'has-photo' : ''}`}>
      {draft?.photo ? <img src={draft.photo} alt="Foto pasangan" /> : <div className="wedding-couple-illustration" role="img" aria-label="Ilustrasi pasangan pengantin">
        <span className="portrait-caption">HARI BAHAGIA KAMI</span>
        <i className="portrait-sun" />
        <i className="portrait-person portrait-person-one" />
        <i className="portrait-person portrait-person-two" />
      </div>}
    </div>
    <div className="wedding-cover-names">
      <span className="wedding-cover-initials">{initials}</span>
      <h1>{couple}</h1>
      <p>{formatDate(draft?.eventDate)}</p>
    </div>
    {(draft?.guestName || draft?.guestMessage) && <p className="wedding-cover-greeting">{draft.guestMessage || `Kepada Yth. ${draft.guestName}`}</p>}
    <nav className="wedding-cover-menu" aria-label="Menu undangan">
      {menu.map((item) => <a key={item} href={`#wedding-${item}`} onClick={(event) => openSection(event, item)}>
        <span aria-hidden="true">{item === 'acara' ? '▦' : item === 'keluarga' ? '♧' : item === 'peta' ? '⌖' : '♡'}</span>
        {menuLabels[item] || item}
      </a>)}
    </nav>
    {draft?.musicData && <audio ref={musicPlayer} src={draft.musicData} loop preload="none" />}
  </section>

  return <article className={`wedding-page ${designClasses}`} style={style}>
    <section className="wedding-hero">
      {draft?.photo ? <img src={draft.photo} alt="Foto pasangan" /> : <div className="wedding-cover-art" aria-hidden="true" />}
      <div className="wedding-hero-copy"><span>THE WEDDING OF</span><h1>{couple}</h1><p>{formatDate(draft?.eventDate)}</p></div>
    </section>
    <nav className="wedding-menu" aria-label="Navigasi undangan">
      {menu.map((item) => <a key={item} href={`#wedding-${item}`}>{menuLabels[item] || item}</a>)}
    </nav>
    <section className="wedding-welcome">
      <span className="wedding-flourish" aria-hidden="true">✦</span>
      <p className="wedding-kicker">DENGAN PENUH RASA SYUKUR</p>
      <h2>Hari istimewa kami</h2>
      <p>{draft?.poetic || 'Dengan penuh rasa syukur, kami mengundang keluarga serta sahabat untuk hadir dan berbagi kebahagiaan bersama kami.'}</p>
      {(draft?.guestName || draft?.guestMessage) && <div className="wedding-guest-message">{draft.guestName && <strong>Kepada {draft.guestName}</strong>}{draft.guestMessage && <p>{draft.guestMessage}</p>}</div>}
    </section>
    <section id="wedding-keluarga" className="wedding-couple-section">
      <p className="wedding-kicker">DUA HATI, SATU CERITA</p>
      <div className="wedding-couple-names">
        <div><h2>{draft?.groom || 'Mempelai pria'}</h2>{draft?.groomParents && <p>Putra dari<br />{draft.groomParents}</p>}</div>
        <span>&amp;</span>
        <div><h2>{draft?.bride || 'Mempelai wanita'}</h2>{draft?.brideParents && <p>Putri dari<br />{draft.brideParents}</p>}</div>
      </div>
    </section>
    <section id="wedding-acara" className="wedding-events">
      <p className="wedding-kicker">CATAT TANGGALNYA</p>
      <h2>Rangkaian acara</h2>
      <div className="wedding-event-list">{events.map((event) => <section className="wedding-event-card" key={event.title}>
        <span className="wedding-event-mark">✦</span>
        <h3>{event.title}</h3>
        <p className="wedding-event-date">{formatDate(event.date) || 'Tanggal menyusul'}{event.time && ` · ${event.time} WIB`}</p>
        <p className="wedding-event-venue">{event.venue || 'Nama tempat'}{event.address && <><br />{event.address}</>}{draft?.city && <><br />{draft.city}</>}</p>
        {event.mapLink && <a className="wedding-map-link" href={event.mapLink} target="_blank" rel="noreferrer"><span aria-hidden="true">⌖</span> Buka peta</a>}
      </section>)}</div>
    </section>
    <section id="wedding-doa" className="wedding-closing">
      <p>Merupakan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.</p>
      {draft?.prayer && <p className="wedding-prayer">{draft.prayer}</p>}
      <h2>{couple}</h2>
      <span className="wedding-kicker">SAMPAI JUMPA DI HARI BAHAGIA</span>
    </section>
    <section id="wedding-peta" className="wedding-map-section">
      <p className="wedding-kicker">LOKASI ACARA</p>
      <h2>Temukan tempatnya</h2>
      {events.map((event) => event.mapLink && <a key={event.title} className="wedding-map-link" href={event.mapLink} target="_blank" rel="noreferrer"><span aria-hidden="true">⌖</span> {event.title} · Buka peta</a>)}
    </section>
    {onRsvp && <section className="wedding-rsvp"><p className="wedding-kicker">KONFIRMASI KEHADIRAN</p><h2>Bisakah kami menantikan kehadiranmu?</h2>{rsvp ? <p className="rsvp-success">Terima kasih, konfirmasi tersimpan.</p> : <button className="primary-button full" onClick={onRsvp}>Konfirmasi kehadiran</button>}</section>}
  </article>
}
