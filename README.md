# 考研笔记存储网站

基于 `Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma ORM + MySQL` 的单用户笔记系统。

## 功能清单

- 单管理员登录（NextAuth Credentials + bcrypt 哈希）
- 科目 CRUD
- 标签 CRUD
- 笔记 CRUD（TipTap 编辑器）
- 支持 Markdown 输入习惯、代码块高亮、LaTeX 公式、图片粘贴/上传
- 图片存储到 `public/uploads`，并在 `ImageAsset` 表记录路径
- 背景图会按管理员账号持久化到数据库，不再只依赖浏览器本地缓存
- 按科目、标签关键词、标题关键词搜索
- 错题本（`isWrongQuestion` 标记）独立列表
- 灰黑主题 + 橙色强调，毛玻璃风格，响应式布局

## 目录结构

- `app/` 页面与 API Route Handlers
- `components/` 前端组件（登录、列表、编辑器等）
- `prisma/schema.prisma` Prisma 模型
- `prisma/seed.ts` 管理员初始化
- `mysql-init.sql` MySQL schema 初始化脚本

## 运行前准备

1. 安装 Node.js 18+（建议 20+）与本地 MySQL 8+
2. 在项目根目录安装依赖：

```bash
npm install
```

3. 初始化数据库（执行 SQL 脚本）：

```bash
mysql -u root -p < mysql-init.sql
```

4. 配置环境变量：

```bash
cp .env.local.example .env.local
```

修改 `.env.local`：

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/kaoyan_notes"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="替换为随机长字符串"
```

如果数据库密码里包含 `@`、`:`、`/` 这类特殊字符，需要先做 URL 编码。
例如密码是 `abc@123`，连接串里应写成 `abc%40123`。

## Prisma 初始化（next dev 前必做）

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

如果你之后修改了 Prisma 模型（例如新增背景设置表），要再次执行 `npm run prisma:migrate` 来同步数据库结构。
如果背景保存时报错，请先确认已经执行过新增 `UserSetting` 的迁移。

- seed 会创建硬编码管理员：
  - username: `admin`
  - password: `admin123456`

## 启动项目

```bash
npm run dev
```

访问：`http://localhost:3000`

## API 概览

- 认证：`/api/auth/[...nextauth]`
- 科目：`GET/POST /api/subjects`，`GET/PATCH/DELETE /api/subjects/:id`
- 标签：`GET/POST /api/tags`，`PATCH/DELETE /api/tags/:id`
- 笔记：`GET/POST /api/notes`，`GET/PATCH/DELETE /api/notes/:id`
- 错题本：`GET /api/notes/wrong`
- 上传：`POST /api/upload`

## 说明

- 本项目为单用户场景，不包含注册与多角色系统。
- API 写入接口使用 `zod` 校验并返回统一错误结构：

```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```
