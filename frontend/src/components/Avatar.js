import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { resolveMediaUrl, initialsOf } from '../utils/settings'

// Profil fotoğrafı varsa onu, yoksa baş harfleri gösterir
export default function Avatar({ uri, name, size = 48, borderColor = '#ec4899', style }) {
  const src = resolveMediaUrl(uri)
  const radius = size / 2
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius, borderColor }, style]}>
      {src ? (
        <Image source={{ uri: src }} style={{ width: '100%', height: '100%', borderRadius: radius }} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#8b5cf6',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { color: '#ffffff', fontWeight: '800', letterSpacing: 0.5 },
})
