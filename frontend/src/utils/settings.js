import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE } from '../api/client'

// Cihazda tutulan uygulama ayarları (sunucuya gitmez)
const SETTINGS_KEY = 'app_settings'

export const DEFAULT_SETTINGS = {
  haptics: true, // doğru/yanlış cevapta titreşim
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function saveSettings(patch) {
  const current = await loadSettings()
  const next = { ...current, ...patch }
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch (e) {}
  return next
}

// Sunucu "/static/uploads/x.jpg" gibi göreli yol döner; tam adrese çevirir
export function resolveMediaUrl(url) {
  if (!url) return null
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

// Fotoğrafı olmayan kullanıcı için baş harfler ("Mustafa Çil" → "MÇ")
export function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]).join('').toLocaleUpperCase('tr-TR')
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'token'])
}
