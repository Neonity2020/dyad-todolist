import { supabase } from '@/lib/supabase';
import { UserService } from '@/services/userService';

// 调试认证状态的工具函数
export const debugAuth = async () => {
  console.log('=== 调试认证状态 ===');
  
  try {
    // 1. 检查当前会话
    const { data: { session } } = await supabase.auth.getSession();
    console.log('当前会话:', session ? '存在' : '不存在');
    
    if (session?.user) {
      console.log('用户信息:', {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      });
      
      // 2. 检查用户记录是否存在
      try {
        const userRecord = await UserService.getUser(session.user.id);
        console.log('用户记录:', userRecord ? '存在' : '不存在');
        
        if (userRecord) {
          console.log('用户记录详情:', userRecord);
        } else {
          console.log('用户记录不存在，尝试创建...');
          const newUser = await UserService.createUser(session.user.id, session.user.email || '');
          console.log('用户记录创建成功:', newUser);
        }
      } catch (error) {
        console.error('检查用户记录时出错:', error);
      }
      
      // 3. 检查数据库连接
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id);
        
        if (error) {
          console.error('数据库查询错误:', error);
        } else {
          console.log('数据库中的用户记录:', data);
        }
      } catch (error) {
        console.error('数据库连接测试失败:', error);
      }
    } else {
      console.log('没有活跃的用户会话');
    }
    
    // 4. 检查所有用户记录
    try {
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('获取所有用户记录时出错:', error);
      } else {
        console.log('数据库中的所有用户记录:', allUsers);
      }
    } catch (error) {
      console.error('获取所有用户记录失败:', error);
    }
    
  } catch (error) {
    console.error('调试过程中出错:', error);
  }
  
  console.log('=== 调试完成 ===');
};

// 手动创建用户记录
export const createUserRecord = async (userId: string, email: string) => {
  try {
    console.log('手动创建用户记录:', { userId, email });
    const user = await UserService.createUser(userId, email);
    console.log('用户记录创建成功:', user);
    return user;
  } catch (error) {
    console.error('创建用户记录失败:', error);
    throw error;
  }
};

// 检查数据库表结构
export const checkDatabaseStructure = async () => {
  console.log('=== 检查数据库表结构 ===');
  
  try {
    // 检查 users 表
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('users 表查询错误:', usersError);
    } else {
      console.log('users 表结构正常');
    }
    
    // 检查 todos 表
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .limit(1);
    
    if (todosError) {
      console.error('todos 表查询错误:', todosError);
    } else {
      console.log('todos 表结构正常');
    }
    
    // 检查 subtasks 表
    const { data: subtasks, error: subtasksError } = await supabase
      .from('subtasks')
      .select('*')
      .limit(1);
    
    if (subtasksError) {
      console.error('subtasks 表查询错误:', subtasksError);
    } else {
      console.log('subtasks 表结构正常');
    }
    
  } catch (error) {
    console.error('检查数据库结构时出错:', error);
  }
  
  console.log('=== 数据库结构检查完成 ===');
};
