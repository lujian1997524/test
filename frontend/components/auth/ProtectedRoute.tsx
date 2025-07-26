'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loading, Alert } from '@/components/ui';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'operator';
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const { isAuthenticated, user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loading size="lg" text="正在验证身份..." />
      </div>
    );
  }

  // 未认证用户重定向到登录页
  if (!isAuthenticated) {
    return null;
  }

  // 检查角色权限
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
          <Alert
            variant="error"
            className="max-w-md text-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-status-error rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                权限不足
              </h2>
              <p className="text-text-secondary mb-4">
                您没有访问此页面的权限
              </p>
              <p className="text-sm text-text-secondary">
                当前角色: {user?.role === 'admin' ? '管理员' : '操作员'}
                <br />
                需要角色: {requiredRole === 'admin' ? '管理员' : '操作员'}
              </p>
            </div>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
};

// 仅管理员可访问的路由保护
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

// 操作员及以上可访问的路由保护
export const OperatorRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="operator">
      {children}
    </ProtectedRoute>
  );
};