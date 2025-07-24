'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// 定义用户类型
export interface User {
  id: number;
  name: string;
  role: 'admin' | 'operator';
}

// 定义认证上下文类型
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: 'admin' | 'operator') => boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 登出函数
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // 调用后端登出接口
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(console.error);
    }
  }, [token]);

  // 验证token有效性
  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
        },
      });

      if (!response.ok) {
        console.warn('Token验证失败，自动登出');
        logout();
      }
    } catch (error) {
      console.error('Token验证错误:', error);
      logout();
    }
  };

  // 从localStorage获取token
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // 验证token有效性
        validateToken(storedToken);
      } catch (error) {
        console.error('解析存储的用户信息失败:', error);
        logout();
      }
    }
    
    setIsLoading(false);
  }, [logout]);

  // 登录函数
  const login = async (username: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        
        // 存储到localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        return true;
      } else {
        throw new Error(data.error || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 检查用户角色
  const hasRole = (role: 'admin' | 'operator'): boolean => {
    if (!user) return false;
    if (role === 'operator') {
      return user.role === 'admin' || user.role === 'operator';
    }
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};