import React from 'react';
import { BoosBetSlip as BrandBoosBetSlip, BoosBetSlipProps } from './brand/BoosBetSlip';

export const BoosBetSlip: React.FC<BoosBetSlipProps> = (props) => {
  return <BrandBoosBetSlip {...props} />;
};

export type { BoosBetSlipProps } from './brand/BoosBetSlip';
export default BoosBetSlip;
