
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import Avatar from '../components/Avatar';

export default function CertificateScreen({ route, navigation }) {
    const { result, user } = route.params;
    const viewShotRef = useRef();

    // Calculate Percentage & Level
    const maxScore = result.total_questions * 100;
    const percentage = maxScore > 0 ? Math.round((result.score / maxScore) * 100) : 0;

    let level = 'A1';
    let levelText = 'Başlangıç';
    let color = '#3498db';

    if (percentage >= 95) { level = 'C2'; levelText = 'Uzman'; color = '#8e44ad'; }
    else if (percentage >= 85) { level = 'C1'; levelText = 'İleri'; color = '#9b59b6'; }
    else if (percentage >= 70) { level = 'B2'; levelText = 'İyi'; color = '#2ecc71'; }
    else if (percentage >= 55) { level = 'B1'; levelText = 'Orta'; color = '#27ae60'; }
    else if (percentage >= 40) { level = 'A2'; levelText = 'Temel'; color = '#f1c40f'; }
    else { level = 'A1'; levelText = 'Başlangıç'; color = '#e74c3c'; }

    const onShare = async () => {
        try {
            const uri = await viewShotRef.current.capture();
            await Share.share({
                url: uri,
                title: 'Sertifikam',
                message: `Bu quizi %${percentage} başarıyla tamamladım ve ${level} (${levelText}) seviyesine ulaştım! 🏆`
            });
        } catch (error) {
            Alert.alert('Hata', 'Paylaşım yapılamadı.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <ViewShot ref={viewShotRef} style={styles.certificateContainer} options={{ format: 'jpg', quality: 0.9 }}>
                <View style={styles.border}>
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="certificate" size={60} color={color} />
                        <Text style={styles.title}>BAŞARI SERTİFİKASI</Text>
                    </View>

                    <Text style={styles.presented}>Bu sertifika</Text>
                    <Avatar uri={user?.avatar_url} name={user?.username} size={88} borderColor={color} style={styles.avatar} />
                    <Text style={[styles.name, { color: color }]}>{user?.username || 'Kullanıcı'}</Text>
                    <Text style={styles.presented}>adlı kullanıcıya</Text>

                    <View style={styles.quizInfo}>
                        <Text style={styles.quizTitle}>"{result.quiz_title}"</Text>
                        {result.room_name && result.room_name !== 'Genel' && (
                            <Text style={styles.roomName}>({result.room_name} Odası)</Text>
                        )}
                        <Text style={styles.completedText}>quizindeki başarısından dolayı verilmiştir.</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Başarı Oranı</Text>
                            <Text style={[styles.statValue, { color: color }]}>%{percentage}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Seviye</Text>
                            <Text style={[styles.statValue, { color: color }]}>{level}</Text>
                            <Text style={styles.levelText}>{levelText}</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.date}>{new Date(result.created_at).toLocaleDateString()}</Text>
                        <MaterialCommunityIcons name="seal" size={40} color={color} style={{ opacity: 0.8 }} />
                    </View>
                </View>
            </ViewShot>

            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: color }]} onPress={onShare}>
                <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
                <Text style={styles.shareText}>Sertifikayı Paylaş</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#2c3e50', padding: 20, alignItems: 'center', justifyContent: 'center' },
    certificateContainer: { backgroundColor: '#fff', width: '100%', borderRadius: 10, padding: 10, elevation: 5 },
    border: { borderWidth: 4, borderColor: '#ecf0f1', padding: 20, alignItems: 'center', borderRadius: 6, borderStyle: 'double' },
    header: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '900', color: '#2c3e50', marginTop: 10, letterSpacing: 2 },
    presented: { fontSize: 16, color: '#7f8c8d', marginVertical: 5 },
    avatar: { marginTop: 6, marginBottom: 4, borderWidth: 3 },
    name: { fontSize: 28, fontWeight: 'bold', marginVertical: 10, textTransform: 'uppercase' },
    quizInfo: { alignItems: 'center', marginVertical: 15 },
    quizTitle: { fontSize: 20, fontWeight: '600', color: '#34495e', textAlign: 'center' },
    roomName: { fontSize: 14, color: '#95a5a6', marginTop: 4, fontStyle: 'italic' },
    completedText: { fontSize: 14, color: '#7f8c8d', marginTop: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 15 },
    statBox: { alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#95a5a6', textTransform: 'uppercase' },
    statValue: { fontSize: 32, fontWeight: 'bold' },
    levelText: { fontSize: 14, color: '#7f8c8d' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: 10 },
    date: { fontSize: 14, color: '#bdc3c7' },
    shareBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 30, marginTop: 30, width: '80%', justifyContent: 'center', elevation: 3 },
    shareText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    closeBtn: { marginTop: 15, padding: 10 },
    closeText: { color: '#bdc3c7', fontSize: 16 }
});
