/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 Gemini Intelligent Proxy Chaining Engine v3.0 (最新订阅全存活节点优化版)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 修复核心要点：
 * 1. 【解除 VMess 协议误杀】：最新订阅核心 BGP 专线及家宽住宅 IP 均为 VMess，全面支持 VMess/VLESS 混链。
 * 2. 【实测存活节点全锁定】：
 *    - 核心跳板入口：[标准]ACSS-HK (381ms香港高速)、[专业]ACPS-HKBGP (915ms香港多线专线)、[标准]ACSS-TW (559ms台湾动态商宽)
 *    - 核心落地出口：[专业+] ACPS-US (964ms美国家宽住宅IP)、[高级]ACAS-US (728ms美国原生)、[高级]ACAS-SG (1348ms新加坡原生AI)
 * 3. 【Shadowrocket 严谨适配】：确保 underlying-proxy 名称与底层入口节点完全一致，双跳秒级握手。
 * 4. 【保底直连与容灾降级】：直连组与备用组全覆盖，永无全红超时。
 * ═══════════════════════════════════════════════════════════════════════════════
 */
function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    return proxies;
  }

  // 1. 防重复处理保护
  if (proxies.some(p => p.name && (p.name.includes('🔗') || p.name.includes('双跳')))) {
    return proxies;
  }

  // 2. 过滤无用通知节点及本机环回地址
  const validNodes = proxies.filter(p => {
    if (!p || !p.server) return false;
    if (p.server === '127.1.1.1' || p.server === '127.0.0.1') return false;
    if (p.name && (p.name.includes('通知') || p.name.includes('官网') || p.name.includes('地址'))) return false;
    return true;
  });

  const pool = validNodes.length > 0 ? validNodes : proxies;

  // 3. 智能匹配精选入口（按实测延迟与质量排序）
  // 核心入口：香港高速 (381ms) > 香港多线BGP (915ms) > 台湾商宽 (559ms) > 香港深度优化 (577ms)
  const entryFinders = [
    {
      id: 'HK-Fast',
      match: p => /ACSS-HK/i.test(p.name) && !/测试/i.test(p.name),
      tag: '🇭🇰 香港高速 (381ms)',
      desc: '超低延迟跳板'
    },
    {
      id: 'HK-BGP',
      match: p => /ACPS-HKBGP/i.test(p.name),
      tag: '🇭🇰 香港多线BGP',
      desc: '晚高峰抗拥堵专线'
    },
    {
      id: 'TW-Broadband',
      match: p => /ACSS-TW/i.test(p.name),
      tag: '🇹🇼 台湾动态商宽',
      desc: '559ms原生商宽'
    },
    {
      id: 'HK-Pro',
      match: p => /ACPS-HK/i.test(p.name) && !/BGP/i.test(p.name),
      tag: '🇭🇰 香港深度优化',
      desc: '577ms极速专线'
    }
  ];

  // 4. 智能匹配精选出口（AI/家宽住宅/原生流媒体）
  const exitFinders = [
    {
      id: 'US-Residential',
      match: p => (/ACPS-US/i.test(p.name) && /家宽|住宅/i.test(p.name)) || /住宅/i.test(p.name),
      tag: '🇺🇸 美国家宽真实住宅IP',
      purpose: '最高防封级别/ChatGPT/Claude/Gemini'
    },
    {
      id: 'US-Native',
      match: p => /ACAS-US/i.test(p.name) && !/测试/i.test(p.name),
      tag: '🇺🇸 美国原生线路 (728ms)',
      purpose: '极速原生/AI低延迟'
    },
    {
      id: 'US-Pro',
      match: p => /ACPS-US/i.test(p.name) && !/家宽|住宅/i.test(p.name),
      tag: '🇺🇸 美国洛杉矶原生',
      purpose: '大带宽AI/流媒体'
    },
    {
      id: 'SG-AI',
      match: p => /ACAS-SG/i.test(p.name),
      tag: '🇸🇬 新加坡原生AI与流媒体',
      purpose: '免美区中转/直接解锁AI'
    },
    {
      id: 'DE-Pro',
      match: p => /ACAS-DE/i.test(p.name) && !/测试/i.test(p.name),
      tag: '🇩🇪 德国法兰克福深度优化',
      purpose: '欧洲原生AI落地'
    },
    {
      id: 'FR-Pro',
      match: p => /ACPS-FR/i.test(p.name),
      tag: '🇫🇷 法国巴黎深度优化',
      purpose: '欧洲备用落地'
    }
  ];

  // 解析入口节点
  const entries = [];
  entryFinders.forEach(ef => {
    const found = pool.find(ef.match);
    if (found && !entries.some(e => e.proxy.name === found.name)) {
      entries.push({ proxy: found, ...ef });
    }
  });

  // 如果精准匹配不足，兜底匹配香港和台湾
  if (entries.length === 0) {
    const hkFallback = pool.find(p => /(香港|HK)/i.test(p.name));
    if (hkFallback) entries.push({ proxy: hkFallback, id: 'HK-Fall', tag: '🇭🇰 香港入口', desc: '兜底跳板' });
  }

  // 解析出口节点
  const exits = [];
  exitFinders.forEach(xf => {
    const found = pool.find(xf.match);
    if (found && !exits.some(e => e.proxy.name === found.name)) {
      exits.push({ proxy: found, ...xf });
    }
  });

  // 兜底出口：找美国节点
  if (exits.length === 0) {
    const usFallback = pool.find(p => /(美国|US|USA)/i.test(p.name));
    if (usFallback) exits.push({ proxy: usFallback, id: 'US-Fall', tag: '🇺🇸 美国出口', purpose: '兜底出口' });
  }

  // 安全降级：若源订阅异常，原样返回存活节点，绝不白屏
  if (entries.length === 0 || exits.length === 0) {
    return pool;
  }

  // 5. 组装链式代理矩阵
  // Shadowrocket 要求：underlying-proxy 的值必须与列表中某个入口节点的 name 完全一致
  const entryNodes = entries.map((e, idx) => ({
    ...e.proxy,
    name: `[入口${idx + 1}] ${e.tag}`
  }));

  const fastEntry = entryNodes.find(e => e.name.includes('香港高速')) || entryNodes[0];
  const bgpEntry = entryNodes.find(e => e.name.includes('BGP')) || fastEntry;
  const twEntry = entryNodes.find(e => e.name.includes('台湾'));
  const proEntry = entryNodes.find(e => e.name.includes('深度优化'));

  const usRes = exits.find(x => x.id === 'US-Residential');
  const usNat = exits.find(x => x.id === 'US-Native');
  const usPro = exits.find(x => x.id === 'US-Pro');
  const sgAI = exits.find(x => x.id === 'SG-AI');
  const dePro = exits.find(x => x.id === 'DE-Pro');
  const frPro = exits.find(x => x.id === 'FR-Pro');

  function makeChain(exitItem, entryNode, rank, label) {
    if (!exitItem || !entryNode) return null;
    return {
      ...exitItem.proxy,
      name: `🔗 ${rank} ${label} (${entryNode.name.split(' ')[1]}👉${exitItem.tag.split(' ')[1]})`,
      'underlying-proxy': entryNode.name,
      'dialer-proxy': entryNode.name
    };
  }

  const chains = [];

  // 【链 01】顶级家宽住宅双跳（香港高速 👉 美国家宽真实住宅IP，解锁所有美区AI与内容）
  if (fastEntry && usRes) {
    chains.push(makeChain(usRes, fastEntry, '01', '顶级美国家宽双跳'));
  }
  // 【链 02】极速原生双跳（香港高速 👉 美国原生线路 728ms，极速低延迟AI对话）
  if (fastEntry && usNat) {
    chains.push(makeChain(usNat, fastEntry, '02', '极速美国原生双跳'));
  }
  // 【链 03】晚高峰抗拥堵双跳（香港多线BGP 👉 美国家宽真实住宅IP，0丢包抗晚高峰）
  if (bgpEntry && usRes) {
    chains.push(makeChain(usRes, bgpEntry, '03', '晚高峰BGP家宽双跳'));
  }
  // 【链 04】狮城原生AI双跳（香港高速 👉 新加坡原生AI与流媒体）
  if (fastEntry && sgAI) {
    chains.push(makeChain(sgAI, fastEntry, '04', '狮城原生AI双跳'));
  }
  // 【链 05】美区大带宽双跳（台湾商宽 👉 美国洛杉矶原生）
  if (twEntry && usPro) {
    chains.push(makeChain(usPro, twEntry, '05', '商宽美区双跳'));
  } else if (fastEntry && usPro) {
    chains.push(makeChain(usPro, fastEntry, '05', '经典美区双跳'));
  }
  // 【链 06】欧洲原生双跳（香港高速 👉 德国法兰克福深度优化）
  if (fastEntry && (dePro || frPro)) {
    chains.push(makeChain(dePro || frPro, fastEntry, '06', '欧洲原生双跳'));
  }

  // 6. 直连极速加速组（供不想走中转或大文件快速下载使用）
  const directPicks = [];
  if (fastEntry) {
    directPicks.push({
      ...fastEntry,
      name: `⚡ [极速直连] 🇭🇰 香港高速 (381ms/最快入口)`
    });
  }
  if (twEntry) {
    directPicks.push({
      ...twEntry,
      name: `⚡ [原生商宽] 🇹🇼 台湾动态商宽 (559ms/解锁Netflix)`
    });
  }
  if (proEntry) {
    directPicks.push({
      ...proEntry,
      name: `⚡ [深度优化] 🇭🇰 香港深度优化 (577ms/支持流媒体)`
    });
  }
  if (sgAI) {
    directPicks.push({
      ...sgAI.proxy,
      name: `⚡ [原生AI] 🇸🇬 新加坡原生 (免中转/直接解锁Gemini)`
    });
  }

  // 7. 应急直连保底组（包含所有底层入口）
  const fallbackNodes = entryNodes.map(e => ({
    ...e,
    name: `🛡️ 备用直连 | ${e.name.replace(/^\[入口\d\]\s*/, '')}`
  }));

  // 最终节点排序组合：
  // 1. 核心精选双跳链（满足美区家宽、原生 AI 及欧洲落地）
  // 2. 极速直连加速节点（免双跳，大带宽）
  // 3. 入口底层实体节点（Shadowrocket underlying-proxy 必须显式存在）
  // 4. 应急直连备用节点
  return [
    ...chains,
    ...directPicks,
    ...entryNodes,
    ...fallbackNodes
  ];
}
