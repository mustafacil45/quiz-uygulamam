import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export default function FAB({ onPress, label = '+' }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.txt}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fab: { 
    position: 'absolute', right: 20, bottom: 30, 
    backgroundColor: '#ec4899', width: 56, height: 56, borderRadius: 28, 
    alignItems: 'center', justifyContent: 'center', 
    shadowColor: '#ec4899', shadowOffset: {width: 0, height: 6}, 
    shadowOpacity: 0.6, shadowRadius: 10,
    borderWidth: 1.5, borderColor: '#f472b6',
    elevation: 8,
  },
  txt: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: -2 }
})
