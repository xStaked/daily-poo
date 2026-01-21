import apiClient from '@/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Friend, FriendRequest, LeaderboardEntry } from '../types';

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  friendshipStatus: 'pending' | 'accepted' | null;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard'>('friends');
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get('/friends');
      setFriends((data.friends || []).filter((f: Friend) => f.status === 'accepted'));
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get('/friends/requests/pending');
      setPendingRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get('/leaderboard');
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
      fetchLeaderboard();
    }
  }, [user, fetchFriends, fetchPendingRequests, fetchLeaderboard]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await apiClient.get(`/friends/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const sendFriendRequest = async (targetUser: SearchUser) => {
    if (!user) return;
    setSendingRequest(targetUser.id);
    try {
      await apiClient.post('/friends/request', {
        friendUsername: targetUser.username,
      });
      // Actualizar el resultado de búsqueda para mostrar el nuevo estado
      setSearchResults(prev =>
        prev.map(u =>
          u.id === targetUser.id ? { ...u, friendshipStatus: 'pending' } : u
        )
      );
      fetchFriends();
      fetchPendingRequests();
    } catch (err) {
      console.error('Failed to send request:', err);
    } finally {
      setSendingRequest(null);
    }
  };

  const respondToRequest = async (friendId: string, accept: boolean) => {
    if (!user) return;
    try {
      await apiClient.post('/friends/respond', {
        friendshipId: friendId,
        accept,
      });
      fetchFriends();
      fetchPendingRequests();
      fetchLeaderboard();
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  };

  const closeModal = () => {
    setShowAddFriend(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getStatusButton = (searchUser: SearchUser) => {
    if (searchUser.id === user?.id) {
      return (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>Tú</Text>
        </View>
      );
    }

    if (searchUser.friendshipStatus === 'accepted') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
          <MaterialIcons name="check" size={14} color="#16A34A" />
          <Text style={[styles.statusBadgeText, styles.statusBadgeTextSuccess]}>Amigos</Text>
        </View>
      );
    }

    if (searchUser.friendshipStatus === 'pending') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgePending]}>
          <MaterialIcons name="schedule" size={14} color="#D97706" />
          <Text style={[styles.statusBadgeText, styles.statusBadgeTextPending]}>Pendiente</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.addUserButton}
        onPress={() => sendFriendRequest(searchUser)}
        disabled={sendingRequest === searchUser.id}
      >
        {sendingRequest === searchUser.id ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.addUserButtonText}>Agregar</Text>
          </>
        )}
      </TouchableOpacity>
    );
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
          <Text style={styles.title}>Amigos</Text>
          <TouchableOpacity
            onPress={() => setShowAddFriend(true)}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person-add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              Amigos {friends.length > 0 && `(${friends.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('leaderboard')}
            style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Ranking
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && activeTab === 'friends' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitudes</Text>
            <View style={styles.list}>
              {pendingRequests.map((request) => (
                <View key={request.friendshipId} style={styles.requestCard}>
                  <View style={styles.userRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {request.requester.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.displayName}>{request.requester.displayName}</Text>
                      <Text style={styles.username}>@{request.requester.username}</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      onPress={() => respondToRequest(request.friendshipId, true)}
                      style={styles.acceptBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => respondToRequest(request.friendshipId, false)}
                      style={styles.rejectBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Friends List */}
        {activeTab === 'friends' && (
          <View style={styles.section}>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={styles.emptyTitle}>Sin amigos aún</Text>
                <Text style={styles.emptySubtitle}>Busca usuarios para agregar</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowAddFriend(true)}
                >
                  <MaterialIcons name="person-add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Buscar amigos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.list}>
                {friends.map((friend) => (
                  <View key={friend.id} style={styles.friendCard}>
                    <View style={styles.userRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {friend.user.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.displayName}>{friend.user.displayName}</Text>
                        <Text style={styles.username}>@{friend.user.username}</Text>
                      </View>
                    </View>
                    <View style={styles.friendStats}>
                      <View style={styles.weekBadge}>
                        <Text style={styles.weekNumber}>{friend.weekCount || 0}</Text>
                        <Text style={styles.weekLabel}>sem</Text>
                      </View>
                      <Text style={styles.todayCount}>{friend.todayCount || 0} hoy</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <View style={styles.section}>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={styles.emptyTitle}>Sin ranking aún</Text>
                <Text style={styles.emptySubtitle}>Agrega amigos para competir</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {leaderboard.map((entry, index) => (
                  <View
                    key={entry.user.id}
                    style={[
                      styles.leaderboardCard,
                      entry.isCurrentUser && styles.leaderboardCardYou,
                      index < 3 && styles.leaderboardCardTop,
                    ]}
                  >
                    <View style={styles.rankContainer}>
                      <Text style={[
                        styles.rankText,
                        index < 3 && styles.rankTextTop
                      ]}>
                        {getRankEmoji(entry.rank)}
                      </Text>
                    </View>
                    <View style={styles.userRow}>
                      <View style={[styles.avatar, index === 0 && styles.avatarGold]}>
                        <Text style={styles.avatarText}>
                          {entry.user.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.displayName}>
                          {entry.user.displayName}
                          {entry.isCurrentUser && <Text style={styles.youLabel}> (Tú)</Text>}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreNumber}>{entry.value}</Text>
                      <Text style={styles.scoreLabel}>esta semana</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showAddFriend}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar amigos</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#999" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por username..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B4513" />
                  <Text style={styles.loadingText}>Buscando...</Text>
                </View>
              )}

              {!isSearching && searchQuery.length > 0 && searchResults.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsEmoji}>🔍</Text>
                  <Text style={styles.noResultsText}>No se encontraron usuarios</Text>
                </View>
              )}

              {!isSearching && searchResults.length > 0 && (
                <View style={styles.resultsList}>
                  {searchResults.map((searchUser) => (
                    <View key={searchUser.id} style={styles.resultCard}>
                      <View style={styles.userRow}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {searchUser.displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.displayName}>{searchUser.displayName}</Text>
                          <Text style={styles.username}>@{searchUser.username}</Text>
                        </View>
                      </View>
                      {getStatusButton(searchUser)}
                    </View>
                  ))}
                </View>
              )}

              {!isSearching && searchQuery.length === 0 && (
                <View style={styles.searchHint}>
                  <Text style={styles.searchHintEmoji}>👆</Text>
                  <Text style={styles.searchHintText}>
                    Escribe un username para buscar
                  </Text>
                </View>
              )}
            </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#8B4513',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#1A1A1A',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  friendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGold: {
    backgroundColor: '#F59E0B',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  username: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  youLabel: {
    color: '#999',
    fontWeight: '400',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#16A34A',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendStats: {
    alignItems: 'flex-end',
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  weekLabel: {
    fontSize: 12,
    color: '#999',
  },
  todayCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderboardCardYou: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#E0D5C9',
  },
  leaderboardCardTop: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999',
  },
  rankTextTop: {
    fontSize: 20,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B4513',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  resultsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
  },
  resultsList: {
    gap: 12,
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  statusBadgeTextSuccess: {
    color: '#16A34A',
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addUserButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchHint: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  searchHintEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  searchHintText: {
    fontSize: 14,
    color: '#999',
  },
});
