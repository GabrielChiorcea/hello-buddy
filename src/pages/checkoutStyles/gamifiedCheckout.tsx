import React from 'react';
import type { CheckoutDisplayData } from './shared';
import { CheckoutTemplate } from './shared';
export const GamifiedCheckout: React.FC<{ data: CheckoutDisplayData }> = ({ data }) => <CheckoutTemplate data={data} variant="gamified" />;
