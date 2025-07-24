'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(username.trim());
      
      if (success) {
        router.push('/');
      } else {
        setError('登录失败，请检查用户名是否正确');
      }
    } catch (err) {
      setError('登录过程中发生错误，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginUsers = [
    { name: '高春强', role: '管理员' },
    { name: '杨伟', role: '操作员' }
  ];

  const handleQuickLogin = (name: string) => {
    setUsername(name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ios18-blue to-ios18-purple flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="mb-8">
          <div className="text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-ios18-blue rounded-ios-xl mx-auto mb-6 flex items-center justify-center"
            >
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              激光切割管理系统
            </h1>
            <p className="text-text-secondary">
              请输入您的用户名登录系统
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="用户名"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                error={error}
                disabled={isLoading}
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                }
              />

              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-8">
              <div className="text-center text-sm text-text-secondary mb-4">
                快速登录
              </div>
              <div className="grid grid-cols-1 gap-2">
                {quickLoginUsers.map((user, index) => (
                  <motion.button
                    key={user.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => handleQuickLogin(user.name)}
                    disabled={isLoading}
                    className="flex items-center justify-between p-3 rounded-ios-lg bg-macos15-control hover:bg-opacity-80 transition-all duration-200 disabled:opacity-50"
                  >
                    <span className="font-medium text-text-primary">
                      {user.name}
                    </span>
                    <span className="text-xs text-text-secondary bg-ios18-blue bg-opacity-20 px-2 py-1 rounded-full">
                      {user.role}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-text-secondary">
                激光切割生产管理系统 v1.0
              </p>
              <p className="text-xs text-text-secondary mt-1">
                内部使用系统，请勿外传
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}