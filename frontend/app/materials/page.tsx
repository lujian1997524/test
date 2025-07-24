'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MaterialsPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到首页，因为板材管理现在就是首页
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-text-secondary">正在跳转到主界面...</p>
      </div>
    </div>
  );
}