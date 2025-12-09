import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN.js';

// 全局处理 ResizeObserver 错误
const handleResizeObserverError = (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
    return false;
  }
  // 处理包含这些关键词的消息
  if (e.message && typeof e.message === 'string' && 
      (e.message.includes('ResizeObserver loop completed with undelivered notifications') || 
       e.message.includes('ResizeObserver loop limit exceeded'))) {
    e.stopImmediatePropagation();
    return false;
  }
};

if (typeof window !== 'undefined') {
  // 捕获 ResizeObserver 错误并阻止它们冒泡到全局错误处理器
  window.addEventListener('error', handleResizeObserverError);

  // 捕获 ResizeObserver 错误的另一种形式（在某些浏览器中）
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && typeof e.reason === 'string' && 
        (e.reason.includes('ResizeObserver loop completed with undelivered notifications') || 
         e.reason.includes('ResizeObserver loop limit exceeded'))) {
      e.stopImmediatePropagation();
      return false;
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ConfigProvider componentSize='middle' locale={zhCN}>
            <App />
        </ConfigProvider>
    </BrowserRouter>
);