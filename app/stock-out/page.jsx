'use client';

import { Suspense } from 'react';
import StockOutPage from '../../src/pages/StockOutPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-slate-500">Loading...</div>}>
      <StockOutPage />
    </Suspense>
  );
}
