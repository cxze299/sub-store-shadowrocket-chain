// Updated 2026-11-04 22:56 +08:00. 714 pairs screened, 58 shortlisted.
// Every selected route passed 6 checks and 2 fresh-connection downloads.
// Static preference snapshot; client handles live health checks and failover.
// Sub-Store Script Operator: benchmark-selected routes across this subscription.
// Generated route data is inserted by the local benchmark build step.
function operator(proxies) {
  const routes = [
  [
    "[高级]|ACAS-HK||",
    "[标准]|ACSS-HK||"
  ],
  [
    "[专业]|ACPS-JP||",
    "[标准]|ACSS-HK||"
  ],
  [
    "[标准]|ACSS-HK||",
    "[高级]|ACAS-HK||"
  ],
  [
    "[高级]|ACAS-HK||",
    "[高级]|ACAS-SG||"
  ],
  [
    "[标准]|ACSS-HK||",
    "[专业]|ACPS-KR||"
  ],
  [
    "[专业]|ACPS-JP2||",
    "[专业]|ACPS-HKBGP||"
  ],
  [
    "[专业+]|ACPS-US|住宅|",
    "[测试]|ACSS-USA||"
  ]
];
  const specs = {
  "[高级]|ACAS-HK||": "港高",
  "[标准]|ACSS-HK||": "港标",
  "[专业]|ACPS-JP||": "日专",
  "[高级]|ACAS-SG||": "新高",
  "[专业]|ACPS-KR||": "韩专",
  "[专业]|ACPS-JP2||": "日东专",
  "[专业]|ACPS-HKBGP||": "港多专",
  "[专业+]|ACPS-US|住宅|": "美宅",
  "[测试]|ACSS-USA||": "美低倍"
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
      ...entry, name: `入口-${specs[entryKey]}`,
    });
    output.push({
      ...exit,
      name: `双跳-${String(index + 1).padStart(2, '0')}-${specs[entryKey]}→${specs[exitKey]}`,
      'underlying-proxy': entries.get(entryKey).name,
    });
  }
  if (!output.length) throw new Error('没有匹配到实测优选组合，请检查原始订阅是否包含国际、专业和测试线路。');
  return [...output, ...entries.values()];
}
