/**
 * Afișează modalul „Ai câștigat X puncte” la prima autentificare (după signup sau login).
 * Se montează în App și verifică user.welcomeBonusSeen / user.welcomeBonusAmount din Redux.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentUser } from '@/store/slices/userSlice';
import { markWelcomeBonusSeenApi } from '@/api/api';
import { WelcomeBonusModal } from '@/components/WelcomeBonusModal';
import { routes } from '@/config/routes';

export const WelcomeBonusGate: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [shown, setShown] = useState(false);

  const shouldShow =
    !isLoading &&
    isAuthenticated &&
    user &&
    user.welcomeBonusSeen !== true &&
    (user.welcomeBonusAmount ?? 0) > 0;

  useEffect(() => {
    if (shouldShow && !shown) {
      setShown(true);
      setModalOpen(true);
    }
  }, [shouldShow, shown]);

  const handleGoToProducts = async () => {
    const result = await markWelcomeBonusSeenApi();
    if (result.success) {
      await dispatch(fetchCurrentUser());
      navigate(routes.catalog);
    }
    setModalOpen(false);
  };

  if (!shouldShow) return null;

  return (
    <WelcomeBonusModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      pointsAmount={user?.welcomeBonusAmount ?? 0}
      onGoToProducts={handleGoToProducts}
    />
  );
};
