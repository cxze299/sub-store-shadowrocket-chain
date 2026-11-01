// Sub-Store Script Operator: HK/SG entry -> US exit.
function operator(proxies) {
  const entries = proxies.filter(p => /AC(?:PS|SS|AS)-(?:HK(?:BGP)?|SG)\s*\|/i.test(p.name));
  const exits = proxies.filter(p => /AC(?:PS|SS|AS)-USA?\s*\|/i.test(p.name));

  if (!entries.length || !exits.length) {
    throw new Error(`未找到入口或美国出口：入口 ${entries.length} 个，出口 ${exits.length} 个。`);
  }

  const entryNodes = entries.map((p, i) => ({
    ...p,
    name: `入口-${String(i + 1).padStart(2, '0')}-${p.name}`,
  }));
  const chains = [];
  for (const entry of entryNodes) {
    for (const exit of exits) {
      chains.push({
        ...exit,
        name: `双跳-${entry.name} → ${exit.name}`,
        'underlying-proxy': entry.name,
      });
    }
  }
  return [...entryNodes, ...chains];
}
