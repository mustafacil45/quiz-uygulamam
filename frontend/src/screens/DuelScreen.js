import React, { useEffect, useState } from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import { API_BASE } from '../api/client'
import WSClient from '../ws/wsClient'

export default function DuelScreen({ route, navigation }) {
  const [messages, setMessages] = useState([])
  useEffect(() => {
    const wsBase = API_BASE.replace(/^http/, 'ws')
    const client = new WSClient(`${wsBase}/api/duel/ws/demo-room`)
    client.onMessage((msg) => setMessages((m) => [...m, msg]))
    client.connect()
    return () => client.disconnect()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duel</Text>
      {messages.map((m, i) => <Text key={i}>{m}</Text>)}
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  )
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 }, title: { fontSize: 20, marginBottom: 12 } })
