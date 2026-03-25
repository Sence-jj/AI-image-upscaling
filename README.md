# AI Image Upscaling

一个轻量级在线图片超分辨率工具，使用 Real-ESRGAN 模型将低分辨率图片转换为高清版本。

## 技术栈

- **前端：** Next.js 14 + TypeScript + TailwindCSS
- **后端：** FastAPI + Python
- **模型：** Real-ESRGAN x4
- **部署：** Docker

## 快速开始

### 本地开发

#### 前端

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`

#### 后端

```bash
pip install -r requirements.txt
python -m uvicorn backend:app --reload
```

后端运行在 `http://localhost:8000`

### Docker 部署

```bash
docker build -t ai-upscaling .
docker run -p 3000:3000 -p 8000:8000 ai-upscaling
```

## 功能

- 🖼️ 拖拽上传图片
- ⚡ 4倍超分处理
- 📊 实时进度显示
- ⬇️ 高清图下载

## 项目结构

```
.
├── app/                    # Next.js 应用
│   ├── api/               # API 路由
│   ├── page.tsx           # 主页面
│   ├── layout.tsx         # 布局
│   └── globals.css        # 全局样式
├── public/                # 静态文件
├── backend.py             # FastAPI 后端
├── requirements.txt       # Python 依赖
├── package.json           # Node 依赖
├── Dockerfile             # Docker 配置
└── README.md
```

## 许可证

MIT
