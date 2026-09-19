import { apiClient } from './client'
import type { AuthResponse } from '../types'

export interface SignupPayload {
  username: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/signup', payload)
  return data
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload)
  return data
}
