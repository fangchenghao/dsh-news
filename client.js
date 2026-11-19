window.__ModuleLoader__.load({
  id: '@local/dsh-news',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback, useRef, useMemo } = React

    const ID = 'dsh-news'

    const T = Object.assign({}, {
      brand: '每日 AI 简报',
      sidebarLabel: '每日简报',
      kicker: 'DAILY AI BRIEF',
      settingsSuffix: ' · 设置',
      refresh: '重新生成',
      refreshing: '生成中…',
      refreshStarted: '已开始生成，完成后自动刷新…',
      copy: '复制 Markdown',
      copied: '已复制',
      copiedLong: '已复制到剪贴板',
      copyFail: '复制失败，可到本地文件里取全文',
      prevDay: '前一天',
      nextDay: '后一天',
      todayBtn: '今天',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      upToDate: '所有改动均已保存',
      retry: '重试',
      loading: '正在读取简报…',
      empty: '这一天还没有简报',
      emptyHint: '点「重新生成」抓一次；之后每天会按你设的时间自动生成。',
      errorTitle: '出错了',
      loadFail: '读取配置失败',
      noDigestFor: '没有这一天的简报：',
      droppedTitle: '被滤掉',
      droppedHint: '模型判断为不值得占用你时间的条目，理由一并列出，方便你核对它有没有筛错。',
      sourcesTitle: '信息源状态',
      appendix: '附录',
      viaDirect: '直连',
      viaProxy: '代理',
      failed: '失败',
      unit: ' 条',
      countFetched: '抓取',
      countKept: '保留',
      countDropped: '滤掉',
      countSummarized: '已总结',
      noticeTitle: '运行提示',
      badPattern: '失败|错误|异常|不可用|超时',
      fallback: '模型不可用，本次按时间倒序全留（未做筛选）',
      whyKept: '为什么留',
      noSummary: '（这条没生成总结：模型调用失败）',
      untitled: '(无标题)',
      unknownSource: '未知来源',
      uncategorized: '未分类',
      tocLabel: '本期',
      generatedAt: '生成于 ',
      fullText: '全文',
      minutesAgo: ' 分钟前',
      hoursAgo: ' 小时前',
      weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      errRequest: '请求失败：',
      errNotJson: '返回不是 JSON（HTTP ',
      errUnknown: '未知错误',
      errGenerate: '生成失败',
      readHere: '阅读界面在左侧边栏「每日简报」；这里只放配置。',
      interestsLabel: '你的兴趣',
      interestsHint: '自然语言，模型照这个判断留不留。写得越具体越好：关注什么、不要什么。这段话会原样交给模型。',
      sourcesLabel: '信息源',
      addSource: '添加源',
      tasteTitle: '品味档案（从你的点赞/点踩里学到的）',
      tasteEmpty: '还没有学到东西。在阅读界面给几条新闻点「值得看」或「不想看」，攒够 25 条会自动提炼一次（也可以现在手动提炼）。',
      tasteLearn: '立即重新学习',
      tasteLearning: '学习中…',
      tasteCount: '已记录反馈',
      learned: '品味档案已更新',
      tasteReset: '复原',
      tasteResetConfirm: '确定复原？',
      tasteResetHint: '清空全部反馈和学到的品味，回到从没学过的状态。会在数据目录留一份备份。',
      tasteResetDone: '已复原：反馈和品味档案都清空了',
      updateTitle: '版本与更新',
      updateCheck: '检查更新',
      updateChecking: '检查中…',
      updateApply: '立即更新',
      updateApplying: '更新中…',
      updateLatest: '已是最新',
      updateBehind: '有新版本',
      updateRestart: '更新完成，重启 Harness 后生效',
      updateCurrent: '当前',
      updateRemote: '最新',
      updateNotGit: '当前安装不是 git 检出，无法自动更新（重新克隆仓库后再装一次即可）',
      newSource: '新源',
      remove: '删除',
      test: '测试',
      testing: '测试中…',
      testOk: '通，样本：',
      testFail: '失败：',
      typeLabel: '类型',
      nameLabel: '名称',
      urlLabel: '地址 / ID',
      categoryLabel: '分类',
      categoryPlaceholder: '官方 / 媒体 / 社区',
      maxItemsLabel: '候选上限',
      maxItemsHint: '候选上限：这个源每天最多贡献几条候选；留空 = 只受全局约束。arXiv 默认 2。',
      unlimited: '不限',
      enabledLabel: '启用',
      timeLabel: '每天生成时间',
      candidatesLabel: '候选上限',
      candidatesHint: '每天送进模型筛选的候选数',
      itemsLabel: '保留上限',
      maxAgeLabel: '时效窗口（天）',
      maxAgeHint: '发布超过这么多天的条目不进简报；0 = 不限制。默认 3。',
      repeatLabel: '重复窗口（天）',
      repeatHint: '最近这么多天已经推过的新闻不再重复推；0 = 不限制。默认 7。',
      itemsHint: '最终保留上限',
      proxyLabel: '代理',
      proxyHint: '留空 = 自动（先直连，失败再走本机代理）；direct = 只直连；否则填 http://127.0.0.1:7890。',
      proxyPlaceholder: '留空自动 / direct / http://127.0.0.1:7890',
      proxyDetected: '检测到本机代理',
      rsshubLabel: 'RSSHub 基址',
      rsshubHint: 'B站 / YouTube 依赖它；本机没起服务时这两个源抓不到，属正常。',
      announceLabel: '把当天简报注入系统提示词',
      announceHint: '默认关闭以省上下文。关闭后模型不会自动知道当天简报，需要你自己在阅读界面看。',
      enabledLabelPlugin: '启用插件',
      enabledPluginHint: '关闭后不再自动生成。',
      modelHint: '留空 = 跟随宿主默认模型。',
      followDefault: '留空跟随默认',
      provider: 'Provider',
      model: 'Model',
      groupSources: '兴趣与信息源',
      groupRun: '运行',
      dirty: '有未保存的改动',
      digestDirLabel: '简报目录',
    }, {
      brand: '每日 AI 简报',
      sidebarLabel: '每日简报',
      kicker: 'DAILY AI BRIEF',
      refresh: '重新生成',
      refreshing: '生成中…',
      copy: '复制 Markdown',
      copied: '已复制到剪贴板',
      prevDay: '前一天',
      nextDay: '后一天',
      todayBtn: '今天',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      retry: '重试',
      loading: '正在读取简报…',
      empty: '这一天还没有简报',
      emptyHint: '点「重新生成」抓一次；之后每天会按你设的时间自动生成。',
      droppedTitle: '被滤掉',
      droppedHint: '模型判断为不值得占用你时间的条目，理由一并列出，方便你核对它有没有筛错。',
      sourcesTitle: '信息源',
      viaDirect: '直连',
      viaProxy: '代理',
      failed: '失败',
      countFetched: '抓取',
      countKept: '保留',
      countDropped: '滤掉',
      countSummarized: '已总结',
      noticeTitle: '运行提示',
      fallback: '模型不可用，本次按时间倒序全留（未做筛选）',
      whyKept: '为什么留',
      noSummary: '（这条没生成总结：模型调用失败）',
      readHere: '阅读界面在左侧边栏「每日简报」；这里只放配置。',
      interestsLabel: '你的兴趣（自然语言，模型照这个判断留不留）',
      interestsHint: '写得越具体越好：关注什么、不要什么。这段话会原样交给模型。',
      sourcesLabel: '信息源',
      addSource: '添加源',
      remove: '删除',
      test: '测试',
      testing: '测试中…',
      testOk: '通，样本：',
      testFail: '失败：',
      typeLabel: '类型',
      nameLabel: '名称',
      urlLabel: '地址 / ID',
      categoryLabel: '分类',
      maxItemsLabel: '候选上限',
      maxItemsHint: '这个源每天最多贡献几条候选；留空 = 只受全局约束。arXiv 默认 2。',
      enabledLabel: '启用',
      timeLabel: '每天生成时间',
      candidatesLabel: '候选上限',
      candidatesHint: '每天送进模型筛选的候选数',
      itemsLabel: '保留上限',
      itemsHint: '最终保留上限',
      proxyLabel: '代理',
      proxyHint: '留空 = 自动（先直连，失败再走本机代理）；direct = 只直连；否则填 http://127.0.0.1:7890。',
      proxyDetected: '检测到本机代理',
      rsshubLabel: 'RSSHub 基址',
      rsshubHint: 'B站 / YouTube 依赖它；本机没起服务时这两个源抓不到，属正常。',
      announceLabel: '把当天简报注入系统提示词',
      announceHint: '默认关闭以省上下文。关闭后模型不会自动知道当天简报，需要你自己在阅读界面看。',
      enabledLabelPlugin: '启用插件（关闭后不再自动生成）',
      modelLabel: '模型',
      modelHint: '留空 = 跟随宿主默认模型。',
      provider: 'provider',
      model: 'model',
      groupSources: '兴趣与信息源',
      groupRun: '运行',
      dirty: '有未保存的改动',
      unsaved: '设置未保存',
    })

    const TYPE_LABEL = {
      'rss': 'RSS / Atom',
      'google-news': 'Google News 关键词',
      'reddit': 'Reddit 版块（r/…）',
      'youtube': 'YouTube 频道（channel id）',
      'bilibili': 'B 站 UP 主（uid）',
      'anthropic-html': '网页抓取（Anthropic）',
    }

    const CSS = `
.rssnews_panel{height:100%;overflow-y:auto;overflow-x:hidden;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);-webkit-font-smoothing:antialiased;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l1) transparent}
.rssnews_panel::-webkit-scrollbar{width:10px}
.rssnews_panel::-webkit-scrollbar-track{background:transparent}
.rssnews_panel::-webkit-scrollbar-thumb{background-color:var(--dsw-alias-border-l1);border-radius:10px;border:3px solid transparent;background-clip:content-box}
.rssnews_panel::-webkit-scrollbar-thumb:hover{background-color:var(--dsw-alias-label-dimmed)}
.rssnews_page{max-width:728px;margin:0 auto;padding:44px 32px 120px;box-sizing:border-box}

.rssnews_topline{display:flex;align-items:center;gap:14px;font-size:10.5px;line-height:16px;letter-spacing:.22em;font-weight:650;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.rssnews_rule{flex:1;height:1px;background:var(--dsw-alias-border-l1)}
.rssnews_topDate{font-variant-numeric:tabular-nums;letter-spacing:.12em}
.rssnews_headRow{display:flex;align-items:flex-end;justify-content:space-between;gap:20px 24px;flex-wrap:wrap;margin-top:18px}
.rssnews_title{margin:0;font-size:36px;line-height:1.12;font-weight:750;letter-spacing:-.025em;color:var(--dsw-alias-label-primary)}
.rssnews_dateline{margin-top:10px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.rssnews_dot{width:3px;height:3px;border-radius:50%;background:var(--dsw-alias-label-dimmed);flex:none}
.rssnews_live{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-state-business-primary);font-weight:600}
.rssnews_liveDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-business-primary);animation:rssnews_pulse 1.2s ease-in-out infinite}

.rssnews_actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rssnews_seg{display:inline-flex;align-items:stretch;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;overflow:hidden;height:30px;box-sizing:border-box}
.rssnews_segBtn{appearance:none;border:0;margin:0;background:transparent;font:inherit;font-size:12.5px;line-height:1;padding:0 10px;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;transition:background .14s,color .14s}
.rssnews_segBtn+.rssnews_segBtn{border-left:1px solid var(--dsw-alias-border-l1)}
.rssnews_segBtn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.rssnews_segBtn:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.rssnews_segBtn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}

.rssnews_btn{appearance:none;margin:0;font:inherit;font-size:12.5px;line-height:1;height:30px;padding:0 12px;box-sizing:border-box;border-radius:9px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l1);transition:background .14s,border-color .14s,color .14s,filter .14s}
.rssnews_btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
.rssnews_btn:disabled{opacity:.42;cursor:default}
.rssnews_btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.rssnews_btnPrimary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:var(--dsw-alias-bg-layer-1);font-weight:600}
.rssnews_btnPrimary:hover:not(:disabled){background:var(--dsw-alias-state-business-primary);border-color:transparent;filter:brightness(1.07)}
.rssnews_btnIcon{width:30px;padding:0;color:var(--dsw-alias-label-tertiary)}
.rssnews_btnDanger:hover:not(:disabled){color:var(--dsw-alias-state-danger-primary);border-color:var(--dsw-alias-state-danger-primary);background:transparent}
.rssnews_btnSmall{height:28px;font-size:12px;padding:0 10px}
.rssnews_spin{animation:rssnews_spin 1s linear infinite}

.rssnews_stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:26px;border-top:2px solid var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l1)}
.rssnews_stat{display:flex;flex-direction:column;gap:1px;padding:12px 0 13px 18px;border-left:1px solid var(--dsw-alias-border-l1);min-width:0}
.rssnews_stat:first-child{border-left:0;padding-left:0}
.rssnews_statNum{font-size:24px;line-height:30px;font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}
.rssnews_statNum.is-accent{color:var(--dsw-alias-state-business-primary)}
.rssnews_statNum.is-muted{color:var(--dsw-alias-label-tertiary)}
.rssnews_statLabel{font-size:11px;line-height:16px;letter-spacing:.1em;color:var(--dsw-alias-label-tertiary)}
.rssnews_mastRule{margin-top:26px;border-top:2px solid var(--dsw-alias-label-primary)}

.rssnews_notes{margin-top:18px;display:flex;flex-direction:column;gap:8px}
.rssnews_callout{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);font-size:12.5px;line-height:1.65;color:var(--dsw-alias-label-secondary)}
.rssnews_callout>svg{flex:none;margin-top:3px;color:var(--dsw-alias-label-tertiary)}
.rssnews_callout.is-danger>svg{color:var(--dsw-alias-state-danger-primary)}
.rssnews_callout.is-info>svg{color:var(--dsw-alias-state-business-primary)}
.rssnews_callout.is-success>svg{color:var(--dsw-alias-state-success-primary)}
.rssnews_calloutBody{display:flex;flex-direction:column;gap:2px;min-width:0;word-break:break-word}
.rssnews_calloutCap{font-weight:650;color:var(--dsw-alias-label-primary)}
.rssnews_bad{color:var(--dsw-alias-state-danger-primary)}
.rssnews_ok{color:var(--dsw-alias-state-success-primary)}

.rssnews_toc{position:sticky;top:0;z-index:2;margin:28px -32px 0;padding:10px 32px;background:var(--dsw-alias-bg-layer-1);border-bottom:1px solid transparent;transition:border-color .16s}
.rssnews_toc.is-stuck{border-bottom-color:var(--dsw-alias-border-l1)}
.rssnews_tocInner{display:flex;align-items:center;gap:2px;overflow-x:auto;scrollbar-width:none}
.rssnews_tocInner::-webkit-scrollbar{display:none}
.rssnews_tocLabel{flex:none;font-size:10.5px;letter-spacing:.18em;font-weight:650;color:var(--dsw-alias-label-tertiary);margin-right:8px;text-transform:uppercase}
.rssnews_tocItem{appearance:none;flex:none;border:0;margin:0;background:transparent;font:inherit;font-size:12.5px;line-height:18px;padding:5px 11px;border-radius:999px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;display:inline-flex;align-items:baseline;gap:5px;transition:background .14s,color .14s,box-shadow .14s}
.rssnews_tocItem:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.rssnews_tocItem.is-active{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);font-weight:600}
.rssnews_tocItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.rssnews_tocCount{font-size:10.5px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-weight:500}

.rssnews_section{margin-top:40px;scroll-margin-top:58px}
.rssnews_section.is-first{margin-top:28px}
.rssnews_secHead{display:flex;align-items:center;gap:12px}
.rssnews_secName{font-size:12px;line-height:18px;font-weight:700;letter-spacing:.16em;color:var(--dsw-alias-state-business-primary);text-transform:uppercase}
.rssnews_secCount{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}

.rssnews_item{display:grid;grid-template-columns:38px minmax(0,1fr);padding:22px 0 26px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rssnews_item:last-child{border-bottom:0;padding-bottom:6px}
.rssnews_itemNo{font-size:12px;line-height:20px;padding-top:4px;font-weight:600;letter-spacing:.06em;color:var(--dsw-alias-label-dimmed);font-variant-numeric:tabular-nums}
.rssnews_itemMain{min-width:0}
.rssnews_itemTitle{display:inline;font-size:19px;line-height:1.45;font-weight:650;letter-spacing:-.012em;color:var(--dsw-alias-label-primary);text-decoration:none;word-break:break-word;border-radius:3px;transition:color .14s,text-decoration-color .14s}
a.rssnews_itemTitle{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;text-decoration-color:transparent}
a.rssnews_itemTitle:hover{text-decoration-color:var(--dsw-alias-label-dimmed)}
a.rssnews_itemTitle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px}
.rssnews_ext{display:inline-block;vertical-align:1px;margin-left:5px;color:var(--dsw-alias-label-dimmed);opacity:0;transition:opacity .14s}
a.rssnews_itemTitle:hover .rssnews_ext,a.rssnews_itemTitle:focus-visible .rssnews_ext{opacity:1}
.rssnews_meta{margin-top:7px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.rssnews_metaSource{color:var(--dsw-alias-label-secondary);font-weight:550}
.rssnews_body.is-excerpt{color:var(--dsw-alias-label-secondary)}
.rssnews_body{margin-top:12px;font-size:15.5px;line-height:1.78;letter-spacing:.005em;color:var(--dsw-alias-label-primary);white-space:pre-line;word-break:break-word}
.rssnews_body.is-missing{color:var(--dsw-alias-label-tertiary);font-size:13.5px}
.rssnews_reason{margin-top:12px;font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-tertiary);white-space:pre-line;word-break:break-word}
.rssnews_reasonCap{font-weight:650;color:var(--dsw-alias-label-secondary);margin-right:2px}

.rssnews_skel{margin-top:40px}
.rssnews_skelItem{padding:22px 0 26px 38px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rssnews_skelLine{height:11px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);margin-top:11px;animation:rssnews_pulse 1.5s ease-in-out infinite}
.rssnews_skelLine.is-title{height:18px;margin-top:0;background:var(--dsw-alias-bg-layer-3)}
.rssnews_skelLine.is-meta{height:9px;margin-top:10px;margin-bottom:18px}
.rssnews_srOnly{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.rssnews_state{margin-top:64px;padding:8px 24px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
.rssnews_stateIcon{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);margin-bottom:6px}
.rssnews_stateIcon.is-danger{color:var(--dsw-alias-state-danger-primary)}
.rssnews_stateTitle{font-size:17px;line-height:26px;font-weight:650;color:var(--dsw-alias-label-primary)}
.rssnews_stateHint{max-width:380px;font-size:13px;line-height:1.7;color:var(--dsw-alias-label-secondary);word-break:break-word}
.rssnews_stateSub{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.rssnews_state .rssnews_btn{margin-top:10px}

.rssnews_appendix{margin-top:64px}
.rssnews_appendixHead{display:flex;align-items:center;gap:12px;font-size:10.5px;line-height:16px;letter-spacing:.22em;font-weight:650;color:var(--dsw-alias-label-tertiary);text-transform:uppercase;padding-bottom:4px}
.rssnews_details{border-bottom:1px solid var(--dsw-alias-border-l1)}
.rssnews_sum{list-style:none;display:flex;align-items:center;gap:10px;padding:14px 2px;cursor:pointer;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);user-select:none;border-radius:6px;transition:color .14s}
.rssnews_sum::-webkit-details-marker{display:none}
.rssnews_sum::marker{content:''}
.rssnews_sum:hover{color:var(--dsw-alias-label-primary)}
.rssnews_sum:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.rssnews_sumTitle{font-weight:600}
.rssnews_sumCount{font-size:12px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.rssnews_chev{margin-left:auto;color:var(--dsw-alias-label-tertiary);transition:transform .16s}
.rssnews_details[open] .rssnews_chev{transform:rotate(180deg)}
.rssnews_detailsBody{padding:0 2px 18px}
.rssnews_detailsHint{font-size:12px;line-height:1.65;color:var(--dsw-alias-label-tertiary);margin-bottom:6px}
.rssnews_drop{padding:10px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.rssnews_dropTitle{font-size:13.5px;line-height:1.55;color:var(--dsw-alias-label-secondary);word-break:break-word}
.rssnews_dropMeta{margin-top:2px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary);word-break:break-word}
.rssnews_dropSrc{color:var(--dsw-alias-label-secondary);margin-right:6px}
.rssnews_srcRow{display:grid;grid-template-columns:8px minmax(0,1fr) auto auto;align-items:center;gap:3px 12px;padding:9px 0;border-top:1px solid var(--dsw-alias-border-l1);font-size:12.5px;line-height:18px}
.rssnews_status{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
.rssnews_status.is-bad{background:var(--dsw-alias-state-danger-primary)}
.rssnews_srcName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary)}
.rssnews_srcCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.rssnews_tag{font-size:10.5px;line-height:16px;padding:0 6px;border-radius:4px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);letter-spacing:.04em}
.rssnews_srcErr{grid-column:2/-1;font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary);word-break:break-all}

.rssnews_colophon{margin-top:40px;font-size:11.5px;line-height:18px;color:var(--dsw-alias-label-tertiary);display:flex;gap:8px;flex-wrap:wrap}
.rssnews_mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary);word-break:break-all}

.rssnews_set{display:flex;flex-direction:column;gap:30px;max-width:880px;box-sizing:border-box;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:13px;line-height:1.5}
.rssnews_setTitle{margin:0;font-size:18px;line-height:26px;font-weight:700;letter-spacing:-.01em}
.rssnews_setSub{margin-top:3px;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.rssnews_group{display:flex;flex-direction:column;gap:16px}
.rssnews_groupHead{display:flex;align-items:center;gap:12px;font-size:10.5px;line-height:16px;font-weight:700;letter-spacing:.2em;color:var(--dsw-alias-label-tertiary);text-transform:uppercase}
.rssnews_field{display:flex;flex-direction:column;gap:6px;min-width:0}
.rssnews_label{font-size:12.5px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary)}
.rssnews_hint{font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}
.rssnews_input{font:inherit;font-size:13px;line-height:20px;height:32px;padding:0 10px;width:100%;box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;transition:border-color .14s;min-width:0}
.rssnews_input::placeholder,.rssnews_bare::placeholder{color:var(--dsw-alias-label-dimmed)}
.rssnews_input:hover{border-color:var(--dsw-alias-label-dimmed)}
.rssnews_input:focus{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-1px;border-color:transparent}
.rssnews_textarea{height:auto;min-height:128px;padding:10px 12px;line-height:1.75;resize:vertical}
.rssnews_select{cursor:pointer;padding-right:6px}
.rssnews_cols{display:grid;gap:14px 16px}
.rssnews_cols.is-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.rssnews_cols.is-2{grid-template-columns:repeat(2,minmax(0,1fr))}

.rssnews_listBar{display:flex;align-items:center;gap:10px}
.rssnews_listTitle{font-size:12.5px;font-weight:600}
.rssnews_listCount{font-size:11.5px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.rssnews_grow{flex:1}
.rssnews_srcList{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden}
.rssnews_srcHead,.rssnews_srow{display:grid;grid-template-columns:30px minmax(0,1.25fr) minmax(0,1fr) 86px 104px;gap:8px 10px;align-items:center;padding:0 14px}
.rssnews_srcHead{padding-top:8px;padding-bottom:8px;background:var(--dsw-alias-bg-layer-2);font-size:11px;line-height:16px;letter-spacing:.06em;color:var(--dsw-alias-label-tertiary);border-bottom:1px solid var(--dsw-alias-border-l1)}
.rssnews_srow{padding-top:12px;padding-bottom:12px;border-top:1px solid var(--dsw-alias-border-l1);transition:background .14s}
.rssnews_srow:first-of-type{border-top:0}
.rssnews_srow:hover{background:var(--dsw-alias-bg-layer-2)}
.rssnews_srow .rssnews_input{height:30px;font-size:12.5px}
.rssnews_srow.is-off .rssnews_srowName,.rssnews_srow.is-off .rssnews_srowType,.rssnews_srow.is-off .rssnews_srowMax,.rssnews_srow.is-off .rssnews_srowSub{opacity:.55}
.rssnews_srowActions{display:flex;justify-content:flex-end;gap:6px}
.rssnews_srowSub{grid-column:2/-1;display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:10px}
.rssnews_affix{display:flex;align-items:center;height:30px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);min-width:0;transition:border-color .14s}
.rssnews_affix:hover{border-color:var(--dsw-alias-label-dimmed)}
.rssnews_affix:focus-within{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-1px;border-color:transparent}
.rssnews_affixLabel{flex:none;padding:0 9px 0 10px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);border-right:1px solid var(--dsw-alias-border-l1);margin-right:9px;white-space:nowrap}
.rssnews_bare{flex:1;min-width:0;height:100%;border:0;margin:0;padding:0 10px 0 0;background:transparent;font:inherit;font-size:12.5px;color:var(--dsw-alias-label-primary);outline:none}
.rssnews_srowTest{grid-column:2/-1;font-size:11.5px;line-height:1.6;word-break:break-word;display:flex;gap:6px;align-items:flex-start}
.rssnews_srowTest>svg{flex:none;margin-top:2px}
.rssnews_srowTest.is-ok{color:var(--dsw-alias-label-secondary)}
.rssnews_srowTest.is-ok>svg{color:var(--dsw-alias-state-success-primary)}
.rssnews_srowTest.is-bad{color:var(--dsw-alias-state-danger-primary)}
.rssnews_srcEmpty{padding:22px 14px;text-align:center;font-size:12.5px;color:var(--dsw-alias-label-tertiary)}

.rssnews_switch{appearance:none;-webkit-appearance:none;flex:none;margin:0;width:30px;height:18px;box-sizing:border-box;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3);position:relative;cursor:pointer;transition:background .16s,border-color .16s}
.rssnews_switch::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-label-tertiary);transition:transform .16s,background .16s}
.rssnews_switch:checked{background:var(--dsw-alias-state-business-primary);border-color:transparent}
.rssnews_switch:checked::after{transform:translateX(12px);background:var(--dsw-alias-bg-layer-1)}
.rssnews_switch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.rssnews_toggleRow{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid var(--dsw-alias-border-l1);cursor:pointer}
.rssnews_toggleRow .rssnews_switch{margin-top:1px}
.rssnews_toggleText{display:flex;flex-direction:column;gap:2px;min-width:0}

.rssnews_saveBar{position:sticky;bottom:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 0;background:var(--dsw-alias-bg-layer-1);border-top:1px solid var(--dsw-alias-border-l1)}
.rssnews_saveStatus{display:inline-flex;align-items:center;gap:7px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);min-width:0;word-break:break-word}
.rssnews_saveStatus.is-dirty{color:var(--dsw-alias-label-secondary)}
.rssnews_saveStatus.is-ok{color:var(--dsw-alias-state-success-primary)}
.rssnews_saveStatus.is-bad{color:var(--dsw-alias-state-danger-primary)}
.rssnews_dirtyDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-business-primary);flex:none}

@keyframes rssnews_pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes rssnews_spin{to{transform:rotate(360deg)}}

@media (max-width:720px){
.rssnews_page{padding:28px 20px 96px}
.rssnews_toc{margin-left:-20px;margin-right:-20px;padding-left:20px;padding-right:20px}
.rssnews_title{font-size:28px}
.rssnews_item{grid-template-columns:minmax(0,1fr)}
.rssnews_itemNo{display:none}
.rssnews_skelItem{padding-left:0}
.rssnews_stat{padding-left:12px}
.rssnews_statNum{font-size:20px;line-height:26px}
.rssnews_cols.is-3,.rssnews_cols.is-2{grid-template-columns:minmax(0,1fr)}
.rssnews_srcHead{display:none}
.rssnews_srow{grid-template-columns:30px minmax(0,1fr) auto}
.rssnews_srowType,.rssnews_srowMax{grid-column:2/-1}
.rssnews_srowActions{grid-column:3;grid-row:1}
.rssnews_srowSub{grid-template-columns:minmax(0,1fr)}
}

@media (prefers-reduced-motion: reduce){
.rssnews_liveDot,.rssnews_skelLine,.rssnews_spin{animation:none}
.rssnews_btn,.rssnews_segBtn,.rssnews_tocItem,.rssnews_toc,.rssnews_chev,.rssnews_sum,.rssnews_itemTitle,.rssnews_ext,.rssnews_switch,.rssnews_switch::after,.rssnews_input,.rssnews_affix,.rssnews_srow{transition:none}
}

/* ---- 设置页沿用旧样式，类名 rssnews_set_ 隔离 ---- */

.rssnews_set_panel{height:100%;overflow-y:auto;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family)}
.rssnews_set_page{max-width:820px;margin:0 auto;padding:30px 36px 110px;box-sizing:border-box}
.rssnews_set_mast{display:flex;flex-direction:column;gap:12px;padding-bottom:20px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.rssnews_set_kicker{font-size:11px;line-height:16px;letter-spacing:.14em;font-weight:600;color:var(--dsw-alias-label-tertiary);text-transform:uppercase}
.rssnews_set_mastRow{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.rssnews_set_title{margin:0;font-size:27px;line-height:36px;font-weight:650;letter-spacing:-.01em;color:var(--dsw-alias-label-primary)}
.rssnews_set_date{font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;margin-top:2px}
.rssnews_set_actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rssnews_set_btn{appearance:none;font:inherit;font-size:12px;line-height:18px;padding:6px 12px;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l1);transition:background .14s,border-color .14s,color .14s;white-space:nowrap}
.rssnews_set_btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-3);border-color:var(--dsw-alias-label-dimmed)}
.rssnews_set_btn:disabled{opacity:.45;cursor:default}
.rssnews_set_btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.rssnews_set_btnPrimary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:var(--dsw-alias-bg-layer-1)}
.rssnews_set_btnPrimary:hover:not(:disabled){background:var(--dsw-alias-state-business-primary);filter:brightness(1.08)}
.rssnews_set_btnGhost{background:transparent}
.rssnews_set_chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rssnews_set_chip{display:inline-flex;align-items:baseline;gap:5px;padding:2px 9px;border-radius:999px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l1)}
.rssnews_set_chip b{font-weight:650;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.rssnews_set_alert{display:flex;gap:6px;flex-direction:column;padding:10px 12px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;margin-top:16px}
.rssnews_set_note{display:flex;flex-direction:column;gap:3px;margin-top:14px;padding:1px 0 1px 10px;border-left:2px solid var(--dsw-alias-border-l1);font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.rssnews_set_noteCap{font-weight:600;color:var(--dsw-alias-label-secondary)}
.rssnews_set_bad{color:var(--dsw-alias-state-danger-primary,var(--dsw-alias-label-primary))}
.rssnews_set_ok{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-label-secondary))}
.rssnews_set_cat{display:flex;align-items:baseline;gap:10px;margin:34px 0 14px}
.rssnews_set_catName{font-size:13px;line-height:20px;font-weight:650;letter-spacing:.04em;color:var(--dsw-alias-label-primary)}
.rssnews_set_catCount{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.rssnews_set_catRule{flex:1;height:.5px;background:var(--dsw-alias-border-l1);transform:translateY(-3px)}
.rssnews_set_item{padding:0 0 26px;margin:0 0 26px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.rssnews_set_item:last-child{border-bottom:0;margin-bottom:0;padding-bottom:8px}
.rssnews_set_itemTitle{display:block;font-size:17px;line-height:26px;font-weight:600;color:var(--dsw-alias-label-primary);text-decoration:none;letter-spacing:-.005em}
a.rssnews_set_itemTitle:hover{text-decoration:underline;text-underline-offset:3px}
.rssnews_set_itemMeta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:6px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.rssnews_set_source{padding:0 7px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.rssnews_set_sep{color:var(--dsw-alias-label-dimmed)}
.rssnews_set_itemBody{margin-top:10px;font-size:14.5px;line-height:26px;color:var(--dsw-alias-label-primary);letter-spacing:.003em;white-space:pre-line}
.rssnews_set_itemReason{margin-top:10px;padding-left:10px;border-left:2px solid var(--dsw-alias-border-l1);font-size:12px;line-height:19px;color:var(--dsw-alias-label-tertiary)}
.rssnews_set_details{margin-top:34px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden}
.rssnews_set_detailsHead{display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);list-style:none;user-select:none}
.rssnews_set_detailsHead::-webkit-details-marker{display:none}
.rssnews_set_detailsHead:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.rssnews_set_chev{transition:transform .14s;color:var(--dsw-alias-label-tertiary);font-size:10px}
.rssnews_set_details[open] .rssnews_set_chev{transform:rotate(90deg)}
.rssnews_set_detailsBody{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px}
.rssnews_set_drop{display:flex;flex-direction:column;gap:2px;padding-top:10px;border-top:.5px solid var(--dsw-alias-border-l1)}
.rssnews_set_drop:first-child{border-top:0;padding-top:0}
.rssnews_set_dropTitle{font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-primary)}
.rssnews_set_dropMeta{font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.rssnews_set_srcRow{display:flex;align-items:center;gap:8px;font-size:12px;line-height:18px;padding:5px 0;border-top:.5px solid var(--dsw-alias-border-l1)}
.rssnews_set_srcRow:first-child{border-top:0}
.rssnews_set_srcName{flex:none;max-width:44%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rssnews_set_errText{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.rssnews_set_foot{margin-top:40px;padding-top:14px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary);word-break:break-all}
.rssnews_set_empty{display:flex;flex-direction:column;gap:10px;align-items:flex-start;margin-top:36px;padding:22px;border-radius:12px;border:.5px dashed var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.rssnews_set_emptyTitle{font-size:15px;line-height:23px;font-weight:600}
.rssnews_set_hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.rssnews_set_root{display:flex;flex-direction:column;gap:18px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:14px;line-height:20px;box-sizing:border-box;max-width:820px}
.rssnews_set_h1{margin:0;font-size:16px;line-height:24px;font-weight:600}
.rssnews_set_sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin-top:2px}
.rssnews_set_bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
.rssnews_set_grow{flex:1}
.rssnews_set_field{display:flex;flex-direction:column;gap:4px}
.rssnews_set_label{font-size:12px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary)}
.rssnews_set_input,.rssnews_set_textarea,.rssnews_set_select{font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;padding:6px 10px;width:100%;box-sizing:border-box}
.rssnews_set_textarea{min-height:124px;resize:vertical;line-height:21px}
.rssnews_set_input:focus,.rssnews_set_textarea:focus,.rssnews_set_select:focus{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:0;border-color:transparent}
.rssnews_set_grid{display:flex;gap:12px;flex-wrap:wrap}
.rssnews_set_grid>*{flex:1 1 180px;min-width:0}
.rssnews_set_srcEdit{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.rssnews_set_srcEditHead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rssnews_set_srcEditHead>*{min-width:0}
.rssnews_set_check{display:flex;align-items:center;gap:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.rssnews_set_footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:4px}
.rssnews_set_btn.is-danger{color:var(--dsw-alias-state-danger-primary);border-color:var(--dsw-alias-state-danger-primary)}
.rssnews_set_badge{font-size:11px;line-height:16px;padding:1px 6px;border-radius:4px;color:var(--dsw-alias-state-business-primary);border:.5px solid var(--dsw-alias-state-business-primary)}
.rssnews_set_profile{white-space:pre-wrap;font-size:12px;line-height:20px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;padding:10px 12px;max-height:260px;overflow:auto}
.rssnews_set_mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);word-break:break-all}
.rssnews_set_group{display:flex;flex-direction:column;gap:12px;padding-top:6px}
.rssnews_set_groupTitle{font-size:12px;line-height:18px;font-weight:650;letter-spacing:.06em;color:var(--dsw-alias-label-tertiary);text-transform:uppercase}


/* ===== Opus 5.5 视觉评审 v1：把「仪表盘」压回「刊物」 ===== */
/* 1. 统计条：四格 KPI → 报眉一行 */
.rssnews_stats{display:flex;flex-wrap:wrap;align-items:baseline;margin-top:22px;padding:7px 0 8px;border-top:2px solid var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l1)}
.rssnews_stat{flex-direction:row;align-items:baseline;gap:5px;padding:0;border-left:0}
.rssnews_stat:first-child{padding-left:0}
.rssnews_stat+.rssnews_stat::before{content:"/";order:-2;margin:0 7px 0 9px;color:var(--dsw-alias-label-dimmed)}
.rssnews_statLabel{order:-1;font-size:12px;line-height:18px;letter-spacing:0;color:var(--dsw-alias-label-tertiary)}
.rssnews_statNum,.rssnews_statNum.is-accent,.rssnews_statNum.is-muted{font-size:12.5px;line-height:18px;font-weight:600;letter-spacing:0;color:var(--dsw-alias-label-primary)}
@media (max-width:720px){.rssnews_stat{padding-left:0}.rssnews_statNum{font-size:12.5px;line-height:18px}}
/* 2. 工具按钮：实心蓝 → 安静的文本按钮 */
.rssnews_btn{height:26px;padding:0 8px;border-radius:6px;font-size:12px;border-color:transparent;color:var(--dsw-alias-label-tertiary)}
.rssnews_btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:transparent;color:var(--dsw-alias-label-primary)}
.rssnews_btnPrimary{background:transparent;border-color:transparent;color:var(--dsw-alias-state-business-primary);font-weight:600}
.rssnews_btnPrimary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);filter:none}
.rssnews_headRow{margin-top:14px}
.rssnews_state .rssnews_btn{border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}
.rssnews_state .rssnews_btnPrimary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:var(--dsw-alias-bg-layer-1)}
.rssnews_segBtn{border-color:transparent;background:transparent;color:var(--dsw-alias-label-tertiary)}
.rssnews_segBtn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
/* 3. 刊头与条目标题：衬线，给页面一点性格 */
.rssnews_title{font-family:"Songti SC","Source Han Serif SC","Noto Serif SC",Georgia,serif;font-size:40px;line-height:1.1;font-weight:700;letter-spacing:.01em}
.rssnews_itemTitle{font-family:"Songti SC","Source Han Serif SC","Noto Serif SC",Georgia,serif;font-size:20px;line-height:1.45;font-weight:700;letter-spacing:0}
.rssnews_dateline{margin-top:8px;font-size:12.5px;color:var(--dsw-alias-label-tertiary)}
/* 4. 运行提示：灰卡 → 注脚 */
.rssnews_callout{padding:0;background:transparent;border-radius:0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}
.rssnews_callout>svg{width:12px;height:12px;margin-top:3px}
.rssnews_calloutBody{flex-direction:row;flex-wrap:wrap;gap:0 6px}
.rssnews_calloutCap{font-weight:600;color:var(--dsw-alias-label-secondary)}
.rssnews_callout.is-danger{padding:6px 0 6px 10px;border-left:2px solid var(--dsw-alias-state-danger-primary);border-radius:0;background:transparent;color:var(--dsw-alias-label-secondary)}
/* 5. 分类导航：药丸 → 纯文字下划线 */
.rssnews_toc{margin-top:24px;padding-top:0;padding-bottom:0}
.rssnews_tocLabel{letter-spacing:.06em;margin-right:16px}
.rssnews_tocItem{padding:9px 0;margin-right:20px;border-radius:0;color:var(--dsw-alias-label-tertiary)}
.rssnews_tocItem:hover{background:transparent;color:var(--dsw-alias-label-primary)}
.rssnews_tocItem.is-active{background:transparent;box-shadow:inset 0 -1.5px 0 var(--dsw-alias-label-primary);color:var(--dsw-alias-label-primary);font-weight:inherit}
.rssnews_tocCount{display:none}
/* 6. 栏目：中文字距收敛，间距归属下一条 */
.rssnews_secName{font-size:13px;letter-spacing:.06em;text-transform:none;font-weight:700}
.rssnews_section{margin-top:64px;scroll-margin-top:50px}
.rssnews_section.is-first{margin-top:32px}
.rssnews_item{padding:24px 0 28px;align-items:baseline}
.rssnews_itemNo{padding-top:0;font-size:12px;line-height:20px;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary)}
/* 8. 反馈与探索标记 */
.rssnews_vote{display:flex;gap:6px;margin-top:12px;opacity:.78;transition:opacity .16s}
.rssnews_item:hover .rssnews_vote,.rssnews_vote:focus-within{opacity:1}
.rssnews_voteBtn{appearance:none;font:inherit;font-size:11.5px;line-height:18px;padding:3px 9px;border-radius:6px;cursor:pointer;color:var(--dsw-alias-label-tertiary);background:transparent;border:.5px solid var(--dsw-alias-border-l1);transition:color .14s,border-color .14s,background .14s}
.rssnews_voteBtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.rssnews_voteBtn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.rssnews_voteBtn.is-up{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-layer-2)}
.rssnews_voteBtn.is-down{color:var(--dsw-alias-state-danger-primary);border-color:var(--dsw-alias-state-danger-primary);background:var(--dsw-alias-bg-layer-2)}
.rssnews_explore{font-size:11px;line-height:16px;padding:1px 6px;border-radius:4px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:.5px dashed var(--dsw-alias-border-l1)}
/* 7. 报头工具条：位置固定，日期长短不再把按钮挤到下一行 */
.rssnews_headRow{flex-wrap:nowrap;align-items:flex-end;gap:16px}
.rssnews_headRow>div:first-child{flex:1 1 auto;min-width:0}
.rssnews_actions{flex:none}
.rssnews_dateline{flex-wrap:wrap}
.rssnews_title{overflow-wrap:anywhere}
@media (max-width:780px){
  .rssnews_headRow{flex-wrap:wrap}
  .rssnews_actions{width:100%;justify-content:flex-start}
}

`

    /* ---------------------------- 数据层 ---------------------------- */

    function errText(error) {
      return error && error.message ? error.message : String(error)
    }

    async function callApi(path, init) {
      let status = 0
      const body = await withTimeout(path, init, async (res) => {
        status = res.status
        const text = await res.text()
        if (!text) return null
        try {
          return JSON.parse(text)
        } catch {
          throw new Error(T.errNotJson + res.status + '）')
        }
      }, 25000).catch((error) => {
        if (error && error.name === 'AbortError') throw new Error(T.errRequest + '请求超时（25 秒）')
        if (status === 0) throw new Error(T.errRequest + errText(error))
        throw error
      })
      if (status >= 400) throw new Error((body && body.error) || 'HTTP ' + status)
      if (body && body.ok === false) throw new Error(body.error || T.errUnknown)
      return body || { ok: true }
    }

    const readState = () => callApi('/api/dsh-news/state')
    const readStatus = () => callApi('/api/dsh-news/state?view=status')
    const triggerRefresh = () => callApi('/api/dsh-news/refresh', {
      method: 'POST',
      headers: { Prefer: 'respond-async' },
    })
    const saveConfig = (patch) => callApi('/api/dsh-news/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const sendFeedback = (id, vote) => callApi('/api/dsh-news/feedback', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ id, vote }),
})
const learnTaste = () => callApi('/api/dsh-news/learn', { method: 'POST' })
const checkUpdateApi = () => callApi('/api/dsh-news/update')
const applyUpdateApi = () => callApi('/api/dsh-news/update/apply', { method: 'POST' })
const testSource = (source) => callApi('/api/dsh-news/source/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: source.type, url: source.url }),
    })

    async function readDigest(date) {
      const body = await getJsonLoose('/api/dsh-news/digest?date=' + encodeURIComponent(date))
      // 服务端用 ok:false + 「没有 X 的简报」表示这天没生成，那是空态不是错误
      if (body && body.ok === false && !/没有.*的简报/.test(String(body.error || ''))) {
        throw new Error(body.error || T.errUnknown)
      }
      return body
    }

    /**
     * 带超时的请求：超时覆盖「连接 + 读完响应体」。
     * 只包 fetch 是不够的——服务端可以先发响应头再卡住正文，那样永远等不到超时。
     */
    async function withTimeout(path, init, handler, timeoutMs = 25000) {
      const controller = typeof AbortController === 'function' ? new AbortController() : null
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
      try {
        const res = await fetch(path, Object.assign({}, init || {}, controller ? { signal: controller.signal } : {}))
        return await handler(res)
      } finally {
        if (timer) clearTimeout(timer)
      }
    }

    async function getJsonLoose(path) {
      let status = 0
      const body = await withTimeout(path, null, async (res) => {
        status = res.status
        const text = await res.text()   // 读取失败必须抛出，不能吞成空响应
        if (!text) return null
        try {
          return JSON.parse(text)
        } catch {
          throw new Error(T.errNotJson + res.status + '）')
        }
      }, 25000).catch((error) => {
        if (error && error.name === 'AbortError') throw new Error(T.errRequest + '请求超时（25 秒）')
        if (status === 0) throw new Error(T.errRequest + errText(error))
        throw error
      })
      if (status >= 400) throw new Error((body && body.error) || 'HTTP ' + status)
      return body || { ok: true }
    }

    /* ---------------------------- 小工具 ---------------------------- */

    const pad = (n) => String(n).padStart(2, '0')

    function localToday() {
      const d = new Date()
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    }

    function shiftDate(date, days) {
      const parts = String(date).split('-').map(Number)
      if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return date
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      d.setDate(d.getDate() + days)
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    }

    function fmtClock(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return pad(d.getHours()) + ':' + pad(d.getMinutes())
    }

    function fmtRelative(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      const diff = Date.now() - d.getTime()
      if (diff >= 0 && diff < 3600000) return Math.max(1, Math.round(diff / 60000)) + T.minutesAgo
      if (diff >= 0 && diff < 86400000) return Math.round(diff / 3600000) + T.hoursAgo
      return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + fmtClock(iso)
    }

    function weekdayOf(date) {
      const parts = String(date).split('-').map(Number)
      if (parts.length !== 3) return ''
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      if (Number.isNaN(d.getTime())) return ''
      return T.weekdays[d.getDay()]
    }

    function groupByCategory(items) {
      const out = []
      const index = new Map()
      for (const item of items) {
        const key = item.category || T.uncategorized
        if (!index.has(key)) {
          index.set(key, { category: key, items: [] })
          out.push(index.get(key))
        }
        index.get(key).items.push(item)
      }
      return out
    }

    function prefersReducedMotion() {
      try {
        return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      } catch {
        return false
      }
    }

    const Style = () => h('style', null, CSS)

    const PATHS = {
      chevL: ['M15 6l-6 6 6 6'],
      chevR: ['M9 6l6 6-6 6'],
      chevD: ['M6 9l6 6 6-6'],
      copy: ['M9 9h10v10H9z', 'M5 15V5h10'],
      check: ['M5 12.5l4.5 4.5L19 7'],
      refresh: ['M20 11a8 8 0 1 0-2.34 5.66', 'M20 4v7h-7'],
      ext: ['M7 17L17 7', 'M9 7h8v8'],
      alert: ['M10.3 3.9L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 9v4', 'M12 16.5v.01'],
      info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v5', 'M12 7.5v.01'],
      plus: ['M12 5v14', 'M5 12h14'],
      trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
      x: ['M6 6l12 12', 'M18 6L6 18'],
      paper: [
        'M4 5.5A1.5 1.5 0 0 1 5.5 4H17a1.5 1.5 0 0 1 1.5 1.5V18a2 2 0 0 0 2 2H6.5A1.5 1.5 0 0 1 5 18.5',
        'M5 18.5A1.5 1.5 0 0 1 6.5 17H20',
        'M8.5 8h6M8.5 11.5h6M8.5 15h3.5',
      ],
    }

    function Icon(props) {
      const size = props.size || 14
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: props.sw || 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: 'false',
        className: props.className,
        style: { display: 'block', flex: 'none' },
      }, ...(PATHS[props.name] || PATHS.info || []).map((d, i) => h('path', { key: i, d })))
    }

    function Callout(props) {
      return h('div', { className: 'rssnews_callout' + (props.tone ? ' is-' + props.tone : ''), role: props.role },
        h(Icon, { name: props.icon || 'info', size: 14 }),
        h('div', { className: 'rssnews_calloutBody' }, props.children),
      )
    }

    /* ---------------------------- 侧边栏图标 ---------------------------- */

    function NewsIcon(props) {
      const size = props && Number.isFinite(props.size) ? props.size : 18
      const active = Boolean(props && props.active)
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: active ? 2 : 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      }, ...PATHS.paper.map((d, i) => h('path', { key: i, d })))
    }

    /* ---------------------------- 阅读面板 ---------------------------- */

    function ArticleItem(props) {
  const item = props.item || {}
  const no = typeof props.index === 'number' ? pad(props.index + 1) : ''
  const body = item.summary || item.excerpt || ''
  const titleText = item.title || '（无标题）'
  // 链接来自外部 feed，必须挡掉 javascript: / data: 这类伪协议
  const safeUrl = /^https?:\/\//i.test(String(item.url || '')) ? item.url : null
  const title = safeUrl
    ? h('a', {
        className: 'rssnews_itemTitle',
        href: safeUrl,
        target: '_blank',
        rel: 'noopener noreferrer'
      }, titleText, h(PIcon, { name: 'ext', size: 11, className: 'rssnews_ext' }))
    : h('span', { className: 'rssnews_itemTitle' }, titleText)
  const metaParts = []
  if (item.source) metaParts.push(h('span', { key: 's', className: 'rssnews_metaSource' }, item.source))
  if (item.publishedAt) {
    if (metaParts.length) metaParts.push(h('span', { key: 'd1', className: 'rssnews_dot', 'aria-hidden': true }))
    metaParts.push(h('time', { key: 't', dateTime: item.publishedAt, title: String(item.publishedAt) }, fmtRelative(item.publishedAt)))
  }
  if (!item.summary && item.excerpt) {
    if (metaParts.length) metaParts.push(h('span', { key: 'd2', className: 'rssnews_dot', 'aria-hidden': true }))
    metaParts.push(h('span', { key: 'x' }, '原文摘录'))
  }
  if (item.explore) {
    if (metaParts.length) metaParts.push(h('span', { key: 'd3', className: 'rssnews_dot', 'aria-hidden': true }))
    metaParts.push(h('span', { key: 'ex', className: 'rssnews_explore' }, '探索'))
  }
  return h('article', { className: 'rssnews_item' },
    h('div', { className: 'rssnews_itemNo', 'aria-hidden': true }, no),
    h('div', { className: 'rssnews_itemMain' },
      h('h3', { style: { margin: 0, display: 'inline' } }, title),
      metaParts.length ? h('div', { className: 'rssnews_meta' }, metaParts) : null,
      body
        ? h('div', { className: item.summary ? 'rssnews_body' : 'rssnews_body is-excerpt' }, body)
        : h('div', { className: 'rssnews_body is-missing' }, '这条源没有提供正文，点标题看原文'),
      item.reason
        ? h('div', { className: 'rssnews_reason' },
            h('span', { className: 'rssnews_reasonCap' }, '为什么留：'),
            item.reason)
        : null,
      props.onVote
        ? h('div', { className: 'rssnews_vote' },
            h('button', {
              type: 'button',
              className: 'rssnews_voteBtn' + (props.vote === 'up' ? ' is-up' : ''),
              'aria-pressed': props.vote === 'up',
              title: '这类我想多看（会进入品味档案）',
              onClick: () => props.onVote(item, 'up')
            }, props.vote === 'up' ? '✓ 值得看' : '值得看'),
            h('button', {
              type: 'button',
              className: 'rssnews_voteBtn' + (props.vote === 'down' ? ' is-down' : ''),
              'aria-pressed': props.vote === 'down',
              title: '这类我不想看（会进入品味档案）',
              onClick: () => props.onVote(item, 'down')
            }, props.vote === 'down' ? '✕ 不想看' : '不想看')
          )
        : null
    )
  )
}

function PIcon(props) {
  const size = props.size || 14
  const ring = 'M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8z'
  const paths = {
    chevL: ['M10 3.5 5.5 8l4.5 4.5'],
    chevR: ['M6 3.5 10.5 8 6 12.5'],
    chevD: ['M4 6l4 4 4-4'],
    copy: ['M6.5 5h6A1.5 1.5 0 0 1 14 6.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 5 12.5v-6A1.5 1.5 0 0 1 6.5 5z', 'M2.5 10.5V3.5a1 1 0 0 1 1-1h7'],
    check: ['M3.5 8.5l3 3 6-7'],
    refresh: ['M13.5 8a5.5 5.5 0 1 1-1.6-3.9', 'M13.5 2.5v3h-3'],
    ext: ['M6.5 3.5h-3v9h9v-3', 'M9.5 2.5h4v4', 'M13.5 2.5 7.5 8.5'],
    alert: [ring, 'M8 5v3.5', 'M8 11h.01'],
    info: [ring, 'M8 7.2V11', 'M8 5h.01'],
    ok: [ring, 'M5.5 8.2l1.8 1.8 3.2-3.6'],
    inbox: ['M2 9.5 4 3.5h8l2 6', 'M2 9.5V13h12V9.5h-3.5a2.5 2.5 0 0 1-5 0z']
  }[props.name] || []
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: 'false',
    className: props.className
  }, paths.map((d, i) => h('path', { key: i, d })))
}

function PCallout(props) {
  const kind = props.kind || ''
  const icon = kind === 'danger' ? 'alert' : kind === 'success' ? 'ok' : 'info'
  return h('div', { className: 'rssnews_callout' + (kind ? ' is-' + kind : ''), role: kind === 'danger' ? 'alert' : 'status', 'aria-live': kind === 'danger' ? 'assertive' : 'polite' },
    h(PIcon, { name: icon, size: 14 }),
    h('div', { className: 'rssnews_calloutBody' },
      props.cap ? h('span', { className: 'rssnews_calloutCap' }, props.cap) : null,
      props.children
    ),
    props.onDismiss
      ? h('button', {
          type: 'button',
          className: 'rssnews_btn rssnews_btnIcon rssnews_btnSmall',
          style: { marginLeft: 'auto', flex: 'none' },
          onClick: props.onDismiss,
          'aria-label': '关闭提示',
          title: '关闭'
        }, '×')
      : null
  )
}

function DigestSkeleton() {
  const rows = [0, 1, 2, 3]
  return h('div', { className: 'rssnews_skel', 'aria-busy': 'true' },
    h('span', { className: 'rssnews_srOnly', role: 'status' }, '正在读取简报…'),
    rows.map(i => h('div', { key: i, className: 'rssnews_skelItem', 'aria-hidden': true },
      h('div', { className: 'rssnews_skelLine is-title', style: { width: (i % 2 ? 64 : 78) + '%' } }),
      h('div', { className: 'rssnews_skelLine is-meta', style: { width: '28%' } }),
      h('div', { className: 'rssnews_skelLine', style: { width: '100%' } }),
      h('div', { className: 'rssnews_skelLine', style: { width: '96%' } }),
      h('div', { className: 'rssnews_skelLine', style: { width: (i % 2 ? 58 : 72) + '%' } })
    ))
  )
}

function DigestState(props) {
  return h('div', { className: 'rssnews_state', role: props.danger ? 'alert' : undefined },
    h('div', { className: 'rssnews_stateIcon' + (props.danger ? ' is-danger' : '') },
      h(PIcon, { name: props.icon || 'inbox', size: 24 })),
    h('div', { className: 'rssnews_stateTitle' }, props.title),
    props.hint ? h('div', { className: 'rssnews_stateHint' }, props.hint) : null,
    props.sub ? h('div', { className: 'rssnews_stateSub' }, props.sub) : null,
    props.action || null
  )
}

function StatsBar(props) {
  const d = props.digest
  const t = d.totals || {}
  const items = d.items || []
  const dropped = d.dropped || []
  const num = (v, fb) => (typeof v === 'number' ? v : fb)
  const cells = [
    { label: '候选', value: num(t.fetched, items.length + dropped.length) },
    { label: '保留', value: num(t.kept, items.length), cls: 'is-accent' },
    { label: '滤掉', value: num(t.dropped, dropped.length), cls: 'is-muted' },
    { label: '已总结', value: num(t.summarized, items.filter(x => x && x.summary).length) }
  ]
  return h('div', { className: 'rssnews_stats', role: 'list', 'aria-label': '本期统计' },
    cells.map(c => h('div', { key: c.label, className: 'rssnews_stat', role: 'listitem' },
      h('span', { className: 'rssnews_statNum' + (c.cls ? ' ' + c.cls : '') }, c.value),
      h('span', { className: 'rssnews_statLabel' }, c.label)
    ))
  )
}

function isFallbackMode(mode) {
  return !!mode && /fallback|time|none|raw/i.test(String(mode))
}

function NoticeList(props) {
  const d = props.digest
  const list = []
  if (props.running) {
    list.push(h(PCallout, { key: 'run', kind: 'info', cap: '正在生成' }, '正在抓取并总结新一期，完成后会自动刷新本页。'))
  }
  if (props.notice) {
    list.push(h(PCallout, {
      key: 'notice',
      kind: props.notice.kind,
      cap: props.notice.cap,
      onDismiss: props.onDismiss
    }, props.notice.text))
  }
  if (d && isFallbackMode(d.filterMode)) {
    list.push(h(PCallout, { key: 'fb', kind: 'info', cap: '未做筛选' }, '模型不可用，本次按时间倒序全留（未做筛选）'))
  }
  const errs = d && Array.isArray(d.errors) ? d.errors.filter(Boolean) : []
  if (errs.length) {
    list.push(h(PCallout, { key: 'errs', kind: 'danger', cap: '运行提示' },
      errs.map((e, i) => h('span', { key: i }, String(e)))))
  }
  if (!list.length) return null
  return h('div', { className: 'rssnews_notes', role: 'status', 'aria-live': 'polite' }, list)
}

function CategoryToc(props) {
  const groups = props.groups
  return h('nav', {
    className: 'rssnews_toc' + (props.stuck ? ' is-stuck' : ''),
    ref: props.tocRef,
    'aria-label': '分类速览'
  },
    h('div', { className: 'rssnews_tocInner', ref: props.innerRef },
      h('span', { className: 'rssnews_tocLabel' }, '分类'),
      groups.map((g, i) => h('button', {
        key: g.category + '_' + i,
        type: 'button',
        ref: el => { props.itemRefs.current[i] = el },
        className: 'rssnews_tocItem' + (i === props.activeIdx ? ' is-active' : ''),
        'aria-current': i === props.activeIdx ? 'true' : undefined,
        onClick: () => props.onJump(i)
      },
        g.category,
        h('span', { className: 'rssnews_tocCount' }, g.items.length)
      ))
    )
  )
}

function DigestSection(props) {
  const g = props.group
  return h('section', {
    id: props.id,
    ref: props.sectionRef,
    className: 'rssnews_section' + (props.first ? ' is-first' : ''),
    'aria-labelledby': props.id + '-h'
  },
    h('div', { className: 'rssnews_secHead' },
      h('h2', { id: props.id + '-h', className: 'rssnews_secName', style: { margin: 0 } }, g.category),
      h('span', { className: 'rssnews_rule', 'aria-hidden': true }),
      h('span', { className: 'rssnews_secCount' }, g.items.length + ' 条')
    ),
    h('div', null,
      g.items.map((it, j) => h(ArticleItem, {
        key: it.id || it.url || (g.category + '_' + j),
        item: it,
        index: props.startNo + j,
        vote: props.votes ? props.votes[it.id] : undefined,
        onVote: props.onVote
      }))
    )
  )
}

function Fold(props) {
  return h('details', { className: 'rssnews_details' },
    h('summary', { className: 'rssnews_sum' },
      h('span', { className: 'rssnews_sumTitle' }, props.title),
      props.count != null ? h('span', { className: 'rssnews_sumCount' }, props.count) : null,
      h(PIcon, { name: 'chevD', size: 14, className: 'rssnews_chev' })
    ),
    h('div', { className: 'rssnews_detailsBody' },
      props.hint ? h('div', { className: 'rssnews_detailsHint' }, props.hint) : null,
      props.children
    )
  )
}

function DroppedList(props) {
  const list = props.dropped
  if (!list.length) return h('div', { className: 'rssnews_detailsHint' }, '这一期没有条目被滤掉。')
  return h('div', null, list.map((d, i) => h('div', { key: i, className: 'rssnews_drop' },
    h('div', { className: 'rssnews_dropTitle' }, d.title || '（无标题）'),
    (d.source || d.reason)
      ? h('div', { className: 'rssnews_dropMeta' },
          d.source ? h('span', { className: 'rssnews_dropSrc' }, d.source) : null,
          d.reason || '')
      : null
  )))
}

function SourceList(props) {
  const list = props.sources
  if (!list.length) return h('div', { className: 'rssnews_detailsHint' }, '没有信息源记录。')
  return h('div', { role: 'list' }, list.map((s, i) => h('div', {
    key: s.sourceId || i,
    className: 'rssnews_srcRow',
    role: 'listitem'
  },
    h('span', {
      className: 'rssnews_status' + (s.ok ? '' : ' is-bad'),
      role: 'img',
      'aria-label': s.ok ? '正常' : '失败'
    }),
    h('span', { className: 'rssnews_srcName', title: s.name || s.sourceId }, s.name || s.sourceId || '未命名'),
    h('span', { className: 'rssnews_srcCount' }, (typeof s.count === 'number' ? s.count : 0) + ' 条'),
    s.via ? h('span', { className: 'rssnews_tag' }, s.via) : h('span', null),
    s.error ? h('div', { className: 'rssnews_srcErr' }, String(s.error)) : null
  )))
}

function DigestAppendix(props) {
  const d = props.digest
  const dropped = Array.isArray(d.dropped) ? d.dropped : []
  const sources = Array.isArray(d.sources) ? d.sources : []
  const okCount = sources.filter(s => s && s.ok).length
  const bad = sources.length - okCount
  return h('div', { className: 'rssnews_appendix' },
    h('div', { className: 'rssnews_appendixHead' },
      h('span', null, '附录'),
      h('span', { className: 'rssnews_rule', 'aria-hidden': true })
    ),
    h(Fold, {
      title: '被滤掉',
      count: dropped.length + ' 条',
      hint: dropped.length ? '模型判断与主题无关或重复的条目，附上理由，便于你校准筛选偏好。' : null
    }, h(DroppedList, { dropped })),
    h(Fold, {
      title: '信息源',
      count: sources.length ? (okCount + '/' + sources.length + ' 正常' + (bad ? ' · ' + bad + ' 个失败' : '')) : '0',
      hint: bad ? '失败的源本次没有贡献内容，可在设置里测试或更换地址。' : null
    }, h(SourceList, { sources }))
  )
}

function DigestColophon(props) {
  const d = props.digest
  const parts = ['由 DeepSeek Harness 生成']
  parts.push(d.filterMode === 'no-candidates' ? '无新候选'
    : isFallbackMode(d.filterMode) ? '未筛选（时间倒序）' : '模型筛选')
  if (Array.isArray(d.sources)) parts.push(d.sources.length + ' 个信息源')
  if (d.generatedAt) parts.push('生成于 ' + d.date + ' ' + fmtClock(d.generatedAt))
  return h('div', { className: 'rssnews_colophon' },
    parts.map((p, i) => h('span', { key: i }, (i ? '· ' : '') + p)))
}

function longDate(date) {
  const p = String(date || '').split('-')
  if (p.length !== 3) return date
  return p[0] + ' 年 ' + Number(p[1]) + ' 月 ' + Number(p[2]) + ' 日'
}

function DigestPanel() {
  const [date, setDate] = useState(() => localToday())
  const [digest, setDigest] = useState(null)
  const [votes, setVotes] = useState({})
  const [markdown, setMarkdown] = useState('')
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [stuck, setStuck] = useState(false)

  const alive = useRef(true)
  const reqRef = useRef(0)
  const dateRef = useRef(date)
  const digestRef = useRef(null)
  const copyTimer = useRef(null)
  const rafRef = useRef(0)
  const panelRef = useRef(null)
  const tocRef = useRef(null)
  const tocInnerRef = useRef(null)
  const tocItemRefs = useRef([])
  const secRefs = useRef([])

  dateRef.current = date
  digestRef.current = digest

  const today = localToday()
  const busy = refreshing || running

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      clearTimeout(copyTimer.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const load = useCallback(async (d, opts) => {
    const silent = !!(opts && opts.silent)
    const my = ++reqRef.current
    const stale = () => !alive.current || my !== reqRef.current
    if (!silent) { setPhase('loading'); setError('') }
    try {
      let dg = null
      let md = ''
      if (d === localToday()) {
        const s = await readState()
        if (stale()) return
        if (s && s.running) setRunning(true)
        if (s && s.taste && s.taste.votes) setVotes(s.taste.votes)
        dg = (s && s.digest) || null
        if (dg && dg.date && dg.date !== d) dg = null
        md = (s && s.markdown) || (dg && dg.markdown) || ''
      } else {
        const r = await readDigest(d)
        if (stale()) return
        if (r && r.ok === false && r.code !== 'NO_DIGEST') throw new Error(r.error || '读取简报失败')
        // 这里不要动 running：它表示「服务端正在生成」，与当前浏览的是哪一天无关。
        // 之前为了藏掉历史页的「生成中」而清零，会导致生成还在跑但轮询被停掉。
        if (r && r.ok && r.digest) {
          dg = r.digest
          md = r.markdown || dg.markdown || ''
        }
      }
      setDigest(dg)
      setMarkdown(md)
      setError('')
      setPhase(dg ? 'ready' : 'empty')
    } catch (e) {
      if (stale()) return
      const msg = (e && e.message) || String(e)
      if (silent && digestRef.current) {
        setNotice({ kind: 'danger', cap: '刷新失败', text: msg })
      } else {
        setDigest(null)
        setMarkdown('')
        setError(msg)
        setPhase('error')
      }
    }
  }, [])

  useEffect(() => {
    setNotice(null)
    setActiveIdx(0)
    setStuck(false)
    if (panelRef.current) panelRef.current.scrollTop = 0
    load(date)
  }, [date, load])

  useEffect(() => {
    if (!running) return
    let cancelled = false
    let timer = null
    const tick = async () => {
      if (cancelled || !alive.current) return
      try {
        const s = await readStatus()
        if (cancelled || !alive.current) return
        if (s && s.running) { timer = setTimeout(tick, 5000); return }
        setRunning(false)
        setRefreshing(false)
        setNotice(s.lastError ? { kind: 'danger', cap: '生成失败', text: s.lastError } : null)
        load(dateRef.current, { silent: true })
      } catch (e) {
        if (cancelled || !alive.current) return
        setNotice({ kind: 'danger', cap: '状态查询失败', text: ((e && e.message) || String(e)) + '，5 秒后重试。' })
        timer = setTimeout(tick, 5000)
      }
    }
    timer = setTimeout(tick, 5000)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [running, load])

  const onRefresh = useCallback(async () => {
    if (refreshing || running) return
    setRefreshing(true)
    setNotice(null)
    const t = localToday()
    if (dateRef.current !== t) setDate(t)
    try {
      const r = await triggerRefresh()
      if (!alive.current) return
      if (r && (r.running || r.busy)) {
        setRunning(true)
        return
      }
      if (dateRef.current === t) await load(t, { silent: true })
    } catch (e) {
      if (!alive.current) return
      setNotice({ kind: 'danger', cap: '生成失败', text: (e && e.message) || String(e) })
    } finally {
      // 任何分支（包括 busy / running 提前 return）都要把「触发中」复位，
      // 否则按钮会永久停在「生成中…」；服务端仍在生成的状态由 running 单独表示。
      if (alive.current) setRefreshing(false)
    }
  }, [refreshing, running, load])

  // 点赞/点踩：先乐观更新，失败再回滚
  const voteInFlight = useRef({})
  const onVote = useCallback(async (item, next) => {
    if (!item || !item.id) return
    if (voteInFlight.current[item.id]) return
    voteInFlight.current[item.id] = true
    const prev = votes[item.id]
    const target = prev === next ? null : next
    setVotes((v) => {
      const copy = { ...v }
      if (target) copy[item.id] = target
      else delete copy[item.id]
      return copy
    })
    try {
      await callApi('/api/dsh-news/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          vote: target,
          title: item.title,
          source: item.source,
          category: item.category,
          reason: item.reason
        })
      })
      if (!alive.current) return
      setNotice({ kind: 'success', cap: '已记录', text: target === 'up' ? '这条会强化同类偏好' : target === 'down' ? '这条会削弱同类偏好' : '已取消标记' })
    } catch (e) {
      if (!alive.current) return
      // 只有当前值仍是本次写入的值才回滚，避免覆盖期间更新的投票
      setVotes((v) => {
        if ((v[item.id] ?? null) !== target) return v
        const copy = { ...v }
        if (prev) copy[item.id] = prev
        else delete copy[item.id]
        return copy
      })
      setNotice({ kind: 'danger', cap: '没记上', text: (e && e.message) || String(e) })
    } finally {
      voteInFlight.current[item.id] = false
    }
  }, [votes])

  const onCopy = useCallback(async () => {
    const md = markdown || (digest && digest.markdown) || ''
    if (!md) return
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('当前环境不支持写入剪贴板')
      await navigator.clipboard.writeText(md)
      if (!alive.current) return
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => { if (alive.current) setCopied(false) }, 1800)
    } catch (e) {
      if (!alive.current) return
      setNotice({ kind: 'danger', cap: '复制失败', text: (e && e.message) || String(e) })
    }
  }, [markdown, digest])

  const view = phase === 'ready' ? digest : null
  const groups = useMemo(() => {
    const items = view && Array.isArray(view.items) ? view.items : []
    return groupByCategory(items).map(g => ({ category: g.category || '未分类', items: g.items || [] }))
  }, [view])

  const onScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const panel = panelRef.current
      if (!panel || !alive.current) return
      const top = panel.getBoundingClientRect().top
      const toc = tocRef.current
      setStuck(!!toc && panel.scrollTop > 0 && toc.getBoundingClientRect().top <= top + 0.5)
      let active = 0
      secRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top - top <= 72) active = i
      })
      setActiveIdx(active)
    })
  }, [])

  useEffect(() => {
    secRefs.current.length = groups.length
    tocItemRefs.current.length = groups.length
    onScroll()
  }, [groups, onScroll])

  useEffect(() => {
    const inner = tocInnerRef.current
    const btn = tocItemRefs.current[activeIdx]
    if (!inner || !btn) return
    const ir = inner.getBoundingClientRect()
    const br = btn.getBoundingClientRect()
    if (br.left < ir.left || br.right > ir.right) {
      inner.scrollLeft += (br.left - ir.left) - (ir.width - br.width) / 2
    }
  }, [activeIdx])

  const onJump = useCallback(i => {
    const el = secRefs.current[i]
    if (!el) return
    setActiveIdx(i)
    const reduce = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    if (typeof el.focus === 'function') el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const canCopy = !!(view && (markdown || view.markdown))

  const header = h('header', null,
    h('div', { className: 'rssnews_topline' },
      h('span', null, 'DAILY AI BRIEF'),
      h('span', { className: 'rssnews_rule', 'aria-hidden': true }),
      h('span', { className: 'rssnews_topDate' }, date + ' ' + weekdayOf(date))
    ),
    h('div', { className: 'rssnews_headRow' },
      h('div', null,
        h('h1', { className: 'rssnews_title' }, '每日 AI 简报'),
        h('div', { className: 'rssnews_dateline' },
          h('span', null, longDate(date)),
          h('span', { className: 'rssnews_dot', 'aria-hidden': true }),
          h('span', null, weekdayOf(date)),
          view && view.generatedAt ? h('span', { className: 'rssnews_dot', 'aria-hidden': true }) : null,
          view && view.generatedAt
            ? h('span', { title: String(view.generatedAt) }, '生成于 ' + fmtRelative(view.generatedAt))
            : null,
          running ? h('span', { className: 'rssnews_dot', 'aria-hidden': true }) : null,
          running
            ? h('span', { className: 'rssnews_live' },
                h('span', { className: 'rssnews_liveDot', 'aria-hidden': true }), '生成中')
            : null
        )
      ),
      h('div', { className: 'rssnews_actions' },
        h('div', { className: 'rssnews_seg', role: 'group', 'aria-label': '切换日期' },
          h('button', {
            type: 'button',
            className: 'rssnews_segBtn',
            onClick: () => setDate(shiftDate(date, -1)),
            'aria-label': '前一天',
            title: '前一天'
          }, h(PIcon, { name: 'chevL', size: 14 })),
          h('button', {
            type: 'button',
            className: 'rssnews_segBtn',
            onClick: () => setDate(localToday()),
            disabled: date === today
          }, '今天'),
          h('button', {
            type: 'button',
            className: 'rssnews_segBtn',
            onClick: () => setDate(shiftDate(date, 1)),
            disabled: date >= today,
            'aria-label': '后一天',
            title: '后一天'
          }, h(PIcon, { name: 'chevR', size: 14 }))
        ),
        h('button', {
          type: 'button',
          className: 'rssnews_btn',
          onClick: onCopy,
          disabled: !canCopy
        },
          h(PIcon, { name: copied ? 'check' : 'copy', size: 14 }),
          copied ? '已复制' : '复制 Markdown'
        ),
        h('button', {
          type: 'button',
          className: 'rssnews_btn rssnews_btnPrimary',
          onClick: onRefresh,
          disabled: busy,
          'aria-busy': busy ? 'true' : undefined
        },
          h(PIcon, { name: 'refresh', size: 14, className: busy ? 'rssnews_spin' : undefined }),
          busy ? '生成中…' : '重新生成'
        ),
        h('span', { className: 'rssnews_srOnly', role: 'status', 'aria-live': 'polite' }, copied ? '已复制到剪贴板' : '')
      )
    ),
    view ? h(StatsBar, { digest: view }) : h('div', { className: 'rssnews_mastRule', 'aria-hidden': true })
  )

  let content = null
  if (phase === 'loading') {
    content = h(DigestSkeleton)
  } else if (phase === 'error') {
    content = h(DigestState, {
      danger: true,
      icon: 'alert',
      title: '读取简报失败',
      hint: error || '未知错误',
      sub: '检查本地服务是否在运行，然后重试。',
      action: h('button', { type: 'button', className: 'rssnews_btn', onClick: () => load(date) },
        h(PIcon, { name: 'refresh', size: 14 }), '重试')
    })
  } else if (phase === 'empty') {
    const isToday = date === today
    content = h(DigestState, {
      title: running && isToday ? '正在生成今天的简报' : '这一天还没有简报',
      hint: isToday
        ? (running ? '抓取与总结完成后会自动显示。' : '点「重新生成」抓一次；之后每天会按你设的时间自动生成。')
        : '历史简报只在当天生成过才会保存。',
      action: isToday
        ? (running ? null : h('button', { type: 'button', className: 'rssnews_btn rssnews_btnPrimary', onClick: onRefresh, disabled: busy },
            h(PIcon, { name: 'refresh', size: 14, className: busy ? 'rssnews_spin' : undefined }), busy ? '生成中…' : '重新生成'))
        : h('button', { type: 'button', className: 'rssnews_btn', onClick: () => setDate(localToday()) }, '回到今天')
    })
  } else if (view && !groups.length) {
    const noCandidates = view.filterMode === 'no-candidates'
    content = h(DigestState, {
      title: noCandidates ? '今天没有符合条件的新条目' : '这一期没有保留下来的条目',
      hint: noCandidates ? '源里的条目都已超过时效或在最近的简报中出现过。'
        : '全部条目都被滤掉了，可以在下方「被滤掉」里查看每条的理由。'
    })
  } else if (view) {
    let no = 0
    content = h('div', null,
      groups.length > 1
        ? h(CategoryToc, {
            groups,
            activeIdx,
            stuck,
            onJump,
            tocRef,
            innerRef: tocInnerRef,
            itemRefs: tocItemRefs
          })
        : null,
      groups.map((g, i) => {
        const startNo = no
        no += g.items.length
        return h(DigestSection, {
          key: g.category + '_' + i,
          id: ID + '-sec-' + i,
          group: g,
          first: i === 0,
          startNo,
          votes,
          onVote,
          sectionRef: el => { secRefs.current[i] = el }
        })
      })
    )
  }

  return h('div', { className: 'rssnews_panel', ref: panelRef, onScroll },
    h(Style),
    h('div', { className: 'rssnews_page' },
      header,
      h(NoticeList, {
        digest: view,
        running: running && !!view,
        notice,
        onDismiss: () => setNotice(null)
      }),
      content,
      view ? h(DigestAppendix, { key: date, digest: view }) : null,
      view ? h(DigestColophon, { digest: view }) : null
    )
  )
}
/** 设置页字段容器（合并时被替换掉，这里补回；类名用 set_ 前缀与阅读面板隔离）。 */
const Field = (props) => h('label', { className: 'rssnews_set_field' },
  h('span', { className: 'rssnews_set_label' }, props.label),
  props.children,
  props.hint ? h('span', { className: 'rssnews_set_hint' }, props.hint) : null,
)

function SourceRow(props) {
      const s = props.source
      const test = props.testResult
      const patch = (next) => props.onChange(Object.assign({}, s, next))
      return h('div', { className: 'rssnews_set_srcEdit' },
        h('div', { className: 'rssnews_set_srcEditHead' },
          h('input', {
            className: 'rssnews_set_input rssnews_set_grow',
            value: s.name || '',
            placeholder: T.nameLabel,
            onChange: (e) => patch({ name: e.target.value }),
          }),
          h('label', { className: 'rssnews_set_check' },
            h('input', {
              type: 'checkbox',
              checked: s.enabled !== false,
              onChange: (e) => patch({ enabled: e.target.checked }),
            }),
            T.enabledLabel,
          ),
          h('button', { className: 'rssnews_set_btn', onClick: () => props.onTest(), disabled: props.testing },
            props.testing ? T.testing : T.test),
          h('button', { className: 'rssnews_set_btn', onClick: () => props.onRemove() }, T.remove),
        ),
        h('div', { className: 'rssnews_set_grid' },
          h(Field, { label: T.typeLabel },
            h('select', {
              className: 'rssnews_set_select',
              value: s.type || 'rss',
              onChange: (e) => patch({ type: e.target.value }),
            }, ...Object.keys(TYPE_LABEL).map((t) => h('option', { key: t, value: t }, TYPE_LABEL[t]))),
          ),
          h(Field, { label: T.urlLabel },
            h('input', {
              className: 'rssnews_set_input',
              value: s.url || '',
              placeholder: s.type === 'reddit'
                ? 'r/LocalLLaMA'
                : s.type === 'bilibili' ? '946974' : s.type === 'youtube' ? 'UC…' : 'https://…',
              onChange: (e) => patch({ url: e.target.value }),
            }),
          ),
          h(Field, { label: T.categoryLabel },
            h('input', {
              className: 'rssnews_set_input',
              value: s.category || '',
              placeholder: '官方 / 媒体 / 社区',
              onChange: (e) => patch({ category: e.target.value }),
            }),
          ),
          h(Field, { label: T.maxItemsLabel, hint: T.maxItemsHint },
            h('input', {
              className: 'rssnews_set_input',
              type: 'number',
              min: 1,
              max: 50,
              value: s.maxItems == null ? '' : s.maxItems,
              placeholder: '不限',
              onChange: (e) => {
                const raw = e.target.value;
                patch({ maxItems: raw === '' ? undefined : Number(raw) });
              },
            }),
          ),
        ),
        test
          ? h('div', { className: test.ok ? 'rssnews_set_hint rssnews_set_ok' : 'rssnews_set_hint rssnews_set_bad' },
            test.ok
              ? T.testOk + String(test.count) + ' 条 · ' + (test.titles || []).slice(0, 3).join(' / ')
              : T.testFail + String(test.error || '未知错误'))
          : null,
      )
    }

    function SettingsSection() {
      const [state, setState] = useState(null)
      const [draft, setDraft] = useState(null)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')
      const [notice, setNotice] = useState('')
      const [saving, setSaving] = useState(false)
      const [testResults, setTestResults] = useState({})
      const [testingId, setTestingId] = useState('')
      const [learning, setLearning] = useState(false)
      const [updateInfo, setUpdateInfo] = useState(null)
      const [checking, setChecking] = useState(false)
      const [applying, setApplying] = useState(false)
      const [updateMsg, setUpdateMsg] = useState('')
      const [resetting, setResetting] = useState(false)
      const [confirmReset, setConfirmReset] = useState(false)
      const resetTimer = useRef(null)
      const alive = useRef(true)

      useEffect(() => {
        alive.current = true
        return () => {
          alive.current = false
          clearTimeout(resetTimer.current)
        }
      }, [])

      const load = useCallback(async () => {
        try {
          const st = await readState()
          if (!alive.current) return
          setState(st)
          setDraft((current) => (current == null ? (st.config || null) : current))
          setError('')
        } catch (e) {
          if (alive.current) setError(e.message || String(e))
        } finally {
          if (alive.current) setLoading(false)
        }
      }, [])

      useEffect(() => { void load() }, [load])

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => { if (alive.current) setNotice('') }, 2400)
        return () => clearTimeout(timer)
      }, [notice])

      const onCheckUpdate = useCallback(async () => {
        if (checking) return
        setChecking(true)
        setUpdateMsg('')
        try {
          const info = await checkUpdateApi()
          if (!alive.current) return
          setUpdateInfo(info)
          if (info && info.gitAvailable === false) setUpdateMsg(T.updateNotGit)
        } catch (e) {
          if (alive.current) setUpdateMsg((e && e.message) || String(e))
        } finally {
          if (alive.current) setChecking(false)
        }
      }, [checking])

      const onApplyUpdate = useCallback(async () => {
        if (applying) return
        setApplying(true)
        setUpdateMsg('')
        try {
          const res = await applyUpdateApi()
          if (!alive.current) return
          if (res && res.ok) {
            setUpdateMsg(res.changed ? T.updateRestart : T.updateLatest)
            await onCheckUpdate()
          } else {
            setUpdateMsg((res && res.error) || '更新失败')
          }
        } catch (e) {
          if (alive.current) setUpdateMsg((e && e.message) || String(e))
        } finally {
          if (alive.current) setApplying(false)
        }
      }, [applying, onCheckUpdate])

      const onReset = useCallback(async () => {
        if (resetting) return
        if (!confirmReset) {
          // 两段式确认：先点亮，4 秒内再点一次才真的执行
          setConfirmReset(true)
          clearTimeout(resetTimer.current)
          resetTimer.current = setTimeout(() => { if (alive.current) setConfirmReset(false) }, 4000)
          return
        }
        clearTimeout(resetTimer.current)
        setConfirmReset(false)
        setResetting(true)
        setError('')
        try {
          const body = await callApi('/api/dsh-news/taste/reset', { method: 'POST' })
          if (!alive.current) return
          setConfirmReset(false)
          if (body && body.ok) {
            setNotice(T.tasteResetDone)
            await load()
          }
        } catch (e) {
          if (alive.current) setError((e && e.message) || String(e))
        } finally {
          if (alive.current) setResetting(false)
        }
      }, [confirmReset, resetting, load])

      const onLearn = useCallback(async () => {
        if (learning) return
        setLearning(true)
        setError('')
        try {
          const body = await learnTaste()
          if (!alive.current) return
          if (body && body.ok) {
            setNotice(T.learned)
            await load()
          } else {
            setError((body && body.error) || '学习失败')
          }
        } catch (e) {
          if (alive.current) setError((e && e.message) || String(e))
        } finally {
          if (alive.current) setLearning(false)
        }
      }, [learning, load])

      const onSave = useCallback(async () => {
        if (draft == null || saving) return
        setSaving(true)
        setError('')
        try {
          const body = await saveConfig(draft)
          if (!alive.current) return
          if (body && body.config) {
            setState((prev) => Object.assign({}, prev, { config: body.config }))
            // 只有草稿没被继续编辑时才用响应覆盖
            setDraft((current) => (current === draft ? body.config : current))
          }
          setNotice(T.saved)
        } catch (e) {
          if (alive.current) setError(e.message || String(e))
        } finally {
          if (alive.current) setSaving(false)
        }
      }, [draft, saving])

      const onTest = useCallback(async (source) => {
        setTestingId(source.id)
        try {
          const res = await testSource(source)
          if (!alive.current) return
          setTestResults((prev) => Object.assign({}, prev, { [source.id]: res }))
        } catch (e) {
          if (!alive.current) return
          setTestResults((prev) => Object.assign({}, prev, {
            [source.id]: { ok: false, error: e.message || String(e) },
          }))
        } finally {
          if (alive.current) setTestingId('')
        }
      }, [])

      if (loading) {
        return h('div', { className: 'rssnews_set_root' }, h(Style), h('div', { className: 'rssnews_set_hint' }, T.loading))
      }
      if (draft == null) {
        return h('div', { className: 'rssnews_set_root' },
          h(Style),
          h('div', { className: 'rssnews_set_alert' }, h('b', { className: 'rssnews_set_bad' }, '出错了'), error || '读取配置失败'),
          h('div', { className: 'rssnews_set_bar' },
            h('button', {
              className: 'rssnews_set_btn',
              onClick: () => { setLoading(true); void load() },
            }, T.retry),
          ),
        )
      }

      const patch = (next) => setDraft(Object.assign({}, draft, next))
      const model = draft.model || { provider: '', model: '' }
      const dirty = Boolean(state && state.config && JSON.stringify(state.config) !== JSON.stringify(draft))

      const saveButton = h('button', {
        className: 'rssnews_set_btn rssnews_set_btnPrimary',
        onClick: onSave,
        disabled: saving || !dirty,
      }, saving ? T.saving : T.save)

      return h('div', { className: 'rssnews_set_root' },
        h(Style),
        h('div', null,
          h('h1', { className: 'rssnews_set_h1' }, T.brand + ' · 设置'),
          h('div', { className: 'rssnews_set_sub' }, T.readHere),
          h('div', { className: 'rssnews_set_bar' },
            dirty ? h('span', { className: 'rssnews_set_chip' }, T.dirty) : null,
            h('span', { className: 'rssnews_set_grow' }),
            saveButton,
          ),
        ),

        error ? h('div', { className: 'rssnews_set_alert' }, h('b', { className: 'rssnews_set_bad' }, '出错了'), error) : null,
        notice ? h('div', { className: 'rssnews_set_alert' }, notice) : null,

        h('div', { className: 'rssnews_set_group' },
          h('div', { className: 'rssnews_set_groupTitle' }, T.groupSources),
          h(Field, { label: T.interestsLabel, hint: T.interestsHint },
            h('textarea', {
              className: 'rssnews_set_textarea',
              value: draft.interests || '',
              onChange: (e) => patch({ interests: e.target.value }),
            }),
          ),
          h('div', { className: 'rssnews_set_bar' },
            h('span', { className: 'rssnews_set_label' }, T.sourcesLabel + ' ' + String((draft.sources || []).length)),
            h('span', { className: 'rssnews_set_grow' }),
            h('button', {
              className: 'rssnews_set_btn',
              onClick: () => {
                const sources = (draft.sources || []).slice()
                sources.push({
                  id: 'custom-' + String(Date.now()),
                  name: '新源',
                  type: 'rss',
                  url: '',
                  category: '',
                  enabled: true,
                })
                patch({ sources })
              },
            }, T.addSource),
          ),
          ...((draft.sources || []).map((s, i) => h(SourceRow, {
            key: s.id || 'src' + String(i),
            source: s,
            testing: testingId === s.id,
            testResult: testResults[s.id],
            onChange: (next) => {
              const sources = (draft.sources || []).slice()
              sources[i] = next
              patch({ sources })
            },
            onRemove: () => {
              const sources = (draft.sources || []).slice()
              sources.splice(i, 1)
              patch({ sources })
            },
            onTest: () => void onTest(s),
          }))),
        ),

        h('div', { className: 'rssnews_set_group' },
          h('div', { className: 'rssnews_set_groupTitle' }, T.tasteTitle),
          h('div', { className: 'rssnews_set_hint' },
            state && state.taste
              ? `${T.tasteCount} ${state.taste.voteCount || 0} 条`
                + (state.taste.profile && state.taste.profile.updatedAt
                  ? ` · 上次学习 ${new Date(state.taste.profile.updatedAt).toLocaleString()}`
                  : '')
              : ''),
          h('div', { className: 'rssnews_set_profile' },
            (state && state.taste && state.taste.profile && state.taste.profile.text) || T.tasteEmpty),
          h('div', { className: 'rssnews_set_bar' },
            h('button', {
              className: 'rssnews_set_btn',
              onClick: onLearn,
              disabled: learning || !(state && state.taste && state.taste.voteCount > 0),
            }, learning ? T.tasteLearning : T.tasteLearn),
            h('button', {
              className: 'rssnews_set_btn' + (confirmReset ? ' is-danger' : ''),
              onClick: onReset,
              disabled: resetting || !(state && state.taste && (state.taste.voteCount > 0 || (state.taste.profile && state.taste.profile.text))),
              title: T.tasteResetHint,
            }, resetting ? T.tasteLearning : (confirmReset ? T.tasteResetConfirm : T.tasteReset))),
          h('div', { className: 'rssnews_set_hint' }, T.tasteResetHint),
        ),

        h('div', { className: 'rssnews_set_group' },
          h('div', { className: 'rssnews_set_groupTitle' }, T.updateTitle),
          h('div', { className: 'rssnews_set_bar' },
            h('span', { className: 'rssnews_set_label' },
              T.updateCurrent + '：' + ((updateInfo && updateInfo.local && updateInfo.local.short) || '—')),
            updateInfo && updateInfo.remote && updateInfo.remote.short
              ? h('span', { className: 'rssnews_set_hint' }, T.updateRemote + '：' + updateInfo.remote.short)
              : null,
            updateInfo && updateInfo.behind
              ? h('span', { className: 'rssnews_set_badge' }, T.updateBehind)
              : (updateInfo && updateInfo.ok ? h('span', { className: 'rssnews_set_hint' }, T.updateLatest) : null),
            h('span', { className: 'rssnews_set_grow' }),
            h('button', { className: 'rssnews_set_btn', onClick: onCheckUpdate, disabled: checking },
              checking ? T.updateChecking : T.updateCheck),
            h('button', {
              className: 'rssnews_set_btn',
              onClick: onApplyUpdate,
              disabled: applying || !(updateInfo && updateInfo.behind),
            }, applying ? T.updateApplying : T.updateApply)),
          updateMsg ? h('div', { className: 'rssnews_set_hint' }, updateMsg) : null,
          updateInfo && updateInfo.remote && updateInfo.remote.message
            ? h('div', { className: 'rssnews_set_hint' }, updateInfo.remote.short + ' · ' + updateInfo.remote.message)
            : null,
          h('div', { className: 'rssnews_set_hint' }, '更新走 git fast-forward，拉完需要重启 Harness 才生效。'),
        ),

        h('div', { className: 'rssnews_set_group' },
          h('div', { className: 'rssnews_set_groupTitle' }, T.groupRun),
          h('div', { className: 'rssnews_set_grid' },
            h(Field, { label: T.timeLabel },
              h('input', {
                className: 'rssnews_set_input',
                type: 'time',
                value: draft.dailyTime || '08:00',
                onChange: (e) => patch({ dailyTime: e.target.value }),
              }),
            ),
            h(Field, { label: T.candidatesLabel, hint: T.candidatesHint },
              h('input', {
                className: 'rssnews_set_input',
                type: 'number',
                min: 10,
                max: 300,
                value: draft.maxCandidates == null ? 80 : draft.maxCandidates,
                onChange: (e) => {
                  const raw = e.target.value
                  patch({ maxCandidates: raw === '' ? undefined : Number(raw) })
                },
              }),
            ),
            h(Field, { label: T.itemsLabel, hint: T.itemsHint },
              h('input', {
                className: 'rssnews_set_input',
                type: 'number',
                min: 5,
                max: 100,
                value: draft.maxItems == null ? 25 : draft.maxItems,
                onChange: (e) => {
                  const raw = e.target.value
                  patch({ maxItems: raw === '' ? undefined : Number(raw) })
                },
              }),
            ),
            h(Field, { label: T.maxAgeLabel, hint: T.maxAgeHint },
              h('input', {
                className: 'rssnews_set_input',
                type: 'number',
                min: 0,
                max: 30,
                value: draft.maxAgeDays == null ? 3 : draft.maxAgeDays,
                onChange: (e) => {
                  const raw = e.target.value
                  patch({ maxAgeDays: raw === '' ? undefined : Number(raw) })
                },
              }),
            ),
            h(Field, { label: T.repeatLabel, hint: T.repeatHint },
              h('input', {
                className: 'rssnews_set_input',
                type: 'number',
                min: 0,
                max: 60,
                value: draft.repeatWindowDays == null ? 7 : draft.repeatWindowDays,
                onChange: (e) => {
                  const raw = e.target.value
                  patch({ repeatWindowDays: raw === '' ? undefined : Number(raw) })
                },
              }),
            ),
          ),
          h(Field, {
            label: T.proxyLabel,
            hint: T.proxyHint
              + (state && state.proxyDetected ? '（' + T.proxyDetected + '：' + state.proxyDetected + '）' : ''),
          },
            h('input', {
              className: 'rssnews_set_input',
              value: draft.proxy == null ? '' : draft.proxy,
              placeholder: '留空自动 / direct / http://127.0.0.1:7890',
              onChange: (e) => patch({ proxy: e.target.value }),
            }),
          ),
          h(Field, { label: T.rsshubLabel, hint: T.rsshubHint },
            h('input', {
              className: 'rssnews_set_input',
              value: draft.rsshubBase || '',
              placeholder: 'http://127.0.0.1:1200',
              onChange: (e) => patch({ rsshubBase: e.target.value }),
            }),
          ),
          h('div', { className: 'rssnews_set_grid' },
            h(Field, { label: T.provider },
              h('input', {
                className: 'rssnews_set_input',
                value: model.provider || '',
                placeholder: '留空跟随默认',
                onChange: (e) => patch({ model: Object.assign({}, model, { provider: e.target.value }) }),
              }),
            ),
            h(Field, { label: T.model, hint: T.modelHint },
              h('input', {
                className: 'rssnews_set_input',
                value: model.model || '',
                placeholder: '留空跟随默认',
                onChange: (e) => patch({ model: Object.assign({}, model, { model: e.target.value }) }),
              }),
            ),
          ),
          h('label', { className: 'rssnews_set_check' },
            h('input', {
              type: 'checkbox',
              checked: draft.announceToAgent === true,
              onChange: (e) => patch({ announceToAgent: e.target.checked }),
            }),
            T.announceLabel,
          ),
          h('div', { className: 'rssnews_set_hint' }, T.announceHint),
          h('label', { className: 'rssnews_set_check' },
            h('input', {
              type: 'checkbox',
              checked: draft.enabled !== false,
              onChange: (e) => patch({ enabled: e.target.checked }),
            }),
            T.enabledLabelPlugin,
          ),
        ),

        h('div', { className: 'rssnews_set_footer' },
          saveButton,
          h('span', { className: 'rssnews_set_mono' }, state && state.digestDir ? state.digestDir : ''),
        ),
      )
    }

    /* ---------------------------- 注册 ---------------------------- */


    return {
      inject: ['slots'],
      apply(ctx) {
        // 侧边栏图标
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: ID,
          order: 20,
          label: () => T.sidebarLabel,
        }, NewsIcon))

        // 图标点开后的主面板（key 必须与侧边栏 id 一致）
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: ID,
        }, DigestPanel))

        // 设置页：只放配置
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: ID,
          order: 50,
          label: () => T.sidebarLabel,
        }, SettingsSection))
      },
    }
  },
})
