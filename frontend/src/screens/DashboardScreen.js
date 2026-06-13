import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
    const [stats, setStats] = useState(null);
    const [user, setUser] = useState(null);
    const [globalQuizzes, setGlobalQuizzes] = useState([]);
    const [solvedQuizzes, setSolvedQuizzes] = useState(new Set());
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const [statsRes, userRes, quizzesRes, solvedRes] = await Promise.all([
                api.get('/api/users/me/stats'),
                api.get('/api/users/me'),
                api.get('/api/quiz', { params: { scope: 'global' } }),
                api.get('/api/users/me/quizzes')
            ]);
            setStats(statsRes.data);
            setUser(userRes.data);
            setGlobalQuizzes(quizzesRes.data);
            
            // Map solved quiz IDs to a Set for fast lookup
            const solvedIds = new Set(solvedRes.data.map(item => item.quiz_id));
            setSolvedQuizzes(solvedIds);
        } catch (e) {
            console.log('Error loading dashboard:', e);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Profile */}
                <View style={styles.header}>
                    <View style={styles.headerPulse} />
                    <View style={styles.headerPulse2} />
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>HOŞ GELDİN, ŞAMPİYON ⚡</Text>
                        <Text style={styles.username} numberOfLines={2}>{user?.username || 'Oyuncu'}</Text>
                    </View>
                    <View style={styles.avatarGlow}>
                        <Ionicons name="person-circle-outline" size={64} color="#a78bfa" />
                    </View>
                </View>

                {/* Stat Cards */}
                <View style={styles.statsContainer}>
                    <TouchableOpacity style={[styles.card, { borderColor: 'rgba(192, 132, 252, 0.4)' }]} onPress={() => navigation.navigate('MyResults')}>
                        <MaterialIcons name="quiz" size={28} color="#c084fc" />
                        <Text style={[styles.cardValue, { color: '#c084fc' }]}>{stats?.solved_quizzes || 0}</Text>
                        <Text style={styles.cardLabel}>Çözülen Quiz</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.card, { borderColor: 'rgba(251, 191, 36, 0.4)' }]} onPress={() => navigation.navigate('MyResults')}>
                        <Ionicons name="trophy" size={28} color="#fbbf24" />
                        <Text style={[styles.cardValue, { color: '#fbbf24' }]}>{stats?.total_score || 0}</Text>
                        <Text style={styles.cardLabel}>Toplam Puan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderColor: 'rgba(52, 211, 153, 0.4)' }]} onPress={() => navigation.navigate('MyRooms')}>
                        <MaterialIcons name="meeting-room" size={28} color="#34d399" />
                        <Text style={[styles.cardValue, { color: '#34d399' }]}>{stats?.joined_rooms || 0}</Text>
                        <Text style={styles.cardLabel}>Üye Oda</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Access Area */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>HIZLI ERİŞİM SEÇENEKLERİ</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#251b4f', borderColor: '#8b5cf6' }]}
                            onPress={() => navigation.navigate('Quizzes')}
                        >
                            <MaterialIcons name="play-circle-outline" size={32} color="#c084fc" />
                            <Text style={[styles.actionText, { color: '#e9d5ff' }]}>Quiz Çöz</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#162b32', borderColor: '#06b6d4' }]}
                            onPress={() => navigation.navigate('Rooms')}
                        >
                            <MaterialIcons name="add-circle-outline" size={32} color="#22d3ee" />
                            <Text style={[styles.actionText, { color: '#cffafe' }]}>Oda Kur</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#3b2514', borderColor: '#f59e0b' }]}
                            onPress={() => navigation.navigate('Leaderboard')}
                        >
                            <Ionicons name="stats-chart" size={32} color="#fbbf24" />
                            <Text style={[styles.actionText, { color: '#fef3c7' }]}>Sıralama</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Admin / Resmi Quizler */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RESMİ EDİTÖR QUİZLERİ ⚡</Text>
                    {globalQuizzes.length === 0 ? (
                        <Text style={styles.emptyText}>Henüz resmi bir quiz yayınlanmadı.</Text>
                    ) : (
                        globalQuizzes.map((item) => {
                            const isCompleted = solvedQuizzes.has(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.quizCard, isCompleted && styles.quizCardCompleted]}
                                    onPress={() => navigation.navigate('QuizSolve', { quizId: item.id })}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.quizInfo}>
                                        <Text style={styles.quizTitleText}>{item.title}</Text>
                                        <Text style={styles.quizMeta}>{item.description || 'Genel Kültür'} • {item.questions?.length || 0} Soru</Text>
                                    </View>
                                    {isCompleted ? (
                                        <View style={styles.completedBadge}>
                                            <Text style={styles.completedText}>TAMAMLANDI</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.solveButton}>
                                            <Text style={styles.solveButtonText}>ÇÖZ ⚡</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#110d29' },
    container: { flex: 1, backgroundColor: '#090816' },
    content: { paddingBottom: 40 },
    header: {
        backgroundColor: '#110d29',
        minHeight: 180,
        paddingTop: 16,
        paddingBottom: 36,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        borderBottomWidth: 1.5,
        borderColor: '#3b2f63',
        position: 'relative',
        overflow: 'hidden',
    },
    headerPulse: {
        position: 'absolute', top: -30, right: -30,
        width: 150, height: 150, borderRadius: 75,
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
    },
    headerPulse2: {
        position: 'absolute', bottom: -40, left: -20,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(6, 182, 212, 0.06)',
    },
    headerText: { flex: 1, paddingRight: 16 },
    greeting: { color: '#ec4899', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    username: { 
        color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 
    },
    avatarGlow: {
        borderRadius: 30,
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        marginTop: -24,
        zIndex: 2,
    },
    card: {
        flex: 1,
        minHeight: 128,
        backgroundColor: '#151130',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    cardValue: { fontSize: 24, fontWeight: '800', marginTop: 10, marginBottom: 4 },
    cardLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'center', fontWeight: '700' },
    section: { paddingHorizontal: 16, paddingTop: 32 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionCard: {
        flexGrow: 1,
        flexBasis: '30%',
        minWidth: 100,
        minHeight: 120,
        paddingHorizontal: 12,
        paddingVertical: 18,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    actionText: { marginTop: 10, fontWeight: '800', fontSize: 15, textAlign: 'center' },
    
    quizCard: {
        backgroundColor: '#110d29',
        borderWidth: 1.5,
        borderColor: '#2d256b',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    quizCardCompleted: {
        borderColor: '#10b981',
    },
    quizInfo: {
        flex: 1,
        paddingRight: 12,
    },
    quizTitleText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#ffffff',
    },
    quizMeta: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: '600',
    },
    completedBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    completedText: {
        color: '#34d399',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    solveButton: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#a78bfa',
    },
    solveButtonText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 13,
        fontStyle: 'italic',
        fontWeight: '600',
        paddingLeft: 4,
    }
});
