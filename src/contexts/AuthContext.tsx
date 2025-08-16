import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserService } from '@/services/userService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 确保用户记录存在的函数（异步但不阻塞）
  const ensureUserRecord = async (user: User) => {
    try {
      // 尝试获取用户记录
      const existingUser = await UserService.getUser(user.id);
      
      if (!existingUser) {
        // 如果用户记录不存在，创建一个
        console.log('Creating user record for:', user.email);
        await UserService.createUser(user.id, user.email || '');
        console.log('User record created successfully');
      } else {
        console.log('User record already exists');
      }
    } catch (error) {
      console.error('Error ensuring user record:', error);
      // 如果创建失败，记录错误但不阻止登录
    }
  };

  useEffect(() => {
    let mounted = true;

    // 获取初始会话
    const getSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          console.log('Initial session loaded, loading set to false');
          
          // 如果有用户，异步确保用户记录存在（不阻塞UI）
          if (session?.user) {
            console.log('Initial session has user, ensuring user record exists');
            // 不等待这个操作完成
            ensureUserRecord(session.user).catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 设置超时，防止无限加载
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout, forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 减少到5秒超时

    getSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('Auth state change processed, loading set to false');
        
        // 当用户登录时，异步确保用户记录存在
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, ensuring user record exists');
          // 不等待这个操作完成
          ensureUserRecord(session.user).catch(console.error);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
