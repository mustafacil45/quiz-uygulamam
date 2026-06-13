import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import QuizzesScreen from '../screens/QuizzesScreen';
import RoomsScreen from '../screens/RoomsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                        return <Ionicons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'Quizzes') {
                        return <MaterialIcons name="quiz" size={size} color={color} />;
                    } else if (route.name === 'Rooms') {
                        return <MaterialIcons name="meeting-room" size={size} color={color} />;
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                        return <Ionicons name={iconName} size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: '#ec4899',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: '#110d29',
                    borderTopWidth: 1.5,
                    borderTopColor: '#3b2f63',
                    elevation: 10,
                    height: 62 + Math.max(insets.bottom, 8),
                    paddingBottom: Math.max(insets.bottom, 8),
                    paddingTop: 8
                }
            })}
        >
            <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Ana Sayfa' }} />
            <Tab.Screen name="Quizzes" component={QuizzesScreen} options={{ title: 'Quizler' }} />
            <Tab.Screen name="Rooms" component={RoomsScreen} options={{ title: 'Odalar' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
        </Tab.Navigator>
    );
}
