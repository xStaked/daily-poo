import apiClient from '@/api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePoops } from '../hooks/usePoops';

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { stats } = usePoops();
  const insets = useSafeAreaInsets();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const achievements: Achievement[] = [
    {
      id: 'first',
      name: 'Bautizo',
      emoji: '🎉',
      description: 'Registra tu primera cagada',
      unlocked: (stats?.allTime || 0) >= 1,
    },
    {
      id: 'streak3',
      name: 'Volcán Activo',
      emoji: '🌋',
      description: 'Mantén una racha de 3 días',
      unlocked: (stats?.longestStreak || 0) >= 3,
    },
    {
      id: 'streak7',
      name: 'Máquina de Mierda',
      emoji: '⚙️',
      description: 'Mantén una racha de 7 días',
      unlocked: (stats?.longestStreak || 0) >= 7,
    },
    {
      id: 'streak30',
      name: 'Rey del Trono',
      emoji: '👑',
      description: 'Mantén una racha de 30 días',
      unlocked: (stats?.longestStreak || 0) >= 30,
    },
    {
      id: 'total10',
      name: 'Principiante',
      emoji: '🐣',
      description: 'Registra 10 en total',
      unlocked: (stats?.allTime || 0) >= 10,
    },
    {
      id: 'total50',
      name: 'Veterano del WC',
      emoji: '🎖️',
      description: 'Registra 50 en total',
      unlocked: (stats?.allTime || 0) >= 50,
    },
    {
      id: 'total100',
      name: 'Culo de Oro',
      emoji: '🏆',
      description: 'Registra 100 en total',
      unlocked: (stats?.allTime || 0) >= 100,
    },
    {
      id: 'total500',
      name: 'Leyenda Fecal',
      emoji: '🐐',
      description: 'Registra 500 en total',
      unlocked: (stats?.allTime || 0) >= 500,
    },
    {
      id: 'streak14',
      name: 'Intestino de Acero',
      emoji: '💪',
      description: 'Mantén una racha de 14 días',
      unlocked: (stats?.longestStreak || 0) >= 14,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.username) {
      return;
    }

    try {
      await apiClient.delete('/auth/account');
      setShowDeleteModal(false);
      logout();
    } catch (err) {
      console.error('Failed to delete account:', err);
      Alert.alert(
        'Error',
        'No se pudo eliminar la cuenta. Intenta de nuevo más tarde.'
      );
    }
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{getInitial()}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>
                {user?.displayName || 'Usuario'}
              </Text>
              <Text style={styles.heroUsername}>@{user?.username || 'user'}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberText}>
                  Desde {user?.createdAt
                    ? format(new Date(user.createdAt), 'MMM yyyy', { locale: es })
                    : 'hoy'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💩</Text>
            <Text style={styles.statNumber}>{stats?.allTime || 0}</Text>
            <Text style={styles.statLabel}>total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statNumber}>{stats?.avgPerDay?.toFixed(1) || '0'}</Text>
            <Text style={styles.statLabel}>diario</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{stats?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>racha</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Logros</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unlockedCount}/{achievements.length}
              </Text>
            </View>
          </View>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked
                    ? styles.achievementUnlocked
                    : styles.achievementLocked,
                ]}
              >
                <Text
                  style={[
                    styles.achievementEmoji,
                    !achievement.unlocked && styles.achievementEmojiLocked,
                  ]}
                >
                  {achievement.emoji}
                </Text>
                <Text
                  style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementNameLocked,
                  ]}
                  numberOfLines={2}
                >
                  {achievement.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ajustes</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🔔</Text>
                <Text style={styles.settingLabel}>Notificaciones</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Pronto</Text>
              </View>
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🔒</Text>
                <Text style={styles.settingLabel}>Privacidad</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Pronto</Text>
              </View>
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>🎨</Text>
                <Text style={styles.settingLabel}>Apariencia</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Pronto</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutButton}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>👋</Text>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Delete Account Link */}
        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteLink}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteLinkText}>Eliminar cuenta</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Daily Poo v1.0.0</Text>
          <Text style={styles.appTagline}>💩 Hecho con amor</Text>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Warning Icon */}
            <View style={styles.warningIcon}>
              <Text style={styles.warningEmoji}>⚠️</Text>
            </View>

            <Text style={styles.modalTitle}>Eliminar cuenta</Text>
            <Text style={styles.modalSubtitle}>
              Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.
            </Text>

            <View style={styles.modalBody}>
              <Text style={styles.confirmLabel}>
                Escribe tu usuario para confirmar:
              </Text>
              <View style={styles.usernameBox}>
                <Text style={styles.usernameDisplay}>@{user?.username}</Text>
              </View>
              <TextInput
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Escribe tu usuario"
                placeholderTextColor="#999"
                style={styles.confirmInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[
                  styles.deleteButton,
                  deleteConfirmation !== user?.username && styles.deleteButtonDisabled
                ]}
                disabled={deleteConfirmation !== user?.username}
              >
                <Text style={[
                  styles.deleteButtonText,
                  deleteConfirmation !== user?.username && styles.deleteButtonTextDisabled
                ]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  heroCard: {
    backgroundColor: '#8B4513',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroUsername: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  statsRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F0F0F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    color: '#8B6914',
    fontWeight: '600',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCard: {
    width: '31%',
    aspectRatio: 0.9,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  achievementUnlocked: {
    backgroundColor: '#FFF8E1',
  },
  achievementLocked: {
    backgroundColor: '#F5F5F5',
  },
  achievementEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  achievementEmojiLocked: {
    opacity: 0.3,
  },
  achievementName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B4513',
    textAlign: 'center',
    lineHeight: 13,
  },
  achievementNameLocked: {
    color: '#BDBDBD',
  },
  settingsList: {
    gap: 8,
    marginTop: -8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingEmoji: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  comingSoonBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  deleteLink: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteLinkText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  appVersion: {
    fontSize: 12,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  appTagline: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 20,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  warningEmoji: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBody: {
    width: '100%',
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  usernameBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  usernameDisplay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4513',
    textAlign: 'center',
  },
  confirmInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButtonTextDisabled: {
    color: '#F8A0A0',
  },
});
