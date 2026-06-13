import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, FlatList, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native'
import TrendingCarousel from '../components/TrendingCarousel'
import QuizCard from '../components/QuizCard'
import api from '../api/client'

const { width } = Dimensions.get('window')

export default function HomeScreen({ navigation }) {
  const [quizzes, setQuizzes] = useState([])
  const [featuredQuizzes, setFeaturedQuizzes] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch all quizzes
        const resAll = await api.get('/api/quiz', { params: { scope: 'global' } })
        setQuizzes(resAll.data)

        // Fetch featured quizzes
        const resFeatured = await api.get('/api/quiz?featured=true')
        setFeaturedQuizzes(resFeatured.data)

      } catch (err) {
        console.log('Error loading quizzes:', err)
      }
    }
    load()
  }, [])

  const onStart = (quiz) => {
    navigation.navigate('QuizSolve', { quizId: quiz.id })
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={(i) => `${i.id}`}
        horizontal={false}
        numColumns={Math.max(1, Math.floor(width / 240))}
        renderItem={({ item }) => <QuizCard quiz={item} onStart={onStart} />}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 8 }}
        ListHeaderComponent={
          <>
            {featuredQuizzes.length > 0 && (
              <>
                <Text style={styles.pageTitle}>Trend & Gündem Quizleri ⚡</Text>
                <TrendingCarousel items={featuredQuizzes} onStart={onStart} />
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tüm Quiz Arenaları</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Leaderboard')} 
                  style={[styles.headerBtn, { backgroundColor: 'rgba(251, 191, 36, 0.12)', borderColor: '#fbbf24' }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAll, { color: '#fbbf24' }]}>🏆 Liderler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Rooms')}
                  style={[styles.headerBtn, { backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: '#8b5cf6' }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAll, { color: '#a78bfa' }]}>Arenalar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090816' },
  pageTitle: { 
    fontSize: 20, fontWeight: '800', color: '#ffffff', 
    marginTop: 24, marginLeft: 12, letterSpacing: 0.5 
  },
  sectionHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 12, marginTop: 24, marginBottom: 12 
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  headerBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    borderWidth: 1,
  },
  seeAll: { fontWeight: '800', fontSize: 11, letterSpacing: 0.5 }
})
