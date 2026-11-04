// Updated 2026-11-04 23:19 +08:00. AI-focused snapshot; static preference, client performs health checks.
// OpenAI/Claude API 401 = authentication required, NOT proof of successful AI inference.
// ChatGPT web probes encountered anti-bot challenges; confirm in your browser.
// Sub-Store Script Operator: AI-focused, measured two-hop routes; no login or inference guarantee.
// Generated route data is inserted by the local benchmark build step.
function operator(proxies) {
  const routes = [
  [
    "[高级]|ACAS-HK||",
    "[高级]|ACAS-SG||"
  ],
  [
    "[标准]|ACSS-JP||",
    "[高级]|ACAS-SG||"
  ],
  [
    "[专业+]|ACPS-US|住宅|",
    "[国际]|ACGO-US||"
  ],
  [
    "[高级]|ACAS-HK||",
    "[专业]|ACPS-KR||"
  ],
  [
    "[标准]|ACSS-HK||",
    "[专业]|ACPS-JP||"
  ]
];
  const specs = {
  "[高级]|ACAS-HK||": "港高",
  "[高级]|ACAS-SG||": "新高",
  "[标准]|ACSS-JP||": "日标",
  "[专业+]|ACPS-US|住宅|": "美宅",
  "[国际]|ACGO-US||": "美国际",
  "[专业]|ACPS-KR||": "韩专",
  "[标准]|ACSS-HK||": "港标",
  "[专业]|ACPS-JP||": "日专"
};
  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if (!Array.isArray(proxies)) throw new Error('请提供原始订阅节点数组。');
  if (proxies.some(p => /^双跳-|^入口-/.test(p.name || '') || chainKeys.some(k => p[k]))) {
    throw new Error('请使用原始订阅，不要重复处理链式输出或带前置代理的节点。');
  }
  function nodeKey(name) {
    const text = String(name || '').replace(/\s+/g, '');
    const tier = (text.match(/^\[[^\]]+\]/) || [''])[0];
    const code = (text.match(/AC[A-Z]+-[A-Z]+\d*/i) || [''])[0].toUpperCase();
    return [tier, code, /家宽|住宅/.test(text) ? '住宅' : '', /三网直连/.test(text) ? '直连' : ''].join('|');
  }
  const available = new Map();
  for (const p of proxies) {
    const key = nodeKey(p.name);
    if (!Object.prototype.hasOwnProperty.call(specs, key)) continue;
    if (available.has(key)) throw new Error(`候选节点重复：${specs[key]}，请先对原始订阅去重。`);
    available.set(key, p);
  }
  const entries = new Map();
  const output = [];
  for (const [index, route] of routes.entries()) {
    const [entryKey, exitKey] = route;
    const entry = available.get(entryKey);
    const exit = available.get(exitKey);
    if (!entry || !exit) continue;
    if (entry.server === exit.server && entry.port === exit.port) continue;
    if (!entries.has(entryKey)) entries.set(entryKey, {
      ...entry, name: `入口-AI-${specs[entryKey]}`,
    });
    output.push({
      ...exit,
      name: `双跳-AI${String(index + 1).padStart(2, '0')}-${specs[entryKey]}→${specs[exitKey]}`,
      'underlying-proxy': entries.get(entryKey).name,
    });
  }
  if (!output.length) throw new Error('没有匹配到 AI 优选组合，请检查原始订阅是否包含国际、专业和测试线路。');
  return [...output, ...entries.values()];
}
