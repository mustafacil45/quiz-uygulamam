import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, SafeAreaView, TouchableOpacity } from 'react-native'
import services from '../api/services'
import api from '../api/client'
import { useIsFocused } from '@react-navigation/native'

export default function RoomDetailScreen({ route, navigation }) {
  const [currentRoom, setCurrentRoom] = useState(route.params?.room || {})
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
  const [myStatus, setMyStatus] = useState('loading')

  const joinRoom = useCallback(async () => {
    if (!currentRoom?.id) return
    try {
      const res = await api.post(`/api/rooms/${currentRoom.id}/join`)
      if (res.data.status === 'pending') {
        Alert.alert('İstek Gönderildi', 'Katılma isteğiniz oda sahibine iletildi.')
        setMyStatus('pending')
      } else if (res.data.status === 'already_joined') {
        setMyStatus('approved')
        loadRoomData()
      }
    } catch (e) {
      console.log('Join room error (might be already joined)', e)
    }
  }, [currentRoom?.id])

  const loadRoomData = useCallback(async () => {
    if (!currentRoom?.id) return
    setLoading(true)
    try {
      const [roomsRes, solvedRes, partsRes, meRes, lbRes] = await Promise.all([
        services.fetchRooms(),
        api.get('/api/users/me/quizzes'),
        api.get(`/api/rooms/${currentRoom.id}/participants`),
        api.get('/api/users/me'),
        api.get(`/api/rooms/${currentRoom.id}/leaderboard`)
      ])

      setLeaderboard(lbRes.data)

      const r = roomsRes.find((x) => Number(x.id) === Number(currentRoom.id))
      if (r) {
        setQuizzes(r.quizzes || [])
        setCurrentRoom(r) // Update local room state with fresh data
        // Set header title to the fetched room name
        if (r.name) {
          navigation.setOptions({ title: r.name })
        }
      }

      const ids = new Set(solvedRes.data.map(q => q.quiz_id))
      setSolvedIds(ids)

      setParticipants(partsRes.data)

      const myId = meRes.data.id
      setAmHost(myId === r?.host_id)

      if (r && myId === r.host_id) {
        setCanCreate(true)
        setMyStatus('approved')
        try {
          const reqRes = await api.get(`/api/rooms/${currentRoom.id}/requests`)
          setRequests(reqRes.data)
        } catch (e) {
          console.log('fetch requests error', e)
        }
      } else {
        const meInParts = partsRes.data.find(p => p.id === myId)
        setCanCreate(meInParts?.can_create_quiz === true)
        try {
          const myRoomsRes = await api.get('/api/users/me/rooms')
          const myMembership = myRoomsRes.data.find(mr => mr.id === currentRoom.id)
          setMyStatus(myMembership ? myMembership.status : 'none')
        } catch (e) { 
          setMyStatus('none')
        }
      }

    } catch (e) {
      console.warn('loadRoomData error', e?.response || e?.message)
    } finally {
      setLoading(false)
    }
  }, [currentRoom?.id])

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
      loadRoomData()
    }
  }, [isFocused, loadRoomData])

  const startQuiz = () => {
    if (!quizzes || quizzes.length === 0) {
      Alert.alert('Uyarı', 'Lütfen önce odaya bir quiz ekleyin.')
      loadRoomData()
      return
    }
    const firstQuiz = quizzes[0]
    checkAndStart(firstQuiz)
  }

  const checkAndStart = (quiz) => {
    const alreadySolved = solvedIds.has(quiz.id)
    if (alreadySolved) {
      if (!quiz.is_retakeable) {
        Alert.alert('Tamamlandı', 'Bu quizi daha önce çözdünüz.')
        return
      }

      const scoring = quiz.scoring_mode || 'first_score'
      const msg = scoring === 'best_score'
        ? 'Bu quiz tekrar çözülebilir. Yeni denemelerinizde en yüksek puanınız güncellenecektir. Tekrar çözmek istiyor musunuz?'
        : 'Bu quiz tekrar çözülebilir ancak ilk tamamladığınız puan korunacaktır. Tekrar çözmek istiyor musunuz?'

      Alert.alert(
        'Tekrar Çöz ⚡',
        msg,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Tekrar Çöz', onPress: () => navigation.navigate('QuizSolve', { quizId: quiz.id, isRetake: true }) }
        ]
      )
      return
    }
    navigation.navigate('QuizSolve', { quizId: quiz.id, isRetake: false })
  }

  const handleRequest = async (userId, action) => {
    try {
      await api.post(`/api/rooms/${currentRoom.id}/requests`, { user_id: userId, action })
      loadRoomData()
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız')
    }
  }

  const togglePermission = async (userId, currentVal) => {
    try {
      await api.post(`/api/rooms/${currentRoom.id}/permissions`, { user_id: userId, can_create_quiz: !currentVal })
      loadRoomData()
    } catch (e) {
      Alert.alert('Hata', 'Yetki değiştirilemedi')
    }
  }

  const deleteQuiz = (quizId) => {
    Alert.alert(
      'Quizi Sil',
      'Bu quizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/quiz/${quizId}`)
              Alert.alert('Başarılı', 'Quiz silindi.')
              loadRoomData()
            } catch (e) {
              Alert.alert('Hata', e?.response?.data?.detail || 'Quiz silinirken bir hata oluştu.')
            }
          }
        }
      ]
    )
  }

  const deleteRoom = () => {
    if (!currentRoom?.id || !amHost) return

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
              await api.delete(`/api/rooms/${currentRoom.id}`)
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

  if (!loading && myStatus === 'none') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 64, marginBottom: 24 }}>👋</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
          {currentRoom?.name}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
          Bu arenanın bir parçası değilsiniz. İçerideki quizleri görebilmek ve çözebilmek için arenaya katılmak ister misiniz?
        </Text>
        <TouchableOpacity style={[styles.mainStartBtn, { width: '100%', marginBottom: 16 }]} onPress={joinRoom} activeOpacity={0.85}>
          <Text style={styles.mainStartBtnText}>KATILMA İSTEĞİ GÖNDER 🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 16 }} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={{ color: '#a78bfa', fontWeight: '800', fontSize: 15 }}>Vazgeç ve Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (!loading && myStatus === 'pending') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 64, marginBottom: 24 }}>⏳</Text>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
          Katılım İsteği Beklemede
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
          Oda sahibinin ({currentRoom?.name}) isteğinizi onaylaması bekleniyor. Onaylandığında arenaya erişebileceksiniz.
        </Text>
        <TouchableOpacity style={[styles.actionCardBtn, { backgroundColor: '#251b4f', borderColor: '#8b5cf6', width: '100%' }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={{ color: '#c084fc', fontWeight: '800', fontSize: 15, textAlign: 'center' }}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
            {currentRoom?.code && (
              <Text style={[styles.codeLabel, { marginTop: 12 }]}>
                Arena Kodu: <Text style={styles.codeText}>{currentRoom.code}</Text>
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
                        {p.username} {p.id === currentRoom.host_id ? '👑' : ''}
                      </Text>
                      {amHost && p.id !== currentRoom.host_id && (
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
        renderItem={({ item }) => {
          const isSolved = solvedIds.has(item.id)
          const blocked = isSolved && !item.is_retakeable
          return (
            <View style={[styles.quizCard, blocked && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.quizTitle}>
                  {item.title} {isSolved ? '✅' : ''}
                </Text>
                {item.description ? <Text style={styles.quizDesc}>{item.description}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {canCreate && (
                  <TouchableOpacity 
                    onPress={() => deleteQuiz(item.id)}
                    style={[styles.quizBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', marginRight: 8 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.quizBtnText, { color: '#ef4444' }]}>SİL</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => checkAndStart(item)} 
                  disabled={blocked}
                  style={[styles.quizBtn, isSolved ? (item.is_retakeable ? styles.quizBtnSolve : styles.quizBtnSolved) : styles.quizBtnSolve]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quizBtnText}>
                    {blocked ? 'Çözüldü' : (isSolved && item.is_retakeable ? 'TEKRAR ÇÖZ 🔄' : 'ÇÖZ ⚡')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
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
            onPress={() => navigation.navigate('QuizCreator', { roomId: currentRoom?.id })} 
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
