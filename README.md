# AI Image Upscaling

一个轻量级在线图片超分辨率工具，使用 Real-ESRGAN 模型将低分辨率图片转换为高清版本。

## 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行

```bash
uvicorn main:app --reload
```

访问 `http://localhost:8000`

## 功能

- 🖼️ 拖拽上传图片
- ⚡ 4倍超分处理
- 📊 原图 vs 超分对比
- ⬇️ 高清图下载

## 技术栈

- 后端：FastAPI + Python
- 前端：HTML5 + Vanilla JS
- 模型：Real-ESRGAN x4
- 部署：Docker

## 部署

```bash
docker build -t ai-upscaling .
docker run -p 8000:8000 ai-upscaling
```

## 许可证

MIT
