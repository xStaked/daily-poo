import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useState } from 'react';
import {
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
import { Friend, LeaderboardEntry } from '../types';

export default function FriendsPage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard'>('friends');

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`api/friends?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFriends((data.friends || []).filter((f: Friend) => f.status === 'accepted'));
        setPendingRequests((data.friends || []).filter((f: Friend) => f.status === 'pending'));
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`api/leaderboard?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchLeaderboard();
    }
  }, [user, fetchFriends, fetchLeaderboard]);

  const sendFriendRequest = async () => {
    if (!user || !searchQuery.trim()) return;
    try {
      const res = await fetch('api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendUsername: searchQuery }),
      });
      if (res.ok) {
        setSearchQuery('');
        setShowAddFriend(false);
        fetchFriends();
      }
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const respondToRequest = async (friendId: string, accept: boolean) => {
    if (!user) return;
    try {
      const res = await fetch('api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: friendId, accept }),
      });
      if (res.ok) {
        fetchFriends();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
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
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="people" size={24} color="#8B4513" />
            </View>
            <View>
              <Text style={styles.title}>Friends</Text>
              <Text style={styles.subtitle}>Compare & compete</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddFriend(true)}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="people"
              size={16}
              color={activeTab === 'friends' ? '#8B4513' : '#A67C52'}
            />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('leaderboard')}
            style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="emoji-events"
              size={16}
              color={activeTab === 'leaderboard' ? '#8B4513' : '#A67C52'}
            />
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && activeTab === 'friends' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <View style={styles.requestsList}>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.emoji}>💩</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{request.user.displayName}</Text>
                      <Text style={styles.username}>@{request.user.username}</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => respondToRequest(request.id, true)}
                      style={styles.acceptButton}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="check" size={20} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => respondToRequest(request.id, false)}
                      style={styles.rejectButton}
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
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={styles.emptyTitle}>No friends yet!</Text>
                <Text style={styles.emptySubtitle}>Add friends to compare stats</Text>
              </View>
            ) : (
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <View key={friend.id} style={styles.card}>
                    <View style={styles.cardContent}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.emoji}>💩</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{friend.user.displayName}</Text>
                        <Text style={styles.username}>@{friend.user.username}</Text>
                      </View>
                    </View>
                    <View style={styles.stats}>
                      <View style={styles.streakContainer}>
                        <MaterialIcons name="local-fire-department" size={16} color="#F97316" />
                        <Text style={styles.streakText}>{friend.streakCount}</Text>
                      </View>
                      <Text style={styles.todayText}>{friend.todayCount} today</Text>
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
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={styles.emptyTitle}>No leaderboard yet!</Text>
                <Text style={styles.emptySubtitle}>Add friends to see rankings</Text>
              </View>
            ) : (
              <View style={styles.leaderboardList}>
                {leaderboard.map((entry) => (
                  <View
                    key={entry.user.id}
                    style={[
                      styles.card,
                      entry.isCurrentUser && styles.currentUserCard,
                    ]}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.rankText}>{getRankEmoji(entry.rank)}</Text>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.emoji}>💩</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {entry.user.displayName}
                          {entry.isCurrentUser && (
                            <Text style={styles.youLabel}> (You)</Text>
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.leaderboardStats}>
                      <Text style={styles.valueText}>{entry.value}</Text>
                      <Text style={styles.periodText}>this week</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriend}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFriend(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddFriend(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity
                onPress={() => setShowAddFriend(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={20}
                color="#A67C52"
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Enter username..."
                placeholderTextColor="#D4A574"
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              onPress={sendFriendRequest}
              disabled={!searchQuery.trim()}
              style={[styles.sendButton, !searchQuery.trim() && styles.sendButtonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>Send Friend Request</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F5E6D3',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B4423',
  },
  subtitle: {
    fontSize: 14,
    color: '#A67C52',
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#8B4513',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67C52',
  },
  tabTextActive: {
    color: '#8B4513',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserCard: {
    backgroundColor: '#FFF8F0',
    borderColor: '#D4A574',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F5E6D3',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatar: {
    width: 56,
    height: 56,
    backgroundColor: '#E8D5C4',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B4423',
  },
  username: {
    fontSize: 14,
    color: '#A67C52',
    marginTop: 2,
  },
  youLabel: {
    color: '#A67C52',
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    alignItems: 'flex-end',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
  },
  todayText: {
    fontSize: 14,
    color: '#A67C52',
    marginTop: 4,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 40,
    color: '#8B4513',
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B4513',
  },
  periodText: {
    fontSize: 12,
    color: '#A67C52',
    marginTop: 2,
  },
  requestsList: {
    gap: 12,
  },
  friendsList: {
    gap: 12,
  },
  leaderboardList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A67C52',
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
    padding: 24,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B4423',
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5E6D3',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B4423',
  },
  sendButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

