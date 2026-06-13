import api from './client'
import { Alert } from 'react-native'

const wrap = async (p, meta = {}) => {
  try {
    const res = await p
    console.log('[API RES]', meta.method || 'GET', meta.url || '', 'status=', res.status, 'data=', res.data)
    if (!(res.status >= 200 && res.status < 300)) {
      const msg = res.data?.detail || JSON.stringify(res.data)
      Alert.alert('API Error', `${meta.method || 'GET'} ${meta.url || ''} -> ${res.status}: ${msg}`)
      throw new Error(msg)
    }
    return res
  } catch (err) {
    console.error('[API ERR]', meta.method || 'GET', meta.url || '', err.response || err.message || err)
    const msg = err?.response?.data?.detail || err.message || 'Network error'
    try { Alert.alert('Ağ Hatası', msg.toString()) } catch (e) { /* ignore */ }
    throw err
  }
}

export const createRoom = async (payload) => {
  // payload: { name: string, is_private?: boolean }
  const url = '/api/rooms/'
  console.log('[CREATE ROOM] Sending', JSON.stringify(payload))
  const res = await wrap(api.post(url, payload), { method: 'POST', url })
  console.log('[CREATE ROOM] Response', res.status, res.data)
  return res.data
}

export const fetchRooms = async () => {
  const url = '/api/rooms/'
  console.log('[API REQ] GET', url)
  const res = await wrap(api.get(url), { method: 'GET', url })
  return res.data
}

export const getQuiz = async (quizId) => {
  const url = `/api/quiz/${quizId}`
  console.log('[API REQ] GET', url)
  const res = await wrap(api.get(url), { method: 'GET', url })
  return res.data
}

export const createQuiz = async (quizData) => {
  // quizData must follow backend: { title, description?, room_id, questions: [{text, choices, correct_choice}] }
  const url = '/api/quiz/'
  console.log('[CREATE QUIZ] Sending', JSON.stringify(quizData))
  const res = await wrap(api.post(url, quizData), { method: 'POST', url })
  console.log('[CREATE QUIZ] Response', res.status, res.data)
  return res.data
}

export const fetchQuestionsForQuiz = async (quizId) => {
  const url = `/api/questions/quiz/${quizId}`
  console.log('[API REQ] GET', url)
  const res = await wrap(api.get(url), { method: 'GET', url })
  return res.data
}

export const createDuel = async (payload) => {
  const url = '/api/duel/create'
  console.log('[API REQ] POST', url, payload)
  const res = await wrap(api.post(url, payload), { method: 'POST', url })
  return res.data
}

export const fetchLeaderboard = async () => {
  const url = '/api/leaderboard/'
  console.log('[API REQ] GET', url)
  const res = await wrap(api.get(url), { method: 'GET', url })
  return res.data
}

export default { createRoom, fetchRooms, getQuiz, createQuiz, fetchQuestionsForQuiz, createDuel, fetchLeaderboard }
