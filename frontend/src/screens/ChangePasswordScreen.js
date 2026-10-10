import React, { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import api from '../api/client'

const MIN_LENGTH = 6

// Bileşen dışında tanımlı: render içinde tanımlansaydı her tuşta yeniden mount olup odağı düşürürdü
function Field({ label, value, onChange, placeholder, show }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </>
  )
}

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!current) { Alert.alert('Eksik Bilgi', 'Mevcut şifreni gir.'); return }
    if (next.length < MIN_LENGTH) { Alert.alert('Zayıf Şifre', `Yeni şifre en az ${MIN_LENGTH} karakter olmalı.`); return }
    if (next !== confirm) { Alert.alert('Uyuşmuyor', 'Yeni şifre ile tekrarı aynı değil.'); return }

    setSaving(true)
    try {
      await api.post('/api/users/me/password', { current_password: current, new_password: next })
      Alert.alert('Şifre Değişti', 'Bir sonraki girişte yeni şifreni kullan.', [{ text: 'Tamam', onPress: () => navigation.goBack() }])
    } catch (err) {
      const msg = err?.response?.data?.detail
      Alert.alert('Hata', typeof msg === 'string' ? msg : 'Şifre değiştirilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Şifreni Değiştir</Text>
            <Text style={styles.subtitle}>Önce mevcut şifreni doğrula, sonra yenisini belirle.</Text>

            <Field label="MEVCUT ŞİFRE" value={current} onChange={setCurrent} placeholder="Mevcut şifre" show={show} />
            <Field label="YENİ ŞİFRE" value={next} onChange={setNext} placeholder={`En az ${MIN_LENGTH} karakter`} show={show} />
            <Field label="YENİ ŞİFRE (TEKRAR)" value={confirm} onChange={setConfirm} placeholder="Yeni şifreyi tekrar gir" show={show} />

            <TouchableOpacity style={styles.toggle} onPress={() => setShow((s) => !s)} activeOpacity={0.7}>
              <MaterialIcons name={show ? 'visibility-off' : 'visibility'} size={18} color="#a78bfa" />
              <Text style={styles.toggleText}>{show ? 'Şifreleri gizle' : 'Şifreleri göster'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={submit} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>ŞİFREYİ GÜNCELLE</Text>}
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
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 6, marginBottom: 24, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, marginLeft: 4, letterSpacing: 1.5 },
  passwordWrap: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#2d256b',
    backgroundColor: '#151130',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordInput: { flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 15, color: '#ffffff', fontWeight: '500' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 16 },
  toggleText: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#8b5cf6', borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
    borderWidth: 1.5, borderColor: '#a78bfa',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.6 },
})
