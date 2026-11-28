function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function makeMapsSearchLink(location, city) {
  const query = [location, city].filter(Boolean).join(', ')
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : ''
}

export default function WeddingInvitation({ couple, draft, opened, onOpen, rsvp, onRsvp }) {
  const isIslamic = draft?.template?.type === 'Islami'
  const animation = isIslamic ? draft?.animation || 'glow' : 'none'
  const colors = draft?.template?.colors || ['#f3eddf', '#263c30', '#b8935b']
  const colorIndex = (draft?.color || 0) % colors.length
  const style = {
    '--invite-paper': colors[colorIndex],
    '--invite-ink': colors[(colorIndex + 1) % colors.length],
    '--invite-accent': colors[(colorIndex + 2) % colors.length],
    ...(draft?.fontColor ? { '--invite-font-color': draft.fontColor } : {}),
  }
  const hasReception = Boolean(draft?.receptionDate || draft?.receptionTime || draft?.receptionVenue || draft?.receptionAddress)
  const events = [
    { title: 'Akad Nikah', date: draft?.eventDate, time: draft?.akadTime, venue: draft?.venue, address: draft?.address, mapLink: draft?.mapLink || makeMapsSearchLink(draft?.address || draft?.venue, draft?.city) },
    ...(hasReception ? [{ title: 'Resepsi', date: draft?.receptionDate, time: draft?.receptionTime, venue: draft?.receptionVenue || draft?.venue, address: draft?.receptionAddress || draft?.address, mapLink: makeMapsSearchLink(draft?.receptionAddress || draft?.receptionVenue || draft?.address || draft?.venue, draft?.city) }] : []),
  ]

  if (!opened) return <section className={`wedding-cover art-${draft?.template?.art || 'simple'} animation-${animation} ${isIslamic ? 'islamic-invitation' : ''} ${draft?.fontColor ? 'has-font-color' : ''}`} style={style}>
    {draft?.photo ? <img className="wedding-cover-photo" src={draft.photo} alt="Foto pasangan pada sampul undangan" /> : <div className="wedding-cover-art" aria-hidden="true" />}
    {isIslamic && <div className="islamic-ornaments" aria-hidden="true"><i /><i /><i /><i /><i /></div>}
    <div className="wedding-cover-content">
      <span className="wedding-kicker">{isIslamic ? 'UNDANGAN PERNIKAHAN · ASSALAMU’ALAIKUM' : 'UNDANGAN PERNIKAHAN'}</span>
      <h1>{couple}</h1>
      <p>{formatDate(draft?.eventDate)}</p>
      <button className="light-button" onClick={onOpen}>Buka Undangan <span aria-hidden="true">→</span></button>
    </div>
  </section>

  return <article className={`wedding-page art-${draft?.template?.art || 'simple'} animation-${animation} ${isIslamic ? 'islamic-invitation' : ''} ${draft?.fontColor ? 'has-font-color' : ''}`} style={style}>
    <section className="wedding-hero">
      {draft?.photo ? <img src={draft.photo} alt="Foto pasangan" /> : <div className="wedding-cover-art" aria-hidden="true" />}
      {isIslamic && <div className="islamic-ornaments" aria-hidden="true"><i /><i /><i /><i /><i /></div>}
      <div className="wedding-hero-copy"><span>THE WEDDING OF</span><h1>{couple}</h1><p>{formatDate(draft?.eventDate)}</p></div>
    </section>
    <section className="wedding-welcome">
      <span className="wedding-flourish" aria-hidden="true">{isIslamic ? '۞' : '✦'}</span>
      <p className="wedding-kicker">{isIslamic ? 'ASSALAMU’ALAIKUM WARAHMATULLAHI WABARAKATUH' : 'DENGAN PENUH RASA SYUKUR'}</p>
      <h2>Hari istimewa kami</h2>
      <p>{isIslamic ? 'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang keluarga serta sahabat untuk hadir dan mengiringi awal perjalanan kami.' : 'Dengan memohon rahmat dan ridho Tuhan, kami mengundang keluarga serta sahabat untuk hadir dan berbagi kebahagiaan bersama kami.'}</p>
    </section>
    <section className="wedding-couple-section">
      <p className="wedding-kicker">DUA HATI, SATU CERITA</p>
      <div className="wedding-couple-names">
        <div><h2>{draft?.groom || 'Mempelai pria'}</h2>{draft?.groomParents && <p>Putra dari<br />{draft.groomParents}</p>}</div>
        <span>&amp;</span>
        <div><h2>{draft?.bride || 'Mempelai wanita'}</h2>{draft?.brideParents && <p>Putri dari<br />{draft.brideParents}</p>}</div>
      </div>
    </section>
    <section className="wedding-events">
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
    <section className="wedding-closing">
      <p>Merupakan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.</p>
      <h2>{couple}</h2>
      <span className="wedding-kicker">SAMPAI JUMPA DI HARI BAHAGIA</span>
    </section>
    {onRsvp && <section className="wedding-rsvp"><p className="wedding-kicker">KONFIRMASI KEHADIRAN</p><h2>Bisakah kami menantikan kehadiranmu?</h2>{rsvp ? <p className="rsvp-success">Terima kasih, konfirmasi tersimpan.</p> : <button className="primary-button full" onClick={onRsvp}>Konfirmasi kehadiran</button>}</section>}
  </article>
}
