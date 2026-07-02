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
        const alreadySolved = solvedIds.has(quiz.id)
        // If already solved
        if (alreadySolved) {
            // If quiz is not retakeable, inform user
            if (!quiz.is_retakeable) {
                Alert.alert('Tekrar Çözüm Yok', 'Bu quiz tekrar çözülemez.')
                return
            }

            // Quiz is retakeable: show message based on scoring mode
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

        // Not solved yet: start normal attempt
        navigation.navigate('QuizSolve', { quizId: quiz.id, isRetake: false })
    }

    const renderItem = ({ item }) => {
        const isSolved = solvedIds.has(item.id)
        return (
            <View style={{ opacity: isSolved ? 0.65 : 1, width: '100%', marginBottom: 12 }}>
                <QuizCard quiz={item} onStart={onStart} fullWidth={true} isSolved={isSolved} />
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
    container: { flex: 1, backgroundColor: '#090816' }
})
