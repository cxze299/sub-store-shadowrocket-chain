// Sub-Store: original optimized nodes, without an extra client-created hop.
// Updated 2026-11-05: purpose-based shortlist; added candidates are unmeasured.
// No throughput or authenticated AI access guarantee; client handles failover.
function operator(proxies) {
  if (!Array.isArray(proxies)) throw new Error('请提供原始订阅节点数组。');
  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if (proxies.some(p => /^(双跳-|入口-|单跳-)/.test(p.name || '') || chainKeys.some(k => p[k]))) {
    throw new Error('请选择原始订阅，不要使用已经处理的单跳或双跳输出。');
  }
  const choices = [
    [/^\[高级\]\s*ACAS-HK\s*\|/i, '单跳-🇭🇰港高'],
    [/^\[专业\]\s*ACPS-HK\s*\|/i, '单跳-🇭🇰港专'],
    [/^\[专业\]\s*ACPS-HKBGP\s*\|/i, '单跳-🇭🇰港多专'],
    [/^\[高级\]\s*ACAS-SG\s*\|/i, '单跳-🇸🇬新高'],
    [/^\[专业\]\s*ACPS-JP2\s*\|/i, '单跳-🇯🇵日东专'],
    [/^\[专业\]\s*ACPS-JP\s*\|/i, '单跳-🇯🇵日专'],
    [/^\[高级\]\s*ACAS-US(?=\s|\||[（(]|$)/i, '单跳-🇺🇸美高'],
    [/^\[国际\]\s*ACGO-US(?=\s|\||[（(]|$)/i, '单跳-🇺🇸美国际'],
    [/^\[专业\+\]\s*ACPS-US\s*\|/i, '单跳-🇺🇸美宅'],
  ];
  const output = [];
  for (const [pattern, name] of choices) {
    const matches = proxies.filter(p => pattern.test(p.name || ''));
    if (matches.length > 1) throw new Error(`候选节点重复：${name}，请先对原始订阅去重。`);
    if (matches.length === 1) output.push({ ...matches[0], name });
  }
  if (!output.length) throw new Error('未找到优选原始节点，请检查源订阅或更新脚本。');
  return output;
}
