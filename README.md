# luckyColor-admin-serve

<div align="center">
  <h2>luckyColor-admin-serve</h2>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20+-green.svg"/>
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-red.svg"/>
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5.22-2D3748.svg"/>
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-8.x-4479A1.svg"/>
  <img alt="Redis" src="https://img.shields.io/badge/Redis-7.x-DC382D.svg"/>
</div>

<p align="center">
  LuckyColor 多租户后台管理系统后端服务，聚焦权限、租户、系统管理与平台基础能力。
</p>

<p align="center">
  <a href="#-快速启动">快速启动</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#-项目亮点">项目亮点</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#-功能清单">功能清单</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#-配套项目">配套项目</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#-项目文档">项目文档</a>
  <span>&nbsp;|&nbsp;</span>
  <a href="#-常用脚本">常用脚本</a>
</p>

## 📢 项目简介

`luckyColor-admin-serve` 是 LuckyColor 后台管理系统的独立后端服务，基于 NestJS、Prisma、MySQL、Redis 构建，面向中后台场景提供认证鉴权、多租户隔离、系统管理和平台基础能力。

它适合作为 SaaS 管理后台、运营后台或企业内部管理系统的后端基础工程，也方便继续扩展租户套餐、文件服务、公告通知、系统日志等能力。

## ✨ 项目亮点

- **多租户能力内建**：支持请求头、域名后缀、Token、默认租户等多种租户识别方式，便于支撑 SaaS 类业务。
- **权限模型完整**：覆盖认证、角色、菜单、数据权限等后台系统常见权限能力，适合直接作为管理端底座继续开发。
- **领域模块清晰**：按 `iam`、`system`、`tenant`、`platform` 分层组织，便于理解、维护和扩展。
- **接口文档开箱可用**：项目启动后即可通过 Swagger 直接调试接口，降低联调与测试成本。
- **工程化基础齐全**：集成 Prisma、ESLint、Prettier、Jest，并约定 `pnpm verify` 作为提交前检查。
- **本地启动成本低**：提供环境变量模板与数据库初始化脚本，新环境可以较快完成拉起。

## 🎯 适用场景

- SaaS 多租户管理后台
- 企业内部运营与配置后台
- 基于 NestJS 的中后台后端脚手架
- 需要权限、菜单、租户能力的后台系统基础工程

## 🧾 功能清单

- **认证与鉴权**：账号登录、JWT 登录态、当前用户资料、访问快照、动态路由、按钮权限查询
- **用户管理**：用户分页、详情、创建、编辑、状态切换、密码重置、角色分配
- **角色与权限**：角色维护、菜单授权、按钮权限控制、平台管理员与租户管理员边界隔离
- **菜单管理**：菜单树查询、菜单 CRUD、状态管理、菜单树批量同步
- **部门管理**：部门树、部门维护、部门成员关联
- **字典管理**：字典树、字典分页、统一选项接口、缓存刷新
- **系统配置**：系统配置项维护与读取
- **通知公告**：公告维护与租户侧通知支撑
- **系统日志**：关键操作留痕、审计日志查询
- **租户中心**：租户分页、租户详情、租户创建、租户更新、初始化管理员与基础资源
- **租户套餐**：租户套餐维护与租户绑定
- **平台能力**：仪表盘、文件服务、健康检查、Swagger 文档

## 🔗 配套项目

| 项目 | 类型 | 地址 |
| --- | --- | --- |
| `luckyColor-admin-serve` | 后端服务 | 当前仓库 |
| `luckyColor-admin` | 前端管理台 | [https://github.com/Liu-code3/luckyColor-admin](https://github.com/Liu-code3/luckyColor-admin) |


## 🖼️ 界面预览

> 当前先放仓库首页截图占位，后续可直接替换为真实系统截图。

| 登录认证 | 用户管理 |
| --- | --- |
| ![登录认证占位](./docs/screenshots/login-placeholder.svg) | ![用户管理占位](./docs/screenshots/users-placeholder.svg) |

| 租户管理 | Swagger 文档 |
| --- | --- |
| ![租户管理占位](./docs/screenshots/tenants-placeholder.svg) | ![Swagger 文档占位](./docs/screenshots/swagger-placeholder.svg) |

## 🌈 技术栈

- **后端框架**：NestJS 10
- **开发语言**：TypeScript
- **数据库**：MySQL 8.x
- **ORM**：Prisma 5
- **缓存**：Redis 7.x
- **接口文档**：Swagger / OpenAPI
- **测试工具**：Jest
- **包管理器**：pnpm

## 📁 项目目录

```text
luckyColor-admin-serve/
├─ src/                          # 核心业务源码
│  ├─ main.ts                    # 应用入口
│  ├─ app.module.ts              # 根模块
│  ├─ modules/                   # 业务模块
│  │  ├─ iam/                    # 认证、权限、数据权限
│  │  ├─ platform/               # 健康检查、仪表盘、文件等平台能力
│  │  ├─ system/                 # 用户、角色、菜单、部门、字典、配置、日志等
│  │  └─ tenant/                 # 租户与租户套餐
│  ├─ infra/                     # 基础设施能力
│  │  ├─ cache/                  # Redis 缓存
│  │  ├─ database/               # Prisma 数据访问
│  │  ├─ security/               # 密码安全
│  │  └─ tenancy/                # 多租户上下文
│  ├─ shared/                    # 配置、过滤器、工具等共享能力
│  ├─ common/                    # 公共常量与类型
│  └─ generated/                 # 生成代码产物
├─ prisma/                       # Prisma Schema、初始化脚本、种子数据
├─ docs/                         # 项目文档与协作约定
├─ test/                         # 单元测试与端到端测试
├─ docker-compose.yml            # 本地 MySQL 编排
├─ .env.example                  # 环境变量示例
└─ package.json                  # 项目脚本与依赖配置
```

## 🚀 快速启动

### 1. 环境准备

| 要求 | 说明 |
| --- | --- |
| **Node.js** | 20+ |
| **pnpm** | 推荐作为包管理器 |
| **MySQL** | 8.x |
| **Redis** | 7.x |

> 项目启动依赖 MySQL 与 Redis，请先确保相关服务已启动。

### 2. 启动依赖服务

仓库内提供了 MySQL 的 Docker Compose 配置：

```bash
docker compose up -d
```

Redis 需要自行准备本地实例或远程实例，并在 `.env` 中填写连接地址。

### 3. 配置环境变量

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
TENANT_ENABLED="true"
TENANT_HEADER="x-tenant-id"
TENANT_DOMAIN_SUFFIX=""
DEFAULT_TENANT_ID=""
APP_TIME_ZONE="+08:00"
```

### 4. 安装依赖并初始化数据库

```bash
pnpm install
pnpm db:setup
```

`pnpm db:setup` 会自动执行：

- `pnpm prisma:generate`
- `pnpm prisma:db:push`
- `pnpm prisma:seed`

### 5. 启动项目

```bash
pnpm dev
```

启动成功后可访问：

- 应用接口前缀：`http://127.0.0.1:3001/api`
- Swagger 文档：`http://127.0.0.1:3001/docs`
- 健康检查：`GET /api/health`

如果你只是想快速确认服务是否已正常启动，优先访问 Swagger 文档页或健康检查接口即可。

## 🧱 初始化数据

执行 `pnpm db:setup` 后，默认会初始化以下基础数据：

- 默认管理员账号：`admin / 123456`
- 默认租户：`tenant_001`
- 基础角色：`super_admin`、`tenant_admin`、`tenant_member`
- 基础菜单：系统管理、用户管理、菜单管理、字典等入口
- 基础字典：`COMMON_STATUS`、`MENU_TYPE`、`NOTICE_TYPE`

相关初始化清单维护在 [prisma/seed-manifest.ts](./prisma/seed-manifest.ts)。

## 🏢 多租户说明

当前项目已接入多租户上下文，租户识别优先级如下：

1. 请求头 `TENANT_HEADER`
2. 域名后缀 `TENANT_DOMAIN_SUFFIX`
3. 登录态 Token
4. 默认租户 `DEFAULT_TENANT_ID`

服务层统一通过租户上下文能力获取当前租户信息，控制器层可通过装饰器读取 `tenantId` 与来源信息。

## 🧩 核心模块

- **IAM**：认证、权限、数据权限
- **System**：用户、角色、菜单、部门、字典、配置、公告、系统日志
- **Tenant**：租户、租户套餐
- **Platform**：健康检查、文件、仪表盘

这些模块已经覆盖典型后台项目的大部分基础能力，可以直接在此基础上继续扩展业务模块。

## 🛠️ 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发环境 |
| `pnpm build` | 构建生产产物 |
| `pnpm start` | 启动已构建应用 |
| `pnpm start:prod` | 生产模式启动 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm verify` | 提交前检查，执行类型检查与构建 |
| `pnpm test` | 执行全部测试 |
| `pnpm test:unit` | 执行单元测试 |
| `pnpm test:e2e` | 执行端到端测试 |
| `pnpm prisma:generate` | 生成 Prisma Client |
| `pnpm prisma:db:push` | 推送 Schema 并补充元数据 |
| `pnpm prisma:seed` | 执行种子数据 |
| `pnpm db:setup` | 初始化数据库 |
| `pnpm menus:sync-system` | 同步系统菜单 |
| `pnpm password:backfill` | 回填用户密码哈希 |

## 🐳 项目部署

### 1. 本地构建运行

```bash
pnpm build
pnpm start:prod
```

### 2. Docker Compose

当前仓库默认提供 MySQL 容器编排：

```bash
docker compose up -d
```

如需完整部署应用服务，建议在此基础上补充 Redis、Nginx 和应用容器配置。

## 🤝 开发约定

- 每次新增功能或修复问题后，建议至少执行一次 `pnpm verify`
- 分支管理遵循 Gitflow
- `git commit message` 使用简洁明确的中文
- `docs/` 目录中的协作文档变更也应纳入版本管理

详细规范见 [docs/Gitflow提交规范.md](./docs/Gitflow提交规范.md)。
