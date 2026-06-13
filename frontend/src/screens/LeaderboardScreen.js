import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import api from '../api/client'
import { Ionicons } from '@expo/vector-icons'

export default function LeaderboardScreen() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const res = await api.get('/api/users/leaderboard')
      setUsers(res.data)
    } catch (e) {
      console.log('Leaderboard err:', e)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }) => {
    let rankColor = '#94a3b8'
    let icon = null
    let borderGlow = 'rgba(255, 255, 255, 0.05)'

    if (item.rank === 1) {
      rankColor = '#fbbf24'
      icon = <Ionicons name="trophy" size={22} color={rankColor} />
      borderGlow = 'rgba(251, 191, 36, 0.3)'
    } else if (item.rank === 2) {
      rankColor = '#94a3b8'
      icon = <Ionicons name="trophy" size={18} color={rankColor} />
      borderGlow = 'rgba(148, 163, 184, 0.2)'
    } else if (item.rank === 3) {
      rankColor = '#b45309'
      icon = <Ionicons name="trophy" size={16} color={rankColor} />
      borderGlow = 'rgba(180, 83, 9, 0.2)'
    } else {
      icon = <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
    }

    return (
      <View style={[styles.card, { borderColor: borderGlow }]}>
        <View style={styles.rankContainer}>
          {icon}
        </View>
        <View style={styles.info}>
          <Text style={styles.username}>{item.username}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{item.score}</Text>
          <Text style={styles.pts}>puan</Text>
        </View>
      </View>
    )
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerPulse} />
        <Text style={styles.headerTitle}>LİDERLİK TABLOSU 🏆</Text>
        <Text style={styles.headerSubtitle}>Genel sıralamada en yüksek puanlı şampiyonlar</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => `${u.user_id}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        ListEmptyComponent={<Text style={styles.empty}>Henüz sıralama verisi bulunmuyor.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090816' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090816' },
  header: { 
    padding: 24, backgroundColor: '#110d29', paddingTop: 64, 
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    borderBottomWidth: 1.5, borderColor: '#3b2f63',
    position: 'relative', overflow: 'hidden'
  },
  headerPulse: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 1 },
  headerSubtitle: { color: '#a78bfa', textAlign: 'center', marginTop: 6, fontWeight: '600', fontSize: 13 },

  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#110d29', 
    padding: 16, borderRadius: 20, marginBottom: 12, 
    borderWidth: 1.5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
    elevation: 3 
  },
  rankContainer: { width: 36, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '900' },
  info: { flex: 1, paddingHorizontal: 16 },
  username: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  scoreContainer: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '900', color: '#d946ef' },
  pts: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  empty: { textAlign: 'center', padding: 40, color: '#64748b', fontWeight: '600', fontStyle: 'italic' }
})
