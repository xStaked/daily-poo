import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PoopLog, Stats } from '../types';

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
        setLogs(data.logs || []);
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

  const logPoop = async (notes?: string) => {
    if (!user) return false;
    try {
      const res = await fetch('http://localhost:3001/api/poops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, notes }),
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

  useEffect(() => {
    if (user) {
      fetchLogs();
      fetchStats();
    }
  }, [user, fetchLogs, fetchStats]);

  return { logs, stats, isLoading, logPoop, refresh: fetchLogs };
}
