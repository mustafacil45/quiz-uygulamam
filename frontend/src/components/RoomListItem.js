import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function RoomListItem({ room, onPress }) {
  const isPending = room.myStatus === 'pending';
  return (
    <TouchableOpacity 
      style={[styles.item, isPending && { opacity: 0.7 }]} 
      onPress={() => onPress && onPress(room)} 
      disabled={isPending}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <Text style={styles.name}>
          {room.name}{' '}
          <Text style={{ fontWeight: '800', fontSize: 11, color: '#8b5cf6' }}>
            #{room.code}
          </Text>
        </Text>
        <Text style={styles.meta}>
          👥 {room.participant_count || 0} Oyuncu • {room.is_private ? 'Özel 🔒' : 'Açık 🔓'}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.join, isPending && { color: '#6b7280' }]}>
          {isPending ? 'Onay Bekliyor ⏳' : 'GİR ⚡'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  item: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 16, backgroundColor: '#110d29', borderRadius: 20, 
    marginVertical: 6, marginHorizontal: 8, 
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, shadowRadius: 6,
    elevation: 3
  },
  left: {},
  name: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: '500' },
  join: { color: '#34d399', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
})
