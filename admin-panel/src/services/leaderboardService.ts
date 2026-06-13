import api from './api';

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export const getLeaderboard = async (limit: number = 50) => {
  const response = await api.get<LeaderboardEntry[]>(`/leaderboard/?limit=${limit}`);
  return response.data;
};

