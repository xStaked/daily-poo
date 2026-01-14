import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isToday } from 'date-fns';
import React, { useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePoops } from '../hooks/usePoops';

export default function HomePage() {
  const { user } = useAuth();
  const { stats, logPoop, logs } = usePoops();
  const insets = useSafeAreaInsets();
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleLog = async () => {
    setIsLogging(true);
    const success = await logPoop();
    setIsLogging(false);

    if (success) {
      setShowSuccess(true);
      // Animación de bounce
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setShowSuccess(false);
        scaleAnim.setValue(1);
      }, 2000);
    }
  };

  const todayLogs = (logs || []).filter((log) => isToday(new Date(log.timestamp)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Hey, {user?.displayName || 'Pooper'}! 👋
          </Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Main Log Button */}
        <View style={styles.logButtonContainer}>
          <TouchableOpacity
            onPress={handleLog}
            disabled={isLogging}
            style={[
              styles.logButton,
              showSuccess && styles.logButtonSuccess,
              isLogging && styles.logButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.logButtonContent,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              {showSuccess ? (
                <View style={styles.successContent}>
                  <Text style={styles.successEmoji}>💩</Text>
                  <Text style={styles.successText}>Nice!</Text>
                </View>
              ) : (
                <View style={styles.logButtonInner}>
                  <MaterialIcons name="add" size={64} color="#FFFFFF" />
                  <Text style={styles.logButtonText}>Log Poop</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Today's Count */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today&apos;s Count</Text>
          <View style={styles.countContainer}>
            <Text style={styles.countNumber}>{stats?.today || 0}</Text>
            <Text style={styles.countEmoji}>💩</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="local-fire-department" size={20} color="#F97316" />
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <Text style={styles.statValue}>
              {stats?.currentStreak || 0}
              <Text style={styles.statUnit}> days</Text>
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <MaterialIcons name="emoji-events" size={20} color="#EAB308" />
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <Text style={styles.statValue}>
              {stats?.longestStreak || 0}
              <Text style={styles.statUnit}> days</Text>
            </Text>
          </View>
        </View>

        {/* Today's Timeline */}
        {todayLogs.length > 0 && (
          <View style={styles.card}>
            <View style={styles.timelineHeader}>
              <MaterialIcons name="auto-awesome" size={20} color="#A67C52" />
              <Text style={styles.timelineTitle}>Today&apos;s Timeline</Text>
            </View>
            <View style={styles.timelineList}>
              {todayLogs.map((log, index) => (
                <View
                  key={log.id}
                  style={[
                    styles.timelineItem,
                    index < todayLogs.length - 1 && styles.timelineItemBorder,
                  ]}
                >
                  <Text style={styles.timelineEmoji}>💩</Text>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Poop #{index + 1}</Text>
                    <Text style={styles.timelineTime}>
                      {format(new Date(log.timestamp), 'h:mm a')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Encouragement */}
        {stats?.currentStreak && stats.currentStreak >= 3 && (
          <View style={styles.encouragementCard}>
            <View style={styles.encouragementContent}>
              <Text style={styles.encouragementEmoji}>🔥</Text>
              <View style={styles.encouragementText}>
                <Text style={styles.encouragementTitle}>You&apos;re on fire!</Text>
                <Text style={styles.encouragementSubtitle}>
                  {stats.currentStreak} day streak! Keep it up! 💪
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B4423',
  },
  date: {
    fontSize: 14,
    color: '#A67C52',
    marginTop: 4,
  },
  logButtonContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logButtonSuccess: {
    backgroundColor: '#8B4513',
  },
  logButtonDisabled: {
    opacity: 0.7,
  },
  logButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 64,
  },
  successText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67C52',
    marginBottom: 8,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#8B4513',
  },
  countEmoji: {
    fontSize: 36,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6B4423',
  },
  statUnit: {
    fontSize: 18,
    fontWeight: '400',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4513',
  },
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#FFF8F0',
  },
  timelineEmoji: {
    fontSize: 24,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  timelineTime: {
    fontSize: 14,
    color: '#A67C52',
    marginTop: 2,
  },
  encouragementCard: {
    marginTop: 24,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  encouragementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  encouragementEmoji: {
    fontSize: 32,
  },
  encouragementText: {
    flex: 1,
  },
  encouragementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C2410C',
  },
  encouragementSubtitle: {
    fontSize: 14,
    color: '#EA580C',
    marginTop: 4,
  },
});

