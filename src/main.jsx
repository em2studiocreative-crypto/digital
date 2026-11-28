import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './overrides.css'
import { supabase, usernameAuthEmail } from './lib/supabaseClient.js'

const VenueMapPicker = lazy(() => import('./VenueMapPicker.jsx'))
const WeddingInvitation = lazy(() => import('./WeddingInvitation.jsx'))

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

const templates = [
  { id: 1, title: 'Sela', type: 'Simple', art: 'simple', colors: ['#f3eddf', '#263c30', '#b8935b'] },
  { id: 6, title: 'Akad Pagi', type: 'Simple', art: 'simple', colors: ['#f5f0e5', '#53675b', '#c4a878'] },
  { id: 7, title: 'Putih Janji', type: 'Simple', art: 'simple', colors: ['#f7f5f0', '#52616b', '#b8a78b'] },
  { id: 8, title: 'Ruang Rindu', type: 'Simple', art: 'simple', colors: ['#eadfd2', '#5a463e', '#b77b64'] },
  { id: 9, title: 'Senandika', type: 'Simple', art: 'simple', colors: ['#e9e5d8', '#38483e', '#9c9875'] },
  { id: 2, title: 'Rona Pesta', type: 'Full Color', art: 'colorful', colors: ['#f2b84b', '#e87563', '#64549b'] },
  { id: 10, title: 'Pesta Ceria', type: 'Full Color', art: 'colorful', colors: ['#f2a65a', '#df5474', '#694f9b'] },
  { id: 11, title: 'Senja Meriah', type: 'Full Color', art: 'colorful', colors: ['#e7a64e', '#bf5360', '#3f7180'] },
  { id: 12, title: 'Rona Bahagia', type: 'Full Color', art: 'colorful', colors: ['#f1bd62', '#ed7c54', '#536ca1'] },
  { id: 13, title: 'Kisah Warna', type: 'Full Color', art: 'colorful', colors: ['#d98d75', '#76569a', '#e3b74e'] },
  { id: 3, title: 'Rimba Senja', type: 'Natural', art: 'natural', colors: ['#c7d0b4', '#d9c096', '#6e7b68'] },
  { id: 14, title: 'Pagi di Ubud', type: 'Natural', art: 'natural', colors: ['#d6ddc8', '#a8ad82', '#687b68'] },
  { id: 15, title: 'Embun Lembut', type: 'Natural', art: 'natural', colors: ['#d7e2db', '#8fa99b', '#65766a'] },
  { id: 16, title: 'Bumi Teduh', type: 'Natural', art: 'natural', colors: ['#d7c8aa', '#a88962', '#65705b'] },
  { id: 17, title: 'Lembah Asri', type: 'Natural', art: 'natural', colors: ['#c4d2c2', '#b2a47e', '#58705c'] },
  { id: 4, title: 'Purnama Jawa', type: 'Tradisional', art: 'traditional', colors: ['#a88a62', '#44372c', '#ede0c2'] },
  { id: 18, title: 'Batik Laras', type: 'Tradisional', art: 'traditional', colors: ['#b58961', '#49372f', '#ead8b8'] },
  { id: 19, title: 'Sekar Jagad', type: 'Tradisional', art: 'traditional', colors: ['#a86d55', '#432f2b', '#e6c99c'] },
  { id: 20, title: 'Adat Pusaka', type: 'Tradisional', art: 'traditional', colors: ['#c19a67', '#514033', '#f0dfbd'] },
  { id: 21, title: 'Citra Mataram', type: 'Tradisional', art: 'traditional', colors: ['#947456', '#382e29', '#dbc69f'] },
  { id: 5, title: 'Taman Hati', type: 'Floral', art: 'floral', colors: ['#e7c1bd', '#f4ede5', '#8a6c78'] },
  { id: 22, title: 'Mawar Pagi', type: 'Floral', art: 'floral', colors: ['#edc9c1', '#f5eee5', '#9c6970'] },
  { id: 23, title: 'Bunga Senja', type: 'Floral', art: 'floral', colors: ['#d9b3b0', '#f4e8d9', '#876578'] },
  { id: 24, title: 'Kebun Cinta', type: 'Floral', art: 'floral', colors: ['#e8cbb1', '#f8f0df', '#8a8b68'] },
  { id: 25, title: 'Kelopak Kasih', type: 'Floral', art: 'floral', colors: ['#dfbfc9', '#f7ede8', '#986f83'] },
  { id: 26, title: 'Sampul Senja', type: 'Dengan Foto', art: 'photo', photoLayout: 'cover', colors: ['#8c5a45', '#f4e3d3', '#e6bb75'] },
  { id: 27, title: 'Potret Pagi', type: 'Dengan Foto', art: 'photo', photoLayout: 'top', colors: ['#e7e1d3', '#4b6358', '#c4a878'] },
  { id: 28, title: 'Bingkai Kenangan', type: 'Dengan Foto', art: 'photo', photoLayout: 'frame', colors: ['#e8d9d1', '#744f56', '#c59078'] },
  { id: 29, title: 'Ruang Cerita', type: 'Dengan Foto', art: 'photo', photoLayout: 'side', colors: ['#d7e0d4', '#40594d', '#a8855d'] },
  { id: 30, title: 'Arsip Cinta', type: 'Dengan Foto', art: 'photo', photoLayout: 'wide', colors: ['#e8d7b8', '#4c4a40', '#ba795e'] },
]

const photoLayoutLabels = {
  cover: 'Foto latar',
  top: 'Foto atas',
  frame: 'Foto bingkai',
  side: 'Foto samping',
  wide: 'Foto lebar',
}

const themeLabels = {
  Simple: 'Klasik Editorial',
  'Full Color': 'Warna Cerita',
  Natural: 'Botanical',
  Tradisional: 'Nusantara',
  Floral: 'Floral',
  'Dengan Foto': 'Foto Pasangan',
}

function App() {
  const [screen, setScreen] = useState('welcome')
  const hasNavigated = useRef(false)
  const [onboarding, setOnboarding] = useState(0)
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [currentUser, setCurrentUser] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [logoutMessage, setLogoutMessage] = useState('')
  const [drafts, setDrafts] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedColor, setSelectedColor] = useState(0)
  const [activeNav, setActiveNav] = useState('home')
  const [form, setForm] = useState({
    groom: '',
    bride: '',
    groomParents: '',
    brideParents: '',
    eventDate: '',
    akadTime: '',
    venue: '',
    city: '',
    address: '',
    receptionDate: '',
    receptionTime: '',
    receptionVenue: '',
    receptionAddress: '',
    photo: '',
  })
  const [previewBackScreen, setPreviewBackScreen] = useState('colors')
  const [duration, setDuration] = useState(90)
  const [paymentStatus, setPaymentStatus] = useState('unpaid')

  const activeDraft = useMemo(() => drafts[0], [drafts])
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
      if (!active || !session) return
      setCurrentUser(session.user.user_metadata?.username || '')
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Gagal memuat sesi autentikasi:', error.message)
        setAuthMessage('Sesi akun tidak dapat dimuat. Silakan coba masuk kembali.')
      } else if (data.session) {
        setCurrentUser(data.session.user.user_metadata?.username || '')
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
    setSelectedColor(0)
    setForm({
      groom: '',
      bride: '',
      groomParents: '',
      brideParents: '',
      eventDate: '',
      akadTime: '',
      venue: '',
      city: '',
      address: '',
      mapLink: '',
      latitude: null,
      longitude: null,
      receptionDate: '',
      receptionTime: '',
      receptionVenue: '',
      receptionAddress: '',
      photo: '',
    })
    setPaymentStatus('unpaid')
    go('editor')
  }
  const saveDraft = () => {
    const next = { ...form, template: selectedTemplate, color: selectedColor, id: Date.now(), status: 'Draft' }
    setDrafts((items) => [next, ...items].slice(0, 2))
    setPreviewBackScreen('colors')
    go('preview')
  }
  const openDraft = (draft) => {
    setDrafts((items) => [draft, ...items.filter((item) => item.id !== draft.id)])
    setForm({
      groom: draft.groom || '',
      bride: draft.bride || '',
      groomParents: draft.groomParents || '',
      brideParents: draft.brideParents || '',
      eventDate: draft.eventDate || '',
      akadTime: draft.akadTime || '',
      venue: draft.venue || '',
      city: draft.city || '',
      address: draft.address || '',
      mapLink: draft.mapLink || '',
      latitude: draft.latitude ?? null,
      longitude: draft.longitude ?? null,
      receptionDate: draft.receptionDate || '',
      receptionTime: draft.receptionTime || '',
      receptionVenue: draft.receptionVenue || '',
      receptionAddress: draft.receptionAddress || '',
      photo: draft.photo || '',
    })
    setSelectedTemplate(draft.template || null)
    setSelectedColor(draft.color || 0)
    setPreviewBackScreen('drafts')
    go('preview')
  }
  const publish = () => {
    go('payment')
  }
  const logout = async () => {
    if (!supabase) {
      setLogoutMessage('Layanan akun belum tersedia. Tidak dapat mengakhiri sesi.')
      return
    }

    setLogoutMessage('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setCurrentUser('')
      setPassword('')
      setAuthMode('login')
      setAuthMessage('')
      setActiveNav('home')
      go('login')
    } catch (error) {
      console.error('Gagal mengakhiri sesi:', error)
      setLogoutMessage('Tidak dapat keluar dari akun. Periksa koneksi lalu coba lagi.')
    }
  }

  return (
    <main className={`app-shell ${screen === 'welcome' ? 'welcome-app-shell' : ''} ${screen === 'login' ? 'auth-app-shell' : ''} ${screen === 'home' ? 'home-app-shell' : ''}`}>
      {screen === 'welcome' && <Welcome onboarding={onboarding} setOnboarding={setOnboarding} onStart={startApp} />}
      {screen === 'login' && <AuthScreen mode={authMode} setMode={(mode) => { setAuthMode(mode); setAuthMessage(''); setPassword('') }} username={username} setUsername={setUsername} password={password} setPassword={setPassword} message={authMessage} busy={authBusy} onSubmit={submitAuth} />}
      {screen === 'home' && <Home drafts={drafts} activeDraft={activeDraft} username={currentUser} onCreate={createDraft} onOpen={go} />}
      {screen === 'templates' && <TemplateGallery onBack={() => go('editor')} selected={selectedTemplate} setSelected={setSelectedTemplate} onUse={() => go('colors')} />}
      {screen === 'drafts' && <DraftsPage drafts={drafts} onBack={() => go('home')} onCreate={createDraft} onOpenDraft={openDraft} />}
      {screen === 'profile' && <ProfilePage username={currentUser} draftCount={drafts.length} onBack={() => go('home')} onLogout={logout} />}
      {screen === 'editor' && <Editor form={form} setForm={setForm} onBack={() => go('home')} onNext={() => go('templates')} />}
      {screen === 'colors' && <ColorSelection template={selectedTemplate} photo={form.photo} setPhoto={(photo) => setForm((current) => ({ ...current, photo }))} selectedColor={selectedColor} setSelectedColor={setSelectedColor} onBack={() => go('templates')} onSave={saveDraft} />}
      {screen === 'preview' && <Preview draft={activeDraft} onBack={() => go(previewBackScreen)} onPublish={publish} />}
      {screen === 'payment' && <Payment duration={duration} setDuration={setDuration} status={paymentStatus} onBack={() => go('preview')} onSubmit={() => setPaymentStatus('waiting')} />}
      {screen === 'share' && <Share onBack={() => go('home')} />}
      {['home', 'templates', 'drafts', 'profile'].includes(screen) && <>
        {logoutMessage && <p className="nav-message" role="alert">{logoutMessage}</p>}
        <BottomNav active={screen} setActive={(item) => { setLogoutMessage(''); setActiveNav(item); if (item === 'templates' && screen !== 'templates') createDraft(); else go(item) }} onLogout={logout} />
      </>}
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

function Home({ drafts, activeDraft, username, onCreate, onOpen }) {
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
        <p>Rangkai undangan sesuai ceritamu. Lengkapi data acara, lalu pilih desain yang paling kamu suka.</p>
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
        <div className="home-flow-step"><span className="home-flow-marker"><small>02</small><span className="home-flow-icon"><Icon name="grid" size={25} /></span></span><strong>Pilih desain</strong><small>Temukan gayamu</small></div>
        <Icon className="home-flow-arrow" name="arrow" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>03</small><span className="home-flow-icon"><Icon name="palette" size={25} /></span></span><strong>Atur warna</strong><small>Pilih nuansa</small></div>
      </div>
      <Icon className="home-flow-turn" name="arrowDown" size={17} />
      <div className="home-flow-row home-flow-row-reverse">
        <div className="home-flow-step"><span className="home-flow-marker"><small>06</small><span className="home-flow-icon"><Icon name="share" size={25} /></span></span><strong>Bagikan</strong><small>Kirim ke tamu</small></div>
        <Icon className="home-flow-arrow" name="arrowLeft" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>05</small><span className="home-flow-icon"><Icon name="lock" size={25} /></span></span><strong>Aktivasi</strong><small>Aktifkan undangan</small></div>
        <Icon className="home-flow-arrow" name="arrowLeft" size={18} />
        <div className="home-flow-step"><span className="home-flow-marker"><small>04</small><span className="home-flow-icon"><Icon name="eye" size={25} /></span></span><strong>Pratinjau</strong><small>Cek hasilnya</small></div>
      </div>
    </section>
    <section className="home-drafts-panel">
      <span className="home-drafts-shimmer" aria-hidden="true" />
      <div className="section-heading draft-heading home-section-heading"><div><p className="eyebrow">Disimpan untuk nanti</p><h2>Rancanganmu</h2></div><span className="count-pill">{drafts.length}/2</span></div>
      {activeDraft ? <div className="draft-card"><TemplateArt item={activeDraft.template} photo={activeDraft.photo} colorIndex={activeDraft.color || 0} className="draft-thumb" /><div className="draft-copy"><h3>{activeDraft.groom || 'Rancangan Undangan' } <span>&amp;</span> {activeDraft.bride || 'Pasangan'}</h3><p>{activeDraft.template?.title || 'Template pilihan'} · Tema {activeDraft.color + 1}</p><button className="outline-button" onClick={() => onOpen('preview')}>Lihat pratinjau</button></div></div> : <div className="empty-card home-empty-card"><div className="empty-icon"><Icon name="file" /></div><h3>Belum ada rancangan</h3><p>Mulai dengan melengkapi data acara, lalu pilih desain undangan.</p><button className="primary-button" onClick={onCreate}>Buat rancangan pertama <Icon name="arrow" size={17} /></button></div>}
    </section>
  </section>
}

function DraftsPage({ drafts, onBack, onCreate, onOpenDraft }) {
  return <section className="plain-screen">
    <Header title="Undangan Saya" onBack={onBack} />
    <div className="screen-intro"><p className="eyebrow">Ruang karyamu</p><h1>Semua rancanganmu.</h1><p className="template-helper">Undangan yang kamu buat tersimpan di sini.</p></div>
    {drafts.length ? <div className="draft-list">{drafts.map((draft) => <button className="draft-list-item" type="button" key={draft.id} onClick={() => onOpenDraft(draft)}>
      <TemplateArt item={draft.template} photo={draft.photo} colorIndex={draft.color || 0} className="draft-list-art" />
      <span className="draft-list-copy"><strong>{draft.groom || 'Nama mempelai'} <i>&amp;</i> {draft.bride || 'Nama mempelai'}</strong><small>{draft.template?.title || 'Template pilihan'} · {draft.status}</small></span>
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

function TemplateArt({ item, className = '', children, colorIndex = 0, photo = '' }) {
  const art = item?.art || 'simple'
  const colors = item?.colors || ['#f3eddf', '#263c30', '#b8935b']
  const primaryIndex = colorIndex % colors.length
  const style = {
    '--art-primary': colors[primaryIndex],
    '--art-secondary': colors[(primaryIndex + 1) % colors.length],
    '--art-accent': colors[(primaryIndex + 2) % colors.length],
  }
  const isPhotoTemplate = Boolean(item?.photoLayout)
  const content = children || <div className="art-copy"><span>UNDANGAN PERNIKAHAN</span><strong>Nama <i>&amp;</i> Nama</strong><small>12 · 12 · 26</small></div>
  return <div className={`template-art art-${art} ${className}`} style={style}>
    <span className="art-type">{themeLabels[item?.type] || item?.type || 'Klasik Editorial'}</span>
    {isPhotoTemplate && <div className="photo-frame" aria-hidden="true">
      {photo ? <img className="photo-image" src={photo} alt="" /> : <span className="photo-placeholder" />}
    </div>}
    {isPhotoTemplate ? <div className="photo-copy">{content}</div> : content}
    <span className="art-privacy">{isPhotoTemplate ? photo ? 'Foto terpasang' : 'Unggah foto' : 'Tanpa foto'}</span>
  </div>
}

function TemplateGallery({ onBack, selected, setSelected, onUse }) {
  const [filter, setFilter] = useState('Semua')
  const filters = ['Semua', ...new Set(templates.map((item) => item.type))]
  const shown = filter === 'Semua' ? templates : templates.filter((item) => item.type === filter)
  return <section className="plain-screen"><Header title="Pilih Template" onBack={onBack} action={<button type="button" className="icon-button" aria-label="Cari"><Icon name="search" /></button>} /><div className="screen-intro"><p className="eyebrow">Langkah 2 dari 6</p><h1>Pilih bentuk undangan digitalmu.</h1><p className="template-helper">Setiap desain kini menampilkan contoh sampul dan halaman undangan di layar ponsel. Pilih gaya, lalu sesuaikan foto dan warnanya.</p></div><button type="button" className={selected ? 'selection-hint selected' : 'selection-hint'} onClick={() => { if (selected) onUse() }} aria-label={selected ? 'Lanjutkan mengatur desain' : 'Petunjuk memilih template'}><Icon name={selected ? 'check' : 'grid'} size={17} /><span>{selected ? `Template “${selected.title}” dipilih. Ketuk di sini untuk mengatur warna dan foto.` : 'Pilih gaya klasik editorial, warna ceria, botanical, Nusantara, floral, atau foto pasangan.'}</span></button><div className="filter-row">{filters.map((item) => <button type="button" key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{themeLabels[item]}</button>)}</div><div className="template-grid">{shown.map((item) => <TemplateCard key={item.id} item={item} selected={selected?.id === item.id} onClick={() => setSelected(item)} />)}</div>{selected && <div className="sticky-action"><div><span className="eyebrow">Template dipilih</span><strong>{selected.title}</strong><small>{selected.photoLayout ? `${photoLayoutLabels[selected.photoLayout]} · ` : 'Undangan digital · '}{selected.colors.length} pilihan warna</small></div><button type="button" className="primary-button" onClick={onUse}>Lanjut atur desain <Icon name="arrow" size={17} /></button></div>}</section>
}

function TemplateCard({ item, selected, compact, onClick }) {
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

function ColorSelection({ template, photo, setPhoto, selectedColor, setSelectedColor, onBack, onSave }) {
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
    <TemplateArt item={template} photo={photo} colorIndex={selectedColor} className="color-preview">
      <div className={`editor-art-copy ${template?.photoLayout ? 'photo-preview-copy' : ''}`}><span className="eyebrow">PRATINJAU TEMA{template?.photoLayout ? ' · FOTO' : ' · TANPA FOTO'}</span><strong>Nama <i>&amp;</i> Nama</strong><small>12 · 12 · 26</small></div>
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
    <div className="form-section color-selection-section">
      <div className="section-heading"><div><p className="eyebrow">Pilihan warna</p><h2>Pilih nuansa undanganmu</h2></div></div>
      <div className="color-picker">{template?.colors.map((color, index) => <button key={color} className={selectedColor === index ? 'color-swatch active' : 'color-swatch'} style={{ background: color }} onClick={() => setSelectedColor(index)} aria-label={`Pilih warna ${index + 1}`} aria-pressed={selectedColor === index} />)}</div>
      <p className="color-choice-label">Nuansa {selectedColor + 1} dari {template?.colors.length || 0}</p>
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

function Preview({ draft, onBack, onPublish }) {
  const [liveOpen, setLiveOpen] = useState(false)
  const couple = `${draft?.groom || 'Bagas'} & ${draft?.bride || 'Andini'}`
  const eventSummary = [
    { label: 'Akad Nikah', date: draft?.eventDate, time: draft?.akadTime, venue: draft?.venue, address: draft?.address },
    ...(draft?.receptionDate || draft?.receptionTime || draft?.receptionVenue || draft?.receptionAddress
      ? [{ label: 'Resepsi', date: draft.receptionDate, time: draft.receptionTime, venue: draft.receptionVenue || draft.venue, address: draft.receptionAddress || draft.address }]
      : []),
  ]
  return <section className="plain-screen">
    <Header title="Pratinjau Undangan" onBack={onBack} action={<span className="step-count">4 dari 6</span>} />
    <div className="preview-note"><Icon name="check" size={17} /><span>Pratinjau sampul undangan digital. Buka Live Preview untuk melihat seluruh halaman acara.</span></div>
    <TemplateArt item={draft?.template} photo={draft?.photo} colorIndex={draft?.color || 0} className="invitation-preview">
      <div className="preview-content">
        <span className="eyebrow">SAVE THE DATE</span>
        <h1>{couple}</h1>
        <p>{formatInvitationDate(draft?.eventDate)}</p>
        <div className="preview-divider" />
        <p className="preview-venue">Akad Nikah<br />{draft?.venue || 'Gedung Pernikahan'}<br />{draft?.address && <>{draft.address}<br /></>}{draft?.city || 'Jakarta'}</p>
      </div>
    </TemplateArt>
    <div className="preview-event-list">{eventSummary.map((event) => <div className="preview-event-card" key={event.label}><span className="eyebrow">{event.label}</span><strong>{formatInvitationDate(event.date) || 'Tanggal belum diatur'}{event.time && ` · ${formatInvitationTime(event.time)}`}</strong><small>{event.venue || 'Tempat acara'}{event.address ? ` · ${event.address}` : ''}</small></div>)}</div>
    {draft?.mapLink && <a className="map-preview-link" href={draft.mapLink} target="_blank" rel="noreferrer"><Icon name="pin" size={18} /><span><strong>Buka lokasi Akad</strong><small>{draft.address || draft.venue}{draft.city ? ` · ${draft.city}` : ''}</small></span><Icon name="arrow" size={18} /></a>}
    <button className="live-preview-button" onClick={() => setLiveOpen(true)}><span className="play-badge"><Icon name="play" size={14} /></span><span><strong>Lihat undangan seperti tamu</strong><small>Sampul, profil pasangan, jadwal, dan lokasi acara</small></span><Icon name="chevron" size={18} /></button>
    <div className="preview-sections"><div className="mini-feature"><Icon name="clock" /><div><strong>Jadwal acara</strong><span>{eventSummary.length} rangkaian ditampilkan</span></div><Icon name="check" size={17} /></div><div className="mini-feature"><Icon name="camera" /><div><strong>{draft?.photo ? 'Foto sampul terpasang' : 'Desain undangan'}</strong><span>{draft?.template?.title || 'Template pilihan'}</span></div><Icon name="check" size={17} /></div></div>
    <div className="bottom-action"><button className="primary-button full" onClick={onPublish}>Lanjut aktivasi <Icon name="arrow" size={17} /></button></div>
    {liveOpen && <LivePreview couple={couple} draft={draft} onClose={() => setLiveOpen(false)} />}
  </section>
}

function LivePreview({ couple, draft, onClose }) {
  const [opened, setOpened] = useState(false)
  const [rsvp, setRsvp] = useState(false)
  return <div className="live-overlay">
    <div className="live-topbar"><div><span className="eyebrow light-text">Mode tamu</span><strong>Live Preview</strong></div><button className="icon-button light" onClick={onClose} aria-label="Tutup live preview"><Icon name="close" /></button></div>
    <div className="live-scroll"><Suspense fallback={<div className="wedding-loading" role="status">Memuat pratinjau undangan…</div>}><WeddingInvitation couple={couple} draft={draft} opened={opened} onOpen={() => setOpened(true)} rsvp={rsvp} onRsvp={() => setRsvp(true)} /></Suspense></div>
  </div>
}

function Payment({ duration, setDuration, status, onBack, onSubmit }) { const prices = { 30: 'Rp49.000', 90: 'Rp89.000', 180: 'Rp149.000', 365: 'Rp229.000' }; return <section className="plain-screen"><Header title="Aktivasi Undangan" onBack={onBack} action={<span className="step-count">5 dari 6</span>} /><div className="screen-intro"><p className="eyebrow">Aktivasi sebelum berbagi</p><h1>Aktifkan undanganmu.</h1><p className="muted">Pilih masa aktif. Undangan dapat dibagikan setelah pembayaran disetujui admin.</p></div><div className="duration-grid">{Object.entries(prices).map(([days, price]) => <button key={days} className={duration === Number(days) ? 'duration-card active' : 'duration-card'} onClick={() => setDuration(Number(days))}><span>{days === '365' ? '1 tahun' : `${days} hari`}</span><strong>{price}</strong>{days === '90' && <em>Populer</em>}</button>)}</div><div className="payment-card"><div><span className="eyebrow">Virtual Account</span><h3>VA UndanganKu</h3></div><strong className="va-number">8808 1200 2026 01</strong><p>Setelah melakukan pembayaran, konfirmasikan di bawah ini agar admin dapat memeriksanya.</p><button className="outline-button full" onClick={onSubmit} disabled={status === 'waiting'}>{status === 'waiting' ? 'Menunggu pemeriksaan admin' : 'Konfirmasi sudah membayar'}</button></div>{status === 'waiting' ? <div className="security-note" role="status"><Icon name="clock" size={17} /><span>Pembayaranmu menunggu konfirmasi admin. Langkah berbagi tersedia setelah aktivasi disetujui.</span></div> : <div className="security-note"><Icon name="check" size={17} /><span>Undangan belum aktif sebelum pembayaran disetujui.</span></div>}</section> }

function Share({ onBack }) { return <section className="plain-screen centered-screen"><p className="eyebrow">Langkah 6 dari 6</p><div className="success-mark"><Icon name="check" size={28} /></div><p className="eyebrow">Undangan aktif</p><h1>Siap dibagikan dengan elegan.</h1><p className="muted center-copy">Link undanganmu sudah siap. Bagikan secara personal melalui WhatsApp.</p><div className="link-card"><span>undanganku.id/andi-dan-sari</span><button className="icon-button small" aria-label="Salin link"><Icon name="share" size={17} /></button></div><button className="primary-button full">Bagikan ke WhatsApp <Icon name="share" size={17} /></button><button className="text-button" onClick={onBack}>Kembali ke beranda</button></section> }

function BottomNav({ active, setActive, onLogout }) { return <nav className="bottom-nav"><button className={active === 'home' ? 'active' : ''} onClick={() => setActive('home')}><Icon name="home" /><span>Beranda</span></button><button className={active === 'templates' ? 'active' : ''} onClick={() => setActive('templates')}><Icon name="grid" /><span>Template</span></button><button className={active === 'drafts' ? 'active' : ''} onClick={() => setActive('drafts')}><Icon name="file" /><span>Undangan</span></button><button className={active === 'profile' ? 'active' : ''} onClick={() => setActive('profile')}><Icon name="user" /><span>Profil</span></button><button type="button" onClick={onLogout}><Icon name="logout" /><span>Logout</span></button></nav> }

createRoot(document.getElementById('root')).render(<App />)
