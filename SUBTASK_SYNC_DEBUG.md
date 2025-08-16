# 子任务同步调试指南

## 问题描述

子任务同步仍然失败，需要进一步诊断问题所在。

## 调试步骤

### 1. 打开浏览器开发者工具

1. **按 F12** 或右键选择"检查"
2. **切换到 Console 标签页**
3. **确保日志级别设置为 All**

### 2. 测试子任务创建

1. **创建待办事项**：先创建一个主任务
2. **添加子任务**：
   - 点击主任务的展开按钮
   - 在子任务输入框中输入文本
   - 按回车或点击添加按钮

3. **观察控制台输出**：
   ```
   === 开始同步子任务 ===
   Todo ID: [todo-id]
   传入的子任务: [subtasks-array]
   当前 todos 状态: [todos-array]
   当前待办事项: [todo-object]
   当前子任务: [current-subtasks]
   子任务操作分析: { new: 1, updated: 0, deleted: 0, ... }
   添加创建操作到同步队列: { id: "local_xxx", type: "CREATE", ... }
   === 子任务同步完成 ===
   当前同步队列长度: [number]
   ```

### 3. 检查同步队列状态

在控制台中输入以下命令检查状态：

```javascript
// 检查 todos 状态
console.log('Todos:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber()?.memoizedState?.baseQueue?.payload?.memoizedState);

// 检查 pendingOperations 状态
console.log('Pending Operations:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber()?.memoizedState?.baseQueue?.payload?.memoizedState);
```

### 4. 检查同步按钮显示

1. **观察界面**：同步按钮是否出现
2. **检查状态指示器**：是否显示待同步操作数量
3. **查看按钮文本**：是否显示正确的操作数量

### 5. 测试同步功能

1. **点击同步按钮**：观察同步过程
2. **查看控制台**：是否有同步相关的日志
3. **检查网络请求**：切换到 Network 标签页查看 API 调用

## 可能的问题和解决方案

### 问题 1：控制台没有日志输出

**原因**：`onSyncSubtasks` 回调没有被调用
**检查**：
- TodoItem 组件是否正确传递了 `onSyncSubtasks` 参数
- 子任务操作函数是否正确调用了回调

**解决**：
```typescript
// 在 TodoItem 组件中添加调试日志
console.log('onSyncSubtasks callback:', onSyncSubtasks);
console.log('Calling onSyncSubtasks with:', id, updatedSubtasks);
```

### 问题 2：同步队列为空

**原因**：`addToSyncQueue` 没有正确添加操作
**检查**：
- `addToSyncQueue` 函数是否被调用
- 操作对象格式是否正确

**解决**：
```typescript
// 在 addToSyncQueue 中添加调试日志
console.log('Adding to sync queue:', operation);
console.log('Current queue before:', pendingOperations);
console.log('Current queue after:', pendingOperations);
```

### 问题 3：类型错误

**原因**：TypeScript 类型不匹配
**检查**：
- 控制台是否有类型错误
- 组件 props 类型是否正确

**解决**：
```typescript
// 检查类型定义
interface TodoItemProps {
  onSyncSubtasks: (todoId: string, subtasks: EditableSubtask[]) => void;
}
```

### 问题 4：状态更新失败

**原因**：React 状态更新没有触发重新渲染
**检查**：
- `setTodos` 是否被正确调用
- 状态更新后组件是否重新渲染

**解决**：
```typescript
// 在状态更新后添加日志
console.log('Todos state updated:', todos);
console.log('Component should re-render');
```

## 调试工具

### 1. React Developer Tools

1. **安装扩展**：Chrome/Firefox 扩展商店搜索 "React Developer Tools"
2. **检查组件状态**：查看组件的 props 和 state
3. **监控状态变化**：观察状态更新的过程

### 2. 网络监控

1. **Network 标签页**：监控 API 请求
2. **请求详情**：查看请求参数和响应
3. **错误状态**：检查 HTTP 状态码

### 3. 断点调试

1. **在关键函数中设置断点**：
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

2. **逐步执行**：使用 F10 逐步执行代码
3. **检查变量值**：在 Console 中查看变量状态

## 常见错误模式

### 1. 无限循环

**症状**：控制台不断输出相同日志
**原因**：useCallback 依赖项错误
**解决**：检查依赖项数组

### 2. 状态不同步

**症状**：界面显示与实际状态不一致
**原因**：状态更新时机错误
**解决**：使用 useEffect 监控状态变化

### 3. 回调丢失

**症状**：`onSyncSubtasks` 是 undefined
**原因**：props 传递错误
**解决**：检查组件调用链

## 调试检查清单

- [ ] 控制台有日志输出
- [ ] 同步队列正确添加操作
- [ ] 同步按钮正确显示
- [ ] 状态指示器正常工作
- [ ] 网络请求成功发送
- [ ] 数据库操作成功执行
- [ ] 本地状态与数据库一致

## 下一步

完成调试后：

1. **记录问题**：写下发现的具体问题
2. **分析原因**：找出问题的根本原因
3. **实施修复**：根据问题类型选择修复方案
4. **验证修复**：重新测试确保问题解决

如果问题仍然存在，请提供：
- 控制台日志输出
- 具体的错误信息
- 问题发生的具体步骤
- 浏览器和操作系统信息
