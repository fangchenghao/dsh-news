// 客户端半体的冒烟测试：用极简 React 垫片把三个槽位组件各渲染一遍。
// 目的不是验证样式，而是抓住「组件里引用了作用域外的变量」这类运行时才会炸的错误
// （例如 setVotes 被写进 SettingsSection，真机打开设置页就白屏）。
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const clientPath = path.join(here, '..', 'client.js')
const source = fs.readFileSync(clientPath, 'utf8')

function makeReact() {
  let hookIndex = 0
  let states = []
  const effects = []
  return {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter((c) => c != null && c !== false) }),
    Fragment: 'Fragment',
    useState: (initial) => {
      const i = hookIndex++
      if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial
      return [states[i], (next) => { states[i] = typeof next === 'function' ? next(states[i]) : next }]
    },
    useEffect: (fn) => effects.push(fn),
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useRef: (value) => {
      const i = hookIndex++
      if (!(i in states)) states[i] = { current: value }
      return states[i]
    },
    __begin: () => { hookIndex = 0; effects.length = 0 },
    __runEffects: () => { for (const fn of effects) { try { fn() } catch { /* 忽略异步副作用 */ } } },
    __reset: () => { hookIndex = 0; states = []; effects.length = 0 },
  }
}

const digest = {
  date: '2026-11-12',
  generatedAt: '2026-11-12T00:00:00Z',
  filterMode: 'llm',
  totals: { fetched: 80, kept: 2, dropped: 3, summarized: 2 },
  errors: ['一条运行提示'],
  items: [
    { id: 'a', title: '示例新闻', url: 'https://example.com/a', source: 'TC', category: '模型与评测', publishedAt: '2026-11-12T01:00:00Z', summary: '两句总结。', reason: '重要', explore: true },
    { id: 'b', title: '第二条', url: 'https://example.com/b', source: 'Verge', category: '产品与商业', publishedAt: '2026-11-12T02:00:00Z', summary: '', excerpt: '原文摘录一句。', reason: '一般' },
  ],
  dropped: [{ title: '被滤掉的', source: 'HN', reason: '重复' }],
  sources: [{ sourceId: 'tc', name: 'TC', ok: true, count: 3, error: '', via: 'direct' }],
  markdown: '# md',
}
const state = {
  ok: true, running: false, digestDir: '/tmp', proxyDetected: '', version: '0.5.1',
  candidateSelection: { mode: 'reserve-then-fill', reservePerSource: 2 },
  taste: { votes: { a: 'up' }, voteCount: 1, profile: { text: '## 值得看\n- 芯片', updatedAt: 1, basedOn: 1 } },
  config: {
    enabled: true, interests: 'AI 产业', dailyTime: '08:00', maxCandidates: 80, maxItems: 25,
    exploreRatio: 0.2, proxy: '', rsshubBase: '', announceToAgent: false, model: {},
    sources: [{ id: 'tc', name: 'TC', type: 'rss', url: 'https://example.com/rss', category: '媒体', enabled: true, maxItems: 2 }],
  },
  digest,
}

function loadModule(respond = (url) => url.includes('/state') || url.includes('/digest') ? state : { ok: true }) {
  const React = makeReact()
  const store = {}
  globalThis.window = { __ModuleLoader__: { load: (entry) => { globalThis.__entry = entry } } }
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true })
  const fakeFetch = async (url, init) => {
    const body = await respond(String(url), init)
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }
  }
  const requireShim = (name) => (name === 'react' ? React : {})
  new Function('window', 'require', 'fetch', 'navigator', source)(globalThis.window, requireShim, fakeFetch, globalThis.navigator)
  const entry = globalThis.__entry
  const mod = entry.factory ? entry.factory(requireShim) : entry
  mod.apply({
    slots: {
      inject: (name, fn) => fn(),
      register: (reg, comp) => { store[reg.name] = { reg, comp }; return () => {} },
    },
  })
  return { React, store }
}

test('客户端：三个槽位都能注册', () => {
  const { store } = loadModule()
  assert.deepEqual(Object.keys(store).sort(), ['main', 'settings.section', 'sidebar.panellist'])
})

test('客户端：重新生成后显示进行中，轮询结束后读取当天结果', async (t) => {
  const requests = []
  let finished = false
  const today = new Date()
  const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-')
  const { React, store } = loadModule((url, init) => {
    requests.push({ url, init })
    if (url.endsWith('/refresh')) return { ok: true, running: true }
    if (url.endsWith('?view=status')) {
      finished = true
      return { ok: true, running: false, lastError: null }
    }
    return { ...state, digest: finished ? { ...digest, date, items: [], filterMode: 'no-candidates' } : null }
  })
  function button(node, label) {
    if (node?.type === 'button' && node.children.includes(label)) return node
    for (const child of node?.children ?? []) {
      const found = button(child, label)
      if (found) return found
    }
  }
  const render = () => { React.__begin(); return store.main.comp({}) }
  t.mock.timers.enable({ apis: ['setTimeout'] })
  render()
  React.__runEffects()
  await new Promise(setImmediate)
  await button(render(), '重新生成').props.onClick()
  assert.equal(requests.find((r) => r.url.endsWith('/refresh')).init.headers.Prefer, 'respond-async')
  assert.equal(button(render(), '生成中…').props.disabled, true)
  React.__runEffects()
  await new Promise(setImmediate)
  t.mock.timers.tick(5000)
  await new Promise(setImmediate)
  assert.deepEqual(requests.slice(-2).map((r) => r.url), ['/api/dsh-news/state?view=status', '/api/dsh-news/state'])
  const result = render()
  assert.equal(button(result, '重新生成').props.disabled, false)
  assert.match(JSON.stringify(result), /今天没有符合条件的新条目/)
})

test('客户端：每个组件都能渲染，不引用作用域外变量', async () => {
  const { React, store } = loadModule()
  for (const [name, entry] of Object.entries(store)) {
    React.__reset()
    let tree
    assert.doesNotThrow(() => {
      React.__begin()
      tree = entry.comp({ size: 18, active: false })
    }, `${name} 首次渲染炸了`)
    // 让 useEffect 跑起来（会触发 setState），再渲染一次，覆盖「数据到达后」的渲染路径
    React.__runEffects()
    await new Promise((resolve) => setTimeout(resolve, 30))
    assert.doesNotThrow(() => {
      React.__begin()
      tree = entry.comp({ size: 18, active: false })
    }, `${name} 二次渲染炸了`)
  }
})

test('客户端：设置页渲染出品味档案与重新学习入口', async () => {
  const { React, store } = loadModule()
  const comp = store['settings.section'].comp
  React.__reset()
  React.__begin()
  comp({})
  React.__runEffects()
  await new Promise((resolve) => setTimeout(resolve, 30))
  React.__begin()
  const tree = comp({})
  const text = JSON.stringify(tree, (k, v) => (typeof v === 'function' ? '[fn]' : v))
  assert.match(text, /品味档案/)
  assert.match(text, /立即重新学习/)
})

test('设置保存只发编辑过的字段，保留桌面聊天及保存期间的修改', async () => {
  let config = { ...state.config }
  let submitted
  let release
  const hold = new Promise((resolve) => { release = resolve })
  const reads = []
  const { React, store } = loadModule(async (url, init) => {
    if (url.endsWith('/config')) {
      submitted = JSON.parse(init.body)
      await hold
      config = { ...config, ...submitted }
    } else {
      reads.push(url)
    }
    return { ...state, config }
  })
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return
    if (predicate(node)) return node
    for (const child of node.children) {
      const found = find(child, predicate)
      if (found) return found
    }
  }
  const render = () => { React.__begin(); return store['settings.section'].comp({}) }
  const number = (tree) => find(tree, (el) => el.type === 'input' && el.props.max === 100)
  const time = (tree) => find(tree, (el) => el.type === 'input' && el.props.type === 'time')
  const interest = (tree) => find(tree, (el) => el.type === 'textarea')
  render()
  React.__runEffects()
  await new Promise(setImmediate)
  number(render()).props.onChange({ target: { value: '12' } })
  config = { ...config, interests: '桌面聊天刚保存的兴趣' }
  const save = find(render(), (el) => el.type === 'button' && el.children.includes('保存'))
  const pending = save.props.onClick()
  time(render()).props.onChange({ target: { value: '09:30' } })
  release()
  await pending
  assert.deepEqual(reads, ['/api/dsh-news/state?view=settings'])
  assert.deepEqual(submitted, { maxItems: 12 })
  const screen = render()
  assert.equal(number(screen).props.value, 12)
  assert.equal(time(screen).props.value, '09:30')
  assert.equal(interest(screen).props.value, config.interests)
  number(screen).props.onChange({ target: { value: '' } })
  await find(render(), (el) => el.type === 'button' && el.children.includes('保存')).props.onClick()
  assert.deepEqual(submitted, { maxItems: 25, dailyTime: '09:30' })
})
