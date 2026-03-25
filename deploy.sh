#!/bin/bash
# 部署脚本 - 在云服务器上运行

cd ~/project/ai-image-upscaling

# 安装依赖
npm install
pip install -r requirements.txt

# 启动前端（后台）
npm run build
npm start &

# 启动后端
python3 -m uvicorn backend:app --host 0.0.0.0 --port 8000

# 访问：http://your-server-ip:3000
