/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 官方认证 · 全新双跳重构引擎 v4.0 (Official Rebuilt Double-Hop Engine)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 核心设计依据官方工单与机房工程师深度指引：
 * 
 * 1. 【两大顶级机房入口】（实测 ~150ms 极低延迟国内 BGP 专线）：
 *    - 核心入口 1: [高级] ACAS-HK (香港深度优化 · 测速与日常低延迟首选)
 *    - 核心入口 2: [专业] ACPS-HKBGP (香港多线BGP · 晚高峰抗拥堵千兆专线)
 * 
 * 2. 【场景精准隔离 · 彻底杜绝误测速】：
 *    - 【🛡️ 顶级防风控组】：锁定 [专业+] 美国家宽真实住宅IP（100% 纯净美国家宽，专为 OpenAI/Claude/美区银行打造，明确标注非测速通道）
 *    - 【⚡ 极速大带宽组】：锁定 [高级] ACAS-US (官方推荐 CN2-GIA 顶级机房专线，美区 4K 秒开，测速大口子)
 *    - 【🤖 亚太极速 AI 组】：锁定 [高级] ACAS-SG (新加坡深度优化，免越洋跨海延迟，毫秒级流式响应)
 *    - 【🎬 亚太千兆机房组】：锁定 [专业] ACPS-JP (日本大阪原生千兆机房)
 *    - 【🌍 欧洲原生机房组】：锁定 [高级] ACAS-DE (德国法兰克福深度优化)
 * 
 * 3. 【双端全兼容挂载】：
 *    - 同时写入 dialer-proxy (Mihomo/Clash) 与 underlying-proxy (Shadowrocket/Loon/Surge)
 *    - 显式保留底层入口节点，确保客户端链式代理 100% 成功握手
 * 
 * 4. 【直连极速通道内嵌】：
 *    - 同步提供直连机房极速节点，无需切换订阅即可一键直连裸跑跑满本地带宽
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) return proxies;

  // 1. 防重复处理保护
  const chainKeys = ['underlying-proxy', 'dialer-proxy', 'chain', 'detour', 'prev_hop'];
  if (proxies.some(p => p.name && (p.name.includes('🔗') || p.name.includes('双跳') || p.name.includes('单跳-')) || chainKeys.some(k => p[k]))) {
    return proxies;
  }

  // 2. 过滤无用通知节点及环回节点
  const pool = proxies.filter(p => {
    if (!p || !p.server) return false;
    if (p.server === '127.1.1.1' || p.server === '127.0.0.1') return false;
    if (p.name && (p.name.includes('通知') || p.name.includes('官网') || p.name.includes('主站'))) return false;
    return true;
  });

  // 3. 辅助匹配函数（基于官方规范精准识别）
  const findNode = (pred) => pool.find(pred);

  // 官方推荐前置入口（香港深度优化 & 香港多线BGP）
  const entryHKHigh = findNode(p => /ACAS-HK/i.test(p.name) && !/测试/i.test(p.name)); // [高级]ACAS-HK 深度优化 (31515)
  const entryHKBGP  = findNode(p => /ACPS-HKBGP/i.test(p.name));                        // [专业]ACPS-HKBGP 多线 (24855)
  const entryHKStd  = findNode(p => /ACSS-HK/i.test(p.name) && !/测试/i.test(p.name));  // [标准]ACSS-HK (25746)

  // 官方推荐落地出口
  const exitUSRes   = findNode(p => /ACPS-US/i.test(p.name) && /家宽|住宅/i.test(p.name)); // [专业+] ACPS-US 美国家宽住宅IP (29452)
  const exitUSCN2   = findNode(p => /ACAS-US/i.test(p.name) && !/测试/i.test(p.name)); // [高级] ACAS-US CN2-GIA最佳线路 (33224)
  const exitSGAI    = findNode(p => /ACAS-SG/i.test(p.name) && !/测试/i.test(p.name)); // [高级] ACAS-SG 新加坡深度优化 (51708)
  const exitJPPro   = findNode(p => /ACPS-JP\s*\|/i.test(p.name) && !/JP2/i.test(p.name)); // [专业] ACPS-JP 日本大阪深度优化 (36747)
  const exitDEHigh  = findNode(p => /ACAS-DE/i.test(p.name) && !/测试/i.test(p.name) && p.type === 'vmess'); // [高级] ACAS-DE 德国法兰克福 (55625)

  // 构建显式底层入口实体（供 Shadowrocket 与 Clash 识别与挂载）
  const entryNodes = [];
  let e1 = null, e2 = null;

  if (entryHKHigh) {
    e1 = {
      ...entryHKHigh,
      name: '[入口1] 🇭🇰 香港深度优化 (ACAS-HK · 实测150ms)'
    };
    entryNodes.push(e1);
  }
  if (entryHKBGP) {
    e2 = {
      ...entryHKBGP,
      name: '[入口2] 🇭🇰 香港多线BGP (ACPS-HKBGP · 晚高峰抗拥堵)'
    };
    entryNodes.push(e2);
  }

  // 备用入口保障
  const defaultEntry = e1 || e2;
  const bgpEntry = e2 || e1;

  function makeChain(exitNode, entryNode, rank, tag, scene) {
    if (!exitNode || !entryNode) return null;
    return {
      ...exitNode,
      name: `🔗 ${rank} ${tag} (${entryNode.name.includes('BGP') ? '🇭🇰多线' : '🇭🇰港高'}➔${exitNode.name.includes('住宅') ? '🇺🇸美宅' : exitNode.name.includes('CN2') || exitNode.name.includes('US') ? '🇺🇸美高' : exitNode.name.includes('SG') ? '🇸🇬新高' : exitNode.name.includes('JP') ? '🇯🇵日专' : '🇩🇪德高'}) · ${scene}`,
      'dialer-proxy': entryNode.name,
      'underlying-proxy': entryNode.name
    };
  }

  const chains = [];

  // 【A 组：官方认证 · 防风控与 AI 专用双跳 (严苛防封 / 真实美国家宽)】
  if (exitUSRes && defaultEntry) {
    chains.push(makeChain(exitUSRes, defaultEntry, '01', '🛡️ 顶级美国家宽双跳', '防封控/OpenAI/Claude/银行'));
  }
  if (exitUSRes && bgpEntry && bgpEntry !== defaultEntry) {
    chains.push(makeChain(exitUSRes, bgpEntry, '02', '🛡️ 晚高峰抗拥家宽双跳', '晚高峰防封备用'));
  }

  // 【B 组：官方推荐 · 美区极速大带宽双跳 (机房千兆专线 / 4K秒开 / 测速首选)】
  if (exitUSCN2 && defaultEntry) {
    chains.push(makeChain(exitUSCN2, defaultEntry, '03', '⚡ 极速美区大带宽双跳', 'CN2-GIA最佳机房专线/4K秒开'));
  }
  if (exitUSCN2 && bgpEntry && bgpEntry !== defaultEntry) {
    chains.push(makeChain(exitUSCN2, bgpEntry, '04', '⚡ 晚高峰美区大带宽双跳', '晚高峰抗拥堵/千兆大口子'));
  }

  // 【C 组：亚太与欧洲原生双跳 (低延迟 / 极速对话 / 原生内容解锁)】
  if (exitSGAI && defaultEntry) {
    chains.push(makeChain(exitSGAI, defaultEntry, '05', '🤖 狮城原生AI极速双跳', '亚太超低延迟/Gemini流式秒回'));
  }
  if (exitJPPro && defaultEntry) {
    chains.push(makeChain(exitJPPro, defaultEntry, '06', '🎬 霓虹原生千兆双跳', '日本大阪机房专线/流媒体/游戏'));
  }
  if (exitDEHigh && defaultEntry) {
    chains.push(makeChain(exitDEHigh, defaultEntry, '07', '🌍 欧洲法兰克福双跳', '德国深度优化机房专线'));
  }

  // 【D 组：日常直连极速加速组（单跳直通 · 官方推荐大带宽通道）】
  const directSingles = [];
  if (entryHKHigh) {
    directSingles.push({
      ...entryHKHigh,
      name: '⚡ [直连极速] 🇭🇰 香港深度优化 (ACAS-HK · 测速/日常主用)'
    });
  }
  if (entryHKBGP) {
    directSingles.push({
      ...entryHKBGP,
      name: '⚡ [直连极速] 🇭🇰 香港多线BGP (ACPS-HKBGP · 晚高峰专线)'
    });
  }
  if (exitUSCN2) {
    directSingles.push({
      ...exitUSCN2,
      name: '⚡ [直连极速] 🇺🇸 美国CN2-GIA (ACAS-US · 美区极速大带宽)'
    });
  }
  if (exitSGAI) {
    directSingles.push({
      ...exitSGAI,
      name: '⚡ [直连极速] 🇸🇬 新加坡深度优化 (ACAS-SG · 原生AI免中转)'
    });
  }
  if (exitJPPro) {
    directSingles.push({
      ...exitJPPro,
      name: '⚡ [直连极速] 🇯🇵 日本大阪原生 (ACPS-JP · 千兆机房直达)'
    });
  }

  // 最终组合返回：
  // 1. 重构双跳核心链（防风控 + 大带宽 + 亚太AI）
  // 2. 直连极速通道（供日常秒开与测速跑满本地带宽）
  // 3. 底层入口节点（供客户端链式挂载）
  return [
    ...chains,
    ...directSingles,
    ...entryNodes
  ];
}
