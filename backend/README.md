# EduAIHub2 后端

基于 FastAPI 的异步后端服务，提供 RESTful API 和 JWT 认证。

## 技术栈

- **FastAPI** - 高性能 Web 框架
- **SQLAlchemy 2.0** - 异步 ORM
- **SQLite** - 轻量级数据库
- **python-jose** - JWT 令牌处理
- **passlib** - 密码哈希

## 目录结构

```
backend/
├── main.py              # FastAPI 应用入口
├── config.py            # 配置管理
├── database.py          # 数据库连接
├── security.py          # JWT 和密码工具
├── models/              # SQLAlchemy 数据模型
├── schemas/             # Pydantic 请求/响应模型
└── routers/             # API 路由
```

## 快速开始

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 配置环境变量（复制 .env.example 为 .env）

3. 启动服务：
```bash
python main.py
```

4. 访问 API 文档：http://localhost:8000/docs

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
