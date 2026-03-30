import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { routes } from '@/config/routes';
import { prefetchHomeCatalogData } from '@/pages/homeStyles/shared';
import { StoreEntryScreen } from '@/components/StoreEntryScreen';

const Welcome = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    prefetchHomeCatalogData(dispatch, 'welcome');
  }, [dispatch]);

  return <StoreEntryScreen presentation="fullPage" onEnter={() => navigate(routes.home)} />;
};

export default Welcome;
