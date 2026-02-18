/**
 * CHAT API ROUTE — Enterprise Brain
 *
 * Runtime: Edge (global low-latency, no server maintenance)
 * Auth:    Supabase JWT validated server-side
 * AI:      Google Gemini 1.5 Flash via @google/generative-ai
 * Security: RLS enforces org isolation; system prompt prevents hallucinations
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// ── Anti-hallucination system prompt ─────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein präziser, professioneller Unternehmens-Assistent namens "Enterprise Brain".

UNVERÄNDERLICHE REGELN:
1. Beantworte Fragen AUSSCHLIESSLICH auf Basis der bereitgestellten Firmendokumente.
2. Halluziniere NIEMALS – erfinde keine Fakten, Zahlen oder Inhalte.
3. Wenn eine Information nicht in den Dokumenten enthalten ist, antworte klar:
   "Diese Information ist in den verfügbaren Dokumenten nicht enthalten."
4. Nenne immer den Titel des Quelldokuments, aus dem du eine Information beziehst.
5. Bleibe stets sachlich, präzise und professionell. Keine persönlichen Meinungen.
6. Antworte in der Sprache, in der die Frage gestellt wurde.

BEREITGESTELLTE DOKUMENTE:
`

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user ───────────────────────────────────────────────────
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // 2. Resolve organization ─────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        {
          error:
            'Ihrer Nutzer-Konto ist noch keiner Organisation zugewiesen. Bitte wenden Sie sich an den Administrator.',
        },
        { status: 400 }
      )
    }

    // 3. Parse + validate request ─────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const question = typeof body?.question === 'string' ? body.question.trim() : ''

    if (!question) {
      return NextResponse.json(
        { error: 'Bitte stellen Sie eine Frage.' },
        { status: 400 }
      )
    }

    // 4. Fetch org documents (RLS prevents cross-org access automatically) ────
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('title, content')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(15)

    if (dbError) {
      console.error('[chat] DB error:', dbError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Dokumente. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        answer:
          'Es sind noch keine Dokumente in Ihrer Wissensbasis. Bitte laden Sie zuerst PDFs über „Wissen hochladen" hoch.',
      })
    }

    // 5. Build Gemini context ─────────────────────────────────────────────────
    // Trim each document to avoid exceeding context limits
    const MAX_CHARS_PER_DOC = 8_000
    const documentContext = documents
      .map(
        (doc, i) =>
          `### Dokument ${i + 1}: „${doc.title}"\n${doc.content.slice(0, MAX_CHARS_PER_DOC)}`
      )
      .join('\n\n---\n\n')

    const fullSystemPrompt = SYSTEM_PROMPT + documentContext

    // 6. Check API key ────────────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Der KI-Dienst ist nicht konfiguriert. Bitte setzen Sie die Umgebungsvariable GEMINI_API_KEY.',
        },
        { status: 500 }
      )
    }

    // 7. Call Gemini ──────────────────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        temperature: 0.1,     // Low temperature = factual, deterministic answers
        maxOutputTokens: 2048,
      },
    })

    const result = await model.generateContent(question)
    const answer = result.response.text()

    return NextResponse.json({ answer })

  } catch (error: unknown) {
    console.error('[chat] Unhandled error:', error)

    // Provide actionable error messages instead of generic crashes
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        return NextResponse.json(
          { error: 'Ungültiger KI-API-Schlüssel. Bitte Administrator kontaktieren.' },
          { status: 500 }
        )
      }
      if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'KI-Dienst-Kontingent erschöpft. Bitte in einigen Minuten erneut versuchen.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      {
        error:
          'Der KI-Dienst ist momentan nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.',
      },
      { status: 503 }
    )
  }
}
