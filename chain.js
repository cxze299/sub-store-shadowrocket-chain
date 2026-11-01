// Sub-Store Script Operator: HK/SG entry -> US exit.
function operator(proxies) {
  const entries = proxies.filter(p => /AC(?:PS|SS|AS)-(?:HK(?:BGP)?|SG)\s*\|/i.test(p.name));
  const exits = proxies.filter(p => /AC(?:PS|SS|AS)-USA?\s*\|/i.test(p.name));
  entries.sort((a, b) => Number(/ACPS-HKBGP\s*\|/i.test(b.name)) - Number(/ACPS-HKBGP\s*\|/i.test(a.name)));
  exits.sort((a, b) => {
    const rank = p => /ACPS-US\s*\|/i.test(p.name) && !/家宽|住宅/.test(p.name) ? 0 : /ACPS-US\s*\|/i.test(p.name) ? 1 : 2;
    return rank(a) - rank(b);
  });

  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if ([...entries, ...exits].some(p => chainKeys.some(key => p[key]))) {
    throw new Error('源节点已有前置代理，请使用原始订阅，勿重复处理双跳输出。');
  }

  if (!entries.length || !exits.length) {
    throw new Error(`未找到入口或美国出口：入口 ${entries.length} 个，出口 ${exits.length} 个。`);
  }

  function shortName(p) {
    const match = p.name.match(/AC(PS|SS|AS)-(HKBGP|HK|SG|USA|US)\s*\|/i);
    const tier = { PS: '专业', SS: '标准', AS: '高级' }[match[1].toUpperCase()];
    const region = { HKBGP: '香港多线', HK: '香港', SG: '新加坡', US: '美国', USA: '美国' }[match[2].toUpperCase()];
    return `${region}${tier}${/家宽|住宅/.test(p.name) ? '家宽' : ''}`;
  }
  function uniqueNames(items, prefix) {
    const counts = {};
    return items.map(p => {
      const base = `${prefix}${shortName(p)}`;
      counts[base] = (counts[base] || 0) + 1;
      return counts[base] === 1 ? base : `${base}-${counts[base]}`;
    });
  }
  const entryNames = uniqueNames(entries, '入口-');
  const exitNames = uniqueNames(exits, '');
  const entryNodes = entries.map((p, i) => ({
    ...p,
    name: entryNames[i],
  }));
  const chains = [];
  for (const entry of entryNodes) {
    for (const [i, exit] of exits.entries()) {
      chains.push({
        ...exit,
        name: `双跳-${entry.name.slice(3)}→${exitNames[i]}`,
        'underlying-proxy': entry.name,
      });
    }
  }
  return [...chains, ...entryNodes];
}
