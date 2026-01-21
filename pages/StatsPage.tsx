import { format, subDays } from 'date-fns';
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
  const { stats, logs } = usePoops();
  const insets = useSafeAreaInsets();

  // Calcular datos de los últimos 7 días
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLogs = (logs || []).filter(log =>
        format(new Date(log.timestamp), 'yyyy-MM-dd') === dateStr
      );
      days.push({
        day: format(date, 'EEE').charAt(0),
        count: dayLogs.length,
        isToday: i === 0,
      });
    }
    return days;
  };

  const weekData = getLast7DaysData();
  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
        </View>

        {/* Hero - Average per day */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroNumber}>
              {stats?.avgPerDay?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.heroLabel}>promedio diario</Text>
          </View>
          <View style={styles.heroEmoji}>
            <Text style={styles.heroEmojiText}>📊</Text>
          </View>
        </View>

        {/* Week Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Últimos 7 días</Text>
          <View style={styles.chartContainer}>
            {weekData.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: day.count > 0 ? `${(day.count / maxCount) * 100}%` : 4,
                        backgroundColor: day.isToday ? '#8B4513' : '#E0D5C9',
                      }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.barLabel,
                  day.isToday && styles.barLabelToday
                ]}>{day.day}</Text>
                {day.count > 0 && (
                  <Text style={[
                    styles.barCount,
                    day.isToday && styles.barCountToday
                  ]}>{day.count}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Today */}
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <Text style={styles.bentoEmoji}>💩</Text>
            <Text style={styles.bentoNumber}>{stats?.today || 0}</Text>
            <Text style={styles.bentoLabel}>hoy</Text>
          </View>

          {/* Week */}
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <Text style={styles.bentoEmoji}>📅</Text>
            <Text style={styles.bentoNumber}>{stats?.week || 0}</Text>
            <Text style={styles.bentoLabel}>semana</Text>
          </View>

          {/* Month */}
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <Text style={styles.bentoEmoji}>🗓️</Text>
            <Text style={styles.bentoNumber}>{stats?.month || 0}</Text>
            <Text style={styles.bentoLabel}>mes</Text>
          </View>

          {/* All time */}
          <View style={[styles.bentoCard, styles.bentoSmall]}>
            <Text style={styles.bentoEmoji}>🏛️</Text>
            <Text style={styles.bentoNumber}>{stats?.allTime || 0}</Text>
            <Text style={styles.bentoLabel}>total</Text>
          </View>
        </View>

        {/* Streaks */}
        <View style={styles.streaksCard}>
          <View style={styles.streakItem}>
            <View style={styles.streakIconContainer}>
              <Text style={styles.streakIcon}>🔥</Text>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{stats?.currentStreak || 0}</Text>
              <Text style={styles.streakLabel}>racha actual</Text>
            </View>
          </View>

          <View style={styles.streakDivider} />

          <View style={styles.streakItem}>
            <View style={[styles.streakIconContainer, styles.trophyBg]}>
              <Text style={styles.streakIcon}>🏆</Text>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{stats?.longestStreak || 0}</Text>
              <Text style={styles.streakLabel}>mejor racha</Text>
            </View>
          </View>
        </View>

        {/* Fun Fact */}
        {stats?.allTime && stats.allTime > 0 && (
          <View style={styles.funFactCard}>
            <Text style={styles.funFactEmoji}>🧻</Text>
            <Text style={styles.funFactText}>
              Has usado aproximadamente {Math.round((stats.allTime || 0) * 57)} hojas de papel
            </Text>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 60,
  },
  heroLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  heroEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmojiText: {
    fontSize: 32,
  },
  chartCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 24,
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  barLabelToday: {
    color: '#8B4513',
    fontWeight: '700',
  },
  barCount: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginTop: 2,
  },
  barCountToday: {
    color: '#8B4513',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoSmall: {
    width: '47%',
    flexGrow: 1,
  },
  bentoEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  bentoNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bentoLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },
  streaksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBg: {
    backgroundColor: '#FFF8E1',
  },
  streakIcon: {
    fontSize: 24,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  streakLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  streakDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  funFactCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  funFactEmoji: {
    fontSize: 32,
  },
  funFactText: {
    flex: 1,
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '500',
    lineHeight: 20,
  },
});
