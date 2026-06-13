import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function QuizCard({ quiz, onStart }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>{quiz.title}</Text>
        <View style={[styles.badge, styles[`difficulty_${quiz.difficulty || 'medium'}`]]}>
          <Text style={styles.badgeText}>{(quiz.difficulty || 'medium').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.desc} numberOfLines={3}>{quiz.description || 'Bu quiz için açıklama belirtilmemiş.'}</Text>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={() => onStart && onStart(quiz)} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>BAŞLA ⚡</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#110d29',
    borderRadius: 20,
    padding: 16,
    margin: 8,
    width: 230,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  title: { fontSize: 16, fontWeight: '800', color: '#ffffff', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  difficulty_easy: { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderWidth: 1, borderColor: '#34d399' },
  difficulty_medium: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderWidth: 1, borderColor: '#fbbf24' },
  difficulty_hard: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444' },
  desc: { marginTop: 10, color: '#94a3b8', fontSize: 13, lineHeight: 18, minHeight: 36 },
  footer: { marginTop: 14, alignItems: 'flex-end' },
  startBtn: { 
    backgroundColor: '#8b5cf6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12,
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },
})
