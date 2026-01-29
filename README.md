# EduAIHub2

> AI 驱动的智能学习助手平台 - 第二代

## 项目简介

EduAIHub2 是一个基于 AI 的学习辅助平台，帮助学生更高效地学习和管理知识。本项目采用前后端分离架构，提供现代化的用户体验和强大的 AI 能力。

## 技术栈

### 后端
- **FastAPI** - 高性能 Python Web 框架
- **SQLAlchemy 2.0** - 异步 ORM
- **SQLite** - 轻量级数据库
- **JWT** - 安全认证

### 前端
- **Vite** - 极速构建工具
- **React 19** - 用户界面库
- **TypeScript** - 类型安全
- **TailwindCSS** - 原子化 CSS

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
cd EduAIHub2
```

2. **安装后端依赖**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 复制并配置环境变量
```

3. **安装前端依赖**
```bash
cd frontend
npm install
cp .env.example .env  # 复制环境变量
```

### 启动项目

#### 方式一：使用启动脚本（推荐）

**Windows:**
```bash
scripts\start.bat
```

#### 方式二：手动启动

**后端:**
```bash
cd backend
python main.py
```

**前端:**
```bash
cd frontend
npm run dev
```

### 访问应用

- 前端应用: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 项目结构

```
EduAIHub2/
├── backend/           # 后端 FastAPI 应用
│   ├── models/       # 数据模型
│   ├── schemas/      # Pydantic 模型
│   ├── routers/      # API 路由
│   └── main.py       # 应用入口
├── frontend/         # 前端 React 应用
│   └── src/
│       ├── pages/    # 页面组件
│       ├── contexts/ # React Context
│       ├── services/ # API 服务
│       └── types/    # TypeScript 类型
└── scripts/          # 启动脚本
```

## 功能特性

### 已实现
- ✅ 用户注册/登录（JWT 认证）
- ✅ 会话持久化（本地存储）
- ✅ 响应式 UI 设计
- ✅ 暗黑模式支持

### 开发中
- 🚧 AI Solver（智能解题）
- 🚧 文件分类管理
- 🚧 错题本
- 🚧 课程管理

## 开发指南

详细的开发文档请参考：
- [后端文档](./backend/README.md)
- [前端文档](./frontend/README.md)

## 许可证

MIT License
