'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif"

type View = 'home' | 'upload' | 'chat'
interface Msg { role: 'user' | 'assistant'; content: string }

export default function DashboardPage() {
  const [view, setView]               = useState<View>('home')
  const [uploading, setUploading]     = useState(false)
  const [uploadOk, setUploadOk]       = useState<string | null>(null)
  const [uploadErr, setUploadErr]     = useState<string | null>(null)
  const [messages, setMessages]       = useState<Msg[]>([])
  const [question, setQuestion]       = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const fileRef   = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router    = useRouter()
  const supabase  = createClient()

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
  }, [supabase, router])

  const goHome = () => { setView('home'); setUploadOk(null); setUploadErr(null) }

  /* ── Upload ── */
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadErr(null); setUploadOk(null)
    if (file.type !== 'application/pdf') { setUploadErr('Nur PDF-Dateien erlaubt.'); return }
    if (file.size > 10 * 1024 * 1024)   { setUploadErr('Maximal 10 MB.'); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r  = await fetch('/api/upload', { method: 'POST', body: fd })
      const d  = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Upload fehlgeschlagen')
      setUploadOk(`„${file.name}" erfolgreich gespeichert.`)
    } catch (err) { setUploadErr(err instanceof Error ? err.message : 'Fehler') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  /* ── Chat ── */
  const onChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim(); if (!q || chatLoading) return
    setQuestion(''); setMessages(p => [...p, { role: 'user', content: q }]); setChatLoading(true)
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Fehler')
      setMessages(p => [...p, { role: 'assistant', content: d.answer }])
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `⚠️ ${err instanceof Error ? err.message : 'KI nicht erreichbar.'}` }])
    } finally {
      setChatLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  /* ── Shared styles ── */
  const s = {
    page:    { minHeight: '100vh', background: '#f5f5f7', fontFamily: F } as React.CSSProperties,
    nav:     { background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.07)', position: 'sticky', top: 0, zIndex: 50 } as React.CSSProperties,
    navInner:{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
    logo:    { display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
    logoMk:  { width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(145deg,#0071e3,#34aadc)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
    logoCo:  { fontSize: 15, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.2px' } as React.CSSProperties,
    logOut:  { fontSize: 13, color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F } as React.CSSProperties,
    main:    { maxWidth: 960, margin: '0 auto', padding: '48px 24px' } as React.CSSProperties,
    h1:      { fontSize: 32, fontWeight: 700, letterSpacing: '-0.6px', color: '#1d1d1f', marginBottom: 6 } as React.CSSProperties,
    sub:     { fontSize: 15, color: '#6e6e73', marginBottom: 40 } as React.CSSProperties,
    card:    { background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', textAlign: 'left' } as React.CSSProperties,
    iconBox: { width: 52, height: 52, borderRadius: 16, background: '#f0f6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as React.CSSProperties,
    cardH:   { fontSize: 19, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.3px', marginBottom: 8 } as React.CSSProperties,
    cardP:   { fontSize: 14, color: '#6e6e73', lineHeight: 1.55, marginBottom: 24 } as React.CSSProperties,
    cta:     { fontSize: 14, fontWeight: 500, color: '#0071e3', display: 'inline-flex', alignItems: 'center', gap: 3 } as React.CSSProperties,
    back:    { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 28, fontFamily: F, padding: 0 } as React.CSSProperties,
    input:   { width: '100%', background: '#fff', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1d1d1f', outline: 'none', fontFamily: F } as React.CSSProperties,
    btn:     { background: '#0071e3', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <div style={s.logoMk}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={s.logoCo}>Enterprise Brain</span>
          </div>
          <button style={s.logOut} onClick={logout}>Abmelden</button>
        </div>
      </nav>

      <main style={s.main}>

        {/* ════════ HOME ════════ */}
        {view === 'home' && (
          <>
            <h1 style={s.h1}>Was möchten Sie tun?</h1>
            <p style={s.sub}>Laden Sie Firmenwissen hoch oder befragen Sie Ihre Dokumente.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>

              {/* Upload card */}
              <div
                style={s.card}
                onClick={() => setView('upload')}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                <div style={s.iconBox}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h2 style={s.cardH}>Wissen hochladen</h2>
                <p style={s.cardP}>PDFs hochladen — Handbücher, Richtlinien, Reports — alles wird automatisch verarbeitet.</p>
                <span style={s.cta}>Dokument hochladen <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
              </div>

              {/* Chat card */}
              <div
                style={s.card}
                onClick={() => setView('chat')}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                <div style={s.iconBox}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <h2 style={s.cardH}>Frage stellen</h2>
                <p style={s.cardP}>Befragen Sie Ihre Dokumente per KI — präzise Antworten, keine Halluzinationen.</p>
                <span style={s.cta}>Frage stellen <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
              </div>
            </div>
          </>
        )}

        {/* ════════ UPLOAD ════════ */}
        {view === 'upload' && (
          <div style={{ maxWidth: 520 }}>
            <button style={s.back} onClick={goHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Zurück
            </button>
            <h1 style={s.h1}>Wissen hochladen</h1>
            <p style={s.sub}>PDF wird automatisch verarbeitet und gespeichert.</p>

            <div
              onClick={() => !uploading && fileRef.current?.click()}
              style={{ border: '2px dashed rgba(0,0,0,0.12)', borderRadius: 20, padding: '56px 32px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: uploading ? '#fafafa' : '#fff', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!uploading) { (e.currentTarget as HTMLElement).style.borderColor = '#0071e3'; (e.currentTarget as HTMLElement).style.background = '#f0f6ff' }}}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.background = uploading ? '#fafafa' : '#fff' }}
            >
              <input ref={fileRef} type="file" accept=".pdf" onChange={onFile} disabled={uploading} style={{ display: 'none' }} />
              {uploading ? (
                <div>
                  <div style={{ width: 36, height: 36, border: '3px solid rgba(0,113,227,0.15)', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
                  <p style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500 }}>Wird verarbeitet…</p>
                  <p style={{ fontSize: 13, color: '#6e6e73', marginTop: 4 }}>Text wird extrahiert</p>
                </div>
              ) : (
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0f6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500 }}>PDF klicken oder hierher ziehen</p>
                  <p style={{ fontSize: 13, color: '#6e6e73', marginTop: 5 }}>Maximal 10 MB</p>
                </div>
              )}
            </div>

            {uploadOk && <div style={{ marginTop: 14, background: '#f0faf0', border: '1px solid rgba(52,199,89,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#34c759' }}>✓ {uploadOk}</div>}
            {uploadErr && <div style={{ marginTop: 14, background: '#fff0f0', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#ff3b30' }}>{uploadErr}</div>}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ════════ CHAT ════════ */}
        {view === 'chat' && (
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 160px)' }}>
            <button style={s.back} onClick={() => { setView('home'); setMessages([]) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Zurück
            </button>
            <h1 style={s.h1}>Frage stellen</h1>
            <p style={s.sub}>Antworten ausschließlich aus Ihren Dokumenten — keine Halluzinationen.</p>

            {/* Messages */}
            <div style={{ flex: 1, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#aeaeb2', fontSize: 14 }}>Stellen Sie Ihre erste Frage…</div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '78%', borderRadius: m.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                    padding: '12px 16px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    background: m.role === 'user' ? '#0071e3' : '#fff',
                    color:      m.role === 'user' ? '#fff' : '#1d1d1f',
                    boxShadow:  m.role === 'user' ? '0 2px 10px rgba(0,113,227,0.25)' : '0 2px 12px rgba(0,0,0,0.07)',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#fff', borderRadius: '20px 20px 20px 6px', padding: '14px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0,150,300].map(d => <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#aeaeb2', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={onChat} style={{ display: 'flex', gap: 10, position: 'sticky', bottom: 20, background: '#f5f5f7', paddingTop: 12 }}>
              <input
                type="text" value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Ihre Frage an das Firmenwissen…" autoFocus
                style={{ ...s.input, flex: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                onFocus={e => { e.target.style.borderColor = '#0071e3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15), 0 2px 12px rgba(0,0,0,0.06)' }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
              />
              <button type="submit" disabled={chatLoading || !question.trim()}
                style={{ ...s.btn, opacity: (chatLoading || !question.trim()) ? 0.5 : 1, cursor: (chatLoading || !question.trim()) ? 'not-allowed' : 'pointer', boxShadow: '0 2px 10px rgba(0,113,227,0.25)' }}>
                Senden
              </button>
            </form>

            <style>{`
              @keyframes spin{to{transform:rotate(360deg)}}
              @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
            `}</style>
          </div>
        )}

      </main>
    </div>
  )
}
