/**
 * UPLOAD API ROUTE — Enterprise Brain
 *
 * Runtime: Node.js (required for pdf-parse; not Edge)
 * Accepts a single PDF via multipart/form-data.
 * Extracts text server-side → stores in Supabase with org isolation.
 *
 * Security: Auth check → org check → RLS (triple layer)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pdfParse from 'pdf-parse'

// Force Node.js runtime (pdf-parse requires fs / Node built-ins)
export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

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
        { error: 'Kein Organisations-Konto gefunden. Bitte wenden Sie sich an den Administrator.' },
        { status: 400 }
      )
    }

    // 3. Parse multipart form ─────────────────────────────────────────────────
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json(
        { error: 'Ungültige Anfrage. Bitte ein Formular mit einer PDF-Datei senden.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei gefunden. Bitte eine PDF-Datei hochladen.' },
        { status: 400 }
      )
    }

    // 4. Validate file ────────────────────────────────────────────────────────
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Nur PDF-Dateien (.pdf) sind erlaubt.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Die Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 10 MB.` },
        { status: 400 }
      )
    }

    // 5. Extract text from PDF ────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText: string

    try {
      const parsed = await pdfParse(buffer)
      extractedText = parsed.text.trim()
    } catch (parseError) {
      console.error('[upload] PDF parse error:', parseError)
      return NextResponse.json(
        {
          error:
            'Das PDF konnte nicht gelesen werden. Bitte prüfen Sie, ob die Datei beschädigt oder passwortgeschützt ist.',
        },
        { status: 422 }
      )
    }

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        {
          error:
            'Im PDF wurde kein lesbarer Text gefunden. Reine Bild-PDFs (gescannte Dokumente ohne OCR) werden nicht unterstützt.',
        },
        { status: 422 }
      )
    }

    // 6. Persist to Supabase ──────────────────────────────────────────────────
    // RLS policy on `documents` table ensures org isolation
    const docTitle = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ')

    const { error: insertError } = await supabase.from('documents').insert({
      organization_id: profile.organization_id,
      title: docTitle,
      content: extractedText,
      file_size: file.size,
      created_by: user.id,
    })

    if (insertError) {
      console.error('[upload] DB insert error:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Speichern des Dokuments. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Dokument erfolgreich verarbeitet und in der Wissensbasis gespeichert.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[upload] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}
