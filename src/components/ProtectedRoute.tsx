import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // 设置超时保护，防止无限加载
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute loading timeout, forcing redirect');
        setTimeoutReached(true);
      }
    }, 15000); // 15秒超时

    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleForceRefresh = () => {
    window.location.reload();
  };

  // 如果正在加载认证状态，显示加载中
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
          <p className="mt-2 text-sm text-gray-500 mb-4">如果长时间加载，请尝试刷新页面</p>
          <Button onClick={handleForceRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            强制刷新
          </Button>
        </div>
      </div>
    );
  }

  // 如果超时或用户未登录，重定向到登录页面
  if (timeoutReached || !user) {
    console.log('Redirecting to login:', { timeoutReached, user: !!user });
    return <Navigate to={redirectTo} replace />;
  }

  // 如果用户已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;
