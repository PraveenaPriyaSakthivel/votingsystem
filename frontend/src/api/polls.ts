import { apiClient } from './client'
import type { Poll, PollResult, CreatePollPayload } from '../types'

export const createPoll = async (payload: CreatePollPayload): Promise<Poll> => {
  const { data } = await apiClient.post<Poll>('/api/polls', payload)
  return data
}

export const getPoll = async (id: string): Promise<Poll> => {
  const { data } = await apiClient.get<Poll>(`/api/polls/${id}`)
  return data
}

export const getMyPolls = async (): Promise<Poll[]> => {
  const { data } = await apiClient.get<{ polls: Poll[] }>('/api/polls/my')
  return data.polls ?? []
}

export const getResults = async (id: string): Promise<PollResult> => {
  const { data } = await apiClient.get<PollResult>(`/api/polls/${id}/results`)
  return data
}

export const votePoll = async (id: string, optionIds: string[]): Promise<PollResult> => {
  const { data } = await apiClient.post<PollResult>(`/api/polls/${id}/vote`, {
    option_ids: optionIds,
  })
  return data
}

export const checkVoted = async (id: string): Promise<boolean> => {
  const { data } = await apiClient.get<{ voted: boolean }>(`/api/polls/${id}/voted`)
  return data.voted
}

export const setActive = async (id: string, active: boolean): Promise<void> => {
  await apiClient.patch(`/api/polls/${id}/active`, { active })
}

export const deletePoll = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/polls/${id}`)
}
