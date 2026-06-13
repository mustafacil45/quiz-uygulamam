import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <View style={styles.glow} />
            <Text style={styles.title}>TrendQuiz ⚡</Text>
            <Text style={styles.subtitle}>Bilgine güven, rakiplerini yen ve zirveye çık!</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                    <Text style={[styles.buttonText, styles.outlineButtonText]}>Kayıt Ol</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#090816',
        padding: 24,
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        top: '25%',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
        color: '#ffffff',
        letterSpacing: 1,
        textShadowColor: 'rgba(139, 92, 246, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#a78bfa',
        marginBottom: 60,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 14,
    },
    button: {
        backgroundColor: '#8b5cf6',
        padding: 16,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1.5,
        borderColor: '#a78bfa',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    outlineButton: {
        backgroundColor: '#110d29',
        borderWidth: 1.5,
        borderColor: '#ec4899',
        shadowColor: '#ec4899',
    },
    outlineButtonText: {
        color: '#f472b6',
    }
})
