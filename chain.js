// Updated 2026-11-05: purpose-based preference, not a new benchmark.
// AI availability requires client verification; residential exit is opt-in, last.
function operator(proxies) {
  const routes = [
  [
    "[高级]|ACAS-HK||",
    "[高级]|ACAS-SG||"
  ],
  [
    "[标准]|ACSS-HK||",
    "[专业]|ACPS-JP2||"
  ],
  [
    "[高级]|ACAS-HK||",
    "[高级]|ACAS-US||"
  ],
  [
    "[高级]|ACAS-HK||",
    "[国际]|ACGO-US||"
  ],
  [
    "[标准]|ACSS-TW||",
    "[专业]|ACPS-US||"
  ],
  [
    "[高级]|ACAS-HK||",
    "[专业+]|ACPS-US|住宅|"
  ]
];
  const specs = {
    "[国际]|ACGO-US||": "美国际",
    "[高级]|ACAS-HK||": "港高",
    "[高级]|ACAS-SG||": "新高",
    "[标准]|ACSS-TW||": "台商",
    "[专业+]|ACPS-US|住宅|": "美宅",
    "[高级]|ACAS-US||": "美高",
    "[专业]|ACPS-US||": "美专",
    "[专业]|ACPS-JP2||": "日东专",
    "[标准]|ACSS-HK||": "港标"
  };
  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if (!Array.isArray(proxies)) throw new Error('请提供原始订阅节点数组。');
  if (proxies.some(p => /^(双跳-|入口-|单跳-)/.test(p.name || '') || chainKeys.some(k => p[k]))) {
    throw new Error('请使用原始订阅，不要重复处理链式输出或带前置代理的节点。');
  }
  function nodeKey(name) {
    const text = String(name || '').replace(/\s+/g, '');
    const tier = (text.match(/^\[[^\]]+\]/) || [''])[0];
    const code = (text.match(/AC[A-Z]+-[A-Z]+\d*/i) || [''])[0].toUpperCase();
    return [tier, code, /家宽|住宅/.test(text) ? '住宅' : '', /三网直连/.test(text) ? '直连' : ''].join('|');
  }
  function flag(key) {
    const code = (key.match(/AC[A-Z]+-([A-Z]+)/) || [])[1];
    return { HK: '🇭🇰', HKBGP: '🇭🇰', SG: '🇸🇬', KR: '🇰🇷',
      JP: '🇯🇵', US: '🇺🇸', USA: '🇺🇸', TW: '🇹🇼', DE: '🇩🇪',
      FR: '🇫🇷', UK: '🇬🇧', RU: '🇷🇺' }[code] || '🌐';
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
      name: `双跳-AI${String(index + 1).padStart(2, '0')}-${flag(exitKey)}${specs[entryKey]}→${specs[exitKey]}`,
      'underlying-proxy': entries.get(entryKey).name,
    });
  }
  if (!output.length) throw new Error('没有匹配到 AI 候选组合，请检查原始订阅。');
  return [...output, ...entries.values()];
}
