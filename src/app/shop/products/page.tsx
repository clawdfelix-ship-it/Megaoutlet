export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ProductsContent from './ProductsContent';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入中...</div>}>
      <ProductsContent />
    </Suspense>
  );
}