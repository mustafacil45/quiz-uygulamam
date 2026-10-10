import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import * as Haptics from 'expo-haptics'
import api, { API_BASE } from '../api/client'
import { loadSettings, saveSettings, DEFAULT_SETTINGS, clearSession } from '../utils/settings'

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  const toggleHaptics = async (value) => {
    const next = await saveSettings({ haptics: value })
    setSettings(next)
    if (value) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }

  const confirmDelete = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabın kapatılır ve bir daha giriş yapamazsın. Skorların sıralamada "silinen kullanıcı" olarak kalır. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Hesabımı Sil', style: 'destructive', onPress: deleteAccount },
      ]
    )
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/api/users/me')
      await clearSession()
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })
    } catch (err) {
      const msg = err?.response?.data?.detail
      Alert.alert('Hata', typeof msg === 'string' ? msg : 'Hesap silinemedi. Tekrar dene.')
      setDeleting(false)
    }
  }

  const version = Constants.expoConfig?.version || '1.0.0'
  const server = API_BASE.replace(/^https?:\/\//, '')

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>QUIZ DENEYİMİ</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="phone-portrait-outline" size={20} color="#a78bfa" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Titreşim</Text>
              <Text style={styles.rowHint}>Doğru ve yanlış cevapta kısa titreşim</Text>
            </View>
            <Switch
              value={settings.haptics}
              onValueChange={toggleHaptics}
              trackColor={{ false: '#2d256b', true: '#8b5cf6' }}
              thumbColor={Platform.OS === 'android' ? (settings.haptics ? '#e9d5ff' : '#94a3b8') : undefined}
              ios_backgroundColor="#2d256b"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>HAKKINDA</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#22d3ee" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Sürüm</Text>
            </View>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Ionicons name="cloud-outline" size={20} color="#22d3ee" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Sunucu</Text>
            </View>
            <Text style={styles.rowValue} numberOfLines={1}>{server}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TEHLİKELİ BÖLGE</Text>
        <TouchableOpacity style={[styles.dangerButton, deleting && styles.disabled]} onPress={confirmDelete} disabled={deleting} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={20} color="#fca5a5" />
          <Text style={styles.dangerText}>{deleting ? 'Siliniyor…' : 'Hesabımı Sil'}</Text>
        </TouchableOpacity>
        <Text style={styles.dangerHint}>Hesabın kapatılır, bilgilerin silinir; skorların anonim olarak kalır.</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090816' },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, marginLeft: 6, letterSpacing: 1.5, marginTop: 8 },
  group: {
    backgroundColor: '#110d29',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginLeft: 66 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  rowHint: { color: '#94a3b8', fontSize: 12, marginTop: 2, fontWeight: '500' },
  rowValue: { color: '#94a3b8', fontSize: 13, fontWeight: '600', maxWidth: '50%' },
  dangerButton: {
    flexDirection: 'row',
    backgroundColor: '#3b1820',
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  dangerText: { color: '#fca5a5', fontSize: 16, fontWeight: '800' },
  dangerHint: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10, fontWeight: '500' },
  disabled: { opacity: 0.6 },
})
