# Command Arsenal

一个用于管理、检索、审计 CLI 命令的 Web 应用，支持：

- 命令库浏览与分类筛选
- AI 命令建议（自然语言 / URL 文档提取）
- 命令安全审计
- 本地导入/导出 JSON
- GitHub Gist 备份

---

## 技术栈

- 前端：`React` + `TypeScript` + `Vite` + `Tailwind`
- 本地开发服务：`server.ts`（Express + Vite middleware）
- 线上部署：`Vercel`（`api/backend/*` Serverless Functions）

---

## 本地运行

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发环境

```bash
npm run dev
```

默认地址：`http://localhost:3000`

---

## Vercel 部署

项目已适配 Vercel：

- 前端构建输出：`dist`
- 后端接口：`/api/backend/*`
- SPA 路由回退：`index.html`

已提供 `vercel.json`，直接连接仓库部署即可。

### 推荐配置（Vercel Project Settings）

- Build Command: `npm run build`
- Output Directory: `dist`

---

## API 路由说明

线上使用以下接口：

- `POST /api/backend/chat`：代理 LLM chat completion
- `POST /api/backend/search`：代理 Tavily 搜索
- `POST /api/backend/github`：校验 GitHub Token
- `POST /api/backend/extract-url`：提取网页标题/正文/代码块

本地 `server.ts` 还提供了分阶段提取任务接口（`/start`、`/status`、`/result`），用于更细粒度进度展示。
在 Vercel 环境下前端会自动降级到直连提取模式。

---

## 数据存储

当前数据默认保存在浏览器 `localStorage`：

- 命令库
- API 设置
- Gist 配置

如需多人共享或服务端持久化，可后续接入数据库。

---

## 已实现的行为细节

- URL 提取进度支持阶段展示
- AI 建议加入命令库时支持防重复（按 `command` 归一化比较）
- 建议弹窗每次打开会自动重置选中状态

---

## 常用命令

```bash
npm run dev      # 本地开发
npm run lint     # TypeScript 类型检查
npm run build    # 生产构建
npm run preview  # 本地预览构建结果
```
