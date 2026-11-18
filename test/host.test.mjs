/**
 * 宿主半体的离线测试：不联网、不碰 ~/.dsh、不启动 HTTP 服务。
 * 覆盖纯函数（解析/去重/截断/筛选解析/配置校验/Markdown）+ 运行时集成（假 curl + 假 llm）+ 5 条路由。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as news from '../index.js';

// ---------------------------------------------------------------------------
// 基础夹具
// ---------------------------------------------------------------------------

const NOW = new Date(2026, 10, 3, 9, 0, 0); // 本地 2026-11-03 09:00
const TODAY = news.localDateString(NOW);

const RSS_A = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Feed A</title>
    <item>
      <title><![CDATA[OpenAI 发布新模型 &amp; 新基准]]></title>
      <link>https://a.example/posts/1?utm_source=rss&amp;utm_medium=feed</link>
      <description><![CDATA[<p>第一段 <b>正文</b>，<a href="https://a.example">链接</a>。</p>]]></description>
      <pubDate>Sat, 03 Oct 2026 08:00:00 +0800</pubDate>
    </item>
    <item>
      <title>Second story</title>
      <link>https://a.example/posts/2</link>
      <guid isPermaLink="false">https://a.example/posts/2</guid>
      <description>Plain second story</description>
      <dc:date>2026-10-02T09:00:00Z</dc:date>
    </item>
  </channel>
</rss>`;

const ATOM_B = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Feed B</title>
  <link rel="self" href="https://b.example/atom.xml"/>
  <entry>
    <title>Atom one</title>
    <link rel="alternate" type="text/html" href="https://b.example/one"/>
    <updated>2026-10-04T10:00:00Z</updated>
    <summary type="html">Atom &lt;b&gt;summary&lt;/b&gt; one</summary>
  </entry>
  <entry>
    <title type="html">Atom two</title>
    <link href="https://b.example/two"/>
    <published>2026-10-01T10:00:00Z</published>
    <content type="html">&lt;p&gt;Body two&lt;/p&gt;</content>
  </entry>
</feed>`;

const EMPTY_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:arxiv="http://arxiv.org/schemas/atom"><channel><title>arXiv cs.AI</title></channel></rss>`;

function makeFeed(count, prefix = 'https://many.example/posts') {
  const items = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const day = String(28 - (index % 20)).padStart(2, '0');
    return `<item><title>Story ${n} about AI</title><link>${prefix}/${n}</link><description>Body ${n}</description><pubDate>2026-09-${day}T08:00:00Z</pubDate></item>`;
  }).join('');
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Many</title>${items}</channel></rss>`;
}

const ANTHROPIC_HTML = `<!DOCTYPE html><html lang="en"><body>
  <article class="tile-a">
    <header><p><a class="cat" href="/news/announcements">Announcements</a></p><time>Oct 18, 2026</time></header>
    <a class="media" href="/news/public-benefit-fund"><img alt="Investing in the public benefit" src="x.jpg"></a>
    <a class="tileLink" href="/news/public-benefit-fund"><h3>Investing in the public benefit</h3><p>We are committing a portion of shares.</p></a>
  </article>
  <article class="tile-b">
    <header><p><a class="cat" href="/news/product">Product</a></p><time datetime="2026-10-01T09:30:00Z">Oct 1, 2026</time></header>
    <a class="media" href="/news/new-model"><img alt="Introducing a new model"></a>
    <a class="tileLink" href="/news/new-model"><h2>Introducing a new model</h2><p>It is faster and cheaper.</p></a>
  </article>
</body></html>`;

function makeCurl(routes = {}) {
  const calls = [];
  const execCurl = async (url, options = {}) => {
    calls.push({ url, proxy: options.proxy ?? '', timeoutMs: options.timeoutMs });
    const handler = routes[url];
    if (handler === undefined) return { ok: false, status: 404, body: '', error: 'HTTP 404（地址不存在）' };
    if (typeof handler === 'function') return handler(options);
    return { ok: true, status: 200, body: handler, error: '' };
  };
  execCurl.calls = calls;
  return execCurl;
}

function filterJson(prompt, decide = (index) => index <= 2) {
  const count = Number(/共 (\d+) 条/.exec(prompt)?.[1] ?? 0);
  const list = Array.from({ length: count }, (_, index) => {
    const i = index + 1;
    return {
      i,
      keep: decide(i),
      category: i % 2 === 1 ? '模型与评测' : '开源与生态',
      reason: decide(i) ? '与用户的兴趣点直接相关' : '信息量不足，属于重复报道',
    };
  });
  return JSON.stringify(list);
}

function makeLlm(options = {}) {
  const calls = [];
  const llm = {
    calls,
    stream(request) {
      calls.push(request);
      const isSummary = String(request.system ?? '').startsWith('你是中文科技编辑');
      const prompt = request.messages?.[0]?.content?.[0]?.text ?? '';
      async function* generate() {
        if (isSummary) {
          const summary = typeof options.summary === 'function' ? options.summary(prompt) : options.summary;
          yield { type: 'text-delta', text: summary ?? '这是测试摘要。第一条事实。第二条影响。' };
          yield { type: 'finish', reason: { kind: 'stop' } };
          return;
        }
        if (typeof options.filter === 'function') {
          const custom = await options.filter(prompt, calls.length);
          if (custom && custom.__chunks) {
            for (const chunk of custom.__chunks) yield chunk;
            return;
          }
          yield { type: 'text-delta', text: String(custom) };
          yield { type: 'finish', reason: { kind: 'stop' } };
          return;
        }
        yield { type: 'text-delta', text: filterJson(prompt) };
        yield { type: 'finish', reason: { kind: 'stop' } };
      }
      return generate();
    },
  };
  llm.summaryCalls = () => calls.filter((call) => String(call.system ?? '').startsWith('你是中文科技编辑'));
  llm.filterCalls = () => calls.filter((call) => !String(call.system ?? '').startsWith('你是中文科技编辑'));
  return llm;
}

function makeFakeCtx(services = {}) {
  const routes = [];
  const prompts = [];
  const effects = [];
  const logger = { debug() {}, info() {}, warn() {}, error() {} };
  const server = {
    register(route) {
      routes.push(route);
      return () => {
        route.disposed = true;
      };
    },
  };
  const promptService = {
    section(spec) {
      prompts.push(spec);
      return () => {
        spec.disposed = true;
      };
    },
  };
  const resolved = { webServer: server, systemPrompt: promptService, ...services };
  const get = (name) => resolved[name];
  const effect = (fn, label) => {
    const dispose = fn();
    effects.push({ label, dispose });
    return dispose;
  };
  const inject = (names, callback) => {
    const sub = { logger: () => logger, get, effect, inject, routes, prompts, effects };
    for (const name of names) sub[name] = resolved[name];
    return callback(sub);
  };
  return { logger: () => logger, get, effect, inject, routes, prompts, effects, services: resolved };
}

function makeReq({ method = 'GET', url = '/', headers = {}, body, remoteAddress = '127.0.0.1' } = {}) {
  const request = { method, url, headers, body, socket: { remoteAddress } };
  request[Symbol.asyncIterator] = async function* iterator() {
    const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
    if (text) yield Buffer.from(text);
  };
  return request;
}

function makeRes() {
  return {
    status: 0,
    headers: undefined,
    body: '',
    writableEnded: false,
    headersSent: false,
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
      this.headersSent = true;
    },
    setHeader() {},
    end(payload) {
      this.body = payload ?? '';
      this.writableEnded = true;
    },
    json() {
      return JSON.parse(this.body);
    },
  };
}

async function callRoute(ctx, routePath, options = {}) {
  const route = ctx.routes.find((entry) => entry.path === routePath);
  assert.ok(route, `路由 ${routePath} 没有注册`);
  const request = makeReq({ url: routePath, ...options });
  const response = makeRes();
  await route.handler(request, response);
  return { response, json: JSON.parse(response.body) };
}

async function makeRuntime(t, options = {}) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'dsh-news-test-'));
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  const ctx = options.ctx ?? makeFakeCtx(options.services ?? {});
  const runtime = news.createRuntime({
    ctx,
    root,
    execCurl: options.execCurl ?? makeCurl(),
    probeProxy: options.probeProxy ?? (async () => null),
    now: options.now ?? (() => NOW),
  });
  if (options.config) {
    await fsp.writeFile(path.join(root, 'config.json'), JSON.stringify(options.config, null, 2));
  }
  return { root, ctx, runtime };
}

function smallConfig(patch = {}) {
  const base = news.defaultConfig();
  return {
    ...base,
    // 测试默认关掉探索位与时效/重复过滤（夹具用的是固定旧日期），需要它的用例显式打开
    exploreRatio: 0,
    maxAgeDays: 0,
    repeatWindowDays: 0,
    model: { provider: 'test-provider', model: 'test-model' },
    sources: [
      { id: 'feed-a', name: 'Feed A', type: 'rss', url: 'https://a.example/rss', category: '媒体', enabled: true },
      { id: 'feed-b', name: 'Feed B', type: 'rss', url: 'https://b.example/atom', category: '官方', enabled: true },
      { id: 'broken', name: 'Broken', type: 'rss', url: 'https://broken.example/rss', category: '社区', enabled: true },
    ],
    ...patch,
  };
}

function defaultCurl() {
  return makeCurl({
    'https://a.example/rss': RSS_A,
    'https://b.example/atom': ATOM_B,
    'https://broken.example/rss': () => ({ ok: false, status: 0, body: '', error: 'curl 7：连接失败（可能被墙、被限流，或需要代理）' }),
  });
}

// ---------------------------------------------------------------------------
// 默认配置
// ---------------------------------------------------------------------------

test('defaultConfig: 18 个源、默认开关与兴趣画像符合产品约定', () => {
  const config = news.defaultConfig();
  assert.equal(config.enabled, true);
  assert.equal(config.dailyTime, '08:00');
  assert.equal(config.announceToAgent, true);
  assert.equal(config.maxCandidates, 80);
  assert.equal(config.maxItems, 25);
  assert.equal(config.proxy, '');
  assert.equal(config.rsshubBase, 'http://127.0.0.1:1200');
  assert.deepEqual(config.model, { provider: '', model: '' });
  assert.equal(config.sources.length, 18);
  assert.match(config.interests, /我在跟踪 AI 领域的进展/);
  assert.match(config.interests, /不要保留/);

  const byId = Object.fromEntries(config.sources.map((source) => [source.id, source]));
  for (const id of [
    'openai-news',
    'anthropic-news',
    'deepmind',
    'google-ai',
    'hf-blog',
    'verge-ai',
    'techcrunch-ai',
    'google-news-ai',
    'hn-front',
    'arxiv-cs-ai',
    'claude-code-releases',
    'ifanr',
    'sspai',
    'qbitai',
  ]) {
    assert.equal(byId[id].enabled, true, `${id} 应默认启用`);
  }
  for (const id of ['reddit-localllama', 'bilibili-up', 'youtube-ch', 'synced-review']) {
    assert.equal(byId[id].enabled, false, `${id} 应默认关闭`);
  }
  assert.match(byId['google-news-ai'].url, /^OpenAI OR Anthropic OR 大模型 OR 生成式AI/);
  assert.match(byId['google-news-ai'].url, /Apple Intelligence/);
  assert.equal(byId['anthropic-news'].type, 'anthropic-html');
});

// ---------------------------------------------------------------------------
// 源适配
// ---------------------------------------------------------------------------

test('resolveSourceUrl: 六种 type 都能解析出真实地址', () => {
  const config = { rsshubBase: 'http://127.0.0.1:1200/' };

  assert.equal(news.resolveSourceUrl({ type: 'rss', url: 'https://x.example/feed' }, config).url, 'https://x.example/feed');

  const google = news.resolveSourceUrl({ type: 'google-news', url: 'OpenAI OR Anthropic' }, config);
  assert.match(google.url, /^https:\/\/news\.google\.com\/rss\/search\?q=OpenAI%20OR%20Anthropic&hl=zh-CN&gl=CN&ceid=CN:zh-Hans$/);

  assert.equal(news.resolveSourceUrl({ type: 'reddit', url: 'r/LocalLLaMA' }, config).url, 'https://www.reddit.com/r/LocalLLaMA/.rss');
  assert.equal(
    news.resolveSourceUrl({ type: 'reddit', url: 'https://www.reddit.com/r/MachineLearning/' }, config).url,
    'https://www.reddit.com/r/MachineLearning/.rss',
  );

  assert.equal(
    news.resolveSourceUrl({ type: 'youtube', url: 'UCabcdefghijklmnopqrstuv' }, config).url,
    'http://127.0.0.1:1200/youtube/channel/UCabcdefghijklmnopqrstuv',
  );
  assert.equal(
    news.resolveSourceUrl({ type: 'bilibili', url: 'https://space.bilibili.com/123456' }, config).url,
    'http://127.0.0.1:1200/bilibili/user/video/123456',
  );
  assert.equal(news.resolveSourceUrl({ type: 'anthropic-html', url: 'news' }, config).url, 'https://www.anthropic.com/news');

  assert.match(news.resolveSourceUrl({ type: 'youtube', url: 'UCx' }, { rsshubBase: '' }).error, /rsshubBase/);
  assert.match(news.resolveSourceUrl({ type: 'bilibili', url: '1' }, { rsshubBase: '' }).error, /rsshubBase/);
  assert.match(news.resolveSourceUrl({ type: 'rss', url: 'ftp://x' }, config).error, /http/);
  assert.match(news.resolveSourceUrl({ type: 'nope', url: 'x' }, config).error, /不支持/);
});

test('parseFeed: RSS 2.0 处理 CDATA / 实体 / pubDate / guid 兜底', () => {
  const items = news.parseFeed(RSS_A);
  assert.equal(items.length, 2);

  assert.equal(items[0].title, 'OpenAI 发布新模型 & 新基准');
  assert.equal(items[0].url, 'https://a.example/posts/1?utm_source=rss&utm_medium=feed');
  assert.equal(items[0].excerpt, '第一段 正文，链接。');
  assert.equal(items[0].publishedAt, '2026-10-03T00:00:00.000Z');

  assert.equal(items[1].url, 'https://a.example/posts/2');
  assert.equal(items[1].publishedAt, '2026-10-02T09:00:00.000Z');
});

test('parseFeed: Atom 用 <link href>（跳过 self），时间取 updated/published', () => {
  const items = news.parseFeed(ATOM_B);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Atom one');
  assert.equal(items[0].url, 'https://b.example/one');
  assert.equal(items[0].excerpt, 'Atom summary one');
  assert.equal(items[0].publishedAt, '2026-10-04T10:00:00.000Z');
  assert.equal(items[1].url, 'https://b.example/two');
  assert.equal(items[1].publishedAt, '2026-10-01T10:00:00.000Z');
});

test('parseFeed: 没有 link 时用 guid/id；标题或链接缺失的条目跳过', () => {
  const xml = `<rss><channel>
    <item><title>By guid</title><guid>https://g.example/1</guid></item>
    <item><title>No url</title></item>
    <item><link>https://nope.example/1</link></item>
  </channel></rss>`;
  const items = news.parseFeed(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://g.example/1');
});

test('parseFeed: 摘要去 HTML 且截断到 400 字符以内', () => {
  const long = `<p>${'长'.repeat(900)}</p>`;
  const items = news.parseFeed(
    `<rss><channel><item><title>T</title><link>https://x.example/1</link><description><![CDATA[${long}]]></description></item></channel></rss>`,
  );
  assert.equal(items.length, 1);
  assert.ok(items[0].excerpt.length <= 400);
  assert.ok(items[0].excerpt.endsWith('…'));
});

test('parseFeed: 合法空 feed 返回空数组（不是错误）', () => {
  assert.deepEqual(news.parseFeed(EMPTY_FEED), []);
  assert.equal(news.looksLikeFeed(EMPTY_FEED), true);
  assert.equal(news.looksLikeFeed('<html><body>nope</body></html>'), false);
});

test('parseAnthropicHtml: 过滤分类入口、合并同 slug、取 time 文本与 datetime', () => {
  const items = news.parseAnthropicHtml(ANTHROPIC_HTML);
  assert.equal(items.length, 2);

  assert.equal(items[0].title, 'Investing in the public benefit');
  assert.equal(items[0].url, 'https://www.anthropic.com/news/public-benefit-fund');
  assert.equal(items[0].excerpt, 'We are committing a portion of shares.');
  assert.equal(items[0].publishedAt, news.toIsoDate('Oct 18, 2026'));

  assert.equal(items[1].title, 'Introducing a new model');
  assert.equal(items[1].url, 'https://www.anthropic.com/news/new-model');
  assert.equal(items[1].publishedAt, '2026-10-01T09:30:00.000Z');

  assert.ok(items.every((item) => !item.url.includes('/news/announcements')));
  assert.ok(items.every((item) => !item.url.includes('/news/product')));
});

// ---------------------------------------------------------------------------
// 去重 / 排序 / 截断
// ---------------------------------------------------------------------------

test('normalizeUrl: 去跟踪参数 / hash / www / 尾斜杠后相等', () => {
  const a = news.normalizeUrl('https://WWW.Example.com/post/?utm_source=x&b=2&a=1#frag');
  const b = news.normalizeUrl('https://example.com/post?a=1&b=2');
  assert.equal(a, b);
  assert.equal(news.normalizeUrl('not a url'), 'not a url');
});

test('prepareCandidates: 按 URL + 标题去重、时间倒序、截断 maxCandidates', () => {
  const raw = [
    { title: 'Same title', url: 'https://x.example/1', source: 'A', publishedAt: '2026-10-01T00:00:00Z' },
    { title: 'same TITLE', url: 'https://x.example/2', source: 'B', publishedAt: '2026-10-02T00:00:00Z' },
    { title: 'Other', url: 'https://x.example/1?utm_source=rss', source: 'C', publishedAt: '2026-10-03T00:00:00Z' },
    { title: 'Newest', url: 'https://x.example/3', source: 'D', publishedAt: '2026-10-05T00:00:00Z' },
    { title: 'Undated', url: 'https://x.example/4', source: 'E', publishedAt: '' },
    { title: 'No url', source: 'F', publishedAt: '2026-10-06T00:00:00Z' },
  ];
  const prepared = news.prepareCandidates(raw, 3);
  assert.equal(prepared.total, 3);
  assert.equal(prepared.items.length, 3);
  assert.deepEqual(
    prepared.items.map((item) => item.title),
    ['Newest', 'Same title', 'Undated'],
  );
  assert.match(prepared.items[0].id, /^[0-9a-f]{16}$/);
});

test('selectCandidates: 低频源不会被高频源挤掉（每源保底）', () => {
  const flood = [];
  for (let i = 0; i < 100; i += 1) {
    flood.push({
      title: `flood ${i}`,
      url: `https://flood.example/${i}`,
      source: '高频源',
      publishedAt: new Date(Date.UTC(2026, 10, 4, 10, 0, 0) - i * 60_000).toISOString(),
    });
  }
  const quiet = [
    { title: 'quiet A', url: 'https://quiet.example/a', source: '低频源', publishedAt: '2026-11-01T00:00:00Z' },
    { title: 'quiet B', url: 'https://quiet.example/b', source: '低频源', publishedAt: '2026-10-30T00:00:00Z' },
  ];
  const picked = news.selectCandidates([...flood, ...quiet], 10);
  const titles = picked.items.map((item) => item.title);
  assert.ok(titles.includes('quiet A'), '低频源最新一条必须有位置');
  assert.ok(titles.includes('quiet B'), '每源保底 2 条');
  assert.equal(picked.items.length, 10);
});

test('selectCandidates: 单源上限，不让一个源吃掉大半', () => {
  const a = Array.from({ length: 100 }, (_, i) => ({
    title: `A${i}`,
    url: `https://a.example/${i}`,
    source: 'A',
    publishedAt: new Date(Date.UTC(2026, 10, 4, 10, 0, 0) - i * 60_000).toISOString(),
  }));
  const b = Array.from({ length: 30 }, (_, i) => ({
    title: `B${i}`,
    url: `https://b.example/${i}`,
    source: 'B',
    publishedAt: new Date(Date.UTC(2026, 10, 4, 9, 0, 0) - i * 60_000).toISOString(),
  }));
  const picked = news.selectCandidates([...a, ...b], 20);
  const countA = picked.items.filter((item) => item.source === 'A').length;
  const countB = picked.items.filter((item) => item.source === 'B').length;
  assert.equal(picked.items.length, 20);
  assert.ok(countA <= picked.perSourceCap, `A 的上限 ${picked.perSourceCap}，实际 ${countA}`);
  assert.ok(countB <= picked.perSourceCap, `B 的上限 ${picked.perSourceCap}，实际 ${countB}`);
  assert.ok(countB >= 2, 'B 至少拿到保底');
});

test('selectCandidates: 裸对象（没有 urlKey/id）也不会被重复选中', () => {
  const raw = [];
  for (let i = 0; i < 5; i += 1) {
    raw.push({ title: `N${i}`, source: 'X', publishedAt: new Date(Date.UTC(2026, 10, 4, 10 - i)).toISOString() });
  }
  for (let i = 0; i < 30; i += 1) {
    raw.push({ title: `M${i}`, source: 'Y', publishedAt: new Date(Date.UTC(2026, 10, 3, 10 - i)).toISOString() });
  }
  const picked = news.selectCandidates(raw, 12);
  assert.equal(picked.items.length, 12);
  const seen = new Set();
  for (const item of picked.items) {
    assert.equal(seen.has(item), false, '同一个条目对象不能出现两次');
    seen.add(item);
  }
  assert.equal(picked.items.filter((item) => item.source === 'X').length, 5, '小源全部保留');
});

test('selectCandidates: 单源 maxItems 在分组层就生效（arXiv 不再吃掉候选）', () => {
  const papers = Array.from({ length: 40 }, (_, i) => ({
    title: `论文 ${i}`,
    url: `https://arxiv.org/abs/${i}`,
    sourceId: 'arxiv-cs-ai',
    source: 'arXiv cs.AI',
    publishedAt: new Date(Date.UTC(2026, 10, 5, 10, 0, 0) - i * 60_000).toISOString(),
  }));
  const newsItems = Array.from({ length: 20 }, (_, i) => ({
    title: `新闻 ${i}`,
    url: `https://news.example/${i}`,
    sourceId: 'tc',
    source: 'TechCrunch AI',
    publishedAt: new Date(Date.UTC(2026, 10, 5, 9, 0, 0) - i * 60_000).toISOString(),
  }));
  const out = news.selectCandidates([...papers, ...newsItems], 20, {
    sourceLimits: { 'arxiv-cs-ai': 2 },
  });
  const papersKept = out.items.filter((item) => item.sourceId === 'arxiv-cs-ai').length;
  const newsKept = out.items.filter((item) => item.sourceId === 'tc').length;
  assert.equal(papersKept, 2, 'arXiv 最多贡献 2 条候选');
  // 只有 2 个源时单源上限 = max(ceil(20/2)+4, ceil(20*0.35)) = 14，所以总数是 2+14
  assert.equal(newsKept, 14, '新闻源受单源上限约束，但依然拿满了名额');
  assert.equal(out.items.length, 16);
});

test('selectCandidates: 只有一个源时等于不设限', () => {
  const only = Array.from({ length: 50 }, (_, i) => ({
    title: `S${i}`,
    url: `https://s.example/${i}`,
    source: '单源',
    publishedAt: new Date(Date.UTC(2026, 10, 4, 10, 0, 0) - i * 60_000).toISOString(),
  }));
  const picked = news.selectCandidates(only, 10);
  assert.equal(picked.items.length, 10);
});

test('selectCandidates: 候选不足时原样返回（不补空）', () => {
  const few = [
    { title: 'x', url: 'https://x.example/1', source: 'X', publishedAt: '2026-11-04T00:00:00Z' },
  ];
  const picked = news.selectCandidates(few, 10);
  assert.equal(picked.items.length, 1);
  assert.equal(picked.perSourceCap, null);
});

test('coerceFeedback: 坏数据退回空结构，合法票保留', () => {
  const empty = news.coerceFeedback(undefined);
  assert.deepEqual(empty.votes, {});
  assert.equal(empty.profile.text, '');
  const ok = news.coerceFeedback({
    votes: {
      a: { vote: 'up', at: 1, title: '英伟达人事变动', source: 'TC', category: '产业', reason: '产业链动态' },
      b: { vote: 'maybe', at: 2 },
    },
  });
  assert.equal(Object.keys(ok.votes).length, 1);
  assert.equal(ok.votes.a.vote, 'up');
});

test('buildDistillPrompt: 要求提炼可迁移判据并写边界', () => {
  const { system, prompt } = news.buildDistillPrompt({
    votes: {
      a: { vote: 'up', at: 2, title: '英伟达要开除黄仁勋', source: 'TC', category: '产业', reason: '产业链' },
      b: { vote: 'down', at: 1, title: '某 CEO 的私生活', source: 'X', category: '八卦', reason: '人物' },
    },
    currentProfile: '',
    interests: 'AI 产业',
  });
  assert.match(system, /可迁移/);
  assert.match(system, /边界/);
  assert.match(prompt, /👍/);
  assert.match(prompt, /👎/);
  assert.match(prompt, /AI 产业/);
});

test('buildTasteSection: 没有档案就返回空串', () => {
  assert.equal(news.buildTasteSection({ text: '' }), '');
  assert.match(news.buildTasteSection({ text: '## 值得看\n- 芯片产业链' }), /学到的品味/);
});

test('pickExploration: 优先冷门来源，同日结果稳定，可排除已选', () => {
  const dropped = [
    { id: '1', title: '某大模型发布新版本', source: '常见源', category: '模型与评测' },
    { id: '2', title: '量子计算实现新突破', source: '冷门源', category: '安全与治理' },
    { id: '3', title: 'AI 芯片供应链新动向', source: '冷门源', category: '安全与治理' },
  ];
  const opts = { seed: '2026-11-12', keptSources: ['常见源'], keptCategories: ['模型与评测'] };
  const first = news.pickExploration(dropped, 1, opts);
  const again = news.pickExploration(dropped, 1, opts);
  assert.equal(first.length, 1);
  assert.equal(first[0].id, again[0].id, '同一天同样的种子结果必须稳定');
  assert.notEqual(first[0].source, '常见源', '优先挑今天没出现过的来源');
  assert.equal(first[0].explore, true);
});

test('applyConfigPatch: 保存配置不会丢掉单源 maxItems', () => {
  const base = news.defaultConfig();
  const patched = news.applyConfigPatch(base, {
    sources: base.sources.map((s) => (s.id === 'arxiv-cs-ai' ? { ...s, maxItems: 2 } : s)),
  });
  const arxiv = patched.sources.find((s) => s.id === 'arxiv-cs-ai');
  assert.equal(arxiv.maxItems, 2, 'arXiv 候选上限必须原样带回');
  const again = news.applyConfigPatch(patched, { interests: '只改兴趣描述' });
  assert.equal(again.sources.find((s) => s.id === 'arxiv-cs-ai').maxItems, 2, '再保存一次也不能丢');
});

test('selectCandidates: 候选不足上限时，单源 maxItems 仍然生效', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({
    id: 'p' + i, title: '论文 ' + i, url: 'https://arxiv.org/abs/' + i,
    sourceId: 'arxiv-cs-ai', source: 'arXiv cs.AI', publishedAt: new Date(Date.UTC(2026, 10, 5, i)).toISOString(),
  }));
  const out = news.selectCandidates(items, 80, { sourceLimits: { 'arxiv-cs-ai': 2 } });
  assert.equal(out.items.length, 2, '不足 maxCandidates 时也必须按单源上限裁剪');
});

test('filterFreshness: 丢掉过旧条目，保留无日期的', () => {
  const now = Date.UTC(2026, 10, 18, 0, 0, 0);
  const items = [
    { id: 'old2025', title: '老帖', publishedAt: '2025-06-24T00:00:00Z' },
    { id: 'old4d', title: '四天前', publishedAt: new Date(now - 4 * 86400000).toISOString() },
    { id: 'fresh', title: '今天', publishedAt: new Date(now - 3600000).toISOString() },
    { id: 'undated', title: '无日期' },
  ];
  const out = news.filterFreshness(items, { nowMs: now, maxAgeDays: 3 });
  assert.deepEqual(out.items.map((i) => i.id), ['fresh', 'undated']);
  assert.deepEqual(out.dropped.map((i) => i.id), ['old2025', 'old4d']);
});

test('filterFreshness: maxAgeDays=0 表示不限制', () => {
  const items = [{ id: 'a', publishedAt: '2020-01-01T00:00:00Z' }];
  assert.equal(news.filterFreshness(items, { maxAgeDays: 0 }).items.length, 1);
});

test('filterRepeats: 最近推过的 id 与同名标题都跳过', () => {
  const items = [
    { id: 'x', title: 'Gemini 4 Hydrogen 发布', source: 'DeepMind' },
    { id: 'y', title: '全新的一条新闻', source: 'TC' },
  ];
  const out = news.filterRepeats(items, { seenIds: new Set(['x']) });
  assert.deepEqual(out.items.map((i) => i.id), ['y']);
  const byTitle = news.filterRepeats(items, {
    seenTitles: new Set([news.normalizeTitleForDedup('Gemini 4 Hydrogen 发布', 'DeepMind')]),
  });
  assert.deepEqual(byTitle.items.map((i) => i.id), ['y']);
});

test('stripOutletSuffix: 只删真正的媒体后缀，不动标题正文', () => {
  assert.equal(news.stripOutletSuffix('OpenAI - 发布 API'), 'OpenAI - 发布 API', '不能把正文当媒体名删掉');
  assert.equal(news.stripOutletSuffix('特努斯施压 Siri - 爱范儿'), '特努斯施压 Siri');
  assert.equal(news.stripOutletSuffix('警方通报 | 界面新闻'), '警方通报');
  assert.equal(news.stripOutletSuffix('New model | TechCrunch', 'TechCrunch'), 'New model');
});

test('collapseDuplicates: 后缀里的数字不参与版本比较', () => {
  const items = [
    { title: 'GPT 4.1 发布 - 36氪', source: 'Google News', sourceId: 'g' },
    { title: 'GPT 4.1 发布 - 爱范儿', source: '爱范儿', sourceId: 'i' },
  ];
  assert.equal(news.collapseDuplicates(items).kept.length, 1, '同一新闻应合并');
  const different = [
    { title: 'Model 1.10 发布', source: 'A', sourceId: 'a' },
    { title: 'Model 11.0 发布', source: 'B', sourceId: 'b' },
  ];
  assert.equal(news.collapseDuplicates(different).kept.length, 2, '版本不同不能合并');
});

test('isPrivateUrl: IPv4-mapped IPv6 与域名不误判', () => {
  assert.equal(news.isPrivateUrl('http://[::ffff:127.0.0.1]/'), true, 'IPv4 映射要还原成 127.0.0.1');
  assert.equal(news.isPrivateUrl('http://[::ffff:8.8.8.8]/'), false);
  assert.equal(news.isPrivateUrl('https://fda.gov/a'), false, '域名不能按 fc/fd 前缀判断');
  assert.equal(news.isPrivateUrl('http://[fe80::1]/'), true);
});

test('redactSecrets: 错误信息里抹掉代理密码与 token', () => {
  assert.match(news.redactSecrets('http://user:pw@127.0.0.1:7890/x'), /\*\*\*:\*\*\*@/);
  assert.doesNotMatch(news.redactSecrets('https://ex.com/rss?token=abc'), /abc/);
});

test('parseFilterResponse: 零基与一基混用时报错而不是猜', () => {
  const mixed = JSON.stringify([
    { i: 0, keep: true, category: '模型与评测', reason: 'x' },
    { i: 3, keep: true, category: '模型与评测', reason: 'y' },
  ]);
  assert.throws(() => news.parseFilterResponse(mixed, 3), /序号基准冲突/);
});

test('collapseDuplicates: 版本号 1.10 与 11.0 不合并', () => {
  const items = [
    { title: 'Model 1.10 发布', source: 'A', sourceId: 'a' },
    { title: 'Model 11.0 发布', source: 'B', sourceId: 'b' },
  ];
  const out = news.collapseDuplicates(items);
  assert.equal(out.kept.length, 2, '版本号不同不能合并');
});

test('parseExploreResponse: count 为 0 时返回空', () => {
  const pool = [{ id: 'a', title: 'AI 芯片' }];
  assert.deepEqual(news.parseExploreResponse('[{"i":1}]', pool, 0), []);
});

test('isPrivateUrl: 内网/回环地址一律拦下（SSRF）', () => {
  for (const url of [
    'http://127.0.0.1:8123/admin', 'http://localhost/x', 'http://10.0.0.5/',
    'http://192.168.1.1/', 'http://172.16.0.9/', 'http://169.254.169.254/latest/meta-data',
    'http://[::1]/', 'http://nas.local/',
  ]) {
    assert.equal(news.isPrivateUrl(url), true, url + ' 应该被拦下');
  }
  for (const url of ['https://techcrunch.com/a', 'https://arxiv.org/abs/1', 'http://8.8.8.8/']) {
    assert.equal(news.isPrivateUrl(url), false, url + ' 不应被拦');
  }
});

test('recordVote: 并发投票不会互相覆盖', async (t) => {
  const { runtime } = await makeRuntime(t, { services: { llm: makeLlm() }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);
  await Promise.all(
    ['a', 'b', 'c', 'd'].map((id) => callRoute(ctx, news.ROUTE_PATHS.feedback, {
      method: 'POST',
      body: JSON.stringify({ id, vote: 'up', title: 't' + id }),
    })),
  );
  const state = await callRoute(ctx, news.ROUTE_PATHS.state, { method: 'GET' });
  assert.equal(state.json.taste.voteCount, 4, '四条并发投票都要落盘');
});

test('tick: 过了 dailyTime 之后仍能补生成（不是只有那一分钟）', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    now: () => new Date(2026, 10, 3, 9, 30, 0),   // 09:30，早已过 08:00
    config: smallConfig({ dailyTime: '08:00' }),
  });
  const first = await runtime.tick('interval');
  assert.equal(first.ok, true, first.error);
  assert.equal(await runtime.hasDigest(TODAY), true, '过了时间点也应该生成');
});

test('isExplorationDomain: 只在 AI / 科技 / 科学 领域内探索', () => {
  assert.equal(news.isExplorationDomain({ title: '城市漫步指南｜夏末大阪' }), false);
  assert.equal(news.isExplorationDomain({ title: '某明星恋情曝光' }), false);
  assert.equal(news.isExplorationDomain({ title: '智能手表横评：五款主流产品' }), false);
  assert.equal(news.isExplorationDomain({ title: '英伟达三季度财报超预期' }), true);
  assert.equal(news.isExplorationDomain({ title: '国行 Apple 智能上手' }), true);
  assert.equal(news.isExplorationDomain({ title: '量子计算首次实现千比特整机' }), true);
});

test('pickExploration: 领域外的条目不会被选中', () => {
  const dropped = [
    { id: 'travel', title: '城市漫步指南｜夏末大阪', source: '少数派', category: '生活' },
    { id: 'ai', title: '大模型推理成本下降', source: '少数派', category: '模型与评测' },
  ];
  const picked = news.pickExploration(dropped, 2, { seed: 'x' });
  assert.equal(picked.length, 1);
  assert.equal(picked[0].id, 'ai');
});

test('buildExplorePrompt + parseExploreResponse: 只挑领域内、能解析序号', () => {
  const pool = [
    { id: 'a', title: '大模型推理优化', source: 'S1' },
    { id: 'b', title: '量子纠错新方法', source: 'S2' },
  ];
  const { system, prompt } = news.buildExplorePrompt(pool, 1);
  assert.match(system, /旅游、生活方式、娱乐八卦/);
  assert.match(prompt, /大模型推理优化/);
  const picked = news.parseExploreResponse('[{"i":2,"topic":"硬件"}]', pool, 2);
  assert.equal(picked.length, 1);
  assert.equal(picked[0].item.id, 'b');
  assert.equal(picked[0].topic, '硬件');
  assert.deepEqual(news.parseExploreResponse('不是 JSON', pool, 2), []);
});

test('buildFilterPrompt: 学到的品味会进 prompt', () => {
  const { prompt } = news.buildFilterPrompt({ interests: 'x' }, [], '## 值得看\n- 芯片产业链人事');
  assert.match(prompt, /学到的品味/);
  assert.match(prompt, /芯片产业链人事/);
});

test('sanitizeExcerpt: 去掉 HN 的 Article URL / Points 元数据', () => {
  const raw = 'Article URL: https://ex.com/a Comments URL: https://news.ycombinator.com/item?id=1 Points: 532 # Comments: 322';
  assert.equal(news.sanitizeExcerpt(raw), '');
  assert.equal(news.sanitizeExcerpt('第一段 正文，链接。'), '第一段 正文，链接。');
  assert.match(news.sanitizeExcerpt('Meta 发布 Spaces：一种和 Muse 智能体协作的新方式，附 https://ex.com/x'), /Meta 发布 Spaces/);
  assert.equal(news.sanitizeExcerpt('https://only-a-link.example/x'), '');
});

test('digestId: sha1(url|title) 前 16 位，稳定', () => {
  const id = news.digestId('https://x.example/1', 'Title');
  assert.equal(id, news.digestId('https://x.example/1', 'Title'));
  assert.notEqual(id, news.digestId('https://x.example/2', 'Title'));
  assert.match(id, /^[0-9a-f]{16}$/);
});

// ---------------------------------------------------------------------------
// 模型筛选结果解析
// ---------------------------------------------------------------------------

test('parseFilterResponse: 纯 JSON 数组', () => {
  const parsed = news.parseFilterResponse(
    '[{"i":1,"keep":true,"category":"模型与评测","reason":"新模型"},{"i":2,"keep":false,"category":"其他","reason":"营销"}]',
    2,
  );
  assert.equal(parsed.results.length, 2);
  assert.equal(parsed.results[0].keep, true);
  assert.equal(parsed.results[1].keep, false);
  assert.deepEqual(parsed.missing, []);
});

test('parseFilterResponse: 容忍 ```json 围栏与前后废话', () => {
  const text = '好的，结果如下：\n```json\n[{"i":1,"keep":true,"reason":"相关"}]\n```\n以上。';
  const parsed = news.parseFilterResponse(text, 1);
  assert.equal(parsed.results[0].keep, true);
});

test('parseFilterResponse: 支持 0 基序号与字符串 keep', () => {
  const parsed = news.parseFilterResponse(
    '[{"i":0,"keep":"yes","category":"产品与商业"},{"i":1,"keep":"no","reason":"不相关"}]',
    2,
  );
  assert.equal(parsed.results[0].keep, true);
  assert.equal(parsed.results[1].keep, false);
});

test('parseFilterResponse: 支持 {items:[...]} 包装、跳过非法项、记录重复', () => {
  const parsed = news.parseFilterResponse(
    JSON.stringify({
      items: [
        { i: 1, keep: true, reason: 'ok' },
        { i: 1, keep: false, reason: 'dup' },
        { i: 99, keep: true },
        { i: 'x', keep: true },
        { nope: true },
      ],
    }),
    2,
  );
  assert.equal(parsed.results[0].keep, true);
  assert.equal(parsed.results[1], null);
  assert.deepEqual(parsed.missing, [1]);
  assert.equal(parsed.duplicates, 1);
});

test('parseFilterResponse: 没有 JSON / 空数组 / 序号全越界都抛错', () => {
  assert.throws(() => news.parseFilterResponse('模型不想输出 JSON', 2), /JSON 数组/);
  assert.throws(() => news.parseFilterResponse('[]', 2), /空/);
  assert.throws(() => news.parseFilterResponse('[{"i":99,"keep":true}]', 2), /超出候选范围/);
});

test('applyFilterJudgement: 未判断的按保留处理，丢弃项带 reason', () => {
  const candidates = [
    { title: 'A', source: 'S', sourceCategory: '官方', url: 'https://x/1', publishedAt: '' },
    { title: 'B', source: 'S', sourceCategory: '官方', url: 'https://x/2', publishedAt: '' },
    { title: 'C', source: 'S', sourceCategory: '官方', url: 'https://x/3', publishedAt: '' },
  ];
  const parsed = {
    results: [
      { keep: true, category: '模型与评测', reason: '相关' },
      { keep: false, category: '', reason: '营销' },
      null,
    ],
    unknownKeep: 0,
  };
  const applied = news.applyFilterJudgement(candidates, parsed);
  assert.equal(applied.kept.length, 2);
  assert.equal(applied.kept[0].category, '模型与评测');
  assert.equal(applied.kept[1].category, '官方');
  assert.match(applied.kept[1].reason, /未给出判断/);
  assert.equal(applied.dropped.length, 1);
  assert.equal(applied.dropped[0].reason, '营销');
  assert.deepEqual(applied.missing, [2]);
});

// ---------------------------------------------------------------------------
// 保留上限 / Markdown / Prompt
// ---------------------------------------------------------------------------

test('selectTopItems: 按分类轮流取，超出上限的进入 truncated', () => {
  const items = [];
  for (let index = 0; index < 10; index += 1) {
    items.push({ title: `A${index}`, category: '模型与评测', publishedAt: `2026-10-${10 + index}T00:00:00Z` });
    items.push({ title: `B${index}`, category: '开源与生态', publishedAt: `2026-10-${10 + index}T00:00:00Z` });
  }
  const selected = news.selectTopItems(items, 6);
  assert.equal(selected.items.length, 6);
  assert.equal(selected.truncated.length, 14);
  assert.equal(selected.items.filter((item) => item.category === '模型与评测').length, 3);
  assert.equal(selected.items.filter((item) => item.category === '开源与生态').length, 3);
  assert.equal(selected.items[0].title, 'A9', '同类内按时间倒序');
});

test('buildMarkdown: 分类标题 / 链接 / 摘要 / reason / 已滤掉 / 错误 / 源状态', () => {
  const digest = {
    date: '2026-11-03',
    filterMode: 'llm',
    totals: { fetched: 2, kept: 1, dropped: 1, summarized: 1 },
    items: [
      {
        title: 'A [bracket] title',
        url: 'https://x.example/1',
        source: 'Feed A',
        category: '模型与评测',
        publishedAt: '2026-10-03T00:00:00Z',
        summary: '这条讲了 A。它还讲了 B。',
        reason: '与评测兴趣相关',
      },
    ],
    dropped: [{ title: 'Dropped', source: 'Feed B', reason: '营销' }],
    errors: ['源「Broken」抓取失败：HTTP 404'],
    sources: [{ name: 'Feed A', ok: true, count: 1, via: 'direct', error: '' }],
  };
  const markdown = news.buildMarkdown(digest);
  assert.match(markdown, /^# 每日 AI 简报 · 2026-11-03/m);
  assert.match(markdown, /## 模型与评测/);
  assert.match(markdown, /\[A \\\[bracket\\\] title\]\(<https:\/\/x\.example\/1>\)/);
  assert.ok(markdown.includes(`- 来源：Feed A ｜ ${news.formatLocalTime('2026-10-03T00:00:00Z')}`));
  assert.match(markdown, /这条讲了 A/);
  assert.match(markdown, /- 为什么留：与评测兴趣相关/);
  assert.match(markdown, /## 已滤掉/);
  assert.match(markdown, /## 生成时的问题/);
  assert.match(markdown, /## 源状态/);
  assert.match(markdown, /✅ Feed A：1 条（直连）/);
});

test('buildMarkdown: 空 digest 不崩', () => {
  const markdown = news.buildMarkdown({ date: '2026-11-03', items: [], dropped: [], sources: [], errors: [], totals: {} });
  assert.match(markdown, /今天没有保留任何条目/);
});

test('buildFilterPrompt: 带兴趣画像、全部候选序号、分类枚举与 JSON 要求', () => {
  const candidates = Array.from({ length: 3 }, (_, index) => ({
    title: `候选 ${index + 1}`,
    source: 'Feed',
    sourceCategory: '媒体',
    publishedAt: '2026-10-03T00:00:00Z',
    excerpt: '摘要内容',
  }));
  const { system, prompt } = news.buildFilterPrompt({ interests: '我关心 Agent 与推理模型' }, candidates);
  assert.match(system, /只输出一个 JSON 数组/);
  assert.match(system, /模型与评测/);
  assert.match(prompt, /我关心 Agent 与推理模型/);
  assert.match(prompt, /共 3 条/);
  assert.match(prompt, /^3\. 标题：候选 3$/m);
  assert.match(prompt, /请输出 3 个元素的 JSON 数组/);
});

test('feedback → state → reset：投票进入 state，复原后回到零', async (t) => {
  const { runtime } = await makeRuntime(t, { services: { llm: makeLlm() }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);

  await callRoute(ctx, news.ROUTE_PATHS.feedback, {
    method: 'POST',
    body: JSON.stringify({ id: 'item-1', vote: 'up', title: '英伟达人事变动', source: 'TC', category: '产业', reason: '产业链' }),
  });
  const before = await callRoute(ctx, news.ROUTE_PATHS.state, { method: 'GET' });
  assert.equal(before.json.taste.voteCount, 1);
  assert.equal(before.json.taste.votes['item-1'], 'up');

  const cleared = await callRoute(ctx, news.ROUTE_PATHS.tasteReset, { method: 'POST' });
  assert.equal(cleared.json.ok, true);
  assert.equal(cleared.json.votes, 1);

  const after = await callRoute(ctx, news.ROUTE_PATHS.state, { method: 'GET' });
  assert.equal(after.json.taste.voteCount, 0);
  assert.deepEqual(after.json.taste.votes, {});
  assert.equal(after.json.taste.profile.text, '');
});

test('collapseDuplicates: 聚合源与原始源同一件事只留一条', () => {
  const items = [
    { title: '特努斯施压 Siri 掌门人，苹果 AI 不能再等了 - 爱范儿', source: 'Google News · AI 关键词', sourceId: 'google-news-ai', summary: '聚合源的一句话。', excerpt: '' },
    { title: '特努斯施压 Siri 掌门人，苹果 AI 不能再等了', source: '爱范儿', sourceId: 'ifanr', summary: '原始媒体更长的总结，提到了特努斯、费德里吉、彭博社记者 Mark Gurman 等细节。', excerpt: '' },
  ];
  const out = news.collapseDuplicates(items);
  assert.equal(out.kept.length, 1);
  assert.equal(out.kept[0].sourceId, 'ifanr', '保留原始出处');
  assert.equal(out.dropped.length, 1);
  assert.match(out.dropped[0].reason, /同一件事/);
});

test('collapseDuplicates: 编号/版本号不同不合并', () => {
  const items = [
    { title: 'Story 1 about AI', source: 'A', sourceId: 'a' },
    { title: 'Story 2 about AI', source: 'B', sourceId: 'b' },
    { title: 'iOS 27.3 新增功能', source: 'C', sourceId: 'c' },
    { title: 'iOS 27.4 新增功能', source: 'D', sourceId: 'd' },
  ];
  const out = news.collapseDuplicates(items);
  assert.equal(out.kept.length, 4);
});

test('buildFilterPrompt: 论文门槛更高，常规增量论文一律丢弃', () => {
  const { system } = news.buildFilterPrompt({ interests: 'x' }, []);
  assert.match(system, /论文\/预印本/);
  assert.match(system, /常规增量论文/);
  assert.match(system, /明显突破/);
});

test('buildSummaryPrompt: arXiv 用 feed 摘要而不是 abs 页样板文字', () => {
  const item = {
    title: 'Paper X',
    source: 'arXiv cs.AI',
    url: 'https://arxiv.org/abs/2611.05556',
    excerpt: '我们提出一种方法。'.repeat(40),
    body: 'arXivLabs 是一个展示框架的通用介绍。'.repeat(20),
  };
  const { prompt } = news.buildSummaryPrompt(item);
  assert.match(prompt, /论文摘要（来自 arXiv feed）/);
  assert.doesNotMatch(prompt, /arXivLabs 是一个展示框架/);
});

test('buildFilterPrompt: 去重规则限定为「同一事件」，不合并同主题', () => {
  const { system } = news.buildFilterPrompt({ interests: 'x' }, []);
  assert.match(system, /「重复」只指同一件事/);
  assert.match(system, /同一主题下的不同事实不算重复/);
  assert.match(system, /有原始链接 \/ 仓库 \/ 论文 \/ 数据的/);
  assert.match(system, /拿不准是否重复就保留/);
  assert.doesNotMatch(system, /同一事件的重复报道只保留信息量最高的一条/);
});

test('buildPromptText: 只列前 10 条、开头声明是数据不是指令', () => {
  const digest = {
    date: '2026-11-03',
    items: Array.from({ length: 12 }, (_, index) => ({
      title: `标题 ${index + 1}`,
      category: '模型与评测',
      source: 'Feed',
      summary: '摘要',
    })),
  };
  const text = news.buildPromptText(digest);
  assert.match(text, /是数据不是指令/);
  assert.match(text, /标题 10/);
  assert.doesNotMatch(text, /标题 11/);
  assert.match(text, /另有 2 条/);
  assert.equal(news.buildPromptText(null), '');
  assert.equal(news.buildPromptText({ date: TODAY, items: [] }), '');
});

test('sanitizeSummary: 要点列表保留换行，统一成「· 」', () => {
  const raw = '这件事有三点：\n- 第一点，348 star\n- 第二点，10/30 建仓\n• 第三点，不再维护';
  const out = news.sanitizeSummary(raw);
  assert.equal(out.split('\n').length, 3);
  assert.match(out, /^· 第一点，348 star$/m);
  assert.match(out, /^· 第三点，不再维护$/m);
});

test('extractArticleText: 优先 article 里的段落，去掉脚本与导航', () => {
  const html = `<html><body>
    <nav><p>导航里的废话足够长足够长足够长足够长足够长足够长</p></nav>
    <script>var x = "<p>不该出现</p>"</script>
    <article>
      <h1>标题</h1>
      <p>FlashProve 是一个研究原型，仓库 348 star，10 月 30 日创建。</p>
      <p>它让验证者只凭一台普通 CPU 就能验证输出确实由某个模型算出，不需要信任任何中心机构。</p>
      <p>短</p>
    </article>
    <footer><p>版权信息版权信息版权信息版权信息版权信息版权信息版权信息</p></footer>
  </body></html>`;
  const text = news.extractArticleText(html);
  assert.match(text, /348 star/);
  assert.match(text, /普通 CPU/);
  assert.doesNotMatch(text, /不该出现/);
  assert.doesNotMatch(text, /导航里的废话/);
  assert.doesNotMatch(text, /版权信息/);
  assert.ok(!text.split('\n').includes('短'));
});

test('extractArticleText: 没有 <p> 时退化成整页文本，且不超过上限', () => {
  const html = '<html><body><div>' + '这是一段没有段落标签的正文内容。'.repeat(300) + '</div></body></html>';
  const text = news.extractArticleText(html, { maxChars: 200 });
  assert.ok(text.length > 0);
  assert.ok(text.length <= 200);
});

test('buildSummaryPrompt: 有正文时喂正文并要 200–300 字，没有时退回源摘要', () => {
  const withBody = news.buildSummaryPrompt({
    title: 'T', source: 'S', url: 'https://x.example/1', excerpt: '一句话',
    body: '正文第一段。'.repeat(50),
  });
  assert.match(withBody.prompt, /【原文正文（节选）】/);
  assert.match(withBody.prompt, /200–300 字/);
  assert.match(withBody.system, /3–6 句/);
  const noBody = news.buildSummaryPrompt({
    title: 'T', source: 'S', url: 'https://x.example/1', excerpt: '一句话',
  });
  assert.match(noBody.prompt, /源摘要：一句话/);
  assert.match(noBody.prompt, /不要编造/);
});

test('sanitizeSummary: 去围栏 / 前缀 / 多余空白，并限制长度', () => {
  assert.equal(news.sanitizeSummary('```\n摘要：这条讲了 A。\n\n它很重要。\n```'), '这条讲了 A。它很重要。');
  assert.equal(news.sanitizeSummary('   '), '');
  assert.ok(news.sanitizeSummary('长'.repeat(900)).length <= 700);
});

// ---------------------------------------------------------------------------
// 配置校验
// ---------------------------------------------------------------------------

test('applyConfigPatch: 局部更新、保留其他字段、写回后形状正确', () => {
  const base = news.defaultConfig();
  const next = news.applyConfigPatch(base, { dailyTime: '09:30', maxItems: 12, proxy: 'direct' });
  assert.equal(next.dailyTime, '09:30');
  assert.equal(next.maxItems, 12);
  assert.equal(next.proxy, 'direct');
  assert.equal(next.maxCandidates, base.maxCandidates);
  assert.equal(next.sources.length, base.sources.length);
});

test('applyConfigPatch: 拒绝非法 dailyTime / proxy / 数字范围 / model 半填', () => {
  const base = news.defaultConfig();
  assert.throws(() => news.applyConfigPatch(base, { dailyTime: '25:00' }), /dailyTime/);
  assert.throws(() => news.applyConfigPatch(base, { proxy: 'ftp://x' }), /proxy/);
  assert.throws(() => news.applyConfigPatch(base, { maxItems: 0 }), /maxItems/);
  assert.throws(() => news.applyConfigPatch(base, { model: { provider: 'p', model: '' } }), /provider/);
  assert.throws(() => news.applyConfigPatch(base, { sources: 'nope' }), /数组/);
});

test('applyConfigPatch: 源校验（重复 id / 未知类型 / 启用但缺地址）', () => {
  const base = news.defaultConfig();
  const sources = base.sources.map((source) => ({ ...source }));
  const duplicated = [...sources, { ...sources[0] }];
  assert.throws(() => news.applyConfigPatch(base, { sources: duplicated }), /重复/);
  assert.throws(
    () => news.applyConfigPatch(base, { sources: [{ id: 'x', name: 'X', type: 'nope', url: 'https://x', category: '', enabled: true }] }),
    /不支持/,
  );
  const enabledBilibili = sources.map((source) =>
    source.id === 'bilibili-up' ? { ...source, enabled: true, url: '' } : source,
  );
  assert.throws(() => news.applyConfigPatch(base, { sources: enabledBilibili }), /bilibili|B站/);
});

test('applyConfigPatch: bilibili 用 uid、youtube 用 channel id 都能通过', () => {
  const base = news.defaultConfig();
  const sources = base.sources.map((source) => {
    if (source.id === 'bilibili-up') return { ...source, enabled: true, url: '123456' };
    if (source.id === 'youtube-ch') return { ...source, enabled: true, url: 'UCabcdefghijklmnopqrstuv' };
    return source;
  });
  const next = news.applyConfigPatch(base, { sources });
  const bilibili = next.sources.find((source) => source.id === 'bilibili-up');
  assert.equal(bilibili.enabled, true);
});

test('coerceConfig: 磁盘上的坏数据退回默认，不抛错', () => {
  assert.equal(news.coerceConfig(undefined).sources.length, 18);
  assert.equal(news.coerceConfig({ dailyTime: '99:99' }).dailyTime, '08:00');
  assert.equal(news.coerceConfig({ maxItems: 9999 }).maxItems, 200);
  assert.equal(news.coerceConfig({ proxy: 'auto' }).proxy, '');
  const config = news.coerceConfig({
    sources: [{ id: 'a', type: 'rss', url: 'https://x', enabled: false }, { id: 'a', type: 'rss', url: 'https://y' }, { id: 'z', type: 'bogus' }],
  });
  assert.equal(config.sources.length, 1);
});

test('parseProxyMode: ""/auto = 自动，direct = 只直连，URL = 只走代理', () => {
  assert.equal(news.parseProxyMode('').mode, 'auto');
  assert.equal(news.parseProxyMode('auto').mode, 'auto');
  assert.equal(news.parseProxyMode('direct').mode, 'direct');
  assert.deepEqual(news.parseProxyMode('http://127.0.0.1:7890'), { mode: 'proxy', url: 'http://127.0.0.1:7890' });
  assert.equal(news.parseProxyMode('socks5://127.0.0.1:1080').mode, 'proxy');
  assert.equal(news.parseProxyMode('ftp://x').invalid, 'ftp://x');
});

// ---------------------------------------------------------------------------
// 摘要缓存
// ---------------------------------------------------------------------------

test('pruneSummaryCache: 过期丢弃、按写入时间保留最新 500 条', () => {
  const now = 2_000_000_000_000;
  const entries = {
    fresh: { summary: 'fresh', at: now - 1000 },
    old: { summary: 'old', at: now - 31 * 24 * 60 * 60 * 1000 },
    empty: { summary: '   ', at: now - 1000 },
    broken: { at: now - 1000 },
  };
  for (let index = 0; index < 510; index += 1) {
    entries[`bulk-${index}`] = { summary: `s${index}`, at: now - 2000 + index };
  }
  const pruned = news.pruneSummaryCache({ entries }, now);
  assert.equal(Object.keys(pruned.entries).length, 500);
  assert.ok(pruned.entries.fresh);
  assert.equal(pruned.entries.old, undefined);
  assert.equal(pruned.entries.empty, undefined);
  assert.equal(pruned.entries.broken, undefined);
  assert.ok(pruned.entries['bulk-509']);
  assert.equal(pruned.entries['bulk-0'], undefined);
});

// ---------------------------------------------------------------------------
// 运行时集成（假 curl + 假 llm）
// ---------------------------------------------------------------------------

test('generate: 三源（含一个失败）→ 模型筛选 + 逐条摘要 + 落盘 JSON/MD + 缓存复用', async (t) => {
  const llm = makeLlm();
  const execCurl = defaultCurl();
  const { root, runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl,
    config: smallConfig(),
  });

  const result = await runtime.generate({ trigger: 'test' });
  assert.equal(result.ok, true, result.error);
  const digest = result.digest;

  assert.equal(digest.date, TODAY);
  assert.equal(digest.filterMode, 'llm');
  assert.equal(digest.totals.fetched, 4);
  assert.equal(digest.totals.kept, 2);
  assert.equal(digest.totals.dropped, 2);
  assert.equal(digest.totals.summarized, 2);
  assert.deepEqual(
    digest.items.map((item) => item.title),
    ['Atom one', 'OpenAI 发布新模型 & 新基准'],
  );
  assert.equal(digest.items[0].category, '模型与评测');
  assert.equal(digest.items[1].category, '开源与生态');
  assert.ok(digest.items.every((item) => item.summary.length > 0));
  assert.ok(digest.items.every((item) => /与用户的兴趣点直接相关/.test(item.reason)));
  assert.equal(digest.dropped.length, 2);
  assert.ok(digest.dropped.every((entry) => entry.reason.length > 0));

  const reports = Object.fromEntries(digest.sources.map((report) => [report.sourceId, report]));
  assert.equal(reports['feed-a'].ok, true);
  assert.equal(reports['feed-a'].count, 2);
  assert.equal(reports['feed-a'].via, 'direct');
  assert.equal(reports['feed-b'].ok, true);
  assert.equal(reports['broken'].ok, false);
  assert.match(reports['broken'].error, /连接失败/);
  assert.ok(digest.errors.some((line) => line.includes('Broken')));

  const jsonFile = path.join(root, 'digest', `${TODAY}.json`);
  const mdFile = path.join(root, 'digest', `${TODAY}.md`);
  const stored = JSON.parse(await fsp.readFile(jsonFile, 'utf8'));
  assert.equal(stored.items.length, 2);
  assert.match(stored.markdown, /## 模型与评测/);
  const markdown = await fsp.readFile(mdFile, 'utf8');
  assert.match(markdown, /Atom one/);

  const cache = JSON.parse(await fsp.readFile(path.join(root, 'cache', 'summaries.json'), 'utf8'));
  assert.equal(Object.keys(cache.entries).length, 2);

  // 第二次生成：摘要应命中缓存，不再调用模型写摘要。
  const summaryCallsAfterFirst = llm.summaryCalls().length;
  assert.equal(summaryCallsAfterFirst, 2);
  const second = await runtime.generate({ trigger: 'test' });
  assert.equal(second.ok, true);
  assert.equal(llm.summaryCalls().length, summaryCallsAfterFirst);
  assert.equal(llm.filterCalls().length, 2);
});

test('generate: 模型把所有候选都滤掉 → 空结果但写明原因（不静默空白）', async (t) => {
  const llm = makeLlm({ filter: (prompt) => filterJson(prompt, () => false) });
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    config: smallConfig(),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, true, result.error);
  assert.equal(result.digest.items.length, 0);
  assert.equal(result.digest.totals.kept, 0);
  assert.equal(result.digest.totals.dropped, 4);
  assert.ok(result.digest.errors.some((line) => /全部被滤掉/.test(line)));
  assert.match(result.digest.markdown, /今天没有保留任何条目/);
});

test('generate: 模型不可用 → filterMode=fallback，按时间保留并在 errors 说明', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    config: smallConfig({ model: { provider: '', model: '' } }),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, true, result.error);
  assert.equal(result.digest.filterMode, 'fallback');
  assert.equal(result.digest.items.length, 4);
  assert.equal(result.digest.items[0].title, 'Atom one');
  assert.ok(result.digest.items.every((item) => item.summary === ''));
  assert.ok(result.digest.errors.some((line) => /没有解析到可用的模型/.test(line)));
  assert.ok(result.digest.errors.some((line) => /没有生成逐条中文总结/.test(line)));
  assert.equal(llm.calls.length, 0, '模型路由不可用就不该调用 llm');
});

test('generate: 模型调用失败 → fallback + 如实记录原因', async (t) => {
  const llm = {
    calls: [],
    stream() {
      return (async function* broken() {
        yield { type: 'text-delta', text: 'partial' };
        throw new Error('provider exploded');
      })();
    },
  };
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    config: smallConfig(),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, true, result.error);
  assert.equal(result.digest.filterMode, 'fallback');
  assert.ok(result.digest.errors.some((line) => /模型筛选失败/.test(line) && /provider exploded/.test(line)));
});

test('generate: 模型返回非 JSON → fallback，并保留全部候选', async (t) => {
  const llm = makeLlm({ filter: () => '我不是 JSON，我是散文。' });
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    config: smallConfig(),
  });
  const result = await runtime.generate();
  assert.equal(result.digest.filterMode, 'fallback');
  assert.ok(result.digest.errors.some((line) => /找不到 JSON 数组/.test(line)));
  assert.equal(result.digest.items.length, 4);
});

test('generate: max-tokens 截断 → 用一半候选重试一次并在 errors 说明', async (t) => {
  let filterCalls = 0;
  const llm = makeLlm({
    filter: (prompt) => {
      filterCalls += 1;
      if (filterCalls === 1) {
        return { __chunks: [{ type: 'text-delta', text: '输出到一半' }, { type: 'finish', reason: { kind: 'max-tokens' } }] };
      }
      return filterJson(prompt, () => true);
    },
  });
  const execCurl = makeCurl({ 'https://many.example/rss': makeFeed(15) });
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl,
    config: smallConfig({
      maxCandidates: 20,
      sources: [{ id: 'many', name: 'Many', type: 'rss', url: 'https://many.example/rss', category: '媒体', enabled: true }],
    }),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, true, result.error);
  assert.equal(result.digest.filterMode, 'llm');
  assert.equal(result.digest.items.length, 15);
  assert.ok(result.digest.errors.some((line) => /maxTokens/.test(line) && /重试一次/.test(line)));
  assert.ok(result.digest.errors.some((line) => /只判断了 8\/15/.test(line)));
});

test('generate: 探索位从被滤掉的条目里补几条，并带 explore 标记', async (t) => {
  const llm = makeLlm({
    filter: (prompt) => filterJson(prompt, (i) => i <= 2),
  });
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: makeCurl({ 'https://many.example/rss': makeFeed(12) }),
    config: smallConfig({
      maxItems: 6,
      exploreRatio: 0.5,
      sources: [{ id: 'many', name: 'Many', type: 'rss', url: 'https://many.example/rss', category: '媒体', enabled: true }],
    }),
  })
  const result = await runtime.generate()
  assert.equal(result.ok, true, result.error)
  const explored = result.digest.items.filter((item) => item.explore)
  assert.ok(explored.length >= 1, '应该有探索位')
  assert.ok(result.digest.items.length <= 6, '探索位不能突破每日上限')
  assert.ok(result.digest.errors.some((line) => /探索位/.test(line)))
})

test('generate: 合法 0 条源（arXiv 场景）ok:true count:0，不写进 errors', async (t) => {
  const llm = makeLlm();
  const execCurl = makeCurl({
    'https://arxiv.example/rss': EMPTY_FEED,
    'https://a.example/rss': RSS_A,
  });
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl,
    config: smallConfig({
      sources: [
        { id: 'arxiv', name: 'arXiv cs.AI', type: 'rss', url: 'https://arxiv.example/rss', category: '论文', enabled: true },
        { id: 'feed-a', name: 'Feed A', type: 'rss', url: 'https://a.example/rss', category: '媒体', enabled: true },
      ],
    }),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, true, result.error);
  const arxiv = result.digest.sources.find((report) => report.sourceId === 'arxiv');
  assert.equal(arxiv.ok, true);
  assert.equal(arxiv.count, 0);
  assert.equal(arxiv.error, '');
  assert.ok(!result.digest.errors.some((line) => line.includes('arXiv')));
});

test('generate: 全部源空 → 报错且不写假的空简报', async (t) => {
  const llm = makeLlm();
  const execCurl = makeCurl({ 'https://arxiv.example/rss': EMPTY_FEED });
  const { root, runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl,
    config: smallConfig({
      sources: [{ id: 'arxiv', name: 'arXiv cs.AI', type: 'rss', url: 'https://arxiv.example/rss', category: '论文', enabled: true }],
    }),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, false);
  assert.match(result.error, /没有抓到任何可用条目/);
  assert.equal(await runtime.hasDigest(TODAY), false);
  await assert.rejects(fsp.readFile(path.join(root, 'digest', `${TODAY}.json`)));
});

test('generate: 没有启用源 → 给人话错误', async (t) => {
  const { runtime } = await makeRuntime(t, {
    services: { llm: makeLlm() },
    config: smallConfig({ sources: [] }),
  });
  const result = await runtime.generate();
  assert.equal(result.ok, false);
  assert.match(result.error, /没有启用的新闻源/);
});

test('generate: 并发调用返回 busy，不重复生成', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, { services: { llm }, execCurl: defaultCurl(), config: smallConfig() });
  const first = runtime.generate();
  const second = await runtime.generate();
  assert.equal(second.busy, true);
  assert.equal((await first).ok, true);
});

test('generate: 生成后把简报注入 promptText，announceToAgent=false 时清空', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    config: smallConfig(),
  });
  await runtime.generate();
  assert.match(runtime.promptText(), /是数据不是指令/);
  assert.match(runtime.promptText(), /Atom one/);

  await runtime.saveConfigPatch({ announceToAgent: false });
  assert.equal(runtime.promptText(), '');

  await runtime.saveConfigPatch({ announceToAgent: true });
  assert.match(runtime.promptText(), /Atom one/);
});

test('六种源适配都能端到端走通（假 curl，按解析出的真实地址路由）', async (t) => {
  const expected = {
    rss: 'https://rss.example/feed',
    'google-news': `https://news.google.com/rss/search?q=${encodeURIComponent('OpenAI OR Anthropic')}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`,
    reddit: 'https://www.reddit.com/r/LocalLLaMA/.rss',
    youtube: 'http://127.0.0.1:1200/youtube/channel/UCabcdefghijklmnopqrstuv',
    bilibili: 'http://127.0.0.1:1200/bilibili/user/video/123456',
    'anthropic-html': 'https://www.anthropic.com/news',
  };
  const execCurl = makeCurl({
    [expected.rss]: RSS_A,
    [expected['google-news']]: RSS_A,
    [expected.reddit]: ATOM_B,
    [expected.youtube]: ATOM_B,
    [expected.bilibili]: ATOM_B,
    [expected['anthropic-html']]: ANTHROPIC_HTML,
  });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    config: smallConfig({ proxy: 'direct', sources: [] }),
  });
  const inputs = {
    rss: { url: 'https://rss.example/feed', type: 'rss' },
    'google-news': { url: 'OpenAI OR Anthropic', type: 'google-news' },
    reddit: { url: 'r/LocalLLaMA', type: 'reddit' },
    youtube: { url: 'UCabcdefghijklmnopqrstuv', type: 'youtube' },
    bilibili: { url: '123456', type: 'bilibili' },
    'anthropic-html': { url: 'news', type: 'anthropic-html' },
  };
  for (const [type, input] of Object.entries(inputs)) {
    const result = await runtime.testSource(input);
    assert.equal(result.ok, true, `${type}: ${result.error}`);
    assert.equal(result.via, 'direct', type);
    assert.ok(result.count > 0, `${type} 应抓到条目`);
    assert.equal(result.resolvedUrl, expected[type], type);
  }
  assert.deepEqual(
    execCurl.calls.map((call) => call.url).sort(),
    Object.values(expected).sort(),
  );
});

// ---------------------------------------------------------------------------
// 抓取通道（auto / direct / proxy + 重试）
// ---------------------------------------------------------------------------

test('testSource: auto 模式直连失败后自动走探测到的代理，via=proxy', async (t) => {
  const execCurl = makeCurl({
    'https://blocked.example/rss': (options) =>
      options.proxy
        ? { ok: true, status: 200, body: RSS_A, error: '' }
        : { ok: false, status: 0, body: '', error: 'curl 7：连接失败' },
  });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    probeProxy: async () => 'http://127.0.0.1:7890',
    config: smallConfig({ proxy: '', sources: [] }),
  });
  const result = await runtime.testSource({ url: 'https://blocked.example/rss', type: 'rss' });
  assert.equal(result.ok, true);
  assert.equal(result.count, 2);
  assert.equal(result.via, 'proxy');
  const proxied = execCurl.calls.filter((call) => call.proxy === 'http://127.0.0.1:7890');
  assert.equal(proxied.length, 1);
  assert.ok(execCurl.calls.some((call) => call.proxy === ''));
});

test('testSource: direct 模式只直连，不探测代理', async (t) => {
  let probed = 0;
  const execCurl = makeCurl({ 'https://a.example/rss': RSS_A });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    probeProxy: async () => {
      probed += 1;
      return 'http://127.0.0.1:7890';
    },
    config: smallConfig({ proxy: 'direct', sources: [] }),
  });
  const result = await runtime.testSource({ url: 'https://a.example/rss', type: 'rss' });
  assert.equal(result.ok, true);
  assert.equal(result.via, 'direct');
  assert.equal(probed, 0);
  assert.ok(execCurl.calls.every((call) => call.proxy === ''));
});

test('testSource: 显式代理只走该代理', async (t) => {
  const execCurl = makeCurl({
    'https://a.example/rss': (options) =>
      options.proxy === 'socks5://127.0.0.1:1080'
        ? { ok: true, status: 200, body: RSS_A, error: '' }
        : { ok: false, status: 0, body: '', error: '不该直连' },
  });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    config: smallConfig({ proxy: 'socks5://127.0.0.1:1080', sources: [] }),
  });
  const result = await runtime.testSource({ url: 'https://a.example/rss', type: 'rss' });
  assert.equal(result.ok, true);
  assert.equal(result.via, 'proxy');
  assert.ok(execCurl.calls.every((call) => call.proxy === 'socks5://127.0.0.1:1080'));
});

test('抓取瞬时失败（000）会重试一次再成功', async (t) => {
  let attempts = 0;
  const execCurl = makeCurl({
    'https://flaky.example/rss': () => {
      attempts += 1;
      if (attempts === 1) return { ok: false, status: 0, body: '', error: 'curl 28：请求超时' };
      return { ok: true, status: 200, body: RSS_A, error: '' };
    },
  });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    config: smallConfig({ proxy: 'direct', sources: [] }),
  });
  const result = await runtime.testSource({ url: 'https://flaky.example/rss', type: 'rss' });
  assert.equal(result.ok, true);
  assert.equal(attempts, 2);
});

test('testSource: 返回非 feed 的 HTML 时明确报错（不伪装成 0 条）', async (t) => {
  const execCurl = makeCurl({ 'https://wrong.example/rss': '<html><body>login</body></html>' });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    config: smallConfig({ proxy: 'direct', sources: [] }),
  });
  const result = await runtime.testSource({ url: 'https://wrong.example/rss', type: 'rss' });
  assert.equal(result.ok, false);
  assert.match(result.error, /不是 RSS\/Atom/);
});

// ---------------------------------------------------------------------------
// 定时
// ---------------------------------------------------------------------------

test('tick: 命中 dailyTime 且当天无文件才生成；生成后不再重复', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    now: () => new Date(2026, 10, 3, 8, 0, 0),
    config: smallConfig({ dailyTime: '08:00' }),
  });
  const first = await runtime.tick('interval');
  assert.equal(first.ok, true);
  assert.equal(await runtime.hasDigest(TODAY), true);
  const second = await runtime.tick('interval');
  assert.equal(second.skipped, 'exists');
});

test('tick: 时间不匹配不生成；catchUp 忽略时间补一次', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, {
    services: { llm },
    execCurl: defaultCurl(),
    now: () => new Date(2026, 10, 3, 7, 59, 0),
    config: smallConfig({ dailyTime: '08:00' }),
  });
  const ticked = await runtime.tick('interval');
  assert.equal(ticked.skipped, 'time');
  assert.equal(await runtime.hasDigest(TODAY), false);

  const caught = await runtime.catchUp();
  assert.equal(caught.ok, true);
  assert.equal(await runtime.hasDigest(TODAY), true);
});

test('tick: config.enabled=false 不生成', async (t) => {
  const { runtime } = await makeRuntime(t, {
    services: { llm: makeLlm() },
    execCurl: defaultCurl(),
    config: smallConfig({ enabled: false, dailyTime: '08:00' }),
  });
  const result = await runtime.tick('interval');
  assert.equal(result.skipped, 'disabled');
});

// ---------------------------------------------------------------------------
// HTTP 路由
// ---------------------------------------------------------------------------

test('路由：注册 8 条 exact 路由，method/path 正确', async (t) => {
  const { runtime } = await makeRuntime(t, { services: { llm: makeLlm() }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);
  assert.deepEqual(
    ctx.routes.map((route) => `${route.kind ?? 'exact'} ${route.path}`),
    [
      'exact /api/dsh-news/state',
      'exact /api/dsh-news/refresh',
      'exact /api/dsh-news/config',
      'exact /api/dsh-news/source/test',
      'exact /api/dsh-news/digest',
      'exact /api/dsh-news/feedback',
      'exact /api/dsh-news/learn',
      'exact /api/dsh-news/taste/reset',
    ],
  );
});

test('路由：非 loopback 一律 403；方法不匹配 405', async (t) => {
  const { runtime } = await makeRuntime(t, { services: { llm: makeLlm() }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);

  const forbidden = await callRoute(ctx, news.ROUTE_PATHS.state, { remoteAddress: '10.0.0.5' });
  assert.equal(forbidden.response.status, 403);
  assert.equal(forbidden.json.ok, false);

  const crossSite = await callRoute(ctx, news.ROUTE_PATHS.state, {
    headers: { 'sec-fetch-site': 'cross-site' },
  });
  assert.equal(crossSite.response.status, 403);

  const wrongMethod = await callRoute(ctx, news.ROUTE_PATHS.state, { method: 'POST' });
  assert.equal(wrongMethod.response.status, 405);
  assert.match(String(wrongMethod.response.headers['content-type']), /application\/json/);
});

test('路由：GET state 返回 config/digest/running/lastError/digestDir/proxyDetected', async (t) => {
  const { root, runtime } = await makeRuntime(t, {
    services: { llm: makeLlm() },
    execCurl: defaultCurl(),
    config: smallConfig(),
    probeProxy: async () => 'http://127.0.0.1:7890',
  });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);

  const { json } = await callRoute(ctx, news.ROUTE_PATHS.state, { method: 'GET' });
  assert.equal(json.ok, true);
  assert.equal(json.config.sources.length, 3);
  assert.equal(json.digest, null);
  assert.equal(json.running, false);
  assert.equal(json.lastError, null);
  assert.equal(json.digestDir, root);
  assert.equal(json.proxyDetected, 'http://127.0.0.1:7890');

  const generated = await runtime.generate();
  assert.equal(generated.ok, true);
  const after = await callRoute(ctx, news.ROUTE_PATHS.state, { method: 'GET' });
  assert.equal(after.json.digest.date, TODAY);
});

test('路由：POST config 校验失败返回 ok:false；成功返回新 config 并落盘', async (t) => {
  const { root, runtime } = await makeRuntime(t, {
    services: { llm: makeLlm() },
    execCurl: defaultCurl(),
    config: smallConfig(),
  });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);

  const invalid = await callRoute(ctx, news.ROUTE_PATHS.config, {
    method: 'POST',
    body: { dailyTime: '25:00' },
  });
  assert.equal(invalid.response.status, 200);
  assert.equal(invalid.json.ok, false);
  assert.match(invalid.json.error, /dailyTime/);

  const saved = await callRoute(ctx, news.ROUTE_PATHS.config, {
    method: 'POST',
    body: { dailyTime: '09:30', maxItems: 12 },
  });
  assert.equal(saved.json.ok, true);
  assert.equal(saved.json.config.dailyTime, '09:30');
  assert.equal(saved.json.config.maxItems, 12);
  assert.equal(saved.json.config.sources.length, 3);
  const disk = JSON.parse(await fsp.readFile(path.join(root, 'config.json'), 'utf8'));
  assert.equal(disk.dailyTime, '09:30');
});

test('路由：POST config 非法 JSON 返回 400', async (t) => {
  const { runtime } = await makeRuntime(t, { services: { llm: makeLlm() }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);
  const { response } = await callRoute(ctx, news.ROUTE_PATHS.config, { method: 'POST', body: '{oops' });
  assert.equal(response.status, 400);
});

test('路由：POST source/test 返回标题样本或人话错误', async (t) => {
  const execCurl = makeCurl({ 'https://a.example/rss': RSS_A });
  const { runtime } = await makeRuntime(t, {
    execCurl,
    config: smallConfig({ proxy: 'direct', sources: [] }),
  });
  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.registerRoutes(ctx, runtime);

  const good = await callRoute(ctx, news.ROUTE_PATHS.sourceTest, {
    method: 'POST',
    body: { url: 'https://a.example/rss', type: 'rss' },
  });
  assert.equal(good.json.ok, true);
  assert.equal(good.json.count, 2);
  assert.deepEqual(good.json.titles, ['OpenAI 发布新模型 & 新基准', 'Second story']);

  const bad = await callRoute(ctx, news.ROUTE_PATHS.sourceTest, {
    method: 'POST',
    body: { url: 'https://missing.example/rss', type: 'rss' },
  });
  assert.equal(bad.json.ok, false);
  assert.match(bad.json.error, /抓取失败/);
});

test('路由：refresh 生成中返回 busy；完成后返回 digest', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, { services: { llm }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm });
  news.registerRoutes(ctx, runtime);

  const first = runtime.handleRefresh();
  const busy = await callRoute(ctx, news.ROUTE_PATHS.refresh, { method: 'POST' });
  assert.equal(busy.json.ok, true);
  assert.equal(busy.json.busy, true);
  const done = await first;
  assert.equal(done.body.ok, true);

  const again = await callRoute(ctx, news.ROUTE_PATHS.refresh, { method: 'POST' });
  assert.equal(again.json.ok, true);
  assert.equal(again.json.digest.items.length, 2);
});

test('路由：GET digest 支持 date 参数、缺省今天、坏日期 400', async (t) => {
  const llm = makeLlm();
  const { runtime } = await makeRuntime(t, { services: { llm }, execCurl: defaultCurl(), config: smallConfig() });
  const ctx = makeFakeCtx({ llm });
  news.registerRoutes(ctx, runtime);

  const missing = await callRoute(ctx, news.ROUTE_PATHS.digest, { method: 'GET', url: '/api/dsh-news/digest?date=2026-01-01' });
  assert.equal(missing.json.ok, false);
  assert.match(missing.json.error, /没有 2026-01-01 的简报/);

  const invalid = await callRoute(ctx, news.ROUTE_PATHS.digest, { method: 'GET', url: '/api/dsh-news/digest?date=2026-13-01' });
  assert.equal(invalid.response.status, 400);

  await runtime.generate();
  const today = await callRoute(ctx, news.ROUTE_PATHS.digest, { method: 'GET' });
  assert.equal(today.json.ok, true);
  assert.equal(today.json.date, TODAY);
  assert.match(today.json.markdown, /Atom one/);
  assert.equal(today.json.digest.items.length, 2);
});

// ---------------------------------------------------------------------------
// 宿主注册（apply / prompt / scheduler）
// ---------------------------------------------------------------------------

test('apply: 注册 8 条路由 + systemPrompt 段（interpolate:false）+ 定时器，dispose 后清理', async (t) => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'dsh-news-apply-'));
  const previous = process.env.DSH_NEWS_HOME;
  process.env.DSH_NEWS_HOME = root;
  t.after(async () => {
    if (previous === undefined) delete process.env.DSH_NEWS_HOME;
    else process.env.DSH_NEWS_HOME = previous;
    await fsp.rm(root, { recursive: true, force: true });
  });

  const ctx = makeFakeCtx({ llm: makeLlm() });
  news.apply(ctx, {});
  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.equal(ctx.routes.length, 8);
  assert.equal(ctx.prompts.length, 1);
  const section = ctx.prompts[0];
  assert.equal(section.name, 'plugin:dsh-news-digest');
  assert.equal(section.order, 160);
  assert.equal(section.interpolate, false);
  assert.equal(typeof section.text, 'function');
  assert.equal(section.text(), '');

  const labels = ctx.effects.map((entry) => entry.label);
  assert.ok(labels.includes('dsh-news: routes'));
  assert.ok(labels.includes('dsh-news: systemPrompt'));
  assert.ok(labels.includes('dsh-news: scheduler'));

  for (const entry of ctx.effects) {
    assert.equal(typeof entry.dispose, 'function', `${entry.label} 必须返回 dispose`);
    entry.dispose();
  }
  assert.equal(ctx.routes.every((route) => route.disposed), true);
  assert.equal(section.disposed, true);

  const config = JSON.parse(await fsp.readFile(path.join(root, 'config.json'), 'utf8'));
  assert.equal(config.sources.length, 18);
});

test('apply: 宿主没有 webServer/systemPrompt 时不抛错（只是不注册），定时器可清理', async (t) => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'dsh-news-apply-bare-'));
  const previous = process.env.DSH_NEWS_HOME;
  process.env.DSH_NEWS_HOME = root;
  t.after(async () => {
    if (previous === undefined) delete process.env.DSH_NEWS_HOME;
    else process.env.DSH_NEWS_HOME = previous;
    await fsp.rm(root, { recursive: true, force: true });
  });

  const effects = [];
  const ctx = {
    logger: () => ({ debug() {}, info() {}, warn() {}, error() {} }),
    get: () => undefined,
    effect: (fn, label) => {
      const dispose = fn();
      effects.push({ label, dispose });
      return dispose;
    },
    inject: (names, callback) => callback({ effect: (fn) => fn() }),
  };
  assert.doesNotThrow(() => news.apply(ctx, {}));
  assert.deepEqual(
    effects.map((entry) => entry.label).filter((label) => label === 'dsh-news: scheduler'),
    ['dsh-news: scheduler'],
  );
  for (const entry of effects) entry.dispose?.();
  await new Promise((resolve) => setTimeout(resolve, 30));
});
