# luckyColor-admin-serve

独立后端服务，技术栈：

- NestJS
- Prisma
- MySQL

## 开发提交流程

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

## 本地初始化结果

执行 `pnpm db:setup` 后，默认会初始化：

- 默认管理员账号：`admin / 123456`
- 基础角色：`super_admin`、`tenant_admin`、`tenant_member`
- 基础菜单：系统管理、用户管理、菜单管理、数据字典等入口
- 基础字典：至少包含 `COMMON_STATUS`、`MENU_TYPE`、`NOTICE_TYPE`
- 初始化契约清单：集中维护在 `prisma/seed-manifest.ts`

租户识别优先级：

- 请求头 `TENANT_HEADER`
- 域名后缀 `TENANT_DOMAIN_SUFFIX`
- 登录态 Token
- 默认租户 `DEFAULT_TENANT_ID`

租户上下文注入：

- 服务层统一通过 `TenantContextService` 或 `TenantPrismaScopeService` 获取当前租户
- 控制器层统一通过 `CurrentTenant` decorator 读取 `tenantId` 和 `source`

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
