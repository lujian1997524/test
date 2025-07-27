'use client';

import React from 'react';

export default function SimpleTest() {
  console.log('🧪 简单测试页面正在渲染...');
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>
          🎉 Electron 应用测试成功！
        </h1>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          如果您看到这个页面，说明：<br/>
          ✅ Next.js 静态导出正常<br/>
          ✅ Electron 文件加载正常<br/>
          ✅ React 组件渲染正常
        </p>
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#2d5a2d'
        }}>
          当前时间: {new Date().toLocaleString('zh-CN')}
        </div>
        <button 
          onClick={() => {
            alert('按钮点击成功！JavaScript 事件正常工作。');
            console.log('🎯 按钮点击测试成功');
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          测试按钮点击
        </button>
      </div>
    </div>
  );
}