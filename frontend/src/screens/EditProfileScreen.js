import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ActivityIndicator, ActionSheetIOS,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/client'
import Avatar from '../components/Avatar'

export default function EditProfileScreen({ navigation, route }) {
  const initial = route.params?.user || null
  const [username, setUsername] = useState(initial?.username || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) return
    api.get('/api/users/me').then((res) => {
      setUsername(res.data.username || '')
      setEmail(res.data.email || '')
      setAvatarUrl(res.data.avatar_url || null)
    }).catch(() => {})
  }, [])

  const uploadAsset = async (asset) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', { uri: asset.uri, name: 'avatar.jpg', type: 'image/jpeg' })
      const res = await api.post('/api/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAvatarUrl(res.data.url)
    } catch (err) {
      Alert.alert('Hata', 'Fotoğraf yüklenemedi. Tekrar dene.')
    } finally {
      setUploading(false)
    }
  }

  const pickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  }

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (perm.status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişimine izin vermelisin.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions)
    if (!result.canceled && result.assets?.length) await uploadAsset(result.assets[0])
  }

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (perm.status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera erişimine izin vermelisin.')
      return
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions)
    if (!result.canceled && result.assets?.length) await uploadAsset(result.assets[0])
  }

  const choosePhoto = () => {
    const actions = [
      { label: 'Galeriden Seç', run: pickFromLibrary },
      { label: 'Fotoğraf Çek', run: takePhoto },
    ]
    if (avatarUrl) actions.push({ label: 'Fotoğrafı Kaldır', run: () => setAvatarUrl(null), destructive: true })

    if (Platform.OS === 'ios') {
      const labels = [...actions.map((a) => a.label), 'Vazgeç']
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: labels,
          cancelButtonIndex: labels.length - 1,
          destructiveButtonIndex: actions.findIndex((a) => a.destructive) >= 0 ? actions.findIndex((a) => a.destructive) : undefined,
          userInterfaceStyle: 'dark',
        },
        (idx) => { if (idx < actions.length) actions[idx].run() }
      )
    } else {
      Alert.alert('Profil Fotoğrafı', undefined, [
        ...actions.map((a) => ({ text: a.label, onPress: a.run, style: a.destructive ? 'destructive' : 'default' })),
        { text: 'Vazgeç', style: 'cancel' },
      ])
    }
  }

  const save = async () => {
    const name = username.trim()
    const mail = email.trim()
    if (name.length < 3) { Alert.alert('Eksik Bilgi', 'Kullanıcı adı en az 3 karakter olmalı.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { Alert.alert('Eksik Bilgi', 'Geçerli bir e-posta gir.'); return }

    setSaving(true)
    try {
      const res = await api.put('/api/users/me', {
        username: name,
        email: mail,
        avatar_url: avatarUrl || '', // boş string = fotoğrafı kaldır
      })
      // Kullanıcı adı değiştiyse sunucu yeni token verir; eskisi geçersizdir
      if (res.data.access_token) {
        await AsyncStorage.setItem('access_token', res.data.access_token)
        if (res.data.refresh_token) await AsyncStorage.setItem('refresh_token', res.data.refresh_token)
      }
      Alert.alert('Kaydedildi', 'Profilin güncellendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }])
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Profil kaydedilemedi.'
      Alert.alert('Hata', typeof msg === 'string' ? msg : 'Profil kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.avatarWrap} onPress={choosePhoto} disabled={uploading} activeOpacity={0.85}>
              <Avatar uri={avatarUrl} name={username} size={120} borderColor="#ec4899" />
              <View style={styles.cameraBadge}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={18} color="#ffffff" />}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>{uploading ? 'Yükleniyor…' : 'Fotoğrafı değiştirmek için dokun'}</Text>

            <Text style={styles.label}>KULLANICI ADI</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Kullanıcı Adı"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              maxLength={32}
              returnKeyType="next"
            />

            <Text style={styles.label}>E-POSTA</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@eposta.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
            />

            <TouchableOpacity style={[styles.primaryButton, (saving || uploading) && styles.disabled]} onPress={save} disabled={saving || uploading} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>KAYDET</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090816' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 },
  card: {
    backgroundColor: '#110d29',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  avatarWrap: { alignSelf: 'center', marginBottom: 10 },
  cameraBadge: {
    position: 'absolute', right: 2, bottom: 2,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#ec4899',
    borderWidth: 3, borderColor: '#110d29',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, marginLeft: 4, letterSpacing: 1.5 },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#2d256b',
    backgroundColor: '#151130',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#8b5cf6', borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
    borderWidth: 1.5, borderColor: '#a78bfa', marginTop: 6,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.6 },
})
