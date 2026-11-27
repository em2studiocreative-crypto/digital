import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './overrides.css'
import { supabase, usernameAuthEmail } from './lib/supabaseClient.js'

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister()))
}

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => console.error('Gagal memeriksa pembaruan aplikasi:', error))
  })
}

const heroImage = `${import.meta.env.BASE_URL}hero-couple.webp`
const heartDividerImage = `${import.meta.env.BASE_URL}heart-divider.png`
const appIcon = `${import.meta.env.BASE_URL}icon-192.png`

const Icon = ({ name, size = 20, stroke = 'currentColor' }) => {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.5M6.2 6.3C3.5 8 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 3-.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    play: <path d="m9 6 9 6-9 6Z"/>,
    share: <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    camera: <><path d="M4 7h3l1.5-2h7L17 7h3v11H4Z"/><circle cx="12" cy="12" r="3.5"/></>,
    phone: <><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M10 18.5h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    file: <><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
    sparkle: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const templates = [
  { id: 1, title: 'Rimba Senja', type: 'Natural', image: heroImage, colors: ['#c7d0b4', '#d9c096', '#6e7b68'] },
  { id: 2, title: 'Purnama Jawa', type: 'Tradisional', image: heroImage, colors: ['#a88a62', '#44372c', '#ede0c2'] },
  { id: 3, title: 'Arunika', type: 'Minimalis', image: heroImage, colors: ['#d6c6bc', '#f4ede5', '#8a6e62'] },
  { id: 4, title: 'Taman Hati', type: 'Romantis', image: heroImage, colors: ['#c5b4b0', '#eee1d7', '#8a6c60'] },
]

function App() {
  const [screen, setScreen] = useState('welcome')
  const [onboarding, setOnboarding] = useState(0)
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedColor, setSelectedColor] = useState(0)
  const [activeNav, setActiveNav] = useState('home')
  const [form, setForm] = useState({ groom: '', bride: '', eventDate: '', venue: '', city: '' })
  const [duration, setDuration] = useState(90)
  const [paymentStatus, setPaymentStatus] = useState('unpaid')

  const activeDraft = useMemo(() => drafts[0], [drafts])
  const go = (next) => setScreen(next)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('welcome-open', screen === 'welcome')
    return () => root.classList.remove('welcome-open')
  }, [screen])

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || !session) return
      setCurrentUser(session.user.user_metadata?.username || '')
      setScreen('home')
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Gagal memuat sesi autentikasi:', error.message)
        setAuthMessage('Sesi akun tidak dapat dimuat. Silakan coba masuk kembali.')
      } else if (data.session) {
        setCurrentUser(data.session.user.user_metadata?.username || '')
        setScreen('home')
      }
    }).catch((error) => {
      if (!active) return
      console.error('Gagal memuat sesi autentikasi:', error)
      setAuthMessage('Sesi akun tidak dapat dimuat. Silakan coba masuk kembali.')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const startApp = () => {
    setAuthMode('register')
    setAuthMessage('')
    go('login')
  }
  const submitAuth = async (event, mode = authMode) => {
    event.preventDefault()
    const id = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,20}$/.test(id)) {
      setAuthMessage('Nama ID harus 3–20 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.')
      return
    }
    if (password.length < 8) {
      setAuthMessage('Kata sandi harus terdiri dari minimal 8 karakter.')
      return
    }
    if (!supabase) {
      setAuthMessage('Konfigurasi Supabase belum tersedia pada aplikasi ini. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY, lalu build dan deploy ulang.')
      return
    }

    setAuthBusy(true)
    setAuthMessage('')
    try {
      const email = usernameAuthEmail(id)
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: id } },
        })
        if (error) {
          const errorMessage = error.message.toLowerCase()
          const errorCode = error.code || error.status
          console.error('Pendaftaran gagal:', { code: errorCode, message: error.message })
          if (errorMessage.includes('already') || errorMessage.includes('duplicate')) {
            setAuthMessage('Nama ID sudah digunakan. Silakan pilih Nama ID lain.')
          } else if (errorCode === 'signup_disabled' || errorMessage.includes('signups not allowed')) {
            setAuthMessage('Pendaftaran dinonaktifkan di Supabase. Aktifkan pendaftaran pengguna pada pengaturan Authentication.')
          } else if (errorCode === 'email_address_invalid' || errorMessage.includes('invalid email')) {
            setAuthMessage('Supabase menolak alamat akun internal. Periksa kebijakan provider Email dan domain yang diizinkan.')
          } else if (errorCode === 'email_provider_disabled') {
            setAuthMessage('Provider Email belum aktif di Supabase Authentication.')
          } else if (errorCode === 'weak_password' || errorMessage.includes('password should be')) {
            setAuthMessage('Kata sandi tidak memenuhi kebijakan keamanan Supabase. Gunakan kata sandi yang lebih kuat.')
          } else if (errorCode === 'over_email_send_rate_limit' || errorCode === 'rate_limit_exceeded') {
            setAuthMessage('Batas pendaftaran sementara tercapai. Tunggu beberapa saat, lalu coba lagi.')
          } else if (errorMessage.includes('database error saving new user')) {
            setAuthMessage('Supabase gagal membuat profil pengguna. Pastikan migrasi username sudah dijalankan dan trigger on_auth_user_created terpasang.')
          } else {
            setAuthMessage(`Pendaftaran ditolak Supabase${errorCode ? ` (${errorCode})` : ''}. Periksa Authentication → Logs di Supabase.`)
          }
          return
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (mode === 'register') {
          console.error('Akun dibuat, tetapi sesi belum dapat dimulai:', error.message)
          setAuthMessage('Akun sudah dibuat, tetapi belum dapat masuk. Pastikan konfirmasi email dinonaktifkan di Supabase, lalu coba masuk.')
        } else {
          setAuthMessage('Nama ID atau kata sandi tidak cocok.')
        }
        return
      }
      setCurrentUser(data.user.user_metadata?.username || id)
      setPassword('')
      go('home')
    } catch (error) {
      console.error('Permintaan autentikasi gagal:', error)
      setAuthMessage('Tidak dapat terhubung ke layanan akun. Periksa koneksi internet lalu coba lagi.')
    } finally {
      setAuthBusy(false)
    }
  }
  const createDraft = () => {
    if (drafts.length >= 2) return
    setSelectedTemplate(null)
    setForm({ groom: '', bride: '', eventDate: '', venue: '', city: '' })
    go('templates')
  }
  const saveDraft = () => {
    const next = { ...form, template: selectedTemplate, color: selectedColor, id: Date.now(), status: 'Draft' }
    setDrafts((items) => [next, ...items].slice(0, 2))
    go('home')
    setActiveNav('home')
  }
  const publish = () => {
    setPaymentStatus('waiting')
    go('payment')
  }

  return (
    <main className={`app-shell ${screen === 'welcome' ? 'welcome-app-shell' : ''} ${screen === 'login' ? 'auth-app-shell' : ''}`}>
      {screen === 'welcome' && <Welcome onboarding={onboarding} setOnboarding={setOnboarding} onStart={startApp} />}
      {screen === 'login' && <AuthScreen mode={authMode} setMode={(mode) => { setAuthMode(mode); setAuthMessage(''); setPassword('') }} username={username} setUsername={setUsername} password={password} setPassword={setPassword} message={authMessage} busy={authBusy} onSubmit={submitAuth} />}
      {screen === 'home' && <Home drafts={drafts} activeDraft={activeDraft} username={currentUser} onCreate={createDraft} onOpenTemplates={() => go('templates')} onOpen={setScreen} />}
      {screen === 'templates' && <TemplateGallery onBack={() => go('home')} selected={selectedTemplate} setSelected={setSelectedTemplate} onUse={() => go('editor')} />}
      {screen === 'editor' && <Editor form={form} setForm={setForm} selectedTemplate={selectedTemplate} selectedColor={selectedColor} setSelectedColor={setSelectedColor} onBack={() => go('templates')} onSave={saveDraft} />}
      {screen === 'preview' && <Preview draft={activeDraft} onBack={() => go('home')} onPublish={publish} />}
      {screen === 'payment' && <Payment duration={duration} setDuration={setDuration} status={paymentStatus} onBack={() => go('home')} onSubmit={() => setPaymentStatus('waiting')} />}
      {screen === 'share' && <Share onBack={() => go('home')} />}
      {['home', 'templates'].includes(screen) && <BottomNav active={activeNav} setActive={(item) => { setActiveNav(item); go(item === 'templates' ? 'templates' : 'home') }} />}
    </main>
  )
}

function Welcome({ onboarding, setOnboarding, onStart }) {
  const snowflakes = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const duration = 18 + Math.random() * 10
    const glowDuration = 2.5 + Math.random() * 4
    return {
      id: index,
      left: `${8 + Math.random() * 84}%`,
      size: `${3 + Math.random() * 2}px`,
      duration: `${duration}s`,
      delay: `${-Math.random() * duration}s`,
      glowDuration: `${glowDuration}s`,
      glowDelay: `${-Math.random() * glowDuration}s`,
      glowSize: `${5 + Math.random() * 7}px`,
      glowSpread: `${1 + Math.random() * 3}px`,
    }
  }), [])
  const slides = [
    { eyebrow: 'Pernikahan yang berkesan', title: 'Rencanakan Hari Bahagia dengan Mudah', body: 'Buat undangan digital yang terasa personal, elegan, dan siap dibagikan.', button: 'Mulai Sekarang' },
    { eyebrow: 'Pilih yang paling kamu suka', title: 'Template yang Mewakili Kisahmu', body: 'Mulai dari desain natural hingga tradisional. Semua template tersedia untukmu.', button: 'Berikutnya' },
    { eyebrow: 'Satu link untuk semua tamu', title: 'Bagikan dengan Elegan', body: 'Terbitkan undangan dengan link profesional yang mudah dikirim lewat WhatsApp.', button: 'Mulai Sekarang' },
  ]
  const slide = slides[onboarding]
  return <section className="welcome" style={{ backgroundImage: `linear-gradient(180deg, rgba(18,32,25,.72) 0%, rgba(18,32,25,.4) 22%, rgba(18,28,21,.3) 50%, rgba(18,28,21,.9) 100%), radial-gradient(ellipse at 50% 78%, rgba(224,183,103,.2), transparent 58%), url("${heroImage}")` }}>
    <div className="welcome-snow" aria-hidden="true">
      {snowflakes.map((flake) => <span
        className="snowflake"
        key={flake.id}
        style={{
          left: flake.left,
          width: flake.size,
          height: flake.size,
          '--snow-duration': flake.duration,
          '--snow-delay': flake.delay,
          '--glow-duration': flake.glowDuration,
          '--glow-delay': flake.glowDelay,
          '--glow-size': flake.glowSize,
          '--glow-spread': flake.glowSpread,
        }}
      />)}
    </div>
    <div className="welcome-top"><div className="welcome-brand"><span className="welcome-logo-frame"><img src={appIcon} alt="" /></span><span className="brand-mark">Undangan<span>Ku</span></span></div></div>
    <div className="welcome-content">
      <div className="love-divider love-divider-top" aria-hidden="true">
        <span style={{ '--heart-divider-image': `url("${heartDividerImage}")` }} />
      </div>
      <h1>{slide.title}</h1>
      <p>{slide.body}</p>
      <div className="love-divider love-divider-bottom" aria-hidden="true">
        <svg viewBox="0 0 18 16" fill="currentColor">
          <path d="M9 15.1 2.2 8.8C-1.6 5.2 3.5-.3 7.2 3.3L9 5l1.8-1.7c3.7-3.6 8.8 1.9 5 5.5L9 15.1Z" />
        </svg>
      </div>
      <div className="pager" aria-label={`Slide ${onboarding + 1} dari 3`}>{slides.map((_, index) => <button key={index} aria-label={`Buka slide ${index + 1}`} className={index === onboarding ? 'active' : ''} onClick={() => setOnboarding(index)} />)}</div>
      <button className="primary-button glass-button" onClick={onboarding === 2 || onboarding === 0 ? onStart : () => setOnboarding(onboarding + 1)}><span>{slide.button}</span><Icon name="arrow" size={18} /></button>
    </div>
  </section>
}

function AuthScreen({ mode, setMode, username, setUsername, password, setPassword, message, busy, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false)
  const isRegister = mode === 'register'
  const switchMode = (nextMode) => {
    setShowPassword(false)
    setMode(nextMode)
  }
  const renderForm = (formMode) => {
    const registering = formMode === 'register'
    return <form className="auth-form" onSubmit={(event) => onSubmit(event, formMode)}>
      <div className="auth-form-brand"><img src={appIcon} alt="Logo UndanganKu" /></div>
      <h1>{registering ? 'Daftar' : 'Masuk'}</h1>
      <div className="auth-input-wrap">
        <input id={`${formMode}-username`} type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nama ID" aria-label="Nama ID" minLength={3} maxLength={20} required />
        <Icon name="user" size={18} />
      </div>
      <div className="auth-input-wrap">
        <input id={`${formMode}-password`} type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Kata sandi" aria-label="Kata sandi" minLength={8} maxLength={72} required />
        <Icon name="lock" size={18} />
        <button className="password-visibility" type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShowPassword((visible) => !visible)}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} /></button>
      </div>
      {registering && <p className="auth-hint">Nama ID unik · kata sandi minimal 8 karakter</p>}
      {message && mode === formMode && <p className="auth-message" role="alert">{message}</p>}
      <button className="auth-submit" type="submit" disabled={busy}><span>{busy ? 'Menghubungkan…' : registering ? 'Buat akun' : 'Masuk'}</span>{!busy && <Icon name="arrow" size={18} />}</button>
      <p className="auth-recovery-note">Kata sandi terlupa? Hubungi admin untuk bantuan.</p>
    </form>
  }
  return <section className="auth-screen">
    <div className={`auth-container ${isRegister ? '' : 'active'}`}>
      <div className="auth-form-box register-form">{renderForm('register')}</div>
      <div className="auth-form-box login-form">{renderForm('login')}</div>
      <div className="auth-toggle-box">
        <div className="auth-toggle-panel panel-login">
          <h2>Selamat datang kembali!</h2>
          <p>Sudah memiliki akun?</p>
          <button className="auth-panel-button" type="button" onClick={() => switchMode('login')}>Masuk</button>
        </div>
        <div className="auth-toggle-panel panel-register">
          <h2>Halo, selamat datang!</h2>
          <p>Belum memiliki akun?</p>
          <button className="auth-panel-button shimmer-button" type="button" onClick={() => switchMode('register')}><span>Daftar</span></button>
        </div>
      </div>
    </div>
  </section>
}

function Header({ title, onBack, action }) { return <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Kembali"><Icon name="back" /></button><h2>{title}</h2>{action || <span className="header-spacer" />}</header> }

function Home({ drafts, activeDraft, username, onCreate, onOpenTemplates, onOpen }) {
  const displayName = username || 'Rara'
  return <section className="plain-screen home-screen"><div className="topbar"><div><p className="eyebrow">Kamis, 26 November 2026</p><h1>Selamat datang, <em>{displayName}.</em></h1></div><button className="avatar" aria-label="Buka profil">{displayName[0].toUpperCase()}</button></div>
    <div className="home-hero"><div><span className="eyebrow light-text">Kisahmu, selamanya</span><h2>Wujudkan undangan pernikahan impianmu.</h2><button className="light-button" onClick={onCreate}>Buat Undangan <Icon name="arrow" size={17} /></button></div><div className="hero-stamp"><Icon name="sparkle" size={22} /></div></div>
    <div className="section-heading"><div><p className="eyebrow">Koleksi pilihan</p><h2>Template untukmu</h2></div><button className="text-button" onClick={onOpenTemplates}>Lihat semua <Icon name="arrow" size={15} /></button></div>
    <div className="template-strip">{templates.slice(0, 3).map((item) => <TemplateCard key={item.id} item={item} compact onClick={onOpenTemplates} />)}</div>
    <div className="section-heading draft-heading"><div><p className="eyebrow">Rancanganmu</p><h2>Undangan Saya</h2></div><span className="count-pill">{drafts.length}/2</span></div>
    {activeDraft ? <div className="draft-card"><div className="draft-thumb" style={{ backgroundImage: `url("${heroImage}")` }}><span>{activeDraft.status}</span></div><div className="draft-copy"><h3>{activeDraft.groom || 'Rancangan Undangan' } <span>&amp;</span> {activeDraft.bride || 'Pasangan'}</h3><p>{activeDraft.template?.title || 'Template pilihan'} · Tema {activeDraft.color + 1}</p><button className="outline-button" onClick={() => onOpen('preview')}>Lihat pratinjau</button></div></div> : <div className="empty-card"><div className="empty-icon"><Icon name="file" /></div><h3>Belum ada rancangan</h3><p>Mulai dari template yang paling mewakili kisah kalian.</p><button className="primary-button" onClick={onCreate}>Buat rancangan pertama <Icon name="arrow" size={17} /></button></div>}
  </section>
}

function TemplateGallery({ onBack, selected, setSelected, onUse }) {
  const [filter, setFilter] = useState('Semua')
  const filters = ['Semua', 'Natural', 'Minimalis', 'Romantis', 'Tradisional']
  const shown = filter === 'Semua' ? templates : templates.filter((item) => item.type === filter)
  return <section className="plain-screen"><Header title="Pilih Template" onBack={onBack} action={<button type="button" className="icon-button" aria-label="Cari"><Icon name="search" /></button>} /><div className="screen-intro"><p className="eyebrow">Langkah 1 dari 4</p><h1>Temukan yang terasa seperti kamu.</h1><p className="template-helper">Pilih satu template untuk melanjutkan ke pengisian data pernikahan.</p></div><button type="button" className={selected ? 'selection-hint selected' : 'selection-hint'} onClick={() => { if (selected) onUse() }} aria-label={selected ? 'Lanjutkan ke pengisian data' : 'Petunjuk memilih template'}><Icon name={selected ? 'check' : 'grid'} size={17} /><span>{selected ? `Template “${selected.title}” dipilih. Ketuk di sini untuk lanjut mengisi data.` : 'Ketuk salah satu template untuk memilih desain undangan.'}</span></button><div className="filter-row">{filters.map((item) => <button type="button" key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="template-grid">{shown.map((item) => <TemplateCard key={item.id} item={item} selected={selected?.id === item.id} onClick={() => setSelected(item)} />)}</div>{selected && <div className="sticky-action"><div><span className="eyebrow">Template dipilih</span><strong>{selected.title}</strong><small>Lanjutkan untuk mengisi data</small></div><button type="button" className="primary-button" onClick={onUse}>Lanjutkan ke data <Icon name="arrow" size={17} /></button></div>}</section>
}

function TemplateCard({ item, selected, compact, onClick }) { return <button type="button" className={`template-card ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}><div className="template-image" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(19,27,20,.75)), url("${item.image}")` }}><span className="template-type">{item.type}</span>{selected && <span className="selected-badge"><Icon name="check" size={14} /></span>}</div><div className="template-meta"><div><h3>{item.title}</h3><p>{selected ? 'Dipilih · lanjutkan di bawah' : 'Ketuk untuk memilih · ' + item.colors.length + ' warna'}</p></div><span className="round-arrow"><Icon name="chevron" size={17} /></span></div></button> }

function Editor({ form, setForm, selectedTemplate, selectedColor, setSelectedColor, onBack, onSave }) { const update = (key, value) => setForm({ ...form, [key]: value }); return <section className="plain-screen editor-screen"><Header title="Sesuaikan Undangan" onBack={onBack} action={<span className="step-count">1 dari 4</span>} /><div className="editor-preview" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(17,29,21,.86)), url("${heroImage}")` }}><div><span className="eyebrow light-text">Pratinjau tema</span><h2>{form.groom || 'Nama Pria'} <small>&amp;</small> {form.bride || 'Nama Wanita'}</h2><p>{selectedTemplate?.title} · Tema {selectedColor + 1}</p></div></div><div className="form-section"><div className="section-heading"><div><p className="eyebrow">Identitas pasangan</p><h2>Mulai dari nama kalian</h2></div><Icon name="sparkle" size={21} /></div><label className="field-label" htmlFor="groom">Nama mempelai pria</label><input id="groom" className="text-input" value={form.groom} onChange={(e) => update('groom', e.target.value)} placeholder="Contoh: Bagas Pratama" /><label className="field-label" htmlFor="bride">Nama mempelai wanita</label><input id="bride" className="text-input" value={form.bride} onChange={(e) => update('bride', e.target.value)} placeholder="Contoh: Andini Larasati" /><label className="field-label" htmlFor="date">Tanggal acara</label><input id="date" className="text-input" type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} /><label className="field-label" htmlFor="venue">Lokasi acara</label><input id="venue" className="text-input" value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Contoh: Gedung Kartika" /><label className="field-label" htmlFor="city">Kota</label><input id="city" className="text-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Contoh: Jakarta Selatan" /></div><div className="form-section"><div className="section-heading"><div><p className="eyebrow">Nuansa warna</p><h2>Pilih warna yang kamu suka</h2></div></div><div className="color-picker">{selectedTemplate?.colors.map((color, index) => <button key={color} className={selectedColor === index ? 'color-swatch active' : 'color-swatch'} style={{ background: color }} onClick={() => setSelectedColor(index)} aria-label={`Pilih warna ${index + 1}`} />)}</div></div><div className="bottom-action"><button className="primary-button full" onClick={onSave}>Simpan rancangan <Icon name="arrow" size={17} /></button></div></section> }

function Preview({ draft, onBack, onPublish }) { const [liveOpen, setLiveOpen] = useState(false); const couple = `${draft?.groom || 'Bagas'} & ${draft?.bride || 'Andini'}`; return <section className="plain-screen"><Header title="Pratinjau Final" onBack={onBack} /><div className="preview-note"><Icon name="check" size={17} /><span>Periksa kembali sebelum diterbitkan. Setelah aktif, undangan tidak dapat diedit.</span></div><div className="invitation-preview" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(15,22,17,.88)), url("${heroImage}")` }}><div className="preview-content"><span className="eyebrow light-text">The wedding of</span><h1>{couple}</h1><p>{draft?.eventDate ? new Date(draft.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sabtu, 12 Desember 2026'}</p><div className="preview-divider" /><p className="preview-venue">{draft?.venue || 'Gedung Pernikahan'}<br />{draft?.city || 'Jakarta'}</p></div></div><button className="live-preview-button" onClick={() => setLiveOpen(true)}><span className="play-badge"><Icon name="play" size={14} /></span><span><strong>Jalankan Live Preview</strong><small>Lihat persis seperti yang akan dibuka tamu</small></span><Icon name="chevron" size={18} /></button><div className="preview-sections"><div className="mini-feature"><Icon name="clock" /><div><strong>Countdown</strong><span>Aktif di undangan</span></div><Icon name="check" size={17} /></div><div className="mini-feature"><Icon name="camera" /><div><strong>Galeri & musik</strong><span>Siap ditambahkan</span></div><Icon name="check" size={17} /></div><div className="mini-feature"><Icon name="file" /><div><strong>RSVP & ucapan</strong><span>Aktif untuk tamu</span></div><Icon name="check" size={17} /></div></div><div className="bottom-action"><button className="primary-button full" onClick={onPublish}>Terbitkan undangan <Icon name="arrow" size={17} /></button></div>{liveOpen && <LivePreview couple={couple} draft={draft} onClose={() => setLiveOpen(false)} />}</section> }

function LivePreview({ couple, draft, onClose }) { const [opened, setOpened] = useState(false); const [rsvp, setRsvp] = useState(false); return <div className="live-overlay"><div className="live-topbar"><div><span className="eyebrow light-text">Mode tamu</span><strong>Live Preview</strong></div><button className="icon-button light" onClick={onClose} aria-label="Tutup live preview"><Icon name="close" /></button></div>{!opened ? <div className="live-cover" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(15,22,17,.94)), url("${heroImage}")` }}><div className="live-cover-content"><span className="eyebrow light-text">The wedding of</span><h1>{couple}</h1><p>Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di hari istimewa kami.</p><button className="light-button" onClick={() => setOpened(true)}>Buka Undangan <Icon name="arrow" size={17} /></button></div></div> : <div className="live-scroll"><div className="live-photo" style={{ backgroundImage: `url("${heroImage}")` }} /><div className="live-body"><span className="eyebrow">The wedding of</span><h1>{couple}</h1><p className="live-date">{draft?.eventDate || '12 Desember 2026'} · {draft?.venue || 'Gedung Pernikahan'}</p><div className="countdown-row"><div><strong>12</strong><span>Hari</span></div><div><strong>08</strong><span>Jam</span></div><div><strong>34</strong><span>Menit</span></div><div><strong>21</strong><span>Detik</span></div></div><div className="live-info"><h2>Menuju hari bahagia</h2><p>Mohon doa dan restu untuk perjalanan baru kami. Kehadiran Anda adalah hadiah yang berarti.</p><button className="outline-button full">Lihat lokasi <Icon name="arrow" size={16} /></button></div><div className="live-info"><h2>Konfirmasi kehadiran</h2>{rsvp ? <p className="rsvp-success"><Icon name="check" size={16} /> Terima kasih, konfirmasi tersimpan.</p> : <button className="primary-button full" onClick={() => setRsvp(true)}>Isi RSVP <Icon name="arrow" size={16} /></button>}</div></div></div>}</div> }

function Payment({ duration, setDuration, status, onBack, onSubmit }) { const prices = { 30: 'Rp49.000', 90: 'Rp89.000', 180: 'Rp149.000', 365: 'Rp229.000' }; return <section className="plain-screen"><Header title="Aktifkan Undangan" onBack={onBack} /><div className="screen-intro"><p className="eyebrow">Satu langkah lagi</p><h1>Bagikan hari bahagiamu.</h1><p className="muted">Masa aktif dimulai setelah pembayaran disetujui oleh admin.</p></div><div className="duration-grid">{Object.entries(prices).map(([days, price]) => <button key={days} className={duration === Number(days) ? 'duration-card active' : 'duration-card'} onClick={() => setDuration(Number(days))}><span>{days === '365' ? '1 tahun' : `${days} hari`}</span><strong>{price}</strong>{days === '90' && <em>Populer</em>}</button>)}</div><div className="payment-card"><div><span className="eyebrow">Virtual Account</span><h3>VA UndanganKu</h3></div><strong className="va-number">8808 1200 2026 01</strong><p>Silakan lakukan pembayaran sesuai nominal, lalu unggah bukti transfer di langkah berikutnya.</p><button className="outline-button full" onClick={onSubmit}>{status === 'waiting' ? 'Bukti pembayaran diunggah' : 'Saya sudah membayar'}</button></div><div className="security-note"><Icon name="check" size={17} /><span>Pembayaran akan diperiksa admin sebelum link undangan aktif.</span></div></section> }

function Share({ onBack }) { return <section className="plain-screen centered-screen"><div className="success-mark"><Icon name="check" size={28} /></div><p className="eyebrow">Undangan aktif</p><h1>Siap dibagikan dengan elegan.</h1><p className="muted center-copy">Link undanganmu sudah siap. Bagikan secara personal melalui WhatsApp.</p><div className="link-card"><span>undanganku.id/andi-dan-sari</span><button className="icon-button small" aria-label="Salin link"><Icon name="share" size={17} /></button></div><button className="primary-button full">Bagikan ke WhatsApp <Icon name="share" size={17} /></button><button className="text-button" onClick={onBack}>Kembali ke beranda</button></section> }

function BottomNav({ active, setActive }) { return <nav className="bottom-nav"><button className={active === 'home' ? 'active' : ''} onClick={() => setActive('home')}><Icon name="home" /><span>Beranda</span></button><button className={active === 'templates' ? 'active' : ''} onClick={() => setActive('templates')}><Icon name="grid" /><span>Template</span></button><button className={active === 'drafts' ? 'active' : ''} onClick={() => setActive('drafts')}><Icon name="file" /><span>Undangan</span></button><button className={active === 'profile' ? 'active' : ''} onClick={() => setActive('profile')}><Icon name="user" /><span>Profil</span></button></nav> }

createRoot(document.getElementById('root')).render(<App />)
