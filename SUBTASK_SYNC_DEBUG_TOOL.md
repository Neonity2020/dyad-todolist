# 子任务同步调试工具

## 问题描述
子任务在本地可以被创建，但无法同步到 Supabase 数据库。

## 调试步骤

### 1. 启动应用并打开开发者工具

```bash
pnpm dev
```

然后按 F12 打开开发者工具，切换到 Console 标签页。

### 2. 测试子任务创建流程

#### 步骤 1：创建主任务
1. 在主任务输入框中输入文本
2. 按回车或点击添加按钮
3. 观察控制台输出

#### 步骤 2：添加子任务
1. 点击主任务的展开按钮（如果有的话）
2. 在子任务输入框中输入文本
3. 按回车或点击添加按钮
4. 观察控制台输出

### 3. 检查关键日志

#### 3.1 子任务创建日志
应该看到：
```
=== 开始同步子任务 ===
Todo ID: [todo-id]
传入的子任务: [subtasks-array]
子任务操作分析: { new: 1, updated: 0, deleted: 0, ... }
添加创建操作到同步队列: { id: "local_subtask_xxx", type: "CREATE", ... }
=== 子任务同步完成 ===
当前同步队列长度: [number]
```

#### 3.2 同步队列状态
在控制台中输入：
```javascript
// 检查 React 组件状态（需要 React Developer Tools）
console.log('检查同步队列状态...');
```

#### 3.3 同步按钮状态
1. 观察界面是否出现同步按钮
2. 检查按钮文本是否显示正确的操作数量
3. 查看状态指示器是否工作

### 4. 测试同步功能

#### 步骤 1：点击同步按钮
1. 点击"同步"按钮
2. 观察控制台输出
3. 查看网络请求（Network 标签页）

#### 步骤 2：检查同步日志
应该看到：
```
=== 开始同步到数据库 ===
用户: [user-id]
待同步操作数量: [number]
所有操作: [operations-array]
操作分组: { 创建: [number], 更新: [number], 删除: [number], 重排序: [number] }
创建操作分组: { 待办事项: [number], 子任务: [number] }
开始创建子任务，数量: [number]
创建子任务: [operation-object]
子任务创建成功: [subtask-object]
子任务本地状态已更新，ID从 local_xxx 更新为 [db-id]
```

### 5. 常见问题诊断

#### 问题 1：没有看到"开始同步子任务"日志
**原因**：`onSyncSubtasks` 回调没有被调用
**检查**：
- TodoItem 组件是否正确传递了 `onSyncSubtasks` 参数
- 子任务操作函数是否正确调用了回调

**解决**：
在 TodoItem 组件中添加调试日志：
```typescript
console.log('onSyncSubtasks callback:', onSyncSubtasks);
console.log('Calling onSyncSubtasks with:', id, updatedSubtasks);
```

#### 问题 2：同步队列为空
**原因**：`addToSyncQueue` 没有正确添加操作
**检查**：
- 控制台是否有"Added to sync queue"日志
- 操作对象格式是否正确

#### 问题 3：子任务创建失败
**原因**：`TodoService.createSubtask` 调用失败
**检查**：
- 控制台是否有"创建子任务失败"错误
- 网络请求是否返回错误状态码
- 数据库表结构是否正确

**解决**：
检查 Supabase 数据库：
1. 确保 `subtasks` 表存在
2. 确保表结构正确（`text`, `is_completed`, `todo_id` 字段）
3. 确保 RLS 策略允许插入操作

#### 问题 4：权限错误
**原因**：数据库权限不足
**检查**：
- 控制台是否有权限相关错误
- 用户是否已正确登录
- RLS 策略是否正确配置

### 6. 手动测试数据库连接

在控制台中测试：
```javascript
// 测试 Supabase 连接
fetch('/api/test-db-connection')
  .then(response => response.json())
  .then(data => console.log('数据库连接测试:', data))
  .catch(error => console.error('数据库连接失败:', error));
```

### 7. 检查网络请求

1. 切换到 Network 标签页
2. 创建子任务并点击同步
3. 查看是否有对 `/rest/v1/subtasks` 的 POST 请求
4. 检查请求参数和响应状态

### 8. 调试检查清单

- [ ] 子任务创建日志正常输出
- [ ] 同步队列正确添加操作
- [ ] 同步按钮正确显示
- [ ] 点击同步后看到详细日志
- [ ] 网络请求成功发送
- [ ] 数据库操作成功执行
- [ ] 本地状态正确更新

### 9. 如果问题仍然存在

请提供：
1. **完整的控制台日志**：从创建到同步的所有输出
2. **网络请求详情**：请求URL、状态码、响应内容
3. **具体错误信息**：任何错误或警告
4. **操作步骤**：您执行的具体操作
5. **浏览器信息**：Chrome/Firefox 版本
6. **操作系统信息**：macOS/Windows/Linux 版本

### 10. 下一步

完成调试后：
1. **记录发现的问题**：写下具体的问题描述
2. **分析根本原因**：找出问题的根源
3. **实施修复方案**：根据问题类型选择解决方案
4. **验证修复效果**：重新测试确保问题解决

## 调试工具

### React Developer Tools
1. 安装 Chrome/Firefox 扩展
2. 检查组件状态和 props
3. 监控状态变化

### 断点调试
在关键函数中设置断点：
```typescript
const syncSubtasks = useCallback(async (todoId: string, subtasks: EditableSubtask[]) => {
  debugger; // 设置断点
  try {
    // ... 函数逻辑
  } catch (err) {
    // ... 错误处理
  }
}, [todos, addToSyncQueue, pendingOperations.length]);
```

现在请按照这个调试指南逐步检查，找出子任务无法同步的具体原因！
