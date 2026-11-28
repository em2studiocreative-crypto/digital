import { useState } from 'react'

function TemplateCard({ item, selected, compact, onClick, themeLabels, photoLayoutLabels, Icon }) {
  const colors = item.colors
  const style = {
    '--art-primary': colors[0],
    '--art-secondary': colors[1],
    '--art-accent': colors[2],
  }
  return <button type="button" className={`template-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>
    <div className={`template-showcase showcase-${item.art}`} style={style}>
      <div className="showcase-device showcase-side showcase-left"><div className="showcase-topline" /><div className="showcase-image" /><div className="showcase-lines"><i /><i /><i /></div><span className="showcase-caption">OUR STORY</span></div>
      <div className="showcase-device showcase-main"><div className="showcase-topline" /><div className="showcase-cover"><span>THE WEDDING OF</span><strong>Nama <i>&amp;</i> Nama</strong><small>Save the date</small><span className="showcase-cover-button">Buka Undangan</span></div></div>
      <div className="showcase-device showcase-side showcase-right"><div className="showcase-topline" /><span className="showcase-monogram">N <i>&amp;</i> N</span><span className="showcase-caption">RANGKAIAN ACARA</span><div className="showcase-lines"><i /><i /><i /><i /></div><span className="showcase-pin">LOKASI</span></div>
      <span className="showcase-label">{themeLabels[item.type]}</span>
    </div>
    {selected && <span className="selected-badge"><Icon name="check" size={14} /></span>}
    <div className="template-meta"><div><h3>{item.title}</h3><p>{selected ? 'Dipilih · lanjutkan di bawah' : `${item.photoLayout ? photoLayoutLabels[item.photoLayout] : 'Sampul + halaman acara'} · ${item.colors.length} warna`}</p></div><span className="round-arrow"><Icon name="chevron" size={17} /></span></div>
  </button>
}

export default function TemplateGallery({ onBack, selected, setSelected, onUse, templates, photoLayoutLabels, themeLabels, Icon, Header }) {
  const [filter, setFilter] = useState('Semua')
  const filters = ['Semua', ...new Set(templates.map((item) => item.type))]
  const shown = filter === 'Semua' ? templates : templates.filter((item) => item.type === filter)
  return <section className="plain-screen">
    <Header title="Pilih Template" onBack={onBack} action={<button type="button" className="icon-button" aria-label="Cari"><Icon name="search" /></button>} />
    <div className="screen-intro"><p className="eyebrow">Langkah 2 dari 6</p><h1>Pilih bentuk undangan digitalmu.</h1><p className="template-helper">Setiap desain kini menampilkan contoh sampul dan halaman undangan di layar ponsel. Pilih gaya, lalu sesuaikan foto dan warnanya.</p></div>
    <button type="button" className={selected ? 'selection-hint selected' : 'selection-hint'} onClick={() => { if (selected) onUse() }} aria-label={selected ? 'Lanjutkan mengatur desain' : 'Petunjuk memilih template'}><Icon name={selected ? 'check' : 'grid'} size={17} /><span>{selected ? `Template “${selected.title}” dipilih. Ketuk di sini untuk mengatur warna dan foto.` : 'Pilih gaya klasik editorial, warna ceria, botanical, Nusantara, floral, atau foto pasangan.'}</span></button>
    <div className="filter-row">{filters.map((item) => <button type="button" key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{themeLabels[item]}</button>)}</div>
    <div className="template-grid">{shown.map((item) => <TemplateCard key={item.id} item={item} selected={selected?.id === item.id} onClick={() => setSelected(item)} themeLabels={themeLabels} photoLayoutLabels={photoLayoutLabels} Icon={Icon} />)}</div>
    {selected && <div className="sticky-action"><div><span className="eyebrow">Template dipilih</span><strong>{selected.title}</strong><small>{selected.photoLayout ? `${photoLayoutLabels[selected.photoLayout]} · ` : 'Undangan digital · '}{selected.colors.length} pilihan warna</small></div><button type="button" className="primary-button" onClick={onUse}>Lanjut atur desain <Icon name="arrow" size={17} /></button></div>}
  </section>
}
