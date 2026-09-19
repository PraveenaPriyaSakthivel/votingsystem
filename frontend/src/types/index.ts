export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Poll {
  id: string
  title: string
  description: string
  options: PollOption[]
  creator_id: string
  creator_name: string
  is_active: boolean
  allow_multiple: boolean
  ends_at: string | null
  created_at: string
  updated_at: string
  total_votes: number
}

export interface OptionResult {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface PollResult {
  poll_id: string
  total_votes: number
  options: OptionResult[]
  updated_at: string
}

export interface CreatePollPayload {
  title: string
  description: string
  options: string[]
  allow_multiple: boolean
  ends_at?: string | null
}
