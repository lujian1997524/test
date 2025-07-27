'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen }) => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setError('');
    const success = await login(username);
    if (!success) {
      setError('登录失败，请重试');
    }
    // 登录成功后模态框会自动关闭（通过isAuthenticated状态变化）
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          {/* 毛玻璃背景 */}
          <div className="absolute inset-0 backdrop-blur-md" />
          
          {/* 登录卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-md mx-4"
          >
            <div 
              className="rounded-2xl p-8 shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* 标题 */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  激光切割生产管理系统
                </h1>
                <p className="text-gray-600 text-sm">
                  请输入用户名登录系统
                </p>
              </div>

              {/* 登录表单 */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 用户名输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    用户名
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="请输入用户名"
                      className="w-full p-4 rounded-xl border-2 border-gray-200 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 错误信息 */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 登录按钮 */}
                <motion.button
                  type="submit"
                  disabled={!username || isLoading}
                  whileHover={{ scale: username && !isLoading ? 1.02 : 1 }}
                  whileTap={{ scale: username && !isLoading ? 0.98 : 1 }}
                  className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
                    username && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      登录中...
                    </div>
                  ) : (
                    '登录系统'
                  )}
                </motion.button>
              </form>

              {/* 底部信息 */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  激光切割生产管理系统 v1.0
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;