/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 官方认证 · 全新双跳重构引擎 v4.1 (极简精炼版 · 手机端无截断)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) return proxies;

  // 1. 防重复处理保护
  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if (proxies.some(p => p.name && (p.name.includes('双跳') || p.name.includes('单跳-') || /^[🛡️⚡🤖🎬🌍]/.test(p.name)) && chainKeys.some(k => p[k]))) {
    return proxies;
  }

  // 2. 过滤无用通知节点及环回节点
  const pool = proxies.filter(p => {
    if (!p || !p.server) return false;
    if (p.server === '127.1.1.1' || p.server === '127.0.0.1') return false;
    if (p.name && (p.name.includes('通知') || p.name.includes('官网') || p.name.includes('主站'))) return false;
    return true;
  });

  const findNode = (pred) => pool.find(pred);

  // 核心机房入口（香港深度优化 & 香港多线BGP）
  const entryHKHigh = findNode(p => /ACAS-HK/i.test(p.name) && !/测试/i.test(p.name));
  const entryHKBGP  = findNode(p => /ACPS-HKBGP/i.test(p.name));

  // 核心落地出口
  const exitUSRes   = findNode(p => /ACPS-US/i.test(p.name) && /家宽|住宅/i.test(p.name));
  const exitUSCN2   = findNode(p => /ACAS-US/i.test(p.name) && !/测试/i.test(p.name));
  const exitSGAI    = findNode(p => /ACAS-SG/i.test(p.name) && !/测试/i.test(p.name));
  const exitJPPro   = findNode(p => /ACPS-JP\s*\|/i.test(p.name) && !/JP2/i.test(p.name));
  const exitDEHigh  = findNode(p => /ACAS-DE/i.test(p.name) && !/测试/i.test(p.name) && p.type === 'vmess');

  // 底层入口实体定义（精炼名称，供小火箭与Clash绑定）
  const entryNodes = [];
  let e1 = null, e2 = null;

  if (entryHKHigh) {
    e1 = { ...entryHKHigh, name: '[入口1] 香港高' };
    entryNodes.push(e1);
  }
  if (entryHKBGP) {
    e2 = { ...entryHKBGP, name: '[入口2] 香港多线' };
    entryNodes.push(e2);
  }

  const defaultEntry = e1 || e2;
  const bgpEntry = e2 || e1;

  function makeChain(exitNode, entryNode, shortName) {
    if (!exitNode || !entryNode) return null;
    return {
      ...exitNode,
      name: shortName,
      'dialer-proxy': entryNode.name,
      'underlying-proxy': entryNode.name
    };
  }

  const chains = [];

  // 双跳精炼组（一目了然，手机端不截断）
  if (exitUSRes && defaultEntry) {
    chains.push(makeChain(exitUSRes, defaultEntry, '🛡️ 01 美国家宽 (港高➔美宅)'));
  }
  if (exitUSRes && bgpEntry && bgpEntry !== defaultEntry) {
    chains.push(makeChain(exitUSRes, bgpEntry, '🛡️ 02 美国家宽·晚高峰 (多线➔美宅)'));
  }
  if (exitUSCN2 && defaultEntry) {
    chains.push(makeChain(exitUSCN2, defaultEntry, '⚡ 03 美国CN2 (港高➔美高)'));
  }
  if (exitUSCN2 && bgpEntry && bgpEntry !== defaultEntry) {
    chains.push(makeChain(exitUSCN2, bgpEntry, '⚡ 04 美国CN2·晚高峰 (多线➔美高)'));
  }
  if (exitSGAI && defaultEntry) {
    chains.push(makeChain(exitSGAI, defaultEntry, '🤖 05 新加坡AI (港高➔新高)'));
  }
  if (exitJPPro && defaultEntry) {
    chains.push(makeChain(exitJPPro, defaultEntry, '🎬 06 日本千兆 (港高➔日专)'));
  }
  if (exitDEHigh && defaultEntry) {
    chains.push(makeChain(exitDEHigh, defaultEntry, '🌍 07 德国法兰 (港高➔德高)'));
  }

  // 直连精炼组
  const directSingles = [];
  if (entryHKHigh) directSingles.push({ ...entryHKHigh, name: '⚡ 直连-香港高' });
  if (entryHKBGP)  directSingles.push({ ...entryHKBGP,  name: '⚡ 直连-香港多线' });
  if (exitUSCN2)   directSingles.push({ ...exitUSCN2,   name: '⚡ 直连-美国CN2' });
  if (exitSGAI)    directSingles.push({ ...exitSGAI,    name: '⚡ 直连-新加坡AI' });
  if (exitJPPro)   directSingles.push({ ...exitJPPro,   name: '⚡ 直连-日本千兆' });

  return [
    ...chains,
    ...directSingles,
    ...entryNodes
  ];
}
