import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import api from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const login = async () => {
    try {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const res = await api.post('/api/auth/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      const { access_token, refresh_token } = res.data
      if (access_token) {
        await AsyncStorage.setItem('access_token', access_token)
      }
      if (refresh_token) {
        await AsyncStorage.setItem('refresh_token', refresh_token)
      }
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Bilinmeyen hata'
      console.warn('Login Error:', msg)
      Alert.alert('Giriş Hatası', msg === 'Network Error' ? 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.' : msg)
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
            <Text style={styles.title}>Giriş Yap</Text>
            <Text style={styles.subtitle}>Hesabına dön ve kaldığın yerden rekabete devam et.</Text>

            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              placeholderTextColor="#64748b"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
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

            <TouchableOpacity style={styles.primaryButton} onPress={login} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Hesabın yok mu? Kayıt Ol</Text>
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
  secondaryButtonText: { color: '#ec4899', fontSize: 14, fontWeight: '800' },
})
