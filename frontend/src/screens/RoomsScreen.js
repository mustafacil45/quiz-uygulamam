import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, Modal, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, SectionList, SafeAreaView } from 'react-native'
import RoomListItem from '../components/RoomListItem'
import FAB from '../components/FAB'
import api from '../api/client'
import services from '../api/services'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useIsFocused } from '@react-navigation/native'

export default function RoomsScreen({ navigation }) {
  const [sections, setSections] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const isFocused = useIsFocused()

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (isFocused) {
      loadData()
    }
  }, [isFocused, debouncedSearch])

  useEffect(() => {
    if (isFocused) {
      loadData()
    }
  }, [isFocused])

  const loadData = async () => {
    try {
      setLoading(true)
      // 1. Get Me (to know my ID)
      const meRes = await api.get('/api/users/me')
      const myId = meRes.data.id

      // 2. Get All Rooms (with search)
      const allRes = await api.get('/api/rooms/', { params: { q: debouncedSearch } })
      const allRooms = allRes.data

      // 3. Get Joined Rooms
      const joinedRes = await api.get('/api/users/me/rooms')
      const joinedRooms = joinedRes.data
      const joinedIds = new Set() // actually just approved
      const approvedIds = new Set()
      const pendingIds = new Set()

      joinedRooms.forEach(r => {
        if (r.status === 'pending') pendingIds.add(r.id)
        else {
          approvedIds.add(r.id)
          joinedIds.add(r.id)
        }
      })

      // Categorize
      const created = []
      const joined = []
      const others = []

      allRooms.forEach(room => {
        if (room.host_id === myId) {
          created.push(room)
        } else if (approvedIds.has(room.id)) {
          joined.push(room)
        } else {
          if (pendingIds.has(room.id)) {
            room.myStatus = 'pending'
          }
          others.push(room)
        }
      })

      const newSections = [
        { title: 'Kurduğum Arenalar 👑', data: created },
        { title: 'Katıldığım Arenalar 🔥', data: joined },
        { title: 'Diğer Arenalar ⚔️', data: others }
      ].filter(s => s.data.length > 0)

      setSections(newSections)
    } catch (err) {
      console.warn('loadData rooms error', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        Alert.alert('Giriş Gerekiyor', 'Oda oluşturmak için lütfen giriş yapın', [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
        ])
        return
      }
      setShowCreate(true)
    } catch (e) {
      console.warn('openCreate auth check failed', e)
      setShowCreate(true)
    }
  }

  const createRoom = async () => {
    setCreating(true)
    try {
      if (!name || name.trim().length === 0) {
        Alert.alert('Eksik Bilgi', 'Lütfen oda adı girin.')
        setCreating(false)
        return
      }
      const payload = { name, is_private: false }
      const created = await services.createRoom(payload)
      loadData()
      setShowCreate(false)
    } catch (err) {
      console.warn('createRoom', err)
      Alert.alert('Hata', 'Oda oluşturulamadı.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#090816' }}>
      <View style={{ padding: 12 }}>
        <View style={[styles.searchContainer, { flexDirection: 'row', alignItems: 'center' }]}>
          <TextInput
            style={[styles.searchBar, { flex: 1 }]}
            placeholder="🔍 Arena Ara (İsim veya Kod ile)"
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text.toUpperCase())}
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
              <View style={{ backgroundColor: '#2d256b', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#a78bfa', fontSize: 12, fontWeight: '900' }}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 50 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id + ''}
          renderItem={({ item }) => (
            <RoomListItem room={item} onPress={(r) => navigation.navigate('RoomDetail', { room: r })} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8', fontWeight: '600' }}>Aramaya uygun oda bulunamadı.</Text>}
        />
      )}

      <FAB onPress={openCreate} label='+' />

      <Modal visible={showCreate} animationType='slide' transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Yeni Arena Kur 🚀</Text>
            <TextInput 
              placeholder='Arena Adı' 
              placeholderTextColor="#6b7280" 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
            />
            <TextInput 
              placeholder='Açıklama' 
              placeholderTextColor="#6b7280" 
              style={styles.input} 
              value={description} 
              onChangeText={setDescription} 
            />

            {creating ? (
              <View style={{ padding: 12 }}>
                <ActivityIndicator size='small' color='#8b5cf6' />
              </View>
            ) : (
              <TouchableOpacity onPress={createRoom} style={styles.primaryBtn} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>ARENAYI KUR ⚡</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.cancelBtn} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>İPTAL ET</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modal: { 
    backgroundColor: '#110d29', padding: 24, borderRadius: 24, width: '90%',
    borderWidth: 1.5, borderColor: '#1f1b44',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 16, textAlign: 'center' },
  input: { 
    backgroundColor: '#151130', padding: 14, borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#2d256b', color: '#f8fafc', fontWeight: '500' 
  },
  primaryBtn: { 
    backgroundColor: '#ec4899', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  cancelBtn: { backgroundColor: '#251b4f', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#a78bfa', fontWeight: '700' },
  sectionHeader: { backgroundColor: '#090816', paddingVertical: 12, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5 },
  searchContainer: {
    backgroundColor: '#151130', borderRadius: 18,
    borderWidth: 1.5, borderColor: '#2d256b',
    paddingHorizontal: 8,
  },
  searchBar: { padding: 12, fontSize: 14, color: '#f8fafc', fontWeight: '500' }
})
