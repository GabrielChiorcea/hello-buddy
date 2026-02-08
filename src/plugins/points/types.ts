/**
 * Tipuri pentru plugin-ul de puncte loialitate
 */

export interface PointsReward {
  id: string;
  pointsCost: number;
  discountAmount: number;
  isActive: boolean;
}
