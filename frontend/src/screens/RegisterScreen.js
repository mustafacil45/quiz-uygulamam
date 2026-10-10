import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import api from '../api/client'

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const register = async () => {
    const name = username.trim()
    const mail = email.trim()

    if (name.length < 3) { Alert.alert('Eksik Bilgi', 'Kullanıcı adı en az 3 karakter olmalı.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { Alert.alert('Eksik Bilgi', 'Geçerli bir e-posta adresi gir.'); return }
    if (password.length < 6) { Alert.alert('Zayıf Şifre', 'Şifre en az 6 karakter olmalı.'); return }

    setSaving(true)
    try {
      const res = await api.post('/api/auth/register', { username: name, email: mail, password })
      console.log('registered', res.data)
      Alert.alert('Kayıt Başarılı', 'Hesabın oluşturuldu, şimdi giriş yapabilirsin.')
      navigation.navigate('Login')
    } catch (err) {
      // Gercek sebebi goster: "bu e-posta kayitli", "sunucuya ulasilamiyor" vb.
      const detail = err?.response?.data?.detail
      const message = typeof detail === 'string'
        ? detail
        : err?.response
          ? 'Kayıt yapılamadı, lütfen bilgilerini kontrol et.'
          : 'Sunucuya ulaşılamıyor. İnternet bağlantını kontrol edip tekrar dene.'
      console.warn('register error:', detail || err.message)
      Alert.alert('Kayıt Hatası', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.eyebrow}>TrendQuiz ⚡</Text>
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Yeni hesabını oluştur, arenalara katıl ve quiz çözmeye başla.</Text>

            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              placeholderTextColor="#64748b"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Şifre"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color="#a78bfa" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={register} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Kayıt Ol</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Zaten hesabım var? Giriş Yap</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
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
  eyebrow: { color: '#ec4899', fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 6, marginBottom: 24, lineHeight: 20, fontWeight: '500' },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#2d256b',
    backgroundColor: '#151130',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  passwordWrap: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#2d256b',
    backgroundColor: '#151130',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: { flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 15, color: '#ffffff', fontWeight: '500' },
  eyeButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { 
    backgroundColor: '#8b5cf6', borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
    borderWidth: 1.5, borderColor: '#a78bfa'
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  secondaryButtonText: { color: '#ec4899', fontSize: 14, fontWeight: '800' },
})
