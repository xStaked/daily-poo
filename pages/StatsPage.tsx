import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoops } from '../hooks/usePoops';

export default function StatsPage() {
  const { stats } = usePoops();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Your poop tracking insights</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="today" size={24} color="#8B4513" />
            <Text style={styles.statValue}>{stats?.today || 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="date-range" size={24} color="#8B4513" />
            <Text style={styles.statValue}>{stats?.week || 0}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="calendar-month" size={24} color="#8B4513" />
            <Text style={styles.statValue}>{stats?.month || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="all-inclusive" size={24} color="#8B4513" />
            <Text style={styles.statValue}>{stats?.allTime || 0}</Text>
            <Text style={styles.statLabel}>All Time</Text>
          </View>
        </View>

        {/* Streaks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Streaks</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <MaterialIcons name="local-fire-department" size={24} color="#F97316" />
              <View style={styles.streakInfo}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>{stats?.currentStreak || 0} days</Text>
              </View>
            </View>
            <View style={styles.streakItem}>
              <MaterialIcons name="emoji-events" size={24} color="#EAB308" />
              <View style={styles.streakInfo}>
                <Text style={styles.streakLabel}>Best Streak</Text>
                <Text style={styles.streakValue}>{stats?.longestStreak || 0} days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Average */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Average</Text>
          <View style={styles.averageContainer}>
            <Text style={styles.averageValue}>
              {stats?.avgPerDay?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.averageLabel}>per day</Text>
          </View>
        </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6B4423',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A67C52',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    fontSize: 32,
    fontWeight: '800',
    color: '#8B4513',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#A67C52',
    fontWeight: '500',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 16,
  },
  streakRow: {
    gap: 16,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    color: '#A67C52',
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B4423',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#8B4513',
    marginBottom: 8,
  },
  averageLabel: {
    fontSize: 16,
    color: '#A67C52',
    fontWeight: '500',
  },
});

