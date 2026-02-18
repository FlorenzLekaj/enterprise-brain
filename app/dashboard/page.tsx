'use client'

/**
 * DASHBOARD PAGE — Enterprise Brain
 * Two primary actions: "Wissen hochladen" and "Frage stellen".
 * Industrial Design: White/light-gray background, #0066FF accent.
 *
 * State machine: home → upload | chat → back to home
 */

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ChatMessage } from '@/types'

// ── Icon components (inline SVG, no extra dependency) ─────────────────────────

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

// ── View types ────────────────────────────────────────────────────────────────

type View = 'home' | 'upload' | 'chat'

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [view, setView] = useState<View>('home')

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const supabase = createClient()

  // ── Logout ───────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }, [supabase, router])

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goHome = () => {
    setView('home')
    setUploadSuccess(null)
    setUploadError(null)
  }

  // ── File Upload ──────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadSuccess(null)

    if (file.type !== 'application/pdf') {
      setUploadError('Nur PDF-Dateien sind erlaubt.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Die Datei darf nicht größer als 10 MB sein.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen')

      setUploadSuccess(`„${file.name}" wurde verarbeitet und gespeichert.`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Chat ─────────────────────────────────────────────────────────────────────

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || chatLoading) return

    setQuestion('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err instanceof Error ? err.message : 'Der KI-Dienst ist momentan nicht erreichbar. Bitte erneut versuchen.'}`,
        },
      ])
    } finally {
      setChatLoading(false)
      // Scroll to latest message
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Top Navigation ── */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-[#0066FF] rounded-[2px]" aria-hidden="true" />
            <span className="text-zinc-900 font-bold text-sm tracking-tight">Enterprise Brain</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-zinc-700 text-sm transition-colors"
          >
            Abmelden
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">

        {/* ════════════════════════════════════════════════════════ HOME VIEW */}
        {view === 'home' && (
          <>
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">
                Was möchten Sie tun?
              </h1>
              <p className="text-zinc-500 text-sm">
                Laden Sie Firmenwissen hoch oder befragen Sie die KI direkt.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Card: Upload */}
              <button
                onClick={() => setView('upload')}
                className="group text-left border-2 border-zinc-200 hover:border-[#0066FF] rounded-xl p-8
                           transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 bg-zinc-100 group-hover:bg-blue-50 rounded-lg
                                flex items-center justify-center mb-6 transition-colors">
                  <UploadIcon className="w-5 h-5 text-zinc-500 group-hover:text-[#0066FF] transition-colors" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 mb-2">Wissen hochladen</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  PDFs hochladen und als Wissensbasis speichern — Handbücher, Richtlinien, Berichte und mehr.
                </p>
                <div className="mt-6 inline-flex items-center text-[#0066FF] text-sm font-semibold gap-1">
                  Dokument hochladen
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card: Chat */}
              <button
                onClick={() => setView('chat')}
                className="group text-left border-2 border-zinc-200 hover:border-[#0066FF] rounded-xl p-8
                           transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 bg-zinc-100 group-hover:bg-blue-50 rounded-lg
                                flex items-center justify-center mb-6 transition-colors">
                  <ChatIcon className="w-5 h-5 text-zinc-500 group-hover:text-[#0066FF] transition-colors" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 mb-2">Frage stellen</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Fragen Sie die KI nach Informationen aus Ihren Dokumenten — präzise, ohne Halluzinationen.
                </p>
                <div className="mt-6 inline-flex items-center text-[#0066FF] text-sm font-semibold gap-1">
                  Frage stellen
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════ UPLOAD VIEW */}
        {view === 'upload' && (
          <div className="max-w-lg">
            <BackButton onClick={goHome} />

            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Wissen hochladen</h1>
            <p className="text-zinc-500 text-sm mb-8">
              PDF-Dateien werden automatisch verarbeitet und mandantengetrennt gespeichert.
            </p>

            {/* Drop zone */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              role="button"
              aria-label="PDF-Datei auswählen"
              className={`relative border-2 border-dashed rounded-xl p-14 text-center cursor-pointer
                          transition-all duration-200
                          ${uploading
                  ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed'
                  : 'border-zinc-300 hover:border-[#0066FF] hover:bg-blue-50/30'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#0066FF] rounded-full animate-spin" />
                  <p className="text-zinc-600 font-medium text-sm">Dokument wird verarbeitet…</p>
                  <p className="text-zinc-400 text-xs">Text wird extrahiert und gespeichert</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadIcon className="w-9 h-9 text-zinc-300 mb-2" />
                  <p className="text-zinc-600 font-medium text-sm">PDF hierher ziehen oder klicken</p>
                  <p className="text-zinc-400 text-xs">Maximale Dateigröße: 10 MB</p>
                </div>
              )}
            </div>

            {/* Success */}
            {uploadSuccess && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
                ✓ {uploadSuccess}
              </div>
            )}

            {/* Error */}
            {uploadError && (
              <div role="alert" className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {uploadError}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ CHAT VIEW */}
        {view === 'chat' && (
          <div className="max-w-3xl flex flex-col" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            <BackButton onClick={goHome} />

            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Frage stellen</h1>
            <p className="text-zinc-500 text-sm mb-8">
              Die KI antwortet ausschließlich auf Basis Ihrer Firmendokumente.
            </p>

            {/* Message list */}
            <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-zinc-400 text-sm py-10">
                  Stellen Sie Ihre erste Frage…
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap
                                ${msg.role === 'user'
                        ? 'bg-[#0066FF] text-white rounded-br-sm'
                        : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 rounded-2xl rounded-bl-sm px-5 py-4">
                    <div className="flex gap-1.5 items-center">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleChatSubmit}
              className="flex gap-3 sticky bottom-4 bg-white pt-4 border-t border-zinc-100"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ihre Frage an das Firmenwissen…"
                autoFocus
                className="flex-1 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900
                           placeholder-zinc-400 focus:outline-none focus:border-[#0066FF]
                           focus:ring-1 focus:ring-[#0066FF] transition-colors"
              />
              <button
                type="submit"
                disabled={chatLoading || !question.trim()}
                className="bg-[#0066FF] hover:bg-[#0055DD] active:bg-[#0044CC]
                           disabled:bg-zinc-200 disabled:cursor-not-allowed
                           text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Senden
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Reusable back button ──────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-700
                 text-sm mb-8 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      Zurück
    </button>
  )
}
