import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRuntime, digestId, localDateString, parseFeed, summaryCacheKey } from '../index.js';
import { runCommand } from '../desktop/skills/daily-ai-news/scripts/news.mjs';

const feed = { id: 'lab', name: '实验室', type: 'rss', url: 'https://lab.example/feed?token=fixture-secret', enabled: true };
const paper = 'https://arxiv.org/abs/2601.01234';
const release = 'https://lab.example/release';
const abstract = 'We measured inference costs with an open benchmark. '.repeat(6);
const article = 'Release notes describe a new local inference runtime and measured throughput. '.repeat(6);
const morning = new Date(2026, 10, 19, 9);
const day = localDateString(morning);
const xml = '<rss><channel>' + [
  ['Open weights for a speech model', release, 'Public release notes.'],
  ['Evaluating inference costs', paper, abstract],
].map(([title, url, excerpt], index) =>
  `<item><title>${title}</title><link>${url}</link><description>${excerpt}</description><pubDate>${new Date(+morning - 3600000 * (index + 1)).toUTCString()}</pubDate></item>`,
).join('') + '</channel></rss>';

const writeJSON = (file, value) => fs.writeFile(file, JSON.stringify(value));

async function setup(t, config = {}, readRelease = () => '<article><p>' + article + '</p></article>') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'desktop-news-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await writeJSON(path.join(root, 'config.json'), {
    sources: [feed], interests: '关心推理成本与开放权重', exploreRatio: 0, proxy: 'direct', ...config,
  });
  await writeJSON(path.join(root, 'feedback.json'), { profile: { text: '优先有实测数据的发布' } });
  const calls = [];
  let now = morning;
  const runtime = () => createRuntime({
    root, now: () => now, execCurl: async (url) => {
      calls.push(url);
      const body = url === feed.url ? xml : url === release ? readRelease() : '';
      return { ok: Boolean(body), body, status: body ? 200 : 404, error: body ? '' : 'HTTP 404' };
    },
  });
  // 每步都创建一个新运行时，对应技能实际启动的不同 Node 进程。
  return { root, calls, runtime, setDate: (date) => { now = date; }, cmd: (...args) => runCommand(args, runtime()) };
}

function verdicts(count, keep = true) {
  return Array.from({ length: count }, (_, i) => ({ i: i + 1, keep, category: '开源与生态', reason: keep ? '与推理成本相关' : '超出本轮兴趣范围' }));
}

async function submit(env, stage, decisions) {
  await writeJSON(stage.decisions, decisions);
  return env.cmd('review', stage.run);
}

async function materials(stage) {
  return (await fs.readFile(stage.materials, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
}

test('桌面聊天分步筛选和总结，共享 Harness 的偏好、归档读取、去重与刷新', async (t) => {
  const env = await setup(t);
  const stage = await env.cmd('prepare');
  assert.equal(stage.count, 2);
  const prompt = await fs.readFile(stage.candidates, 'utf8');
  assert.match(prompt, /关心推理成本与开放权重/);
  assert.match(prompt, /优先有实测数据/);
  assert.doesNotMatch(prompt, /fixture-secret/);
  const next = await submit(env, stage, verdicts(2));
  const evidence = await materials(next);
  assert.ok(evidence.some((m) => m.prompt.includes(article.trim())));
  assert.ok(evidence.some((m) => m.prompt.includes('论文摘要') && m.prompt.includes(abstract.trim())));
  assert.deepEqual(env.calls, [feed.url, release]);
  const summaries = evidence.map(({ id }, i) => ({ id, summary: '摘要：已核对原始材料 ' + i }));
  await writeJSON(next.summaries, summaries.reverse());
  const archived = await env.cmd('finish', next.selection);
  assert.deepEqual(archived, { status: 'ready', date: day, totals: { fetched: 2, kept: 2, dropped: 0, summarized: 2 } });
  const digest = await env.runtime().readDigest(day);
  assert.ok(digest.items.every((item) => item.summary === summaries.find((s) => s.id === item.id).summary.slice(3)));
  assert.match(await env.cmd('read', day), /已核对原始材料/);
  const query = await env.runtime().handleDigestQuery({ url: '/?date=' + day });
  assert.equal(query.body.markdown, digest.markdown);
  assert.equal((await env.runtime().tick()).skipped, 'exists');
  assert.deepEqual(await env.cmd('prepare'), archived);
  assert.equal(env.calls.length, 2);
  const refreshed = await env.cmd('prepare', '--refresh');
  assert.deepEqual(await submit(env, refreshed, verdicts(2)), archived);
  assert.deepEqual(env.calls, [feed.url, release, feed.url]);
  env.setDate(new Date(2026, 10, 20, 9));
  assert.equal(await env.cmd('read', 'yesterday'), digest.markdown);
  const empty = await env.cmd('prepare');
  assert.equal(empty.status, 'ready');
  assert.deepEqual(empty.totals, { fetched: 0, kept: 0, dropped: 0, summarized: 0 });
  assert.equal((await env.runtime().readDigest(empty.date)).filterMode, 'no-candidates');
});

test('桌面录入拒绝缺失、重复、越界或伪造的判断，允许修正后重试', async (t) => {
  const env = await setup(t);
  const stage = await env.cmd('prepare');
  for (const bad of [[], verdicts(1), [verdicts(1)[0], verdicts(1)[0]], [null, null], [{ ...verdicts(1)[0], i: 3 }, verdicts(2)[1]], [{ ...verdicts(1)[0], keep: 'false' }, verdicts(2)[1]]]) {
    await assert.rejects(submit(env, stage, bad), /筛选结果/);
  }
  const selected = await submit(env, stage, verdicts(2));
  const [first, second] = await materials(selected);
  const row = { id: first.id, summary: '有数据' };
  for (const bad of [[row], [row, row], [row, { ...row, id: 'unknown' }], [row, { id: second.id, summary: '摘要：' }]]) {
    await writeJSON(selected.summaries, bad);
    await assert.rejects(env.cmd('finish', selected.selection), /摘要/);
    assert.equal(await env.runtime().hasDigest(day), false);
  }
  // 跨午夜完成时应归档到抓取日期。
  env.setDate(new Date(2026, 10, 20, 1));
  await writeJSON(selected.summaries, [row, { ...row, id: second.id }]);
  assert.equal((await env.cmd('finish', selected.selection)).date, day);
  assert.equal(await env.runtime().hasDigest('2026-11-20'), false);
  const stored = await env.runtime().readDigest(day);
  await env.cmd('finish', selected.selection);
  assert.deepEqual(await env.runtime().readDigest(day), stored);
  await assert.rejects(env.cmd('review', '../'), /编号/);
  await assert.rejects(env.cmd('read', '2026-02-30'), /日期/);
});

test('桌面刷新按来源重试摘录摘要，失败保留旧日报，完整材料归档后直接复用', async (t) => {
  let full = false;
  const env = await setup(t, {}, () => full ? '<article><p>' + article + '</p></article>' : '');
  const decisions = [verdicts(2)[0], { ...verdicts(2)[1], keep: false }];
  const first = await submit(env, await env.cmd('prepare'), decisions);
  const [limited] = await materials(first);
  assert.match(limited.prompt, /原文正文没抓到/);
  await writeJSON(first.summaries, [{ id: limited.id, summary: '根据发布预告整理' }]);
  await env.cmd('finish', first.selection);
  assert.equal((await env.runtime().readDigest(day)).items[0].summaryBasis, 'excerpt');

  const refresh = () => env.cmd('prepare', '--refresh').then((batch) => submit(env, batch, decisions));
  assert.equal((await refresh()).status, 'ready');
  const unchanged = await env.runtime().readDigest(day);
  assert.equal(unchanged.items[0].summary, '根据发布预告整理');
  assert.match(unchanged.errors.join(' '), /摘要生成时没有抓到正文/);
  full = true;
  const upgrade = await refresh();
  const [evidence] = await materials(upgrade);
  assert.match(evidence.prompt, /measured throughput/);
  await writeJSON(upgrade.summaries, [{ id: evidence.id, summary: '' }]);
  await assert.rejects(env.cmd('finish', upgrade.selection), /非空摘要/);
  assert.deepEqual(await env.runtime().readDigest(day), unchanged);
  await writeJSON(upgrade.summaries, [{ id: evidence.id, summary: '完整评测的摘要' }]);
  await env.cmd('finish', upgrade.selection);
  const recovered = await env.runtime().readDigest(day);
  assert.equal(recovered.items[0].summaryBasis, undefined);
  assert.equal(recovered.items[0].summary, '完整评测的摘要');
  assert.doesNotMatch(recovered.errors.join(' '), /没有抓到正文/);
  assert.equal((await refresh()).status, 'ready');
  assert.equal(env.calls.filter((url) => url === release).length, 3);
});

test('桌面只为入选且未缓存的条目抓正文，落选理由可以回看', async (t) => {
  const env = await setup(t);
  const [known] = parseFeed(xml);
  await fs.mkdir(path.join(env.root, 'cache'));
  await writeJSON(env.runtime().cacheFile, { entries: { [summaryCacheKey(digestId(known.url, known.title))]: { summary: '以前写好的摘要', at: +morning } } });
  const stage = await env.cmd('prepare');
  const [yes, no] = verdicts(2);
  const result = await submit(env, stage, [yes, { ...no, keep: false, reason: '常规增量研究' }]);
  assert.equal(result.status, 'ready');
  assert.deepEqual(env.calls, [feed.url]);
  assert.match(await env.cmd('read'), /以前写好的摘要/);
  assert.match(await env.cmd('read'), /常规增量研究/);
  const refresh = await env.cmd('prepare', '--refresh');
  const nothing = await submit(env, refresh, verdicts(2, false));
  assert.equal(nothing.totals.kept, 0);
  assert.equal(nothing.totals.dropped, 2);
});

test('旧版 Harness Markdown、本地聊天期间出现的新归档及稍后的 Harness 更新均可读取', async (t) => {
  const env = await setup(t);
  const dir = env.runtime().digestDir;
  await fs.mkdir(dir);
  const json = path.join(dir, day + '.json');
  await writeJSON(json, { items: [] });
  await fs.writeFile(path.join(dir, day + '.md'), '旧版 Markdown');
  assert.equal(await env.cmd('read'), '旧版 Markdown');
  const legacy = await env.cmd('prepare');
  assert.equal(legacy.status, 'ready');
  assert.equal(legacy.date, day);
  assert.equal(env.calls.length, 0);
  const first = await env.cmd('prepare', '--refresh');
  const other = await env.cmd('prepare', '--refresh');
  await submit(env, first, verdicts(2, false));
  const calls = env.calls.length;
  const existing = await submit(env, other, verdicts(2));
  assert.equal(existing.status, 'ready');
  assert.equal(existing.superseded, true);
  assert.equal(existing.totals.kept, 0);
  assert.equal(env.calls.length, calls, '已被取代的筛选无需抓正文或让聊天写摘要');
  const newer = { date: day, generatedAt: new Date(+morning + 1000).toISOString(), items: [], markdown: '更新的 Harness 版本' };
  await writeJSON(json, newer);
  assert.equal(await env.cmd('read'), newer.markdown);
  assert.equal((await env.runtime().handleDigestQuery({ url: '/' })).body.markdown, newer.markdown);
});

test('抓取完全失败时保留重试机会，查询不存在的日期不触发抓取', async (t) => {
  const env = await setup(t, { sources: [{ ...feed, url: 'https://broken.example/feed' }] });
  await assert.rejects(env.cmd('read', day), /没有/);
  assert.deepEqual(env.calls, []);
  await assert.rejects(env.cmd('prepare'), /没有抓到任何可用条目/);
  assert.equal(await env.runtime().hasDigest(day), false);
});

test('桌面聊天可以读取与保存长期兴趣，保留共享的信息源设置', async (t) => {
  const env = await setup(t);
  const before = await env.runtime().loadConfig();
  assert.deepEqual(await env.cmd('interests'), { interests: before.interests });
  const interests = '主要看开放权重\n保留部署实测';
  const response = await runCommand(['interests', '--stdin'], env.runtime(), [Buffer.from(interests)]);
  assert.deepEqual(response, { interests });
  assert.deepEqual(await env.runtime().loadConfig(), { ...before, interests });
  const stage = await env.cmd('prepare');
  assert.ok((await fs.readFile(stage.candidates, 'utf8')).includes(interests));
});

test('跨天去重覆盖两个入口当天分别保留的稿件', async (t) => {
  const env = await setup(t);
  const stage = await env.cmd('prepare');
  const selected = await submit(env, stage, [verdicts(1)[0], { ...verdicts(2)[1], keep: false }]);
  const [first] = await materials(selected);
  await writeJSON(selected.summaries, [{ id: first.id, summary: '桌面版保留第一篇' }]);
  await env.cmd('finish', selected.selection);
  const [, second] = parseFeed(xml);
  await fs.mkdir(env.runtime().digestDir);
  await writeJSON(path.join(env.runtime().digestDir, day + '.json'), {
    date: day, generatedAt: new Date(+morning + 1).toISOString(), items: [second],
  });
  env.setDate(new Date(2026, 10, 20, 9));
  const empty = await env.cmd('prepare');
  assert.deepEqual(empty.totals, { fetched: 0, kept: 0, dropped: 0, summarized: 0 });
});

test('桌面 CLI 通过符号链接调用时与直接调用返回相同结果', async (t) => {
  const env = await setup(t);
  const alias = path.join(env.root, 'linked-scripts');
  const scripts = fileURLToPath(new URL('../desktop/skills/daily-ai-news/scripts/', import.meta.url));
  await fs.symlink(scripts, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const stdout = execFileSync(process.execPath, [path.join(alias, 'news.mjs'), 'interests'], {
    cwd: env.root, env: { ...process.env, DSH_NEWS_HOME: env.root }, encoding: 'utf8',
  });
  assert.deepEqual(JSON.parse(stdout), await env.cmd('interests'));
});

test('保存兴趣遇到损坏的 JSON 或错误的顶层类型时保留原文件', async (t) => {
  const env = await setup(t);
  const runtime = env.runtime();
  for (const raw of ['{"maxItems":14,}', '["手工配置"]']) {
    await fs.writeFile(runtime.configFile, raw);
    await assert.rejects(runCommand(['interests', '--stdin'], runtime, [Buffer.from('开源')]), /请先修复/);
    assert.equal(await fs.readFile(runtime.configFile, 'utf8'), raw);
  }
});

test('同一天两个聊天在同一毫秒完成时只提交一期，另一个读回获胜版本', async (t) => {
  const env = await setup(t);
  await env.runtime().desktop.save({ date: day, generatedAt: morning.toISOString(), items: [] });
  const [a, b] = await Promise.all([env.cmd('prepare', '--refresh'), env.cmd('prepare', '--refresh')]);
  const one = verdicts(2);
  one[1].keep = false;
  const choices = await Promise.all([submit(env, a, one), submit(env, b, verdicts(2))]);
  await Promise.all(choices.map(async (c) => {
    await writeJSON(c.summaries, (await materials(c)).map(({ id }) => ({ id, summary: '本轮摘要' })));
  }));
  const results = await Promise.all(choices.map((c) => env.cmd('finish', c.selection)));
  assert.equal(results.filter((r) => r.superseded).length, 1);
  const stored = await env.runtime().readDigest(day);
  for (const result of results) assert.deepEqual(result.totals, stored.totals);
});

test('桌面与 Harness 在同一毫秒连续发布三次，各入口均读取最后提交的版本', async (t) => {
  const env = await setup(t);
  const rt = env.runtime();
  await submit(env, await env.cmd('prepare'), verdicts(2, false));
  const first = await rt.readDigest(day);
  const waiting = await env.cmd('prepare', '--refresh');

  const second = await rt.generate();
  assert.equal(second.ok, true);
  assert.equal(second.digest.items.length, 2);
  assert.ok(second.digest.generatedAt > first.generatedAt);
  assert.deepEqual(await rt.readDigest(day), second.digest);
  assert.equal(await env.cmd('read'), second.digest.markdown);
  assert.equal((await fs.readFile(path.join(rt.digestDir, day + '.md'), 'utf8')).trimEnd(), second.digest.markdown.trimEnd());
  const calls = env.calls.length;
  assert.equal((await submit(env, waiting, verdicts(2))).superseded, true);
  assert.equal(env.calls.length, calls);

  await submit(env, await env.cmd('prepare', '--refresh'), verdicts(2, false));
  const third = await rt.readDigest(day);
  assert.ok(third.generatedAt > second.digest.generatedAt);
  assert.equal(third.items.length, 0);
  const query = await rt.handleDigestQuery({ url: '/?date=' + day });
  assert.deepEqual(query.body.digest, third);
  assert.equal(await env.cmd('read'), third.markdown);
});

test('抓源、抓正文或等待摘要期间出现新归档时，直接返回已保存的版本', async (t) => {
  const env = await setup(t);
  const refreshDuringFetch = createRuntime({
    root: env.root, now: () => morning,
    execCurl: async (url) => {
      const other = await env.runtime().generate();
      assert.equal(other.ok, true);
      return { ok: true, status: 200, body: url === feed.url ? xml : '<article><p>' + article + '</p></article>' };
    },
  });
  const initial = await runCommand(['prepare'], refreshDuringFetch);
  assert.equal(initial.status, 'ready');
  assert.equal(initial.superseded, true);

  const unfinished = await env.cmd('prepare', '--refresh');
  const selection = await submit(env, unfinished, verdicts(2));
  assert.equal(selection.status, 'summarize');
  const reviewing = await env.cmd('prepare', '--refresh');
  await writeJSON(reviewing.decisions, verdicts(2));
  const result = await runCommand(['review', reviewing.run], refreshDuringFetch);
  assert.equal(result.status, 'ready');
  assert.equal(result.superseded, true);
  // 旧聊天尚未写出 summaries.json，也应能接收新的归档。
  assert.deepEqual(await env.cmd('finish', selection.selection), result);
});

test('配置首建与不同进程的修改可以并行，中断写入后能继续保存', { timeout: 12_000 }, async (t) => {
  const env = await setup(t);
  await fs.unlink(env.runtime().configFile);
  await Promise.all([env.runtime().loadConfig(), env.runtime().saveConfigPatch({ maxItems: 9 })]);
  assert.equal((await env.runtime().loadConfig()).maxItems, 9);

  // 在子进程的原子提交点暂停，模拟用户关掉仍在保存的聊天。
  const code = `
    import { promises as fs } from 'node:fs';
    const { createRuntime } = await import(process.argv[1]);
    const runtime = createRuntime({ root: process.argv[2] });
    const rename = fs.rename;
    fs.rename = async (from, to) => {
      if (to === runtime.configFile) {
        process.send('writing');
        await new Promise((resolve) => process.once('message', resolve));
      }
      return rename(from, to);
    };
    await runtime.saveConfigPatch({ maxItems: 99 });
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code,
    new URL('../desktop/runtime.mjs', import.meta.url).href, env.root], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  const exited = once(child, 'exit');
  const pending = [];
  try {
    const started = await Promise.race([once(child, 'message'), exited]);
    assert.equal(started[0], 'writing');
    pending.push(env.runtime().saveConfigPatch({ maxItems: 7 }));
    pending.push(runCommand(['interests', '--stdin'], env.runtime(), [Buffer.from('新偏好')]));
    const tickets = path.join(env.root, '.dsh-locks');
    const end = Date.now() + 4_000;
    while ((await fs.readdir(tickets)).filter((name) => /^config\.json\.\d+-[a-f0-9-]{36}$/.test(name)).length < 3) {
      assert.ok(Date.now() < end, '两个请求应等待活跃写入');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal((await env.runtime().loadConfig()).maxItems, 9);
  } finally {
    child.kill('SIGKILL');
    await exited;
    await Promise.all(pending);
  }
  const saved = await env.runtime().loadConfig();
  assert.equal(saved.maxItems, 7);
  assert.equal(saved.interests, '新偏好');
  assert.deepEqual(await fs.readdir(path.join(env.root, '.dsh-locks')), []);
});
