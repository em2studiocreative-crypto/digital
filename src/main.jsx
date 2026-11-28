import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './overrides.css'
import { supabase, usernameAuthEmail } from './lib/supabaseClient.js'
import { fetchInvitationDrafts, saveInvitationDraft } from './lib/invitationDrafts.js'

const VenueMapPicker = lazy(() => import('./VenueMapPicker.jsx'))
const WeddingInvitation = lazy(() => import('./WeddingInvitation.jsx'))
const InvitationEditor = lazy(() => import('./InvitationEditor.jsx'))

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

const Icon = ({ name, size = 20, stroke = 'currentColor', className = '' }) => {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    arrowDown: <><path d="M12 5v14"/><path d="m18 13-6 6-6-6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 10h17"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.5M6.2 6.3C3.5 8 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 3-.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.6 1.6 0 0 1 1.1-2.7H18a3 3 0 0 0 3-3C21 7 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/></>,
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
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const emptyForm = {
  groom: '', bride: '', groomNickname: '', brideNickname: '',
  groomParents: '', brideParents: '', eventDate: '', akadTime: '',
  venue: '', city: '', address: '', mapLink: '', latitude: null, longitude: null,
  receptionDate: '', receptionTime: '', receptionVenue: '', receptionAddress: '',
  poetic: '', prayer: '', guestName: '', guestMessage: '', photo: '',
  palette: 'forest', fontColor: '#263c30', fontStyle: 'anggun', buttonStyle: 'capsule',
  layout: 'gate', menuOrder: ['acara', 'keluarga', 'peta', 'doa'],
  music: 'none', musicName: '', musicData: '',
}

function App() {
  const [screen, setScreen] = useState('welcome')
  const hasNavigated = useRef(false)
  const [onboarding, setOnboarding] = useState(0)
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState('')
  const [userId, setUserId] = useState(null)
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [draftsError, setDraftsError] = useState('')
  const [draftLoadVersion, setDraftLoadVersion] = useState(0)
  const [editingDraftId, setEditingDraftId] = useState(null)
  const [draftLimitMessage, setDraftLimitMessage] = useState('')
  const [editorInitialPreview, setEditorInitialPreview] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  const go = (next) => {
    hasNavigated.current = true
    setScreen(next)
  }

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('welcome-open', screen === 'welcome')
    return () => root.classList.remove('welcome-open')
  }, [screen])

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUserId(session?.user.id || null)
      setCurrentUser(session?.user.user_metadata?.username || '')
      if (!session) {
        setDrafts([])
        setDraftsError('')
        setDraftsLoading(false)
      } else {
        setDraftsLoading(true)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Gagal memuat sesi autentikasi:', error.message)
        setAuthMessage('Sesi akun tidak dapat dimuat. Silakan coba masuk kembali.')
      } else if (data.session) {
        setCurrentUser(data.session.user.user_metadata?.username || '')
        setUserId(data.session.user.id)
        setDraftsLoading(true)
        if (!hasNavigated.current) setScreen('home')
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

  useEffect(() => {
    if (!userId || !supabase) {
      setDrafts([])
      setDraftsLoading(false)
      setDraftsError('')
      return undefined
    }

    let active = true
    setDraftsLoading(true)
    setDraftsError('')
    setDrafts([])
    fetchInvitationDrafts(supabase, userId).then((loadedDrafts) => {
      if (active) setDrafts(loadedDrafts)
    }).catch((error) => {
      if (!active) return
      setDraftsError(error instanceof Error ? error.message : 'Rancangan tidak dapat dimuat. Coba lagi.')
    }).finally(() => {
      if (active) setDraftsLoading(false)
    })

    return () => { active = false }
  }, [userId, draftLoadVersion])

  const startApp = () => {
    setAuthMode('login')
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
      setUserId(data.user.id)
      setDraftsLoading(true)
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
    if (draftsLoading || draftsError) {
      setDraftLimitMessage('Pastikan rancangan tersimpan sudah berhasil dimuat sebelum membuat rancangan baru.')
      return
    }
    if (drafts.length >= 2) {
      setDraftLimitMessage('Kamu sudah memiliki 2 rancangan. Buka salah satunya untuk mengubah data.')
      return
    }
    setDraftLimitMessage('')
    setEditingDraftId(null)
    setEditorInitialPreview(false)
    setForm({ ...emptyForm })
    go('editor')
  }
  const saveDraft = async () => {
    if (!editingDraftId && drafts.length >= 2) {
      setDraftLimitMessage('Batas 2 rancangan tercapai. Kembali ke beranda dan buka rancangan untuk mengedit.')
      return false
    }
    if (!supabase || !userId) {
      throw new Error('Sesi Supabase tidak ditemukan. Masuk kembali sebelum menyimpan rancangan.')
    }
    const next = await saveInvitationDraft(supabase, userId, editingDraftId, form)
    setDrafts((items) => [next, ...items.filter((item) => item.id !== next.id)].slice(0, 2))
    setEditingDraftId(next.id)
    setDraftLimitMessage('')
    return true
  }
  const openDraft = (draft, preview = false) => {
    setDrafts((items) => [draft, ...items.filter((item) => item.id !== draft.id)])
    setForm({ ...emptyForm, ...draft, palette: draft.palette || 'forest', layout: draft.layout || 'gate' })
    setEditingDraftId(draft.id)
    setEditorInitialPreview(preview)
    setDraftLimitMessage('')
    go('editor')
  }
  return (
    <main className={`app-shell ${screen === 'welcome' ? 'welcome-app-shell' : ''} ${screen === 'login' ? 'auth-app-shell' : ''} ${screen === 'home' ? 'home-app-shell' : ''} ${screen === 'editor' ? 'studio-app-shell' : ''}`}>
      {screen === 'welcome' && <Welcome onboarding={onboarding} setOnboarding={setOnboarding} onStart={startApp} />}
      {screen === 'login' && <AuthScreen mode={authMode} setMode={(mode) => { setAuthMode(mode); setAuthMessage(''); setPassword('') }} username={username} setUsername={setUsername} password={password} setPassword={setPassword} message={authMessage} busy={authBusy} onSubmit={submitAuth} />}
      {screen === 'home' && <Home drafts={drafts} username={currentUser} onCreate={createDraft} onOpen={(draft) => openDraft(draft, true)} draftLimitMessage={draftLimitMessage} draftsLoading={draftsLoading} draftsError={draftsError} onRetryDrafts={() => setDraftLoadVersion((version) => version + 1)} />}
      {screen === 'editor' && <Suspense fallback={<div className="wedding-loading" role="status">Memuat editor undangan…</div>}><InvitationEditor form={form} setForm={setForm} onBack={() => go('home')} onSave={saveDraft} initialPreview={editorInitialPreview} Icon={Icon} VenueMapPicker={VenueMapPicker} /></Suspense>}
      {screen === 'home' && <BottomNav active="home" setActive={() => go('home')} />}
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
    { eyebrow: 'Rangkai ceritamu', title: 'Satu Editor untuk Semua', body: 'Lengkapi isi undangan dan sesuaikan tampilannya tanpa berpindah langkah.', button: 'Berikutnya' },
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

function Header({ title, onBack, action }) {
  return <header className="page-header branded-page-header">
    <div className="page-header-brand">
      <img src={appIcon} alt="" />
      <h2>{title}</h2>
    </div>
    <div className="page-header-actions">
      {action}
      <button className="icon-button page-header-back" onClick={onBack} aria-label="Kembali"><Icon name="back" /></button>
    </div>
  </header>
}

function Home({ drafts, username, onCreate, onOpen, draftLimitMessage, draftsLoading, draftsError, onRetryDrafts }) {
  const displayName = username || 'Kamu'
  return <section className="plain-screen home-screen">
    <header className="home-topbar">
      <div className="home-brand"><img src={appIcon} alt="" /><span>Undangan<span>Ku</span><small>RUANG CERITA BAHAGIA</small></span></div>
      <button className="avatar" aria-label={`Profil ${displayName}`}>{displayName[0].toUpperCase()}</button>
    </header>
    <section className="home-hero">
      <div className="home-hero-copy">
        <span className="home-kicker"><span /> RUANG PRIBADIMU</span>
        <h1>Selamat datang,<br /><em>{displayName}.</em></h1>
        <p>Rangkai undangan sesuai ceritamu. Lengkapi isi dan sesuaikan tampilannya dalam satu editor.</p>
      </div>
    </section>
    <section className="home-flow" aria-label="Alur membuat undangan">
      <header className="home-flow-heading">
        <p className="eyebrow">CARA KERJANYA</p>
        <h2>Dari ide hingga siap dibagikan.</h2>
      </header>
      <div className="home-flow-row">
        <div className="home-flow-step"><span className="home-flow-marker"><small>01</small><span className="home-flow-icon"><Icon name="file" size={25} /></span></span><strong>Isi data</strong><small>Lengkapi nama &amp; acara</small></div>
        <Icon className="home-flow-arrow" name="arrow" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>02</small><span className="home-flow-icon"><Icon name="grid" size={25} /></span></span><strong>Atur tampilan</strong><small>Sesuaikan gaya undangan</small></div>
        <Icon className="home-flow-arrow" name="arrow" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>03</small><span className="home-flow-icon"><Icon name="palette" size={25} /></span></span><strong>Pratinjau</strong><small>Periksa sebelum dibagikan</small></div>
      </div>
      <Icon className="home-flow-turn" name="arrowDown" size={17} />
      <div className="home-flow-row home-flow-row-reverse">
        <div className="home-flow-step"><span className="home-flow-marker"><small>06</small><span className="home-flow-icon"><Icon name="share" size={25} /></span></span><strong>Selesai</strong><small>Undangan siap dibagikan</small></div>
        <Icon className="home-flow-arrow" name="arrowLeft" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>05</small><span className="home-flow-icon"><Icon name="lock" size={25} /></span></span><strong>Bagikan</strong><small>Kirim ke tamu</small></div>
        <Icon className="home-flow-arrow" name="arrowLeft" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>04</small><span className="home-flow-icon"><Icon name="eye" size={25} /></span></span><strong>Aktivasi</strong><small>Aktifkan undangan</small></div>
      </div>
    </section>
    <section className="home-drafts-panel">
      <span className="home-drafts-shimmer" aria-hidden="true" />
      <div className="section-heading draft-heading home-section-heading"><div><p className="eyebrow">Disimpan untuk nanti</p><h2>Rancanganmu</h2></div><span className="count-pill">{draftsLoading ? '…' : `${drafts.length}/2`}</span></div>
      {draftLimitMessage && <p className="field-error" role="alert">{draftLimitMessage}</p>}
      {draftsLoading ? <p className="home-drafts-status" role="status">Memuat rancangan tersimpan…</p>
        : draftsError ? <div className="home-drafts-error" role="alert"><p>{draftsError}</p><button type="button" className="outline-button" onClick={onRetryDrafts}>Coba lagi</button></div>
          : drafts.length ? <div className="home-drafts-list">{drafts.map((draft) => <div className="draft-card" key={draft.id}><InvitationThumbnail draft={draft} className="draft-thumb" /><div className="draft-copy"><h3>{draft.groomNickname || draft.groom || 'Rancangan Undangan'} <span>&amp;</span> {draft.brideNickname || draft.bride || 'Pasangan'}</h3><p>Editor undangan · tersimpan di Supabase</p><button className="outline-button" onClick={() => onOpen(draft)}>Lihat pratinjau</button></div></div>)}</div>
            : <div className="empty-card home-empty-card"><div className="empty-icon"><Icon name="file" /></div><h3>Belum ada rancangan</h3><p>Mulai dengan melengkapi data acara dan tampilan undangan.</p><button className="primary-button" onClick={onCreate}>Buat rancangan pertama <Icon name="arrow" size={17} /></button></div>}
    </section>
  </section>
}

function DraftsPage({ drafts, onBack, onCreate, onOpenDraft }) {
  return <section className="plain-screen">
    <Header title="Undangan Saya" onBack={onBack} />
    <div className="screen-intro"><p className="eyebrow">Ruang karyamu</p><h1>Semua rancanganmu.</h1><p className="template-helper">Undangan yang kamu buat tersimpan di sini.</p></div>
    {drafts.length ? <div className="draft-list">{drafts.map((draft) => <button className="draft-list-item" type="button" key={draft.id} onClick={() => onOpenDraft(draft)}>
      <InvitationThumbnail draft={draft} className="draft-list-art" />
      <span className="draft-list-copy"><strong>{draft.groomNickname || draft.groom || 'Nama mempelai'} <i>&amp;</i> {draft.brideNickname || draft.bride || 'Nama mempelai'}</strong><small>Undangan Pernikahan · {draft.status}</small></span>
      <Icon name="chevron" size={18} />
    </button>)}</div> : <div className="empty-card home-empty-card"><div className="empty-icon"><Icon name="file" /></div><h3>Belum ada undangan</h3><p>Rancangan yang kamu simpan akan muncul di sini.</p><button className="primary-button" onClick={onCreate}>Mulai buat undangan <Icon name="arrow" size={17} /></button></div>}
  </section>
}

function ProfilePage({ username, draftCount, onBack, onLogout }) {
  return <section className="plain-screen">
    <Header title="Profil" onBack={onBack} />
    <div className="profile-card">
      <div className="profile-avatar"><Icon name="user" size={28} /></div>
      <p className="eyebrow">Akun UndanganKu</p>
      <h1>{username || 'Pengguna'}</h1>
      <p className="profile-description">Ini adalah ruang pribadimu untuk mengelola rancangan undangan.</p>
      <div className="profile-details">
        <div><span>Nama ID</span><strong>{username || 'Belum tersedia'}</strong></div>
        <div><span>Rancangan tersimpan</span><strong>{draftCount} dari 2</strong></div>
      </div>
      <button className="outline-button profile-logout" onClick={onLogout}><Icon name="logout" size={17} /> Keluar dari akun</button>
    </div>
  </section>
}

function InvitationThumbnail({ draft, className = '' }) {
  const palettes = {
    forest: ['#f3eddf', '#263c30', '#b8935b'],
    ivory: ['#f7f4ec', '#544b3e', '#a7895e'],
    sage: ['#e8eee5', '#3e5a48', '#b08b58'],
    rose: ['#f2e8e5', '#694d52', '#b78477'],
  }
  const [paper, ink, accent] = palettes[draft?.palette] || palettes.forest
  return <div className={`invitation-thumbnail ${className}`} style={{ '--thumb-paper': paper, '--thumb-ink': ink, '--thumb-accent': accent }}>
    {draft?.photo && <img src={draft.photo} alt="" />}
    <span>UNDANGAN PERNIKAHAN</span>
    <strong>{draft?.groomNickname || draft?.groom || 'Nama'} <i>&amp;</i> {draft?.brideNickname || draft?.bride || 'Nama'}</strong>
    <small>{draft?.eventDate || 'Atur tanggal acara'}</small>
  </div>
}

function Editor({ form, setForm, onBack, onNext }) {
  const [dataError, setDataError] = useState('')
  const [mapMessage, setMapMessage] = useState('')
  const [mapSearchState, setMapSearchState] = useState('idle')
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDataError('')
  }
  const selectMapLocation = (latitude, longitude) => {
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
      mapLink: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    }))
    setMapMessage('')
    setDataError('')
  }
  useEffect(() => {
    const address = form.address.trim()
    const venue = form.venue.trim()
    const city = form.city.trim()
    if (address.length < 5 || !city) {
      setMapSearchState('idle')
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setMapSearchState('searching')
      try {
        const query = [address, venue, city, 'Indonesia'].filter(Boolean).join(', ')
        const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'id' })
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Layanan pencarian alamat merespons ${response.status}`)
        const results = await response.json()
        if (controller.signal.aborted) return
        const result = results[0]
        const latitude = Number(result?.lat)
        const longitude = Number(result?.lon)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setMapSearchState('not-found')
          return
        }
        selectMapLocation(latitude, longitude)
        setMapSearchState('found')
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Gagal mencari alamat pada peta:', error)
        setMapSearchState('error')
      }
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [form.address, form.city, form.venue])

  const locateDevice = () => {
    if (!navigator.geolocation) {
      setMapMessage('Browser ini tidak mendukung akses lokasi. Silakan pilih titik langsung pada peta.')
      return
    }
    setMapMessage('Sedang mencari lokasi perangkat…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => selectMapLocation(coords.latitude, coords.longitude),
      (error) => {
        const messages = {
          1: 'Izin lokasi belum diberikan. Izinkan akses lokasi atau pilih titik pada peta.',
          2: 'Lokasi perangkat tidak tersedia. Coba pilih titik pada peta.',
          3: 'Pencarian lokasi terlalu lama. Coba lagi atau pilih titik pada peta.',
        }
        setMapMessage(messages[error.code] || 'Lokasi perangkat tidak dapat ditemukan. Silakan pilih titik pada peta.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }
  const handleNext = () => {
    const requiredFields = [
      ['groom', 'nama mempelai pria'],
      ['bride', 'nama mempelai wanita'],
      ['eventDate', 'tanggal acara'],
      ['venue', 'lokasi acara'],
      ['city', 'kota'],
      ['address', 'alamat acara'],
    ]
    const missingField = requiredFields.find(([key]) => !form[key].trim())
    if (missingField) {
      setDataError(`Lengkapi ${missingField[1]} sebelum memilih desain.`)
      document.getElementById(missingField[0])?.focus()
      return
    }
    if (form.mapLink.trim()) {
      try {
        const mapUrl = new URL(form.mapLink.trim())
        const validHost = ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'].includes(mapUrl.hostname)
        if (!['http:', 'https:'].includes(mapUrl.protocol) || !validHost) throw new Error('URL peta tidak valid')
      } catch {
        setDataError('Masukkan link Google Maps yang valid, atau pilih titik lokasi pada peta.')
        document.getElementById('map-link')?.focus()
        return
      }
    }
    onNext()
  }
  return <section className="plain-screen editor-screen">
    <Header title="Isi Data Undangan" onBack={onBack} action={<span className="step-count">1 dari 6</span>} />
    <div className="screen-intro"><p className="eyebrow">Langkah 1 dari 6</p><h1>Lengkapi detail hari bahagiamu.</h1><p className="template-helper">Isi semua data acara terlebih dahulu. Setelah itu, kamu bisa memilih desain yang paling sesuai.</p></div>
    <div className="editor-form">
      <section className="editor-form-section" aria-labelledby="couple-section-title">
        <div className="editor-section-heading"><span className="editor-section-icon"><Icon name="sparkle" size={19} /></span><div><p className="eyebrow">Bagian 01 · Identitas</p><h2 id="couple-section-title">Nama pasangan</h2><p>Siapa yang akan merayakan hari istimewa?</p></div></div>
        <div className="editor-fields">
          <div className={`editor-field ${form.groom.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="groom">Nama mempelai pria <span>Wajib diisi</span></label><input id="groom" className="text-input" autoComplete="name" value={form.groom} onChange={(e) => update('groom', e.target.value)} placeholder="Contoh: Bagas Pratama" aria-required="true" /></div>
          <div className={`editor-field ${form.bride.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="bride">Nama mempelai wanita <span>Wajib diisi</span></label><input id="bride" className="text-input" autoComplete="name" value={form.bride} onChange={(e) => update('bride', e.target.value)} placeholder="Contoh: Andini Larasati" aria-required="true" /></div>
          <div className={`editor-field ${form.groomParents.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="groom-parents">Nama orang tua mempelai pria <span>Opsional</span></label><input id="groom-parents" className="text-input" value={form.groomParents} onChange={(e) => update('groomParents', e.target.value)} placeholder="Contoh: Bapak Arif & Ibu Ratna" /></div>
          <div className={`editor-field ${form.brideParents.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="bride-parents">Nama orang tua mempelai wanita <span>Opsional</span></label><input id="bride-parents" className="text-input" value={form.brideParents} onChange={(e) => update('brideParents', e.target.value)} placeholder="Contoh: Bapak Dedi & Ibu Sari" /></div>
        </div>
      </section>
      <section className="editor-form-section" aria-labelledby="event-section-title">
        <div className="editor-section-heading"><span className="editor-section-icon"><Icon name="clock" size={19} /></span><div><p className="eyebrow">Bagian 02 · Jadwal</p><h2 id="event-section-title">Atur rangkaian acara</h2><p>Isi jadwal Akad. Resepsi dapat ditambahkan bila ada.</p></div></div>
        <div className="editor-fields">
          <div className={`editor-field ${form.eventDate ? 'has-value' : ''}`}><label className="field-label" htmlFor="date">Tanggal Akad <span>Wajib diisi</span></label><div className="editor-input-wrap date-input-wrap"><Icon name="calendar" size={19} /><input id="date" className="text-input" type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} aria-required="true" /></div></div>
          <div className={`editor-field ${form.akadTime ? 'has-value' : ''}`}><label className="field-label" htmlFor="akad-time">Waktu Akad <span>Opsional</span></label><input id="akad-time" className="text-input" type="time" value={form.akadTime} onChange={(e) => update('akadTime', e.target.value)} /></div>
        </div>
        <div className="event-subsection">
          <div className="event-subsection-heading"><strong>Resepsi</strong><span>Opsional</span></div>
          <p>Tambahkan jadwal resepsi jika berbeda dari Akad.</p>
          <div className="editor-fields">
            <div className={`editor-field ${form.receptionDate ? 'has-value' : ''}`}><label className="field-label" htmlFor="reception-date">Tanggal resepsi <span>Opsional</span></label><input id="reception-date" className="text-input" type="date" value={form.receptionDate} onChange={(e) => update('receptionDate', e.target.value)} /></div>
            <div className={`editor-field ${form.receptionTime ? 'has-value' : ''}`}><label className="field-label" htmlFor="reception-time">Waktu resepsi <span>Opsional</span></label><input id="reception-time" className="text-input" type="time" value={form.receptionTime} onChange={(e) => update('receptionTime', e.target.value)} /></div>
          </div>
        </div>
      </section>
      <section className="editor-form-section" aria-labelledby="location-section-title">
        <div className="editor-section-heading"><span className="editor-section-icon"><Icon name="pin" size={19} /></span><div><p className="eyebrow">Bagian 03 · Lokasi</p><h2 id="location-section-title">Di mana acaranya?</h2><p>Isi lokasi Akad. Lokasi resepsi dapat ditambahkan bila berbeda.</p></div></div>
        <div className="editor-fields">
          <div className={`editor-field ${form.city.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="city">Kota / kabupaten <span>Wajib diisi</span></label><input id="city" className="text-input" autoComplete="address-level2" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Contoh: Jakarta Selatan" aria-required="true" /></div>
          <div className={`editor-field ${form.venue.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="venue">Nama tempat Akad <span>Wajib diisi</span></label><input id="venue" className="text-input" autoComplete="organization" value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Contoh: Masjid Al-Ikhlas" aria-required="true" /></div>
          <div className={`editor-field ${form.address.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="address">Alamat Akad <span>Wajib diisi</span></label><input id="address" className="text-input" autoComplete="street-address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Contoh: Jl. Melati No. 12, Kebayoran Baru" aria-required="true" /><small>{mapSearchState === 'searching' ? 'Mencari alamat di peta…' : mapSearchState === 'found' ? 'Alamat ditemukan dan titik peta diperbarui.' : mapSearchState === 'not-found' ? 'Alamat tidak ditemukan. Gunakan Lokasi saya atau geser pin di peta.' : mapSearchState === 'error' ? 'Pencarian alamat gagal. Periksa koneksi, lalu gunakan Lokasi saya atau geser pin di peta.' : 'Peta akan mencari alamat setelah kamu berhenti mengetik.'}</small></div>
        </div>
        <div className="editor-map-settings">
          <div className="editor-map-heading"><div><strong>Tandai lokasi Akad di peta</strong><p>Alamat akan dicari otomatis. Jika tidak ditemukan, gunakan Lokasi saya lalu geser pin, atau ketuk titik yang tepat pada peta.</p></div><button type="button" className="map-locate-button" onClick={locateDevice}><Icon name="pin" size={16} /> Lokasi saya</button></div>
          <Suspense fallback={<div className="venue-map map-loading" role="status">Memuat peta…</div>}>
            <VenueMapPicker latitude={form.latitude} longitude={form.longitude} onPick={selectMapLocation} />
          </Suspense>
          {Number.isFinite(form.latitude) && Number.isFinite(form.longitude) && <p className="map-coordinates" role="status">Pin dipilih · {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</p>}
          {mapMessage && <p className="map-message" role="status">{mapMessage}</p>}
          <div className={`editor-field map-link-field ${form.mapLink.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="map-link">Link Google Maps Akad <span>Opsional</span></label><input id="map-link" className="text-input" type="url" inputMode="url" autoComplete="url" value={form.mapLink} onChange={(e) => update('mapLink', e.target.value)} placeholder="Tempel link Google Maps di sini" /><small>{Number.isFinite(form.latitude) ? 'Link dibuat otomatis dari pin; kamu tetap bisa menggantinya.' : 'Tempel link Google Maps, atau pilih titik di peta untuk membuat link otomatis.'}</small></div>
        </div>
        <div className="event-subsection">
          <div className="event-subsection-heading"><strong>Lokasi resepsi</strong><span>Opsional</span></div>
          <p>Kosongkan jika resepsi berlangsung di tempat yang sama dengan Akad.</p>
          <div className="editor-fields">
            <div className={`editor-field ${form.receptionVenue.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="reception-venue">Nama tempat resepsi <span>Opsional</span></label><input id="reception-venue" className="text-input" value={form.receptionVenue} onChange={(e) => update('receptionVenue', e.target.value)} placeholder="Contoh: Aula Taman Cempaka" /></div>
            <div className={`editor-field ${form.receptionAddress.trim() ? 'has-value' : ''}`}><label className="field-label" htmlFor="reception-address">Alamat resepsi <span>Opsional</span></label><input id="reception-address" className="text-input" autoComplete="street-address" value={form.receptionAddress} onChange={(e) => update('receptionAddress', e.target.value)} placeholder="Alamat lengkap lokasi resepsi" /></div>
          </div>
        </div>
      </section>
    </div>
    {dataError && <p className="field-error editor-data-error" role="alert">{dataError}</p>}
    <div className="bottom-action editor-bottom-action"><button className="primary-button full" onClick={handleNext}>Lanjut pilih desain <Icon name="arrow" size={17} /></button><p>Data bisa kamu ubah lagi sebelum undangan dibagikan.</p></div>
  </section>
}

function ColorSelection({ template, form, photo, setPhoto, selectedColor, setSelectedColor, selectedFontColor, setSelectedFontColor, selectedAnimation, setSelectedAnimation, onBack, onSave }) {
  const [photoError, setPhotoError] = useState('')
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Gunakan foto dengan format JPG, PNG, atau WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Ukuran foto maksimal 5 MB.')
      return
    }
    setPhotoError('')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setPhotoError('Foto tidak dapat dibaca. Coba pilih gambar lain.')
        return
      }
      setPhoto(reader.result)
    }
    reader.onerror = () => setPhotoError('Foto tidak dapat dibaca. Coba pilih gambar lain.')
    reader.readAsDataURL(file)
  }
  return <section className="plain-screen">
    <Header title="Atur Desain & Warna" onBack={onBack} action={<span className="step-count">3 dari 6</span>} />
    <div className="screen-intro"><p className="eyebrow">Satu sentuhan personal</p><h1>Sesuaikan desain pilihanmu.</h1><p className="template-helper">{template?.title || 'Template pilihan'} · atur warna dan foto sebelum melihat pratinjau.</p></div>
    <TemplateArt item={template} photo={photo} colorIndex={selectedColor} fontColor={selectedFontColor} animation={selectedAnimation} className="color-preview">
      <div className={`editor-art-copy ${template?.photoLayout ? 'photo-preview-copy' : ''}`}>
        <span className="eyebrow">{template?.title || 'PRATINJAU UNDANGAN'}</span>
        <strong>{form.groom || 'Nama mempelai pria'} <i>&amp;</i> {form.bride || 'Nama mempelai wanita'}</strong>
        <small>{formatInvitationDate(form.eventDate) || 'Tanggal acara'}</small>
        {(form.akadTime || form.venue || form.city) && <span className="design-preview-detail">
          {[form.akadTime && `${form.akadTime} WIB`, form.venue, form.city].filter(Boolean).join(' · ')}
        </span>}
        {(form.groomParents || form.brideParents) && <span className="design-preview-parents">
          {[form.groomParents, form.brideParents].filter(Boolean).join(' · ')}
        </span>}
        {(form.receptionDate || form.receptionTime) && <span className="design-preview-detail">
          Resepsi · {[formatInvitationDate(form.receptionDate), form.receptionTime && `${form.receptionTime} WIB`].filter(Boolean).join(' · ')}
        </span>}
      </div>
    </TemplateArt>
    {template?.photoLayout && <div className="form-section photo-upload-section">
      <div className="section-heading"><div><p className="eyebrow">Personalisasi foto</p><h2>Tambahkan foto kalian</h2></div><Icon name="camera" size={21} /></div>
      <p className="template-helper">Desain ini menggunakan {photoLayoutLabels[template.photoLayout].toLowerCase()}. Gunakan foto JPG, PNG, atau WebP hingga 5 MB. Di prototipe ini, foto tersimpan sementara selama sesi aplikasi.</p>
      <label className="photo-upload">
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
        <span className="photo-upload-icon"><Icon name="camera" size={19} /></span>
        <span><strong>{photo ? 'Ganti foto' : 'Pilih foto dari perangkat'}</strong><small>{photo ? 'Foto akan mengikuti tata letak template' : 'Foto bersifat opsional'}</small></span>
      </label>
      {photo && <button type="button" className="text-button photo-remove" onClick={() => { setPhoto(''); setPhotoError('') }}>Hapus foto</button>}
      {photoError && <p className="field-error" role="alert">{photoError}</p>}
    </div>}
    {template?.type === 'Islami' && <div className="form-section animation-selection-section">
      <div className="section-heading"><div><p className="eyebrow">Gerak ornamen</p><h2>Pilih animasi undangan</h2></div><Icon name="sparkle" size={21} /></div>
      <p className="template-helper">Pilih gerakan halus untuk hiasan undangan. Animasi bisa dimatikan kapan saja.</p>
      <div className="animation-picker" role="group" aria-label="Pilih animasi undangan">
        {animationChoices.map((choice) => <button key={choice.id} type="button" className={`animation-choice ${selectedAnimation === choice.id ? 'active' : ''}`} onClick={() => setSelectedAnimation(choice.id)} aria-pressed={selectedAnimation === choice.id}>
          <span className={`animation-sample animation-sample-${choice.id}`} aria-hidden="true"><i /><i /><i /></span>
          <span className="animation-choice-copy"><strong>{choice.label}</strong><small>{choice.detail}</small></span>
          <span className="animation-check" aria-hidden="true">{selectedAnimation === choice.id ? '✓' : ''}</span>
        </button>)}
      </div>
    </div>}
    <div className="form-section color-selection-section">
      <div className="section-heading"><div><p className="eyebrow">Pilihan warna</p><h2>Pilih nuansa undanganmu</h2></div></div>
      <div className="color-picker">{template?.colors.map((color, index) => <button key={color} className={selectedColor === index ? 'color-swatch active' : 'color-swatch'} style={{ background: color }} onClick={() => setSelectedColor(index)} aria-label={`Pilih warna ${index + 1}`} aria-pressed={selectedColor === index} />)}</div>
      <p className="color-choice-label">Nuansa {selectedColor + 1} dari {template?.colors.length || 0}</p>
    </div>
    <div className="form-section font-color-section">
      <div className="section-heading"><div><p className="eyebrow">Warna tulisan</p><h2>Sesuaikan warna font</h2></div></div>
      <div className="font-color-picker" role="group" aria-label="Pilih warna font">
        {fontColorChoices.map((choice) => <button key={choice.value} type="button" className={`font-color-swatch ${selectedFontColor.toLowerCase() === choice.value ? 'active' : ''}`} style={{ '--font-swatch-color': choice.value }} onClick={() => setSelectedFontColor(choice.value)} aria-label={choice.label} aria-pressed={selectedFontColor.toLowerCase() === choice.value} />)}
        <label className={`font-color-custom ${fontColorChoices.some((choice) => choice.value === selectedFontColor.toLowerCase()) ? '' : 'active'}`}>
          <input type="color" value={selectedFontColor} onChange={(event) => setSelectedFontColor(event.target.value)} aria-label="Pilih warna font khusus" />
          <span aria-hidden="true">+</span>
        </label>
      </div>
      <p className="color-choice-label">Warna font: <span className="font-color-value">{selectedFontColor.toUpperCase()}</span></p>
    </div>
    <div className="bottom-action"><button className="primary-button full" onClick={onSave}>Lanjut ke pratinjau <Icon name="arrow" size={17} /></button></div>
  </section>
}

function formatInvitationDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatInvitationTime(value) {
  if (!value) return ''
  return `${value} WIB`
}

function Preview({ draft, onBack, onEdit, onPublish }) {
  const [liveOpen, setLiveOpen] = useState(false)
  const couple = `${draft?.groomNickname || draft?.groom || 'Nama mempelai'} & ${draft?.brideNickname || draft?.bride || 'Nama mempelai'}`
  const eventSummary = [
    { label: 'Akad Nikah', date: draft?.eventDate, time: draft?.akadTime, venue: draft?.venue, address: draft?.address },
    ...(draft?.receptionDate || draft?.receptionTime || draft?.receptionVenue || draft?.receptionAddress
      ? [{ label: 'Resepsi', date: draft.receptionDate, time: draft.receptionTime, venue: draft.receptionVenue || draft.venue, address: draft.receptionAddress || draft.address }]
      : []),
  ]
  return <section className="plain-screen">
    <Header title="Pratinjau Undangan" onBack={onBack} action={<button className="text-button preview-edit-button" onClick={onEdit}>Edit data</button>} />
    <div className="preview-note"><Icon name="check" size={17} /><span>Pratinjau sampul undangan digital. Buka Live Preview untuk melihat seluruh halaman acara.</span></div>
    <InvitationThumbnail draft={draft} className="invitation-preview" />
    <div className="preview-event-list">{eventSummary.map((event) => <div className="preview-event-card" key={event.label}><span className="eyebrow">{event.label}</span><strong>{formatInvitationDate(event.date) || 'Tanggal belum diatur'}{event.time && ` · ${formatInvitationTime(event.time)}`}</strong><small>{event.venue || 'Tempat acara'}{event.address ? ` · ${event.address}` : ''}</small></div>)}</div>
    {draft?.mapLink && <a className="map-preview-link" href={draft.mapLink} target="_blank" rel="noreferrer"><Icon name="pin" size={18} /><span><strong>Buka lokasi Akad</strong><small>{draft.address || draft.venue}{draft.city ? ` · ${draft.city}` : ''}</small></span><Icon name="arrow" size={18} /></a>}
    <button className="live-preview-button" onClick={() => setLiveOpen(true)}><span className="play-badge"><Icon name="play" size={14} /></span><span><strong>Lihat undangan seperti tamu</strong><small>Sampul, profil pasangan, jadwal, dan lokasi acara</small></span><Icon name="chevron" size={18} /></button>
    <div className="preview-sections"><div className="mini-feature"><Icon name="clock" /><div><strong>Jadwal acara</strong><span>{eventSummary.length} rangkaian ditampilkan</span></div><Icon name="check" size={17} /></div><div className="mini-feature"><Icon name="camera" /><div><strong>{draft?.photo ? 'Foto sampul terpasang' : 'Sampul ilustrasi'}</strong><span>{draft?.musicName || 'Tanpa musik'}</span></div><Icon name="check" size={17} /></div></div>
    <div className="bottom-action"><button className="primary-button full" onClick={onPublish}>Lanjut aktivasi <Icon name="arrow" size={17} /></button></div>
    {liveOpen && <LivePreview couple={couple} draft={draft} onClose={() => setLiveOpen(false)} onEdit={onEdit} onPublish={onPublish} />}
  </section>
}

function LivePreview({ couple, draft, onClose, onEdit, onPublish }) {
  const [opened, setOpened] = useState(false)
  const [rsvp, setRsvp] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  return <div className="live-overlay">
    <div className="live-topbar"><span className="live-mode-label">Pratinjau tamu</span><button className="icon-button light" onClick={onClose} aria-label="Tutup live preview"><Icon name="close" /></button></div>
    <div className="live-scroll"><Suspense fallback={<div className="wedding-loading" role="status">Memuat pratinjau undangan…</div>}><WeddingInvitation couple={couple} draft={draft} opened={opened} onOpen={() => setOpened(true)} onMusicSettings={() => { onClose(); onEdit('music') }} rsvp={rsvp} onRsvp={() => setRsvp(true)} /></Suspense></div>
    <nav className="live-toolbar" aria-label="Alat pratinjau undangan">
      <button type="button" onClick={() => { onClose(); onEdit('appearance') }}><Icon name="camera" size={18} /><span>Foto</span></button>
      <button type="button" onClick={() => { onClose(); onEdit('appearance') }}><Icon name="palette" size={18} /><span>Atur tema</span></button>
      <button type="button" onClick={() => setOpened((value) => !value)}><Icon name="eye" size={18} /><span>{opened ? 'Sampul' : 'Pratinjau'}</span></button>
      <button type="button" className="live-share-button" onClick={() => setShareOpen(true)}><Icon name="share" size={18} /><span>Bagikan</span></button>
    </nav>
    {shareOpen && <div className="live-share-overlay" role="presentation" onClick={() => setShareOpen(false)}>
      <section className="live-share-dialog" role="dialog" aria-modal="true" aria-labelledby="live-share-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="icon-button live-share-close" onClick={() => setShareOpen(false)} aria-label="Tutup"><Icon name="close" size={18} /></button>
        <span className="eyebrow">Undanganmu</span>
        <h2 id="live-share-title">Siap dibagikan?</h2>
        <p>Aktifkan undangan untuk mendapatkan tautan yang bisa dikirim kepada tamu.</p>
        <button type="button" className="unified-primary-button" onClick={() => { setShareOpen(false); onClose(); onPublish() }}>Lanjut aktivasi</button>
      </section>
    </div>}
  </div>
}

function Payment({ duration, setDuration, status, onBack, onSubmit }) { const prices = { 30: 'Rp49.000', 90: 'Rp89.000', 180: 'Rp149.000', 365: 'Rp229.000' }; return <section className="plain-screen"><Header title="Aktivasi Undangan" onBack={onBack} action={<span className="step-count">5 dari 6</span>} /><div className="screen-intro"><p className="eyebrow">Aktivasi sebelum berbagi</p><h1>Aktifkan undanganmu.</h1><p className="muted">Pilih masa aktif. Undangan dapat dibagikan setelah pembayaran disetujui admin.</p></div><div className="duration-grid">{Object.entries(prices).map(([days, price]) => <button key={days} className={duration === Number(days) ? 'duration-card active' : 'duration-card'} onClick={() => setDuration(Number(days))}><span>{days === '365' ? '1 tahun' : `${days} hari`}</span><strong>{price}</strong>{days === '90' && <em>Populer</em>}</button>)}</div><div className="payment-card"><div><span className="eyebrow">Virtual Account</span><h3>VA UndanganKu</h3></div><strong className="va-number">8808 1200 2026 01</strong><p>Setelah melakukan pembayaran, konfirmasikan di bawah ini agar admin dapat memeriksanya.</p><button className="outline-button full" onClick={onSubmit} disabled={status === 'waiting'}>{status === 'waiting' ? 'Menunggu pemeriksaan admin' : 'Konfirmasi sudah membayar'}</button></div>{status === 'waiting' ? <div className="security-note" role="status"><Icon name="clock" size={17} /><span>Pembayaranmu menunggu konfirmasi admin. Langkah berbagi tersedia setelah aktivasi disetujui.</span></div> : <div className="security-note"><Icon name="check" size={17} /><span>Undangan belum aktif sebelum pembayaran disetujui.</span></div>}</section> }

function Share({ onBack }) { return <section className="plain-screen centered-screen"><p className="eyebrow">Langkah 6 dari 6</p><div className="success-mark"><Icon name="check" size={28} /></div><p className="eyebrow">Undangan aktif</p><h1>Siap dibagikan dengan elegan.</h1><p className="muted center-copy">Link undanganmu sudah siap. Bagikan secara personal melalui WhatsApp.</p><div className="link-card"><span>undanganku.id/andi-dan-sari</span><button className="icon-button small" aria-label="Salin link"><Icon name="share" size={17} /></button></div><button className="primary-button full">Bagikan ke WhatsApp <Icon name="share" size={17} /></button><button className="text-button" onClick={onBack}>Kembali ke beranda</button></section> }

function BottomNav({ active, setActive }) { return <nav className="bottom-nav home-only-nav" aria-label="Navigasi utama"><button className={active === 'home' ? 'active' : ''} onClick={() => setActive('home')}><Icon name="home" /><span>Beranda</span></button></nav> }

createRoot(document.getElementById('root')).render(<App />)
