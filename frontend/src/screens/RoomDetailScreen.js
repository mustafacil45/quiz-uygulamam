import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, SafeAreaView, TouchableOpacity } from 'react-native'
import services from '../api/services'
import api from '../api/client'
import { useIsFocused } from '@react-navigation/native'

export default function RoomDetailScreen({ route, navigation }) {
  const { room } = route.params || {}
  const [participants, setParticipants] = useState([])
  const [started, setStarted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [quizzes, setQuizzes] = useState([])
  const [requests, setRequests] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [amHost, setAmHost] = useState(false)
  const [canCreate, setCanCreate] = useState(false)
  const isFocused = useIsFocused()
  const [solvedIds, setSolvedIds] = useState(new Set())

  const joinRoom = useCallback(async () => {
    if (!room?.id) return
    try {
      const res = await api.post(`/api/rooms/${room.id}/join`)
      if (res.data.status === 'pending') {
        Alert.alert('İstek Gönderildi', 'Katılma isteğiniz oda sahibine iletildi.')
        navigation.goBack()
      }
    } catch (e) {
      console.log('Join room error (might be already joined)', e)
    }
  }, [room])

  const loadRoomData = useCallback(async () => {
    if (!room?.id) return
    setLoading(true)
    try {
      const [roomsRes, solvedRes, partsRes, meRes, lbRes] = await Promise.all([
        services.fetchRooms(),
        api.get('/api/users/me/quizzes'),
        api.get(`/api/rooms/${room.id}/participants`),
        api.get('/api/users/me'),
        api.get(`/api/rooms/${room.id}/leaderboard`)
      ])

      setLeaderboard(lbRes.data)

      const r = roomsRes.find((x) => Number(x.id) === Number(room.id))
      if (r) {
        setQuizzes(r.quizzes || [])
      }

      const ids = new Set(solvedRes.data.map(q => q.quiz_id))
      setSolvedIds(ids)

      setParticipants(partsRes.data)

      const myId = meRes.data.id
      setAmHost(myId === r.host_id)

      if (myId === r.host_id) {
        setCanCreate(true)
        try {
          const reqRes = await api.get(`/api/rooms/${room.id}/requests`)
          setRequests(reqRes.data)
        } catch (e) {
          console.log('fetch requests error', e)
        }
      } else {
        const meInParts = partsRes.data.find(p => p.id === myId)
        setCanCreate(meInParts?.can_create_quiz === true)
      }

    } catch (e) {
      console.warn('loadRoomData error', e?.response || e?.message)
    } finally {
      setLoading(false)
    }
  }, [room])

  useEffect(() => {
    let t
    if (started && countdown > 0) {
      t = setInterval(() => setCountdown((c) => c - 1), 1000)
    } else if (started && countdown === 0) {
      setStarted(false)
      if (quizzes && quizzes.length > 0) {
        navigation.navigate('QuizSolve', { quizId: quizzes[0].id })
      } else {
        Alert.alert('Uyarı', 'Bu odada çözülecek quiz yok!')
      }
    }
    return () => clearInterval(t)
  }, [started, countdown, quizzes])

  useEffect(() => {
    if (isFocused) {
      joinRoom().then(() => {
        loadRoomData()
      })
    }
  }, [isFocused, joinRoom, loadRoomData])

  const startQuiz = () => {
    if (!quizzes || quizzes.length === 0) {
      Alert.alert('Uyarı', 'Lütfen önce odaya bir quiz ekleyin.')
      loadRoomData()
      return
    }
    const firstQuiz = quizzes[0]
    if (solvedIds.has(firstQuiz.id)) {
      Alert.alert('Tamamlandı', 'Bu quizi daha önce çözdünüz.')
      return
    }

    setStarted(true)
    setCountdown(3)
  }

  const checkAndStart = (id) => {
    if (solvedIds.has(id)) {
      Alert.alert('Tamamlandı', 'Bu quizi daha önce çözdünüz.')
      return
    }
    navigation.navigate('QuizSolve', { quizId: id })
  }

  const handleRequest = async (userId, action) => {
    try {
      await api.post(`/api/rooms/${room.id}/requests`, { user_id: userId, action })
      loadRoomData()
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız')
    }
  }

  const togglePermission = async (userId, currentVal) => {
    try {
      await api.post(`/api/rooms/${room.id}/permissions`, { user_id: userId, can_create_quiz: !currentVal })
      loadRoomData()
    } catch (e) {
      Alert.alert('Hata', 'Yetki değiştirilemedi')
    }
  }

  const deleteRoom = () => {
    if (!room?.id || !amHost) return

    Alert.alert(
      'Odayı Sil',
      'Bu odayı silmek istediğine emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/rooms/${room.id}`)
              Alert.alert('Silindi', 'Oda silindi.')
              navigation.goBack()
            } catch (e) {
              Alert.alert('Hata', e?.response?.data?.detail || 'Oda silinemedi.')
            }
          }
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={(q) => `${q.id}`}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRoomData} tintColor="#8b5cf6" />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{room?.name || 'Room'}</Text>
            {room?.code && (
              <Text style={styles.codeLabel}>
                Arena Kodu: <Text style={styles.codeText}>{room.code}</Text>
              </Text>
            )}

            {/* Participants */}
            <View style={styles.sectionBox}>
              <Text style={styles.sub}>👥 Katılımcılar ({participants.length})</Text>
              {participants.length === 0 ? (
                <Text style={styles.emptyText}>Kimse yok.</Text>
              ) : (
                <View>
                  {participants.map((p, i) => (
                    <View key={i} style={styles.partRow}>
                      <Text style={styles.partText}>
                        {p.username} {p.id === room.host_id ? '👑' : ''}
                      </Text>
                      {amHost && p.id !== room.host_id && (
                        <TouchableOpacity 
                          onPress={() => togglePermission(p.id, p.can_create_quiz)} 
                          style={[styles.permBtn, p.can_create_quiz && styles.permBtnActive]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.permText, p.can_create_quiz && { color: '#ffffff' }]}>
                            {p.can_create_quiz ? 'Quiz Yetkisi Var ⚡' : 'Yetki Ver'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Leaderboard */}
            <View style={styles.sectionBox}>
              <Text style={styles.sub}>🏆 Arena Sıralaması</Text>
              {leaderboard.length === 0 ? (
                <Text style={styles.emptyText}>Henüz skor kaydı bulunmuyor.</Text>
              ) : (
                leaderboard.map((l, i) => {
                  let rankBg = '#1e1b4b';
                  let rankColor = '#a78bfa';
                  if (l.rank === 1) { rankBg = '#fbbf24'; rankColor = '#090816'; }
                  else if (l.rank === 2) { rankBg = '#94a3b8'; rankColor = '#090816'; }
                  else if (l.rank === 3) { rankBg = '#b45309'; rankColor = '#ffffff'; }

                  return (
                    <View key={i} style={styles.lbRow}>
                      <View style={[styles.rankBadge, { backgroundColor: rankBg }]}>
                        <Text style={[styles.rankText, { color: rankColor }]}>#{l.rank}</Text>
                      </View>
                      <Text style={styles.lbName}>{l.username}</Text>
                      <Text style={styles.lbScore}>{l.score}p</Text>
                    </View>
                  )
                })
              )}
            </View>

            {/* Join Requests */}
            {requests.length > 0 && (
              <View style={[styles.sectionBox, { borderColor: '#ea580c' }]}>
                <Text style={[styles.sub, { color: '#fb923c' }]}>⏳ Katılma İstekleri ({requests.length})</Text>
                {requests.map((r, i) => (
                  <View key={i} style={styles.reqItem}>
                    <Text style={styles.reqName}>{r.username}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        onPress={() => handleRequest(r.id, 'approve')} 
                        style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#090816', fontWeight: '800', fontSize: 11 }}>Kabul</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleRequest(r.id, 'reject')} 
                        style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Red</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.sub, { marginTop: 24, paddingLeft: 4 }]}>📝 Bu Arenadaki Quizler</Text>
          </>
        }
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>Henüz quiz eklenmemiş.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.quizCard, solvedIds.has(item.id) && { opacity: 0.6 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.quizTitle}>
                {item.title} {solvedIds.has(item.id) ? '✅' : ''}
              </Text>
              {item.description ? <Text style={styles.quizDesc}>{item.description}</Text> : null}
            </View>
            <TouchableOpacity 
              onPress={() => checkAndStart(item.id)} 
              disabled={solvedIds.has(item.id)}
              style={[styles.quizBtn, solvedIds.has(item.id) ? styles.quizBtnSolved : styles.quizBtnSolve]}
              activeOpacity={0.8}
            >
              <Text style={styles.quizBtnText}>
                {solvedIds.has(item.id) ? 'Çözüldü' : 'ÇÖZ ⚡'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 12, paddingBottom: 200 }}
      />

      {/* Footer Actions */}
      <View style={styles.footer}>
        {started ? (
          <Text style={styles.countdown}>BAŞLIYOR: {countdown}</Text>
        ) : (
          <TouchableOpacity onPress={startQuiz} style={styles.mainStartBtn} activeOpacity={0.85}>
            <Text style={styles.mainStartBtnText}>HEMEN BAŞLA (İLK QUIZ) 🔥</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 8 }} />
        {canCreate && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('QuizCreator', { roomId: room?.id })} 
            style={[styles.actionCardBtn, { backgroundColor: '#251b4f', borderColor: '#8b5cf6' }]}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#c084fc', fontWeight: '800', fontSize: 13 }}>+ QUIZ EKLE</Text>
          </TouchableOpacity>
        )}
        {amHost && (
          <>
            <View style={{ height: 8 }} />
            <TouchableOpacity 
              onPress={deleteRoom} 
              style={[styles.actionCardBtn, { backgroundColor: '#3b1820', borderColor: '#ef4444' }]}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fca5a5', fontWeight: '800', fontSize: 13 }}>ARENAYI SİL 🗑️</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090816' },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  codeLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  codeText: { fontWeight: '800', color: '#a78bfa' },
  sub: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 12 },
  sectionBox: { 
    backgroundColor: '#110d29', padding: 16, borderRadius: 24, marginTop: 12,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  countdown: { fontSize: 20, fontWeight: '900', color: '#ef4444', textAlign: 'center', padding: 12, letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  reqItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2d256b' },
  reqName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  partRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1f1b44' },
  partText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  permBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#251b4f' },
  permBtnActive: { backgroundColor: '#10b981' },
  permText: { fontSize: 11, color: '#a78bfa', fontWeight: '800' },
  emptyText: { color: '#64748b', fontStyle: 'italic', paddingVertical: 4, fontWeight: '600' },
  
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1f1b44', gap: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '900' },
  lbName: { flex: 1, fontSize: 14, color: '#ffffff', fontWeight: '700' },
  lbScore: { fontSize: 14, fontWeight: '800', color: '#d946ef' },

  actionBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  
  quizCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: '#110d29', marginVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6
  },
  quizTitle: { fontWeight: '800', color: '#ffffff', fontSize: 16 },
  quizDesc: { color: '#94a3b8', marginTop: 4, fontSize: 13, fontWeight: '500' },
  quizBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  quizBtnSolve: { backgroundColor: '#8b5cf6' },
  quizBtnSolved: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  quizBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },

  mainStartBtn: { 
    backgroundColor: '#10b981', padding: 16, borderRadius: 18, alignItems: 'center',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8,
    borderWidth: 1.5, borderColor: '#34d399'
  },
  mainStartBtnText: { color: '#090816', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  actionCardBtn: {
    padding: 16, borderRadius: 18, alignItems: 'center', borderWidth: 1.5,
  }
})
