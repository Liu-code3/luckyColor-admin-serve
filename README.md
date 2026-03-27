# luckyColor-admin-serve

<div align="center">
  <h2>LuckyColor Admin Serve</h2>
  <p>LuckyColor 多租户后台管理系统后端服务</p>
  <p>
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20+-43853D.svg" />
    <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-E0234E.svg" />
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5.22-2D3748.svg" />
    <img alt="MySQL" src="https://img.shields.io/badge/MySQL-8.x-4479A1.svg" />
    <img alt="Redis" src="https://img.shields.io/badge/Redis-7.x-DC382D.svg" />
  </p>
</div>

<p align="center">
  <a href="#项目简介">项目简介</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#仓库与配套项目">仓库与配套项目</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#快速开始">快速开始</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#功能概览">功能概览</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#项目结构">项目结构</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#项目文档">项目文档</a>
</p>

## 项目简介

`luckyColor-admin-serve` 是 LuckyColor 后台管理系统的独立后端服务，基于 `NestJS 10 + Prisma + MySQL + Redis` 构建，面向中后台与 SaaS 场景提供认证鉴权、多租户隔离、系统管理与平台通用能力。

当前仓库已经具备以下基础：

- 统一的登录认证、JWT 登录态、权限快照、动态路由与按钮权限输出
- 多租户上下文识别、租户管理、租户套餐与租户隔离能力
- 用户、角色、菜单、部门、字典、系统配置、通知公告、系统日志等后台常用模块
- 工作台、文件服务、国际化资源、用户偏好、水印配置、代码生成器等平台能力
- Prisma Schema、种子数据、回归测试、Swagger 文档与基础工程化脚本

适合作为多租户管理后台、运营后台、企业内部管理系统或中后台脚手架的后端基础工程。

## 仓库与配套项目

| 项目                     | 类型       | 地址                                                |
| ------------------------ | ---------- | --------------------------------------------------- |
| `luckyColor-admin-serve` | 后端服务   | https://github.com/Liu-code3/luckyColor-admin-serve |
| `luckyColor-admin`       | 前端管理台 | https://github.com/Liu-code3/luckyColor-admin       |

后端仓库拉取方式：

```bash
git clone https://github.com/Liu-code3/luckyColor-admin-serve.git
cd luckyColor-admin-serve
```

## 技术栈

| 类别     | 说明              |
| -------- | ----------------- |
| 后端框架 | NestJS 10         |
| 开发语言 | TypeScript        |
| ORM      | Prisma 5          |
| 数据库   | MySQL 8.x         |
| 缓存     | Redis 7.x         |
| API 文档 | Swagger / OpenAPI |
| 测试     | Jest              |
| 包管理器 | pnpm              |

## 快速开始

### 1. 环境要求

| 组件    | 版本要求       |
| ------- | -------------- |
| Node.js | 20+            |
| pnpm    | 推荐最新稳定版 |
| MySQL   | 8.x            |
| Redis   | 7.x            |

### 2. 启动 MySQL

仓库内自带 MySQL 编排文件：

```bash
docker compose up -d
```

默认会启动一个本地 MySQL 8.4 实例：

- Host: `127.0.0.1`
- Port: `3306`
- Database: `luckycolor_admin`
- Username: `root`
- Password: `123456`

### 3. 准备 Redis

当前 `docker-compose.yml` 只包含 MySQL，Redis 需要自行准备本地实例或远程实例，并将连接串写入 `.env`。

默认 Redis 地址：

```env
REDIS_URL="redis://127.0.0.1:6379"
```

### 4. 配置环境变量

复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

默认环境变量示例：

```env
PORT=3001
DATABASE_URL="mysql://root:123456@127.0.0.1:3306/luckycolor_admin?charset=utf8mb4"
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="2h"
REDIS_URL="redis://127.0.0.1:6379"
SWAGGER_ENABLED="true"
LOGIN_CAPTCHA_ENABLED="true"
TENANT_ENABLED="true"
TENANT_HEADER="x-tenant-id"
TENANT_DOMAIN_SUFFIX=""
DEFAULT_TENANT_ID=""
DEFAULT_ADMIN_USERNAME="admin"
DEFAULT_ADMIN_PASSWORD="123456"
APP_TIME_ZONE="+08:00"
```

### 5. 安装依赖并初始化数据库

```bash
pnpm install
pnpm db:setup
```

`pnpm db:setup` 会依次执行：

- `pnpm prisma:generate`
- `pnpm prisma:db:push`
- `pnpm prisma:seed`

注意：

- `prisma/seed.ts` 会清理并重建核心基础数据，适合本地初始化与回灌，不建议直接在生产环境执行
- 默认初始化管理员账号可通过 `DEFAULT_ADMIN_USERNAME`、`DEFAULT_ADMIN_PASSWORD` 覆盖

### 6. 启动项目

```bash
pnpm dev
```

启动成功后可访问：

- API 基础路径：`http://127.0.0.1:3001/api`
- Swagger 文档：`http://127.0.0.1:3001/docs`
- 健康检查：`GET http://127.0.0.1:3001/api/health`

## 默认初始化数据

执行 `pnpm db:setup` 后，仓库会初始化一套可直接联调的基础数据：

- 默认租户：`tenant_001`
- 默认管理员：`admin / 123456`
- 基础角色：`super_admin`、`tenant_admin`、`tenant_member`
- 基础菜单：系统管理、用户管理、菜单管理、字典等核心入口
- 基础字典：`COMMON_STATUS`、`MENU_TYPE`、`NOTICE_TYPE`
- 国际化资源、公告、系统配置、租户套餐等平台演示数据

如果你开启了多租户上下文，联调阶段可优先使用请求头：

```http
x-tenant-id: tenant_001
```

## 多租户机制

当前项目已接入统一的租户上下文识别，优先级如下：

1. 请求头 `TENANT_HEADER`
2. 域名后缀 `TENANT_DOMAIN_SUFFIX`
3. 登录态 Token
4. 默认租户 `DEFAULT_TENANT_ID`

相关能力集中在 `src/infra/tenancy` 目录，业务层通过租户上下文服务读取当前租户信息并完成数据隔离。

## 功能概览

### 认证与权限

- 登录、JWT 登录态、当前用户信息
- SVG 验证码与登录校验
- 权限快照输出
- 前端动态路由树输出
- 按钮权限码校验
- 数据权限与安全审计

### 系统管理

- 用户管理
- 角色管理
- 菜单管理
- 部门管理
- 字典类型、字典项与字典统一出口
- 系统配置
- 通知公告
- 系统日志

### 租户中心

- 租户管理
- 租户套餐管理
- 租户初始化与基础资源装配

### 平台能力

- 工作台
- 文件服务
- 健康检查
- 国际化资源
- 用户偏好
- 水印配置
- 代码生成器

## 项目结构

```text
luckyColor-admin-serve/
├─ src/
│  ├─ main.ts                    # 应用入口
│  ├─ app.module.ts              # 根模块
│  ├─ generated/                 # Prisma Client 生成产物
│  ├─ infra/                     # 基础设施能力
│  │  ├─ cache/                  # Redis
│  │  ├─ database/               # Prisma
│  │  ├─ security/               # 密码与安全能力
│  │  └─ tenancy/                # 多租户上下文
│  ├─ modules/                   # 业务模块
│  │  ├─ iam/                    # 认证、权限、数据权限、安全审计
│  │  ├─ platform/               # 工作台、文件、国际化、偏好、水印、代码生成
│  │  ├─ system/                 # 用户、角色、菜单、部门、字典、配置、公告、日志
│  │  └─ tenant/                 # 租户与租户套餐
│  └─ shared/                    # 配置、响应体、过滤器、工具与常量
├─ prisma/                       # Schema、SQL 脚本、种子数据
├─ docs/                         # 项目文档与协作规范
├─ test/                         # unit / e2e 测试
├─ storage/                      # 本地存储目录
├─ docker-compose.yml            # 本地 MySQL 编排
├─ .env.example                  # 环境变量模板
└─ package.json                  # 脚本与依赖配置
```

## 数据模型概览

当前 Prisma Schema 已覆盖一套完整的后台核心实体，主要包含：

- 租户与套餐：`TenantPackage`、`Tenant`、`TenantAuditLog`
- 权限体系：`User`、`Role`、`Menu`、`UserRole`、`RoleMenu`、`RolePermission`、`RoleDepartmentScope`
- 组织与基础资料：`Department`、`Dictionary`、`SystemConfig`
- 业务辅助能力：`Notice`、`I18nResource`、`UserPreference`、`WatermarkConfig`
- 平台与审计能力：`SystemLog`、`SecurityAuditLog`、`DashboardVisit`
- 代码生成能力：`CodegenTable`、`CodegenColumn`

## 常用命令

| 命令                     | 说明                               |
| ------------------------ | ---------------------------------- |
| `pnpm dev`               | 启动开发环境                       |
| `pnpm build`             | 构建生产产物                       |
| `pnpm start`             | 启动构建后的应用                   |
| `pnpm start:prod`        | 生产模式启动                       |
| `pnpm lint`              | 执行 ESLint                        |
| `pnpm format`            | 执行 Prettier 格式化               |
| `pnpm typecheck`         | TypeScript 类型检查                |
| `pnpm verify`            | 提交前基础校验，执行类型检查与构建 |
| `pnpm test`              | 运行全部测试                       |
| `pnpm test:unit`         | 运行单元测试                       |
| `pnpm test:e2e`          | 运行端到端测试                     |
| `pnpm prisma:generate`   | 生成 Prisma Client                 |
| `pnpm prisma:db:push`    | 推送 Schema 并补齐元数据           |
| `pnpm prisma:seed`       | 执行种子数据初始化                 |
| `pnpm db:setup`          | 初始化数据库                       |
| `pnpm menus:sync-system` | 同步系统菜单                       |
| `pnpm password:backfill` | 回填用户密码哈希                   |

## 测试与校验

当前仓库已包含基础测试与回归检查：

- 单元测试：环境变量校验、Schema 索引、种子数据契约、关键路径能力
- E2E 测试：最小应用启动、字典路由回归、系统 API 回归
- 推荐提交前至少执行一次 `pnpm verify`

## 项目文档

`docs/` 目录已经沉淀了较完整的配套文档，建议按场景查阅：

| 文档                                            | 说明                       |
| ----------------------------------------------- | -------------------------- |
| `docs/初始化与部署检查清单.md`                  | 本地初始化、部署前检查项   |
| `docs/上线前测试执行清单.md`                    | 上线前测试项与回归建议     |
| `docs/发布前回归清单.md`                        | 发布前自检清单             |
| `docs/列表接口参数规范.md`                      | 列表接口查询参数与兼容规范 |
| `docs/后端错误码清单.md`                        | 后端业务错误码约定         |
| `docs/Gitflow提交规范.md`                       | 分支与提交规范             |
| `docs/开发任务拆解.md`                          | 当前项目能力建设清单       |
| `docs/技术选型清单.md`                          | 技术栈与设计取舍说明       |
| `docs/tenant-id-rollout.md`                     | 租户标识接入说明           |
| `docs/tenant-isolation-regression-checklist.md` | 租户隔离回归检查清单       |

## 界面预览

当前仓库保留了首页预览占位图，后续可以直接替换为真实系统截图：

| 登录认证                                                  | 用户管理                                                  |
| --------------------------------------------------------- | --------------------------------------------------------- |
| ![登录认证占位](./docs/screenshots/login-placeholder.svg) | ![用户管理占位](./docs/screenshots/users-placeholder.svg) |

| 租户管理                                                    | Swagger 文档                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| ![租户管理占位](./docs/screenshots/tenants-placeholder.svg) | ![Swagger 占位](./docs/screenshots/swagger-placeholder.svg) |
