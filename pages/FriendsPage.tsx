import apiClient from '@/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

interface FriendLog {
  id: string;
  timestamp: string;
  notes?: string;
  locationName?: string;
  photoUrl?: string;
  rating?: number;
  durationMinutes?: number;
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
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendLogs, setFriendLogs] = useState<FriendLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [friendsRes, requestsRes, leaderboardRes] = await Promise.all([
        apiClient.get('/friends'),
        apiClient.get('/friends/requests/pending'),
        apiClient.get('/leaderboard'),
      ]);

      console.log('Friends response:', friendsRes.data);
      console.log('Requests response:', requestsRes.data);
      console.log('Leaderboard response:', leaderboardRes.data);

      setFriends((friendsRes.data.friends || []).filter((f: Friend) => f.status === 'accepted'));
      setPendingRequests(requestsRes.data.requests || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load data when user is available
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Individual fetch functions for refreshing after actions
  const refreshData = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

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
      refreshData();
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
      refreshData();
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  };

  const closeModal = () => {
    setShowAddFriend(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openFriendLogs = async (friend: Friend) => {
    setSelectedFriend(friend);
    setIsLoadingLogs(true);
    setFriendLogs([]);

    try {
      const { data } = await apiClient.get(`/friends/${friend.user.id}/poops`);
      // Mapear de snake_case a camelCase
      const logs = (data.logs || data.poops || []).map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        notes: log.notes,
        locationName: log.location_name || log.locationName,
        photoUrl: log.photo_url || log.photoUrl,
        rating: log.rating,
        durationMinutes: log.duration_minutes || log.durationMinutes,
      }));
      setFriendLogs(logs);
    } catch (err) {
      console.error('Failed to fetch friend logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const closeFriendLogs = () => {
    setSelectedFriend(null);
    setFriendLogs([]);
  };

  const getRatingEmoji = (rating: number) => {
    const emojis = ['😫', '😕', '😐', '😊', '🤩'];
    return emojis[rating - 1] || '😐';
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

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingStateText}>Cargando...</Text>
          </View>
        )}

        {/* Pending Requests */}
        {!isLoading && pendingRequests.length > 0 && activeTab === 'friends' && (
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
        {!isLoading && activeTab === 'friends' && (
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
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendCard}
                    onPress={() => openFriendLogs(friend)}
                    activeOpacity={0.7}
                  >
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
                    <MaterialIcons name="chevron-right" size={20} color="#CCC" style={styles.chevron} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Leaderboard */}
        {!isLoading && activeTab === 'leaderboard' && (
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
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
                placeholder="Buscar por usuario..."
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
                    Escribe un usuario para buscar
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Friend Logs Modal */}
      <Modal
        visible={selectedFriend !== null}
        transparent
        animationType="slide"
        onRequestClose={closeFriendLogs}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeFriendLogs}
          />
          <View style={[styles.friendLogsModal, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            {selectedFriend && (
              <>
                {/* Friend Header */}
                <View style={styles.friendLogsHeader}>
                  <View style={styles.friendLogsUserRow}>
                    <View style={styles.friendLogsAvatar}>
                      <Text style={styles.friendLogsAvatarText}>
                        {selectedFriend.user.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.friendLogsName}>{selectedFriend.user.displayName}</Text>
                      <Text style={styles.friendLogsUsername}>@{selectedFriend.user.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={closeFriendLogs} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={20} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* Stats Summary */}
                <View style={styles.friendStatsSummary}>
                  <View style={styles.friendStatItem}>
                    <Text style={styles.friendStatNumber}>{selectedFriend.todayCount || 0}</Text>
                    <Text style={styles.friendStatLabel}>hoy</Text>
                  </View>
                  <View style={styles.friendStatDivider} />
                  <View style={styles.friendStatItem}>
                    <Text style={styles.friendStatNumber}>{selectedFriend.weekCount || 0}</Text>
                    <Text style={styles.friendStatLabel}>semana</Text>
                  </View>
                  <View style={styles.friendStatDivider} />
                  <View style={styles.friendStatItem}>
                    <Text style={styles.friendStatNumber}>{friendLogs.length}</Text>
                    <Text style={styles.friendStatLabel}>total</Text>
                  </View>
                </View>

                {/* Logs List */}
                <ScrollView style={styles.friendLogsList} showsVerticalScrollIndicator={false}>
                  {isLoadingLogs ? (
                    <View style={styles.logsLoadingContainer}>
                      <ActivityIndicator size="large" color="#8B4513" />
                      <Text style={styles.logsLoadingText}>Cargando historial...</Text>
                    </View>
                  ) : friendLogs.length === 0 ? (
                    <View style={styles.noLogsContainer}>
                      <Text style={styles.noLogsEmoji}>🚽</Text>
                      <Text style={styles.noLogsText}>Sin registros aún</Text>
                    </View>
                  ) : (
                    <View style={styles.logsList}>
                      {friendLogs.map((log) => (
                        <View key={log.id} style={styles.logCard}>
                          <View style={styles.logCardHeader}>
                            <Text style={styles.logCardTime}>
                              {format(new Date(log.timestamp), 'dd/MM • HH:mm')}
                            </Text>
                            {log.rating && (
                              <Text style={styles.logCardRating}>{getRatingEmoji(log.rating)}</Text>
                            )}
                          </View>

                          {log.notes && (
                            <Text style={styles.logCardNotes}>"{log.notes}"</Text>
                          )}

                          <View style={styles.logCardMeta}>
                            {log.locationName && (
                              <View style={styles.logCardMetaItem}>
                                <MaterialIcons name="location-on" size={14} color="#999" />
                                <Text style={styles.logCardMetaText} numberOfLines={1}>
                                  {log.locationName}
                                </Text>
                              </View>
                            )}
                            {log.durationMinutes && (
                              <View style={styles.logCardMetaItem}>
                                <MaterialIcons name="timer" size={14} color="#999" />
                                <Text style={styles.logCardMetaText}>{log.durationMinutes}m</Text>
                              </View>
                            )}
                          </View>

                          {log.photoUrl && (
                            <Image source={{ uri: log.photoUrl }} style={styles.logCardPhoto} />
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
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
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  loadingStateText: {
    fontSize: 15,
    color: '#999',
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
  chevron: {
    marginLeft: 8,
  },
  friendLogsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  friendLogsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  friendLogsUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendLogsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendLogsAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  friendLogsName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  friendLogsUsername: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  friendStatsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  friendStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  friendStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  friendStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  friendStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  friendLogsList: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  logsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  logsLoadingText: {
    fontSize: 14,
    color: '#999',
  },
  noLogsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noLogsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noLogsText: {
    fontSize: 16,
    color: '#999',
  },
  logsList: {
    gap: 12,
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logCardTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  logCardRating: {
    fontSize: 24,
  },
  logCardNotes: {
    fontSize: 15,
    color: '#1A1A1A',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 22,
  },
  logCardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  logCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logCardMetaText: {
    fontSize: 13,
    color: '#999',
    maxWidth: 150,
  },
  logCardPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
});
