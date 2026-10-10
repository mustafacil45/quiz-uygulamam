import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import { clearSession } from '../utils/settings';

function MenuItem({ icon, color, bg, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.itemText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  // Düzenleme ekranından dönünce güncel bilgiyi göster
  useFocusEffect(
    useCallback(() => {
      let active = true;
      api.get('/api/users/me')
        .then(res => { if (active) setUser(res.data); })
        .catch(err => console.log(err));
      return () => { active = false; };
    }, [])
  );

  const handleLogout = async () => {
    try {
      await clearSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (e) {
      console.log('Logout error', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Profile Card */}
      <View style={styles.header}>
        <View style={styles.headerPulse} />
        <TouchableOpacity
          style={styles.avatarGlow}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('EditProfile', { user })}
        >
          <Avatar uri={user?.avatar_url} name={user?.username} size={96} borderColor="#ec4899" />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.username}>{user?.username || 'Kullanıcı'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HESAP AYARLARI</Text>

          <MenuItem
            icon="person-outline"
            color="#f9a8d4"
            bg="rgba(236, 72, 153, 0.15)"
            label="Profili Düzenle"
            onPress={() => navigation.navigate('EditProfile', { user })}
          />
          <MenuItem
            icon="key-outline"
            color="#a78bfa"
            bg="rgba(139, 92, 246, 0.15)"
            label="Şifre Değiştir"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <MenuItem
            icon="settings-outline"
            color="#22d3ee"
            bg="rgba(6, 182, 212, 0.15)"
            label="Uygulama Ayarları"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={22} color="#fca5a5" />
          <Text style={styles.logoutText}>Oturumu Kapat</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090816' },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: '#110d29',
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1.5,
    borderColor: '#3b2f63',
    position: 'relative',
    overflow: 'hidden',
  },
  headerPulse: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
  },
  avatarGlow: {
    borderRadius: 55,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16
  },
  editBadge: {
    position: 'absolute', right: 0, bottom: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#ec4899',
    borderWidth: 2, borderColor: '#110d29',
    alignItems: 'center', justifyContent: 'center',
  },
  username: { color: '#ffffff', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  email: { color: '#94a3b8', fontSize: 13, marginTop: 4, fontWeight: '500' },
  section: { padding: 20, marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, marginLeft: 6, letterSpacing: 1.5 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#110d29',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#ffffff', fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#3b1820',
    margin: 20,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 30
  },
  logoutText: { color: '#fca5a5', fontSize: 16, fontWeight: '800' }
});
