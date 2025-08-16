import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/lib/supabase';

export class UserService {
  // 创建用户记录
  static async createUser(userId: string, email: string): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: email
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`创建用户记录失败: ${error.message}`);
    }

    return data;
  }

  // 获取用户信息
  static async getUser(userId: string): Promise<AuthUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`获取用户信息失败: ${error.message}`);
    }

    return data;
  }

  // 更新用户信息
  static async updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新用户信息失败: ${error.message}`);
    }

    return data;
  }

  // 删除用户（及其所有数据）
  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`删除用户失败: ${error.message}`);
    }
  }
}
