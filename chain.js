// Sub-Store Script Operator: measured HK entry -> US exits.
// Two direct benchmarks + three chained checks (2026-11-04); not a live health check.
function operator(proxies) {
  const entryRules = [
    [/\[测试-标准\]\s*ACSS-HK\s*\|/i, '港测试'],
  ];
  const exitRules = [
    [/\[测试-标准\]\s*ACSS-USA?\s*\|/i, '美测试'],
    [/\[测试\]\s*ACSS-USA?\s*\|/i, '美低倍'],
    [/\[测试-高级\]\s*ACAS-US2\s*\|/i, '美高级'],
    [/ACGO-US\s*\|/i, '美国际'],
  ];
  function select(rules) {
    return rules.flatMap(([pattern, label]) => proxies
      .filter(p => pattern.test(p.name || ''))
      .map(p => ({ proxy: p, label })));
  }
  const entries = select(entryRules);
  const exits = select(exitRules);

  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if (proxies.some(p => /^双跳-|^入口-/.test(p.name || '') || chainKeys.some(key => p[key]))) {
    throw new Error('源节点已有前置代理，请使用原始订阅，勿重复处理双跳输出。');
  }

  if (!entries.length || !exits.length) {
    throw new Error(`未找到测速优选入口或美国出口：入口 ${entries.length} 个，出口 ${exits.length} 个。请使用含国际/测试线路的原始订阅。`);
  }

  function uniqueNames(items, prefix) {
    const counts = {};
    return items.map(p => {
      const base = `${prefix}${p.label}`;
      counts[base] = (counts[base] || 0) + 1;
      return counts[base] === 1 ? base : `${base}-${counts[base]}`;
    });
  }
  const entryNames = uniqueNames(entries, '入口-');
  const exitNames = uniqueNames(exits, '');
  const entryNodes = entries.map((p, i) => ({
    ...p.proxy,
    name: entryNames[i],
  }));
  const chains = [];
  // Prefer all routes to the best US exit before trying a weaker exit.
  for (const [i, exit] of exits.entries()) {
    for (const entry of entryNodes) {
      chains.push({
        ...exit.proxy,
        name: `双跳-${entry.name.slice(3)}→${exitNames[i]}`,
        'underlying-proxy': entry.name,
      });
    }
  }
  return [...chains, ...entryNodes];
}
