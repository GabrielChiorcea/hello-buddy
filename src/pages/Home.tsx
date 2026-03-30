/**
 * Home — ruta `/`; conținutul vine din `homeStyles/home.tsx` (singură sursă).
 */
import React from 'react';
import { useHomeData } from './homeStyles/shared';
import { HomePage } from './homeStyles/home';

const Home: React.FC = () => {
  const data = useHomeData();
  return <HomePage data={data} />;
};

export default Home;
