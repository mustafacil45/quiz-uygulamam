import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

const isLocalhostHost = (host) => host === '127.0.0.1' || host === 'localhost'

const getExpoExtraApiBase = () => {
  const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || Constants?.manifest2?.extra || null
  const v = extra?.API_BASE
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

const getExpoDevHost = () => {
  // Expo SDK 49+ provides hostUri in expoConfig (e.g. "192.168.1.230:8081").
  const hostUri = Constants?.expoConfig?.hostUri || null
  if (hostUri && typeof hostUri === 'string') return hostUri.split(':')[0]

  // Legacy manifests may expose debuggerHost / devHost.
  const legacy =
    Constants?.manifest?.debuggerHost ||
    Constants?.manifest?.packagerOpts?.devHost ||
    Constants?.manifest2?.debuggerHost ||
    Constants?.manifest2?.packagerOpts?.devHost ||
    null

  if (legacy && typeof legacy === 'string') return legacy.split(':')[0]
  return null
}

// Default per-platform behavior:
// - iOS simulator: 127.0.0.1 (backend running on same Mac)
// - Android emulator: 10.0.2.2 (host machine)
// - Web: current host
let API_BASE = 'http://127.0.0.1:8000'

try {
  // Platform defaults first.
  if (Platform.OS === 'android') API_BASE = 'http://10.0.2.2:8000'
  if (Platform.OS === 'web') {
    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : '127.0.0.1'
    API_BASE = `http://${host}:8000`
  }

  // On Expo Go / native dev builds, prefer the Metro host. A physical phone
  // cannot reach the Mac through 127.0.0.1, but it can reach the LAN host
  // shown by Expo (for example 192.168.1.230:8081).
  const devHost = getExpoDevHost()
  if (Platform.OS !== 'web' && devHost && !isLocalhostHost(devHost) && typeof devHost === 'string' && !devHost.startsWith('http')) {
    API_BASE = `http://${devHost}:8000`
  }

  // Explicit override last (wins), so you can force any base URL.
  const explicit = getExpoExtraApiBase()
  if (explicit) API_BASE = explicit
} catch (e) {}


console.log('[API BASE]', API_BASE)

export { API_BASE }

const api = axios.create({ baseURL: API_BASE, timeout: 10000 })

// attach access token from AsyncStorage and log requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    config.headers = config.headers || {}
    // ensure JSON content-type for POST/PUT/PATCH
    if (!config.headers['Content-Type'] && ['post', 'put', 'patch'].includes((config.method || '').toLowerCase())) {
      config.headers['Content-Type'] = 'application/json'
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // log outgoing request
    try {
      // don't stringify large circular objects
      const body = config.data ? JSON.stringify(config.data) : ''
      console.log('[API REQ]', (config.method || 'GET').toUpperCase(), config.baseURL + (config.url || ''), body)
    } catch (e) {
      console.log('[API REQ]', (config.method || 'GET').toUpperCase(), config.baseURL + (config.url || ''))
    }
  } catch (e) {
    // ignore
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => {
    // log successful responses
    try { console.log('[API RES]', res.config.method.toUpperCase(), res.config.url, 'status=', res.status, 'data=', res.data) } catch (e) { }
    return res
  },
  async (err) => {
    const originalRequest = err.config
    // log error response if present
    if (err.response) {
      console.error('[API ERROR]', originalRequest?.method?.toUpperCase(), originalRequest?.url, 'status=', err.response.status, 'data=', err.response.data)
    } else {
      console.error('[API ERROR]', err.message || err)
    }
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token
              return axios(originalRequest)
            })
            .catch((e) => Promise.reject(e))
        }

        isRefreshing = true
        const refreshToken = await AsyncStorage.getItem('refresh_token')
        if (!refreshToken) {
          isRefreshing = false
          return Promise.reject(err)
        }
        // call refresh endpoint
        const resp = await axios.post(`${API_BASE}/api/auth/refresh`, { refresh_token: refreshToken })
        const newAccess = resp.data.access_token
        const newRefresh = resp.data.refresh_token || refreshToken
        await AsyncStorage.setItem('access_token', newAccess)
        await AsyncStorage.setItem('refresh_token', newRefresh)
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        isRefreshing = false
        return api(originalRequest)
      } catch (e) {
        processQueue(e, null)
        isRefreshing = false
        // tokens invalid - clear storage
        await AsyncStorage.removeItem('access_token')
        await AsyncStorage.removeItem('refresh_token')
        return Promise.reject(e)
      }
    }
    return Promise.reject(err)
  }
)

export default api
