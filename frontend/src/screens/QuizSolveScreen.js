import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Animated, Image, ScrollView } from 'react-native'
import services from '../api/services'
import api from '../api/client'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { loadSettings } from '../utils/settings'

export default function QuizSolveScreen({ route, navigation }) {
  const { quizId, isRetake } = route.params || {}
  const [quiz, setQuiz] = useState(null)
  const hapticsRef = useRef(true) // Uygulama Ayarları > Titreşim
  useEffect(() => { loadSettings().then((s) => { hapticsRef.current = s.haptics }) }, [])
  const [loading, setLoading] = useState(true)

  // Quiz State
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [status, setStatus] = useState('loading') // loading, ready, running, feedback, finished
  const [timer, setTimer] = useState(20)
  const [feedback, setFeedback] = useState(null) // { correct: bool, score: int, correctChoice: int }

  const timerRef = useRef(null)
  const startTime = useRef(0)

  useEffect(() => {
    loadQuiz()
    return () => clearInterval(timerRef.current)
  }, [quizId])

  const loadQuiz = async () => {
    try {
      const data = await services.getQuiz(quizId)
      setQuiz(data)
      setStatus('ready')
      setLoading(false)
    } catch (e) {
      Alert.alert('Hata', 'Quiz yüklenemedi')
      navigation.goBack()
    }
  }

  const startQuestion = () => {
    setStatus('running')
    setTimer(20)
    startTime.current = Date.now()
    setFeedback(null)

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (status === 'ready') {
      startQuestion()
    }
  }, [status])

  const handleTimeout = () => {
    submitAnswer(-1)
  }

  const submitAnswer = async (choiceIdx) => {
    clearInterval(timerRef.current)
    const timeSpent = (Date.now() - startTime.current) / 1000
    const currentQ = quiz.questions[qIndex]

    try {
      const res = await api.post(`/api/quiz/${quizId}/submit-answer`, {
        question_id: currentQ.id,
        answer: choiceIdx,
        time_spent: timeSpent
      })

      const data = res.data
      if (hapticsRef.current) {
        Haptics.notificationAsync(
          data.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        ).catch(() => {})
      }
      if (isRetake) {
        setTotalScore(prev => prev + data.score)
      } else {
        setTotalScore(data.total_score)
      }
      setFeedback({
        correct: data.correct,
        score: data.score,
        correctChoice: data.correct_choice,
        userChoice: choiceIdx
      })
      setStatus('feedback')

      setTimeout(() => {
        if (qIndex + 1 < quiz.questions.length) {
          setQIndex(i => i + 1)
          startQuestion()
        } else {
          setStatus('finished')
        }
      }, 3000)

    } catch (e) {
      console.warn(e)
      Alert.alert('Error', 'Submission failed')
    }
  }

  if (loading || !quiz) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    )
  }

  if (status === 'finished') {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <View style={styles.resultCard}>
          <View style={styles.trophyContainer}>
            <Ionicons name="trophy" size={90} color="#fbbf24" />
          </View>
          <Text style={styles.resultTitle}>QUIZ BİTTİ! 🎉</Text>
          <Text style={styles.resultSub}>Kazanılan Toplam Skor</Text>
          <Text style={styles.resultScore}>{totalScore} Puan</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.btnText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const currentQ = quiz.questions[qIndex]

  return (
    <View style={{ flex: 1, backgroundColor: '#090816' }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.progress}>SORU {qIndex + 1} / {quiz.questions.length}</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SKOR</Text>
            <Text style={styles.score}>{totalScore}</Text>
          </View>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerTrack}>
          <View style={[styles.timerFill, { width: `${(timer / 20) * 100}%`, backgroundColor: timer < 5 ? '#ef4444' : '#22d3ee' }]} />
        </View>
        <Text style={[styles.timerText, { color: timer < 5 ? '#ef4444' : '#a78bfa' }]}>{timer} saniye kaldı</Text>

        {/* Question */}
        <View style={styles.card}>
          {currentQ.image_url && (
            <Image
              source={{ uri: currentQ.image_url.startsWith('http') ? currentQ.image_url : `${api.defaults.baseURL}${currentQ.image_url}` }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.questionText}>{currentQ.text}</Text>
        </View>

        {/* Choices */}
        <View style={styles.choices}>
          {currentQ.choices.map((c, idx) => {
            let bg = '#151130'
            let border = '#2d256b'
            let textColor = '#ffffff'
            let letterBg = 'rgba(255, 255, 255, 0.05)'
            let letterColor = '#a78bfa'

            if (status === 'feedback') {
              if (idx === feedback.correctChoice) {
                bg = '#10b981'
                border = '#34d399'
                textColor = '#090816'
                letterBg = 'rgba(0, 0, 0, 0.1)'
                letterColor = '#090816'
              } else if (idx === feedback.userChoice && !feedback.correct) {
                bg = '#ef4444'
                border = '#f87171'
                textColor = '#ffffff'
                letterBg = 'rgba(0, 0, 0, 0.1)'
                letterColor = '#ffffff'
              } else {
                bg = '#0f0c24'
                border = '#1f1b44'
                textColor = '#64748b'
                letterColor = '#475569'
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.choiceBtn, { backgroundColor: bg, borderColor: border }]}
                disabled={status !== 'running'}
                onPress={() => submitAnswer(idx)}
                activeOpacity={0.8}
              >
                <View style={[styles.choiceIcon, { backgroundColor: letterBg }]}>
                  <Text style={{ fontWeight: '900', color: letterColor }}>{['A', 'B', 'C', 'D'][idx]}</Text>
                </View>
                <Text style={[styles.choiceText, { color: textColor }]}>{c}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Feedback Overlay */}
      {status === 'feedback' && (
        <View style={styles.feedbackOverlay}>
          <View style={[styles.feedbackCard, { backgroundColor: feedback.correct ? '#10b981' : '#ef4444' }]}>
            <Ionicons name={feedback.correct ? "checkmark-circle" : "close-circle"} size={68} color="#fff" />
            <Text style={styles.feedbackTitle}>{feedback.correct ? 'DOĞRU!' : 'YANLIŞ!'}</Text>
            {feedback.correct && <Text style={styles.feedbackScore}>+{feedback.score} Puan</Text>}
          </View>
        </View>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090816', padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  progress: { fontSize: 13, fontWeight: '800', color: '#a78bfa', letterSpacing: 1 },
  scoreContainer: { alignItems: 'flex-end', backgroundColor: '#110d29', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2d256b' },
  scoreLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
  score: { fontSize: 18, fontWeight: '900', color: '#fbbf24' },

  timerTrack: { height: 8, backgroundColor: '#1e1b4b', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  timerFill: { height: '100%', borderRadius: 4 },
  timerText: { textAlign: 'right', fontWeight: '800', fontSize: 11, marginBottom: 20, letterSpacing: 0.5 },

  card: { 
    backgroundColor: '#110d29', padding: 24, borderRadius: 24, marginBottom: 24, 
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
    elevation: 5, minHeight: 160, justifyContent: 'center', alignItems: 'center' 
  },
  questionImage: { width: '100%', height: 200, marginBottom: 16, borderRadius: 16 },
  questionText: { fontSize: 20, fontWeight: '800', color: '#ffffff', textAlign: 'center', lineHeight: 28 },

  choices: { gap: 10 },
  choiceBtn: { 
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, 
    borderWidth: 1.5, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    elevation: 2 
  },
  choiceIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  choiceText: { fontSize: 16, fontWeight: '700', flex: 1 },

  feedbackOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(9, 8, 22, 0.85)' },
  feedbackCard: { 
    padding: 36, borderRadius: 30, alignItems: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, 
    elevation: 10, width: '80%'
  },
  feedbackTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 12, letterSpacing: 1 },
  feedbackScore: { fontSize: 20, fontWeight: '800', color: '#fbbf24', marginTop: 6 },

  resultCard: { alignItems: 'center', padding: 24 },
  trophyContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 50, padding: 20, marginBottom: 20,
    borderWidth: 1.5, borderColor: '#fbbf24',
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10
  },
  resultTitle: { fontSize: 28, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  resultSub: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 8 },
  resultScore: { fontSize: 52, fontWeight: '900', color: '#d946ef', marginVertical: 16 },
  btn: { 
    backgroundColor: '#8b5cf6', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 18,
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    borderWidth: 1.5, borderColor: '#a78bfa', marginTop: 12
  },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }
})
