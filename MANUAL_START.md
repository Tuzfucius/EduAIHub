# 手动启动指南

如果启动脚本遇到问题，请按照以下步骤手动启动项目。

## 方式一：使用修复后的启动脚本

在项目根目录 `E:\Project\EduAIHub2` 下运行：

```bash
scripts\start.bat
```

脚本会自动：
1. 定位到项目根目录
2. 检查并创建 `.env` 文件
3. 启动后端和前端服务

## 方式二：手动启动（推荐用于调试）

### 1. 启动后端

打开第一个终端窗口：

```bash
# 进入后端目录
cd E:\Project\EduAIHub2\backend

# 启动后端服务
python main.py
```

**预期输出：**
```
🚀 正在初始化数据库...
✅ 数据库初始化完成
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. 启动前端

打开第二个终端窗口：

```bash
# 进入前端目录
cd E:\Project\EduAIHub2\frontend

# 启动前端服务
npm run dev
```

**预期输出：**
```
VITE v6.2.0  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 常见问题

### 问题 1: "python is not recognized"

**原因：** Python 未安装或未添加到系统 PATH

**解决方案：**
1. 确认 Python 已安装：打开终端运行 `python --version`
2. 如果未安装，从 https://www.python.org/ 下载安装
3. 安装时勾选 "Add Python to PATH"

### 问题 2: "npm is not recognized"

**原因：** Node.js 未安装或未添加到系统 PATH

**解决方案：**
1. 确认 Node.js 已安装：打开终端运行 `node --version`
2. 如果未安装，从 https://nodejs.org/ 下载安装

### 问题 3: 后端依赖未安装

**错误信息：** `ModuleNotFoundError: No module named 'fastapi'`

**解决方案：**
```bash
cd E:\Project\EduAIHub2\backend
pip install -r requirements.txt
```

### 问题 4: 前端依赖未安装

**错误信息：** `Cannot find module 'react'`

**解决方案：**
```bash
cd E:\Project\EduAIHub2\frontend
npm install
```

### 问题 5: 端口被占用

**错误信息：** `Address already in use`

**解决方案：**
- 后端端口 8000 被占用：修改 `backend/main.py` 中的端口号
- 前端端口 5173 被占用：修改 `frontend/vite.config.ts` 中的端口号

## 验证启动成功

1. **后端 API**: 访问 http://localhost:8000
   - 应该看到 JSON 响应：`{"message": "欢迎使用 EduAIHub API", ...}`

2. **后端文档**: 访问 http://localhost:8000/docs
   - 应该看到 Swagger UI 界面

3. **前端应用**: 访问 http://localhost:5173
   - 应该看到登录/注册页面

## 下一步

启动成功后，请：
1. 注册一个新用户
2. 登录系统
3. 查看 Dashboard
4. 刷新页面确认登录状态保持
