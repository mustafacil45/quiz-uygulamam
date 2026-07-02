import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native'
import { createQuiz as svcCreateQuiz } from '../api/services'
import api from '../api/client'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function QuizCreatorScreen({ route, navigation }) {
  const { roomId } = route.params || {}
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Gündem')
  const [difficulty, setDifficulty] = useState('easy')
  const [isRetakeable, setIsRetakeable] = useState(false)
  const [scoringMode, setScoringMode] = useState('first_score')
  const [questions, setQuestions] = useState([{ text: '', choices: ['', '', '', ''], correct: 0 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token')
        if (!token) {
          Alert.alert('Giriş Gerekli', 'Quiz oluşturmak için lütfen giriş yapın.', [
            { text: 'İptal', onPress: () => navigation.goBack(), style: 'cancel' },
            { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
          ])
        }
      } catch (e) {
        // ignore
      }
    }
    checkAuth()
  }, [])

  const addQuestion = () => setQuestions((q) => [...q, { text: '', choices: ['', '', '', ''], correct: 0 }])

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const newQ = [...questions]
      newQ.splice(index, 1)
      setQuestions(newQ)
    } else {
      Alert.alert('Uyarı', 'En az bir soru kalmalı.')
    }
  }

  const pickImage = async (idx) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('İçin Gerekli', 'Galeriye erişim izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        updateQuestion(idx, 'uploading', true);
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: 'photo.jpg',
          type: 'image/jpeg'
        });

        const res = await api.post('/api/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        updateQuestion(idx, 'image_url', res.data.url);
      } catch (err) {
        console.log('Upload error:', err);
        Alert.alert('Hata', 'Resim yüklenemedi.');
      } finally {
        updateQuestion(idx, 'uploading', false);
      }
    }
  }

  const saveQuiz = async () => {
    setSaving(true)
    if (!title || title.trim().length < 3) {
      Alert.alert('Hata', 'Lütfen bir quiz başlığı girin (en az 3 karakter)')
      setSaving(false)
      return
    }
    if (!questions || questions.length === 0) {
      Alert.alert('Hata', 'En az bir soru ekleyin')
      setSaving(false)
      return
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text || q.text.trim() === '') {
        Alert.alert('Hata', `Soru ${i + 1} metni boş olamaz`)
        setSaving(false)
        return
      }
      if (!q.choices || q.choices.length < 4) {
        Alert.alert('Hata', `Soru ${i + 1} için 4 seçenek girin`)
        setSaving(false)
        return
      }
      for (let c of q.choices) {
        if (!c || c.trim() === '') {
          Alert.alert('Hata', `Soru ${i + 1}: tüm seçenekleri doldurun`)
          setSaving(false)
          return
        }
      }
    }

    const transformed = questions.map((q) => ({
      text: q.text,
      choices: q.choices.slice(0, 4),
      correct_choice: Number(q.correct),
      image_url: q.image_url
    }))
    const payload = { title, description: category, room_id: roomId, is_retakeable: isRetakeable, scoring_mode: scoringMode, questions: transformed }
    try {
      await svcCreateQuiz(payload)
      Alert.alert('Başarılı', 'Quiz başarıyla oluşturuldu', [{ text: 'Tamam', onPress: () => navigation.goBack() }])
    } catch (err) {
      console.warn('saveQuiz', err?.response || err.message)
      if (err?.response?.status === 401) {
        Alert.alert('Oturum Süresi Doldu', 'Lütfen tekrar giriş yapın.', [
          { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
        ])
        return
      }
      const msg = err?.response?.data?.detail || err?.response?.data || err.message
      Alert.alert('Hata', `Quiz oluşturulamadı: ${msg}`)
    }
    setSaving(false)
  }

  const updateQuestion = (idx, field, v) => {
    setQuestions(prev => {
      const newQuestions = [...prev]
      const q = { ...newQuestions[idx] }

      if (field === 'text') {
        q.text = v
      } else if (field.startsWith('choice')) {
        const i = Number(field.split(':')[1])
        q.choices = [...q.choices]
        q.choices[i] = v
      } else if (field === 'correct') {
        q.correct = Number(v)
      } else if (field === 'image_url') {
        q.image_url = v
      } else if (field === 'uploading') {
        q.uploading = v
      }

      newQuestions[idx] = q
      return newQuestions
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }} keyboardShouldPersistTaps='handled'>
      <Text style={styles.pageTitle}>YENİ QUİZ OLUŞTUR 🚀</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Quiz Başlığı</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Örn: Genel Kültür Testi" 
          placeholderTextColor="#64748b"
          value={title} 
          onChangeText={setTitle} 
        />

        <Text style={styles.label}>Kategori / Açıklama</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Örn: Gündem" 
          placeholderTextColor="#64748b"
          value={category} 
          onChangeText={setCategory} 
        />

        <Text style={styles.label}>Zorluk Seviyesi (easy / medium / hard)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="easy" 
          placeholderTextColor="#64748b"
          value={difficulty} 
          onChangeText={setDifficulty} 
        />

        <View style={{ marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2d256b', backgroundColor: '#0f0b1b' }}>
          <TouchableOpacity onPress={() => setIsRetakeable(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} activeOpacity={0.8}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: isRetakeable ? '#10b981' : '#151130', borderWidth: 1.2, borderColor: isRetakeable ? '#34d399' : '#2d256b', justifyContent: 'center', alignItems: 'center' }}>
              {isRetakeable && <View style={{ width: 10, height: 10, backgroundColor: '#fff', borderRadius: 3 }} />}
            </View>
            <Text style={{ color: '#fff', fontWeight: '800' }}>✓ Quizi Tekrar Çözülebilir Yap</Text>
          </TouchableOpacity>

          {isRetakeable && (
            <View style={{ marginTop: 12, paddingLeft: 8 }}>
              <Text style={{ color: '#94a3b8', fontWeight: '800', marginBottom: 8 }}>Puanlama Modu:</Text>
              <TouchableOpacity onPress={() => setScoringMode('first_score')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }} activeOpacity={0.8}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: scoringMode === 'first_score' ? '#10b981' : '#2d256b', justifyContent: 'center', alignItems: 'center', backgroundColor: scoringMode === 'first_score' ? '#10b981' : '#151130' }}>
                  {scoringMode === 'first_score' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                </View>
                <Text style={{ color: '#c7f9d6', fontWeight: '800' }}>📍 İlk Çözülen Puan (First Score)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScoringMode('best_score')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} activeOpacity={0.8}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: scoringMode === 'best_score' ? '#f59e0b' : '#2d256b', justifyContent: 'center', alignItems: 'center', backgroundColor: scoringMode === 'best_score' ? '#f59e0b' : '#151130' }}>
                  {scoringMode === 'best_score' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                </View>
                <Text style={{ color: '#fce7a9', fontWeight: '800' }}>🏆 En Yüksek Puan (Best Score)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Sorular</Text>
      {questions.map((q, idx) => (
        <View key={idx} style={styles.qBox}>
          <View style={styles.qHeader}>
            <Text style={styles.qTitle}>Soru {idx + 1}</Text>
            {questions.length > 1 && (
              <TouchableOpacity onPress={() => removeQuestion(idx)} activeOpacity={0.8}>
                <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 13 }}>Sil 🗑️</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
            placeholder="Sorunuzu buraya yazın..."
            placeholderTextColor="#64748b"
            value={q.text}
            onChangeText={(t) => updateQuestion(idx, 'text', t)}
            multiline
          />

          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity onPress={() => pickImage(idx)} style={styles.imgBtn} disabled={q.uploading} activeOpacity={0.8}>
              {q.uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.imgBtnText}>{q.image_url ? 'Görseli Değiştir 🔄' : '📷 Görsel Ekle'}</Text>}
            </TouchableOpacity>
            {q.image_url && (
              <Image
                source={{ uri: q.image_url.startsWith('http') ? q.image_url : `${api.defaults.baseURL}${q.image_url}` }}
                style={{ width: '100%', height: 160, marginTop: 10, borderRadius: 16, resizeMode: 'contain', backgroundColor: '#090816' }}
              />
            )}
          </View>

          <Text style={[styles.label, { marginTop: 12, color: '#a78bfa' }]}>Seçenekler</Text>
          {q.choices.map((c, i) => (
            <View key={i} style={styles.choiceRow}>
              <View style={styles.choiceLetter}><Text style={styles.choiceLetterText}>{['A', 'B', 'C', 'D'][i]}</Text></View>
              <TextInput
                style={[styles.input, { flex: 1, marginVertical: 0 }]}
                placeholder={`Seçenek ${i + 1}`}
                placeholderTextColor="#64748b"
                value={c}
                onChangeText={(t) => updateQuestion(idx, `choice:${i}`, t)}
              />
            </View>
          ))}

          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Doğru Cevap Seçin:</Text>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <TouchableOpacity key={i} onPress={() => updateQuestion(idx, 'correct', i)} style={[styles.choiceGridBtn, q.correct === i && styles.choiceBtnActive]} activeOpacity={0.8}>
                  <Text style={q.correct === i ? styles.choiceTextActive : styles.choiceText}>{['A', 'B', 'C', 'D'][i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addQuestion} activeOpacity={0.85}>
        <Text style={styles.addBtnText}>+ Soru Ekle</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />

      {saving ? (
        <View style={{ padding: 12 }}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      ) : (
        <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>QUİZİ KAYDET VE YAYINLA ⚡</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090816' },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 24, marginBottom: 16, letterSpacing: 0.5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 12, letterSpacing: 0.5 },

  input: {
    backgroundColor: '#151130',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2d256b',
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.5
  },

  qBox: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#110d29',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  qTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },

  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  choiceLetter: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#251b4f',
    borderRadius: 12,
  },
  choiceLetterText: {
    fontWeight: '900',
    color: '#a78bfa'
  },

  choiceGridBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2d256b',
    backgroundColor: '#151130'
  },
  choiceBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399'
  },
  choiceText: {
    fontWeight: '800',
    color: '#a78bfa',
    fontSize: 15
  },
  choiceTextActive: {
    color: '#090816',
    fontWeight: '900',
    fontSize: 15
  },

  addBtn: {
    backgroundColor: '#110d29',
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addBtnText: {
    color: '#c084fc',
    fontWeight: '800',
    fontSize: 15
  },
  saveBtn: {
    backgroundColor: '#ec4899',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#f472b6',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5
  },
  imgBtn: {
    backgroundColor: '#251b4f',
    borderColor: '#8b5cf6',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  imgBtnText: {
    color: '#a78bfa',
    fontWeight: '700',
    fontSize: 12
  }
})
