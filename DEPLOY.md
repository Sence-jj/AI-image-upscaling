# 部署指南

## 1. 环境变量配置

复制 `.env.example` 为 `.env`，填写以下配置：

```bash
# 数据库（使用 Supabase 或自己的 PostgreSQL）
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="https://ai-image-upscaling.xyz"
NEXTAUTH_SECRET="生成一个随机字符串"

# Google OAuth（在 Google Cloud Console 创建）
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# 后端 API
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

## 2. Google OAuth 设置

1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭据
5. 添加授权重定向 URI：
   - `https://ai-image-upscaling.xyz/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (开发环境)

## 3. 数据库初始化

```bash
npx prisma generate
npx prisma db push
```

## 4. 本地开发

```bash
npm install
npm run dev
```

## 5. 生产部署

```bash
npm run build
npm start
```

## 6. Docker 部署

更新 `docker-compose.yml` 添加数据库和环境变量。
