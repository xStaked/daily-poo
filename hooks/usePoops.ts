import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreatePoopData, PoopLog, Stats } from '../types';

export function usePoops() {
  const { user } = useAuth();
  const [logs, setLogs] = useState < PoopLog[] > ([]);
  const [stats, setStats] = useState < Stats | null > (null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/poops?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        // Mapear los datos del backend (snake_case) a camelCase
        const mappedLogs: PoopLog[] = (data.logs || []).map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          timestamp: log.timestamp,
          notes: log.notes || undefined,
          latitude: log.latitude ? parseFloat(log.latitude) : undefined,
          longitude: log.longitude ? parseFloat(log.longitude) : undefined,
          locationName: log.location_name || undefined,
          photoUrl: log.photo_url || undefined,
          rating: log.rating || undefined,
          durationMinutes: log.duration_minutes || undefined,
        }));
        setLogs(mappedLogs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:3001/api/stats?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [user]);

  const logPoop = async (data: CreatePoopData) => {
    if (!user) return false;
    try {
      const res = await fetch('http://localhost:3001/api/poops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notes: data.notes,
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.locationName,
          photoUrl: data.photoUrl,
          rating: data.rating,
          durationMinutes: data.durationMinutes,
        }),
      });

      if (res.ok) {
        await fetchLogs();
        await fetchStats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to log:', err);
      return false;
    }
  };

  const deletePoop = async (poopId: string) => {
    if (!user) return false;
    try {
      const res = await fetch(`http://localhost:3001/api/poops/${poopId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchLogs();
        await fetchStats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete:', err);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchStats();
    }
  }, [user, fetchLogs, fetchStats]);

  return { logs, stats, isLoading, logPoop, refresh: fetchLogs, deletePoop };
}
