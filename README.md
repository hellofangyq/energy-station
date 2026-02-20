# Energy Station

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Set `JWT_SECRET` to a long random string.

3. Install dependencies and initialize the database:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the app:

```bash
npm run dev
```

## Features in this scaffold

- 能量瓶首页（摇一摇随机回放）
- 时间轴（按时间查看）
- 能量发送（文字/图片/语音/视频）
- 家庭成员管理
- 邮箱登录/注册（基础 JWT Session）

## Notes

- 媒体上传暂存于 `public/uploads`，上线建议切换对象存储。
- `EnergyCard` 与首页目前使用 demo 数据，完成数据库迁移后可改为读取 API。
