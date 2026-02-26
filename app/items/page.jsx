'use client';

import { Suspense } from 'react';
import ItemsPage from '../../src/pages/ItemsPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-slate-500">Loading...</div>}>
      <ItemsPage />
    </Suspense>
  );
}
