import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { text } from 'node:stream/consumers';
import { pathToFileURL } from 'node:url';
import {
  buildFilterPrompt, buildMarkdown, createRuntime, digestRevision, isDateString, localDateString,
  parseFilterResponse, redactSecrets, sanitizeSummary,
} from '../../../runtime.mjs';

const RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const WEEK = 7 * 24 * 60 * 60 * 1000;

function runDirectory(runtime, id) {
  if (!RUN_ID.test(id)) throw new Error('无效的任务编号');
  return path.join(runtime.root, 'cache', 'chatgpt', id);
}

async function pruneRuns(base) {
  const entries = await fs.readdir(base, { withFileTypes: true });
  await Promise.all(entries.filter((e) => e.isDirectory() && RUN_ID.test(e.name)).map(async (e) => {
    const dir = path.join(base, e.name);
    if ((await fs.stat(dir)).mtimeMs < Date.now() - WEEK) await fs.rm(dir, { recursive: true, force: true });
  }));
}

async function createStage(runtime, stage, state) {
  const id = randomUUID();
  const dir = runDirectory(runtime, id);
  await fs.mkdir(path.dirname(dir), { recursive: true, mode: 0o700 });
  await fs.mkdir(dir, { mode: 0o700 });
  await fs.writeFile(path.join(dir, stage + '.json'), JSON.stringify(state), { mode: 0o600 });
  return { id, dir };
}

async function readJSON(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function ready(date, digest, superseded = false) {
  return { status: 'ready', date, totals: digest.totals, ...(superseded ? { superseded: true } : {}) };
}

async function publish(runtime, state, selected) {
  const { batch, baseline } = state;
  const digest = runtime.desktop.assembleDigest(batch, selected, batch.candidates.length ? 'llm' : 'no-candidates');
  const saved = await runtime.desktop.save(digest, baseline);
  return ready(batch.date, saved.digest, saved.superseded);
}

async function prepare(runtime, refresh) {
  const start = runtime.desktop.now();
  const date = localDateString(start);
  const previous = await runtime.readDigest(date);
  if (previous && !refresh) return ready(date, previous);
  const config = await runtime.loadConfig();
  const batch = await runtime.desktop.collectCandidates(config, start);
  const baseline = digestRevision(previous);
  const duringFetch = await runtime.desktop.supersedingEdition(date, baseline);
  if (duringFetch) return ready(date, duringFetch, true);
  // 源地址可能带有私有订阅参数，阅读与模型判断只需要源的名称和抓取状态。
  batch.sourceReports = batch.sourceReports.map((report) => ({
    ...report, url: '', error: redactSecrets(report.error),
  }));
  batch.errors = batch.errors.map(redactSecrets);
  const state = {
    batch, baseline,
    config: { interests: config.interests, exploreRatio: config.exploreRatio, maxItems: config.maxItems },
  };
  if (!batch.candidates.length) return publish(runtime, state, { items: [], dropped: [] });
  const { system, prompt } = buildFilterPrompt(config, batch.candidates, await runtime.desktop.readTasteProfile());
  const { id, dir } = await createStage(runtime, 'batch', state);
  await pruneRuns(path.dirname(dir)).catch(() => {});
  const candidates = path.join(dir, 'candidates.txt');
  await fs.writeFile(candidates, [system, prompt].join('\n\n'), { mode: 0o600 });
  return {
    status: 'review', date: batch.date, count: batch.candidates.length, run: id,
    candidates, decisions: path.join(dir, 'decisions.json'),
  };
}

async function review(runtime, run) {
  const dir = runDirectory(runtime, run);
  const state = await readJSON(path.join(dir, 'batch.json'));
  const newer = await runtime.desktop.supersedingEdition(state.batch.date, state.baseline);
  if (newer) return ready(state.batch.date, newer, true);
  const verdicts = await readJSON(path.join(dir, 'decisions.json'));
  const count = state.batch.candidates.length;
  if (!Array.isArray(verdicts) || verdicts.length !== count ||
      !verdicts.every((v) => Number.isInteger(v?.i) && v.i >= 1 && v.i <= count &&
        typeof v.keep === 'boolean' && typeof v.reason === 'string' && v.reason.trim()) ||
      new Set(verdicts.map((v) => v.i)).size !== count) {
    throw new Error(`筛选结果须覆盖 1 至 ${count} 的每个编号，各含布尔值 keep 与非空理由 reason`);
  }
  const judgement = parseFilterResponse(JSON.stringify(verdicts), count);
  const selected = await runtime.desktop.selectReviewedItems(state.batch, state.config, judgement);
  if (!selected.items.length) return publish(runtime, state, selected);
  const materials = await runtime.desktop.materials(selected.items, state.batch.errors, state.batch.date);
  const pending = materials.filter((item) => !item.cached);
  if (!pending.length) return publish(runtime, state, selected);
  const duringFetch = await runtime.desktop.supersedingEdition(state.batch.date, state.baseline);
  if (duringFetch) return ready(state.batch.date, duringFetch, true);
  const next = await createStage(runtime, 'selection', { ...state, selected });
  const file = path.join(next.dir, 'materials.jsonl');
  await fs.writeFile(file, pending.map((item) => JSON.stringify(item)).join('\n') + '\n', { mode: 0o600 });
  return {
    status: 'summarize', date: state.batch.date, count: pending.length, selection: next.id,
    materials: file, summaries: path.join(next.dir, 'summaries.json'),
  };
}

async function finish(runtime, selection) {
  const dir = runDirectory(runtime, selection);
  const state = await readJSON(path.join(dir, 'selection.json'));
  const newer = await runtime.desktop.supersedingEdition(state.batch.date, state.baseline);
  if (newer) return ready(state.batch.date, newer, true);
  const rows = await readJSON(path.join(dir, 'summaries.json'));
  const pending = new Map(state.selected.items.filter((item) => !item.summary).map((item) => [item.id, item]));
  if (!Array.isArray(rows) || rows.length !== pending.size) throw new Error('摘要数量与待总结的条目数不符');
  for (const row of rows) {
    const item = pending.get(row?.id);
    const summary = typeof row?.summary === 'string' && sanitizeSummary(row.summary);
    if (!item || !summary) throw new Error('摘要须按素材 id 提交，每个 id 对应一条非空摘要');
    item.summary = summary;
    pending.delete(item.id);
  }
  return publish(runtime, state, state.selected);
}

export async function runCommand(args, runtime = createRuntime(), input = process.stdin) {
  const [command, arg] = args;
  if (args.length <= 2) {
    if (command === 'prepare' && (!arg || arg === '--refresh')) return prepare(runtime, Boolean(arg));
    if (command === 'review' && arg) return review(runtime, arg);
    if (command === 'finish' && arg) return finish(runtime, arg);
    if (command === 'interests' && (!arg || arg === '--stdin')) {
      const config = arg ? await runtime.saveConfigPatch({ interests: (await text(input)).trim() }) : await runtime.loadConfig();
      return { interests: config.interests };
    }
    if (command === 'read') {
      let date = arg || runtime.today();
      if (date === 'yesterday') {
        const day = new Date(runtime.today() + 'T12:00:00');
        day.setDate(day.getDate() - 1);
        date = localDateString(day);
      }
      if (!isDateString(date)) throw new Error('日期格式应为 YYYY-MM-DD');
      const digest = await runtime.readDigest(date);
      if (!digest) throw new Error(`没有 ${date} 的简报`);
      return await runtime.readMarkdown(date, digest) || buildMarkdown(digest);
    }
  }
  throw new Error('用法：news.mjs prepare [--refresh] | review RUN | finish SELECTION | read [YYYY-MM-DD|yesterday] | interests [--stdin]');
}

const entry = process.argv[1];
if (import.meta.main ?? (entry && import.meta.url === pathToFileURL(await fs.realpath(entry).catch(() => entry)).href)) {
  try {
    const result = await runCommand(process.argv.slice(2));
    console.log(typeof result === 'string' ? result : JSON.stringify(result));
  } catch (error) {
    console.error(redactSecrets(error.message));
    process.exitCode = 1;
  }
}
