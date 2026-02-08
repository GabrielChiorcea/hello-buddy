/**
 * Hook pentru query pointsRewards
 */

import { useQuery } from '@apollo/client';
import { GET_POINTS_REWARDS } from '../queries';
import type { PointsReward } from '../types';

export function usePointsRewards() {
  const { data, loading, error } = useQuery<{ pointsRewards: PointsReward[] }>(
    GET_POINTS_REWARDS
  );
  return {
    pointsRewards: data?.pointsRewards ?? [],
    loading,
    error,
  };
}
