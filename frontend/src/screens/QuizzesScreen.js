import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, Alert, SafeAreaView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client'
import QuizCard from '../components/QuizCard'

const { width } = Dimensions.get('window')

export default function QuizzesScreen({ navigation }) {
    const [quizzes, setQuizzes] = useState([])
    const [solvedIds, setSolvedIds] = useState(new Set())
    const [loading, setLoading] = useState(true)

    const loadQuizzes = async () => {
        try {
            setLoading(true)
            const [allRes, solvedRes] = await Promise.all([
                api.get('/api/quiz', { params: { scope: 'global' } }),
                api.get('/api/users/me/quizzes')
            ])

            setQuizzes(allRes.data)
            const ids = new Set(solvedRes.data.map(r => r.quiz_id))
            setSolvedIds(ids)
        } catch (err) {
            console.log('Error loading quizzes:', err)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadQuizzes()
        }, [])
    );

    const onStart = (quiz) => {
        if (solvedIds.has(quiz.id)) {
            Alert.alert(
                'Tekrar Çöz ⚡',
                'Bu quizi daha önce çözdünüz. Tekrar çözebilirsiniz ancak puanınız değişmeyecektir (İlk puan geçerlidir).',
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Tekrar Çöz', onPress: () => navigation.navigate('QuizSolve', { quizId: quiz.id, isRetake: true }) }
                ]
            );
            return;
        }
        navigation.navigate('QuizSolve', { quizId: quiz.id, isRetake: false })
    }

    const renderItem = ({ item }) => {
        const isSolved = solvedIds.has(item.id)
        return (
            <View style={{ opacity: isSolved ? 0.65 : 1 }}>
                <QuizCard quiz={item} onStart={onStart} />
                {isSolved && (
                    <View style={styles.solvedBadge}>
                        <Text style={styles.solvedText}>TAMAMLANDI ✓</Text>
                    </View>
                )}
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(i) => `${i.id}`}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#090816' },
    solvedBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: '#10b981',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#34d399',
        zIndex: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    solvedText: { color: '#090816', fontWeight: '900', fontSize: 9, letterSpacing: 0.5 }
})
