# dsh-news：每日 AI 简报

把十几个 AI 信息源抓下来，**由模型判断哪些值得你花时间**，再逐条写清「这条讲了什么」。

ChatGPT 桌面版在本地 Work 或 Codex 聊天里使用。DeepSeek Harness 提供两个界面。

- **侧边栏「每日简报」** → 完整阅读界面（日期可前后翻、按分类成文、被滤掉的条目可展开看理由、信息源状态、复制 Markdown、重新生成）
- **设置 →「每日简报」** → 只管配置（兴趣描述、信息源、时间、代理、模型）

## 安装

### DeepSeek Harness

在 Harness 对话中使用插件管理器安装 npm 包。

```text
plugin_manager install_bundle target=@fffangchenghao/dsh-news
```

使用 Web profile 也可以在终端运行 `dsh plugin --profile web add @fffangchenghao/dsh-news`。安装后，在侧边栏打开「每日简报」，或在设置中调整兴趣与信息源。开发时可将 `install_bundle` 的 target 换成本地仓库的绝对路径。

如果当前 profile 已启用旧的本地包 `@local/dsh-news`，切换到 npm 版时先停用旧包，再安装新包。两个版本沿用同一个插件行 ID，兴趣、反馈和历史简报都保存在 `~/.dsh/dsh-news`。 [npm 软件包](https://www.npmjs.com/package/@fffangchenghao/dsh-news)

### ChatGPT 桌面版

安装 Node.js 22+、curl 和 Codex CLI 后，在一个打算保留的目录中运行以下命令。

```bash
npm install @fffangchenghao/dsh-news
codex plugin marketplace add ./node_modules/@fffangchenghao/dsh-news
codex plugin add dsh-news@dsh-news-plugins
```

从 GitHub 源码安装时，在仓库根目录运行 `codex plugin marketplace add .`，再运行上面的 `codex plugin add` 命令。

在 ChatGPT 桌面版开启新的**本地 Work 或 Codex 聊天**，输入 `@` 选择「每日 AI 简报」，然后说「按我的兴趣整理今天的 AI 新闻」。也可以说「查看昨天的简报」、「重新抓取并筛选今天的新闻」或「以后优先看开源模型和有实测数据的工程文章」。普通请求会复用当天的归档。抓取、去重、探索配额和历史记录与 Harness 共用，桌面插件按聊天请求运行。 [本地插件说明](https://developers.openai.com/plugins/deploy/desktop-only)

用 ChatGPT 账户登录时，当前聊天的模型直接完成筛选和摘要，计入相应的套餐用量，无需配置模型 API 密钥。Harness 定时任务仍使用其宿主配置的模型。单独调用 OpenAI API 适用 API 平台计费，部分符合条件的 Pro 和 Business 订阅可领取独立的 API 赠金。 [Work 与 Codex 的用量说明](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) · [API 赠金说明](https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions)

## 开发

```bash
node --check index.js && node --check client.js
npm test   # 离线运行宿主、阅读界面和桌面插件测试
```

- `index.js` 是 Harness 的入口，两个宿主共用的抓取、筛选、归档逻辑在 `desktop/runtime.mjs`，桌面聊天的分步命令在 `desktop/skills/daily-ai-news/scripts/news.mjs`。
- `client.js` 浏览器半体：侧边栏图标 + 阅读面板 + 设置页（三个 slot 注册）
- `CONTRACT.md` 两半之间的唯一契约（HTTP + 数据结构），也记录了历次审查踩到的坑

## 它做什么

1. 每天 `08:00`（可改）抓取已启用的信息源，也可以在阅读面板点「重新生成」并查看进度。
2. 先排除过期和最近推过的新闻，再按信息源分配候选名额。默认看最近 3 天的稿件，跳过最近 7 天已推过的条目，最多送 80 条给模型。
3. 模型按你的**兴趣描述**逐条决定留弃并记录理由。探索位只从符合领域要求的落选稿件里挑，空余名额用于常规保留项。
4. 为入选稿件写中文摘要，优先复用最近 30 天的摘要缓存。
5. 简报保存在本地，也能在侧边栏阅读。默认把前 10 条注入 systemPrompt，可在设置里关闭。

## 数据在哪

```
~/.dsh/dsh-news/
  config.json             兴趣描述 / 源 / 时间 / 代理 / 模型
  digest/2026-11-03.json  当天完整结果（含被滤掉的条目与理由）
  digest/2026-11-03.md    当天简报全文（Markdown，可直接复制/存档）
  chatgpt/digest/YYYY-MM-DD.json  桌面聊天生成的归档，含 Markdown 全文
  cache/chatgpt/          聊天本轮使用的候选和素材，之后整理新闻时清理超过 7 天的任务
  cache/summaries.json    Harness 的逐条摘要缓存（30 天），桌面版也可复用
```

两个入口都使用 0.15.0 或更高版本时，均可读取对方的简报。如果同日都生成过，按完成时间展示较新的一份。可通过 `DSH_NEWS_HOME` 更换共用的数据目录。

## 内置的 18 个源

默认启用 OpenAI News、Anthropic News、Google DeepMind、Google AI Blog、Hugging Face Blog、The Verge AI、TechCrunch AI、Google News 关键词、Hacker News、arXiv cs.AI、Claude Code Releases、爱范儿、少数派、量子位，共 14 个。

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

生成新摘要时，插件给模型最多 2600 字的正文，要求用 3–6 句话写清文中的数字、版本号和机构名。RSS 或 Atom 已提供足够长的正文时，可以省去网页请求。arXiv 的订阅摘要达到 200 字符时直接使用论文摘要，超长摘要同时保留开头的方法和结尾的结果。

若原文暂时不可用，简报会标明有多少条仅依据标题和源摘录生成。再次整理时会重试这些条目的原文。取到正文后更新摘要，素材没变则沿用上次的摘要。

## 候选怎么选（0.2.0 起）

不是「按时间取最新 80 条」——那等于按更新频率发门票，官网/blog 这类低频源永远挤不进去。
现在的规则是**每源保底 2 条 → 剩余按时间补齐 → 单源不超过上限**，保证官方源、arXiv、中文深度媒体每天都有位置。

默认关闭机器之心 Synced、Reddit r/LocalLLaMA、B 站 UP 主和 YouTube 频道。B 站与 YouTube 可通过自配的 RSSHub 抓取。

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
- 通常只需一次模型筛选。大批候选的输出被截断或无法解析时，插件会分成两批各重试一次。探索挑选和缺少缓存的逐条摘要会另外调用模型。
