import apiClient from '@/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
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

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { stats } = usePoops();
  const insets = useSafeAreaInsets();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const achievements = [
    {
      id: 'first',
      name: 'First Log',
      emoji: '🎉',
      description: 'Log your first poop',
      unlocked: (stats?.allTime || 0) >= 1,
    },
    {
      id: 'streak3',
      name: '3 Day Streak',
      emoji: '🔥',
      description: 'Maintain a 3 day streak',
      unlocked: (stats?.longestStreak || 0) >= 3,
    },
    {
      id: 'streak7',
      name: 'Week Warrior',
      emoji: '⚔️',
      description: 'Maintain a 7 day streak',
      unlocked: (stats?.longestStreak || 0) >= 7,
    },
    {
      id: 'streak30',
      name: 'Monthly Master',
      emoji: '👑',
      description: 'Maintain a 30 day streak',
      unlocked: (stats?.longestStreak || 0) >= 30,
    },
    {
      id: 'total50',
      name: 'Fifty Club',
      emoji: '🎯',
      description: 'Log 50 total poops',
      unlocked: (stats?.allTime || 0) >= 50,
    },
    {
      id: 'total100',
      name: 'Century',
      emoji: '💯',
      description: 'Log 100 total poops',
      unlocked: (stats?.allTime || 0) >= 100,
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
        'Failed to delete account. Please try again later.'
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>💩</Text>
          </View>
          <Text style={styles.profileName}>
            {user?.displayName || 'Anonymous'}
          </Text>
          <Text style={styles.profileUsername}>@{user?.username || 'user'}</Text>
          <Text style={styles.memberSince}>
            Member since{' '}
            {user?.createdAt
              ? format(new Date(user.createdAt), 'MMMM yyyy')
              : 'Today'}
          </Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={20} color="#A67C52" />
            <Text style={styles.statValue}>{stats?.allTime || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="calendar-today" size={20} color="#16A34A" />
            <Text style={styles.statValue}>
              {stats?.avgPerDay?.toFixed(1) || '0'}
            </Text>
            <Text style={styles.statLabel}>Daily Avg</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="emoji-events" size={20} color="#EAB308" />
            <Text style={styles.statValue}>{stats?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <MaterialIcons name="emoji-events" size={20} color="#8B4513" />
              <Text style={styles.cardTitle}>Achievements</Text>
            </View>
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
                    ? styles.achievementCardUnlocked
                    : styles.achievementCardLocked,
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
                    achievement.unlocked
                      ? styles.achievementNameUnlocked
                      : styles.achievementNameLocked,
                  ]}
                >
                  {achievement.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <MaterialIcons name="settings" size={20} color="#8B4513" />
            <Text style={styles.cardTitle}>Settings</Text>
          </View>
          <View style={styles.settingsList}>
            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              disabled
            >
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingValue}>Coming soon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              disabled
            >
              <Text style={styles.settingLabel}>Privacy</Text>
              <Text style={styles.settingValue}>Coming soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutButton}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete Account Link */}
        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteAccountLink}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
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
            <View style={styles.modalHeader}>
              <MaterialIcons name="warning" size={48} color="#DC2626" />
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalSubtitle}>
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.confirmLabel}>
                Type your username to confirm:
              </Text>
              <Text style={styles.usernameDisplay}>@{user?.username}</Text>
              <TextInput
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Enter username"
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
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[
                  styles.deleteButton,
                  deleteConfirmation !== user?.username && styles.deleteButtonDisabled
                ]}
                disabled={deleteConfirmation !== user?.username}
              >
                <Text style={styles.deleteButtonText}>Delete Forever</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#D4A574',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B4423',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: '#A67C52',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 12,
    color: '#D4A574',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B4423',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A67C52',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4513',
  },
  badge: {
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#A67C52',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  achievementCardUnlocked: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  achievementCardLocked: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  achievementEmojiLocked: {
    opacity: 0.5,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievementNameUnlocked: {
    color: '#8B4513',
  },
  achievementNameLocked: {
    color: '#9CA3AF',
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B4513',
  },
  settingValue: {
    fontSize: 14,
    color: '#A67C52',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  deleteAccountLink: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBody: {
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  usernameDisplay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 12,
  },
  confirmInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FEE2E2',
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
