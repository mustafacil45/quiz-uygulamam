import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import api from '../api/client'
import { Ionicons } from '@expo/vector-icons'

export default function MyResultsScreen({ navigation }) {
    const [results, setResults] = useState([])
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const getLevel = (p) => {
        if (p >= 95) return 'Uzman (C2)';
        if (p >= 85) return 'İleri (C1)';
        if (p >= 70) return 'İyi (B2)';
        if (p >= 55) return 'Orta (B1)';
        if (p >= 40) return 'Temel (A2)';
        return 'Başlangıç (A1)';
    }

    useEffect(() => {
        const load = async () => {
            try {
                const [res, userRes] = await Promise.all([
                    api.get('/api/users/me/quizzes'),
                    api.get('/api/users/me')
                ])
                setResults(res.data)
                setUser(userRes.data)
            } catch (e) {
                console.log('Error loading results', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const renderItem = ({ item }) => {
        const maxScore = item.total_questions * 100
        const percentage = maxScore > 0
            ? Math.round((item.score / maxScore) * 100)
            : 0

        const isGood = percentage >= 50;

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate('Certificate', { result: item, user })}
                activeOpacity={0.8}
            >
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name="checkmark-circle" 
                        size={40} 
                        color={isGood ? "#10b981" : "#ef4444"} 
                    />
                </View>
                <View style={styles.info}>
                    <Text style={styles.quizTitle}>{item.quiz_title}</Text>
                    {item.room_name && item.room_name !== 'Genel' && (
                        <Text style={{ fontSize: 12, color: '#8b5cf6', fontWeight: '700', marginTop: 2 }}>
                          Oda: {item.room_name}
                        </Text>
                    )}
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                    </Text>
                </View>
                <View style={styles.scoreContainer}>
                    <Text style={styles.score}>{item.score} / {maxScore}</Text>
                    <Text style={[styles.percentage, { color: isGood ? '#34d399' : '#f87171' }]}>
                      %{percentage} - {getLevel(percentage)}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    if (loading) return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    )

    return (
        <View style={styles.container}>
            <FlatList
                data={results}
                keyExtractor={item => `${item.id}`}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={styles.empty}>Henüz çözülen quiz bulunmuyor.</Text>}
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
    quizTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
    date: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: '500' },
    scoreContainer: { alignItems: 'flex-end' },
    score: { fontSize: 16, fontWeight: '900', color: '#fbbf24' },
    percentage: { fontSize: 11, marginTop: 4, fontWeight: '700' },
    empty: { textAlign: 'center', marginTop: 60, color: '#64748b', fontStyle: 'italic', fontWeight: '600' }
})
