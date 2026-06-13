import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import api from '../api/client'
import { MaterialIcons } from '@expo/vector-icons'

export default function MyRoomsScreen({ navigation }) {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/api/users/me/rooms')
                setRooms(res.data)
            } catch (e) {
                console.log('Error loading rooms', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('RoomDetail', { room: item })}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons name="meeting-room" size={36} color="#8b5cf6" />
            </View>
            <View style={styles.info}>
                <Text style={styles.roomName}>{item.name}</Text>
                <Text style={styles.details}>{item.is_private ? 'Özel Arena 🔒' : 'Herkese Açık 🌍'}</Text>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.quizzes_count || 0} Quiz</Text>
            </View>
        </TouchableOpacity>
    )

    if (loading) return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    )

    return (
        <View style={styles.container}>
            <FlatList
                data={rooms}
                keyExtractor={item => `${item.id}`}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={styles.empty}>Henüz katıldığınız bir arena bulunmuyor.</Text>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#090816' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090816' },
    card: {
        flexDirection: 'row',
        backgroundColor: '#110d29',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3
    },
    iconContainer: { marginRight: 14 },
    info: { flex: 1 },
    roomName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
    details: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
    badge: { 
      backgroundColor: '#251b4f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
      borderWidth: 1, borderColor: '#8b5cf6' 
    },
    badgeText: { color: '#c084fc', fontWeight: '800', fontSize: 11 },
    empty: { textAlign: 'center', marginTop: 60, color: '#64748b', fontStyle: 'italic', fontWeight: '600' }
})
