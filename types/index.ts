export interface User {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    createdAt: string;
  }
  
  export interface PoopLog {
    id: string;
    userId: string;
    timestamp: string;
    notes?: string;
  }
  
  export interface Friend {
    id: string;
    user: User;
    status: 'pending' | 'accepted';
    streakCount: number;
    todayCount: number;
    weekCount: number;
  }
  
  export interface Stats {
    today: number;
    week: number;
    month: number;
    allTime: number;
    currentStreak: number;
    longestStreak: number;
    avgPerDay: number;
    dailyData: DailyData[];
  }
  
  export interface DailyData {
    date: string;
    count: number;
  }
  
  export interface LeaderboardEntry {
    rank: number;
    user: User;
    value: number;
    isCurrentUser?: boolean;
  }
  