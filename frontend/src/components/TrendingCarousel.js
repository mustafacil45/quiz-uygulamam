import React from 'react'
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import QuizCard from './QuizCard'

export default function TrendingCarousel({ items = [], onStart }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Bugünün Trendleri 🔥</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((q) => (
          <QuizCard key={q.id} quiz={q} onStart={onStart} />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  heading: { fontSize: 18, fontWeight: '800', color: '#fbbf24', marginLeft: 12, letterSpacing: 0.5 },
  row: { paddingHorizontal: 4, paddingVertical: 8 },
})
