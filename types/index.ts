export interface Document {
  id: string
  organization_id: string
  title: string
  content: string
  file_size: number | null
  created_by: string | null
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  full_name: string | null
  created_at: string
}

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UploadResponse {
  success: boolean
  message?: string
  error?: string
}

export interface ChatResponse {
  answer?: string
  error?: string
}
