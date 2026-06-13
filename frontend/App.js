import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootStack from './src/navigation'

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
