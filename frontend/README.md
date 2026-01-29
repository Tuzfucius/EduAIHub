# EduAIHub2 前端

基于 Vite + React + TypeScript 的现代化前端应用。

## 技术栈

- **React 19** - 用户界面库
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **TailwindCSS** - 原子化 CSS
- **Lucide React** - 图标库

## 目录结构

```
src/
├── pages/          # 页面组件
│   ├── Auth/      # 登录/注册
│   └── Dashboard/ # 首页
├── contexts/       # React Context
│   └── AuthContext.tsx
├── services/       # API 服务
│   ├── api.ts     # HTTP 客户端
│   └── auth.ts    # 认证服务
├── types/          # TypeScript 类型
├── styles/         # 样式文件
└── config.ts       # 配置文件
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 状态管理

使用 **React Context** 进行状态管理，轻量且无额外依赖。

### AuthContext

管理用户认证状态：
- `user` - 当前用户信息
- `isLoading` - 加载状态
- `login()` - 登录
- `register()` - 注册
- `logout()` - 登出

## API 调用

所有 API 调用都通过 `services/api.ts` 进行，自动处理：
- JWT Token 附加
- 错误处理
- 请求/响应拦截

## 主题

支持亮色/暗色主题切换，使用 TailwindCSS 的 `dark:` 变体。
