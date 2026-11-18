# dsh-news：每日 AI 简报

把十几个 AI 信息源抓下来，**由模型判断哪些值得你花时间**，再逐条写清「这条讲了什么」。

界面分两处：

- **侧边栏「每日简报」** → 完整阅读界面（日期可前后翻、按分类成文、被滤掉的条目可展开看理由、信息源状态、复制 Markdown、重新生成）
- **设置 →「每日简报」** → 只管配置（兴趣描述、信息源、时间、代理、模型）

## 安装

这是一个 DeepSeek Harness 插件（bundle）。装进当前 profile：

```
plugin_manager install_bundle   target=/absolute/path/to/dsh-news
```

装好后：侧边栏出现「每日简报」阅读面板，设置 →「每日简报」是配置页。

> 包名 `@local/dsh-news` 是本机 profile 里用的名字（未发布到 npm）；
> 仓库里的 `cordis.patch.yml` 会把插件行 `dsh-news-digest` 插进 profile 组合。

## 开发

```bash
node --check index.js && node --check client.js
node --test test/host.test.mjs test/client.smoke.test.mjs   # 104 个用例，不联网
```

- `index.js` 宿主半体：抓取 / 解析 / 模型筛选 / 逐条摘要 / 定时 / HTTP 路由
- `client.js` 浏览器半体：侧边栏图标 + 阅读面板 + 设置页（三个 slot 注册）
- `CONTRACT.md` 两半之间的唯一契约（HTTP + 数据结构），也记录了历次审查踩到的坑

## 它做什么

1. 每天 `08:00`（可改）抓一遍你在源列表里勾选的源；
2. 去掉重复条目，按时间倒序取最新 80 条交给模型；
3. 模型按你写的**兴趣描述**逐条判断「保留 / 丢弃」，丢弃的也记理由；
4. 对保留的每一条写 2–3 句中文总结；
5. 结果落盘 + 侧边栏阅读界面呈现。**默认不注入 systemPrompt**（省上下文），需要时在设置里勾上才注入。

## 数据在哪

```
~/.dsh/dsh-news/
  config.json             兴趣描述 / 源 / 时间 / 代理 / 模型
  digest/2026-11-03.json  当天完整结果（含被滤掉的条目与理由）
  digest/2026-11-03.md    当天简报全文（Markdown，可直接复制/存档）
  cache/summaries.json    逐条摘要缓存（30 天，按条目 id）
```

## 默认的 16 个源

开箱启用 13 个：OpenAI News、Anthropic News（网页抓取）、Google DeepMind、Google AI Blog、HuggingFace Blog、The Verge AI、TechCrunch AI、Google News 关键词、Hacker News、arXiv cs.AI、Claude Code Releases（GitHub releases）、爱范儿、少数派。

## 论文源的闸门（0.4.0 起）

arXiv 每天 300 条，默认只让它贡献 **2 条候选**（源的「候选上限」字段可调），
筛选 prompt 里也写明：常规增量论文一律丢，只有明显突破 / 知名机构 / 开源可复现 /
刷新榜单 / 已引起讨论的才留。想彻底关掉就在源列表里取消勾选。

## 品味学习（0.5.0 起）

阅读界面每条新闻底部有「值得看 / 不想看」。点满 25 条新反馈会后台自动提炼一次，产出一份
「可迁移判据」（不是记标题），拼进每天的筛选 prompt；设置页能看全文，也能手动提炼。

**复原**：设置 → 每日简报 → 品味档案 → 「复原」，点两下清空全部反馈与档案，回到从没学过的状态
（会在数据目录留一份 `feedback.backup-*.json`）。

## 摘要质量（0.4.1 起）

- 源给的 description 会先清洗：Hacker News 那种 `Article URL: … Points: 532` 的元数据不会进模型；
- 摘要 2400 tokens，被截断会自动用「只写两句」的紧凑模式重试一次；
- 强制简体中文输出（英文源也给中文总结），并禁止把 URL / 评论数写进摘要。

## 摘要怎么来的（0.3.0 起）

每条保留项都会**再抓一次原文正文**（上限 2600 字）喂给模型，而不是只用 RSS 那行摘要——
后者常常只有一百来字，写出来的总结只能是标题改写。提示词要求 3–6 句、200–300 字，
并且必须保留原文里的具体数字、版本号、机构名。

## 候选怎么选（0.2.0 起）

不是「按时间取最新 80 条」——那等于按更新频率发门票，官网/blog 这类低频源永远挤不进去。
现在的规则是**每源保底 2 条 → 剩余按时间补齐 → 单源不超过上限**，保证官方源、arXiv、中文深度媒体每天都有位置。

默认关闭 3 个（Reddit r/LocalLLaMA、B 站 UP 主、YouTube 频道）——它们需要你先配好 **RSSHub** 或能出网的代理，否则抓回来只有错误。

## 抓取通道（实测过的坑）

同一台机器上不同源需要的通道不一样：DeepMind / Google AI / HuggingFace / Google News 只有走代理才通，而 The Verge / Anthropic 走代理反而失败。

所以 `proxy` 留空时是**自动**：每个源先直连，失败再走探测到的本机代理（`7890 / 1087 / 8888 / 6152` 探测），每个源各自记录实际用了哪条通道（简报里的「源状态」能看到）。

- `proxy: ""` → 自动
- `proxy: "direct"` → 只直连
- `proxy: "http://127.0.0.1:7890"` → 只走该代理

## 依赖外部服务的地方

| 源类型 | 需要什么 |
|---|---|
| B 站 / YouTube | 本地或可访问的 RSSHub，填进「RSSHub 基址」（默认 `http://127.0.0.1:1200`） |
| Reddit | 通常要代理：`reddit.com/r/xxx/.rss` 对机房 IP 返回 403/429 |

## 已知限制

- **定时只在 Harness 进程活着时触发**。08:00 没开机就当天不生成，下次启动会补一次（当天没有才补，不覆盖已有结果）。
- 生成一次要调 1 次筛选 + N 次逐条总结（默认模型开了 reasoning，实测 10 源 80 条 → 24 条保留，约 20 秒完成）。
- `npm run` 之类的不存在：这是个零依赖 ESM 包，只用 `node:` 内置模块。

## 开发

```bash
node --check index.js
node --check client.js
node --test test/host.test.mjs test/client.smoke.test.mjs   # 85 个用例，不联网
```

改完重新安装（会把改动链接进 profile）：

```
plugin_manager: install_bundle, target=/Users/dp/Documents/deepseek-harness/dsh-news
```

接口约定（HTTP + 数据结构）见 [CONTRACT.md](./CONTRACT.md)。
