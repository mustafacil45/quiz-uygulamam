import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import QuizSolveScreen from '../screens/QuizSolveScreen'
import RoomDetailScreen from '../screens/RoomDetailScreen'
import DuelScreen from '../screens/DuelScreen'
import QuizCreatorScreen from '../screens/QuizCreatorScreen'
import LeaderboardScreen from '../screens/LeaderboardScreen'
import WelcomeScreen from '../screens/WelcomeScreen'
import MyResultsScreen from '../screens/MyResultsScreen'
import MyRoomsScreen from '../screens/MyRoomsScreen'
import TabNavigator from './TabNavigator'
import CertificateScreen from '../screens/CertificateScreen'

const Stack = createNativeStackNavigator()

export default function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />

      {/* Main App (Tabs) */}
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />

      {/* Screens that should cover tabs */}
      <Stack.Screen name="QuizSolve" component={QuizSolveScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="QuizCreator" component={QuizCreatorScreen} />
      <Stack.Screen name="Duel" component={DuelScreen} />


      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Liderlik Tablosu' }} />
      <Stack.Screen name="MyResults" component={MyResultsScreen} options={{ title: 'Sonuçlarım' }} />
      <Stack.Screen name="MyRooms" component={MyRoomsScreen} options={{ title: 'Odalarım' }} />
      <Stack.Screen name="Certificate" component={CertificateScreen} options={{ title: 'Sertifika', headerShown: false }} />
    </Stack.Navigator>
  )
}
