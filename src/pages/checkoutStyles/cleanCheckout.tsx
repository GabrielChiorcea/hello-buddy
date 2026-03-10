import React from 'react';
import type { CheckoutDisplayData } from './shared';
import { CheckoutTemplate } from './shared';
export const CleanCheckout: React.FC<{ data: CheckoutDisplayData }> = ({ data }) => <CheckoutTemplate data={data} variant="clean" />;
