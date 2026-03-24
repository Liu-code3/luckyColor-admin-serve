# luckyColor-admin-serve

独立后端服务，技术栈：

- NestJS
- Prisma
- MySQL

## 开发提交约定

- 后端项目每次新增功能或修改功能后，必须完成一次 Git 提交。
- 分支管理遵循 `gitflow`。
- `git commit message` 使用简洁明了的中文。

## 提交前检查

每个小任务提交前至少执行一次：

```powershell
pnpm verify
```

当前 `pnpm verify` 会串行执行：

- `pnpm typecheck`
- `pnpm build`

## 启动

```powershell
Copy-Item .env.example .env
pnpm install
pnpm db:setup
pnpm dev
```

默认端口：`3001`

## 已提供接口

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/menus`
- `GET /api/menus/tree`
- `GET /api/menus/:id`
- `POST /api/menus`
- `PATCH /api/menus/:id`
- `DELETE /api/menus/:id`
- `GET /api/dict/tree`
- `GET /api/dict/page`
- `GET /api/dict/:id`
- `POST /api/dict`
- `PATCH /api/dict/:id`
- `DELETE /api/dict/:id`
