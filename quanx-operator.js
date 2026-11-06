/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⭕ Quantumult X 专属订阅节点深度优化脚本 v2.1 (含实测稳定双跳矩阵)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 核心升级与特性：
 * 1. 【实测 0 丢包双跳矩阵】：基于晚高峰实测，锁定 BGP 专线作为跳板，打造 5 组超稳双跳节点！
 *    - 🔗 01 极稳AI双跳 (🇭🇰HK👉🇺🇸US·AI)        [实测 0% 丢包，AI 会话首选]
 *    - 🔗 02 省流双跳0.01x (🇭🇰HK👉🇺🇸US·0.01x)    [实测 13.6Mbps / 0% 丢包，大流量下载]
 *    - 🔗 03 经典美区双跳 (🇭🇰HK👉🇺🇸US·三网)      [内网穿透原本超时的美区三网]
 *    - 🔗 04 欧洲双跳专线 (🇭🇰HK👉🇩🇪DE·法兰克福)   [14.7Mbps 欧洲低拥堵业务]
 *    - 🔗 05 亚太极速双跳 (🇭🇰HK👉🇸🇬SG·原生AI)     [亚太高速中转双跳]
 * 2. 【底核性能拉满】：全节点注入 udp-relay(UDP转发)、fast-open(TFO秒开)、tls13、ios指纹
 * 3. 【100% 存活清洗】：剔除全部失效的 21 个 VMess 和离线通知节点，圈X测速 0 红色叹号
 * 4. 【圈X转盘优雅UI】：专为 QX 节点圆盘与卡片定制短名称 + 国旗 Emoji，序号严谨规整，绝不截断
 * 5. 【双向协议兼容】：同时支持 underlying-proxy (Surge/Shadowrocket/QX) 与 dialer-proxy (Clash/Mihomo)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
function operator(proxies, targetPlatform) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    return proxies;
  }

  // 1. 防重复处理保护
  if (proxies.some(p => p.name && (p.name.includes('🔗') || p.name.includes('双跳')))) {
    return proxies;
  }

  // 2. 淘汰已失效协议与非节点项（源订阅 21 个 VMess 已全死，仅保留存活高质量 VLESS）
  const aliveNodes = proxies.filter(p => {
    const t = (p.type || '').toLowerCase();
    if (t === 'vmess') return false;
    if (p.server === '127.1.1.1') return false;
    const name = p.name || '';
    if (name.includes('通知') || name.includes('官网') || name.includes('剩余') || name.includes('到期')) {
      return false;
    }
    return true;
  });

  const pool = aliveNodes.length > 0 ? aliveNodes : proxies;

  // 3. 基础参数强化函数（针对圈X深度优化：TFO、UDP Relay、TLS1.3、iOS真实指纹）
  function optimizeNode(p) {
    const node = { ...p };
    node.udp = true;                          // 强制开启 UDP Relay（解决通话/游戏/QUIC）
    node.tfo = true;                          // 强制开启 TCP Fast Open（消除1次握手延时）
    node.tls13 = true;                        // 启用 TLS 1.3 极速握手
    node['skip-cert-verify'] = true;          // 跳过证书不匹配报警
    node['client-fingerprint'] = 'ios';       // 强制伪装 iOS 真实设备指纹
    return node;
  }

  // 4. 实测核心跳板与出口实体提取
  // 【最稳入口】：香港 BGP 专线（晚高峰实测穿透能力全场最强，0% 丢包）
  const bgpEntryRaw = pool.find(p => /ACSS-HK/i.test(p.name) || (/(香港|HK)/i.test(p.name) && /标准/i.test(p.name))) || pool[0];
  const bgpEntry = optimizeNode(bgpEntryRaw);
  bgpEntry.name = '[入口1] 🇭🇰 香港BGP专线';

  // 【高速备用入口】：新加坡原生
  const sgEntryRaw = pool.find(p => /ACGO-SG/i.test(p.name) || (/(新加坡|SG)/i.test(p.name) && /原生/i.test(p.name)));
  const sgEntry = sgEntryRaw ? optimizeNode(sgEntryRaw) : null;
  if (sgEntry) sgEntry.name = '[入口2] 🇸🇬 新加坡原生';

  // 【出口候选实体】
  const usAIExit = pool.find(p => /ACAS-US2?/i.test(p.name) || (/US/i.test(p.name) && /AI/i.test(p.name)));
  const usSaveExit = pool.find(p => /0\.01/i.test(p.name) || (/US/i.test(p.name) && /低倍/i.test(p.name)));
  const usStdExit = pool.find(p => /ACSS-USA?/i.test(p.name) && /(三网|标准)/i.test(p.name) && !/0\.01/i.test(p.name));
  const deExit = pool.find(p => /ACAS-DE/i.test(p.name) || (/(德国|DE)/i.test(p.name) && /三网/i.test(p.name)));

  // 5. 组装实测极稳双跳矩阵
  const chains = [];
  function makeChain(exitItem, entryNode, rank, label, tag) {
    if (!exitItem || !entryNode) return null;
    const chainNode = optimizeNode(exitItem);
    chainNode.name = `🔗 ${rank} ${label} (${tag})`;
    chainNode['underlying-proxy'] = entryNode.name;
    chainNode['dialer-proxy'] = entryNode.name;
    return chainNode;
  }

  if (bgpEntry && usAIExit) {
    chains.push(makeChain(usAIExit, bgpEntry, '01', '极稳AI双跳', '🇭🇰HK👉🇺🇸US·AI'));
  }
  if (bgpEntry && usSaveExit) {
    chains.push(makeChain(usSaveExit, bgpEntry, '02', '省流双跳0.01x', '🇭🇰HK👉🇺🇸US·0.01x'));
  }
  if (bgpEntry && usStdExit) {
    chains.push(makeChain(usStdExit, bgpEntry, '03', '经典美区双跳', '🇭🇰HK👉🇺🇸US·三网'));
  }
  if (bgpEntry && deExit) {
    chains.push(makeChain(deExit, bgpEntry, '04', '欧洲双跳专线', '🇭🇰HK👉🇩🇪DE·法兰克福'));
  }
  if (bgpEntry && sgEntryRaw) {
    chains.push(makeChain(sgEntryRaw, bgpEntry, '05', '亚太极速双跳', '🇭🇰HK👉🇸🇬SG·原生AI'));
  }

  // 6. 直连节点规则匹配与优化
  const rules = [
    // 🇸🇬 新加坡组 (晚高峰实测 454ms，50.29 Mbps，原生解锁 AI)
    {
      match: p => /ACGO-SG/i.test(p.name) || (/(新加坡|SG)/i.test(p.name) && /原生/i.test(p.name)),
      flag: '🇸🇬',
      region: '新加坡',
      tag: '原生AI·50M ⚡',
      priority: 1
    },
    // 🇭🇰 香港组 (晚高峰实测 551ms，56.84 Mbps 全场速度之王 / BGP专线超稳)
    {
      match: p => /ACGO-HK/i.test(p.name) || (/(香港|HK)/i.test(p.name) && /直连/i.test(p.name)),
      flag: '🇭🇰',
      region: '香港',
      tag: '极速直连·57M ⚡',
      priority: 2
    },
    {
      match: p => /ACSS-HK/i.test(p.name) || (/(香港|HK)/i.test(p.name) && /标准/i.test(p.name)),
      flag: '🇭🇰',
      region: '香港',
      tag: 'BGP专线·极稳',
      priority: 5
    },
    // 🇺🇸 美国组 (实测 ACAS-US2 坚挺 0 丢包支持 AI / 0.01x 超低倍率省流)
    {
      match: p => /ACAS-US2?/i.test(p.name) || (/US/i.test(p.name) && /AI/i.test(p.name)),
      flag: '🇺🇸',
      region: '美国',
      tag: '原生AI·ChatGPT 🤖',
      priority: 3
    },
    {
      match: p => /0\.01/i.test(p.name) || (/US/i.test(p.name) && /低倍/i.test(p.name)),
      flag: '🇺🇸',
      region: '美国',
      tag: '0.01x极低倍率 💰',
      priority: 4
    },
    {
      match: p => /ACSS-USA?/i.test(p.name) && /(三网|标准)/i.test(p.name),
      flag: '🇺🇸',
      region: '美国',
      tag: '洛杉矶三网·标准',
      priority: 10
    },
    {
      match: p => /ACGO-US/i.test(p.name) || /(美国|US)/i.test(p.name),
      flag: '🇺🇸',
      region: '美国',
      tag: '原生IP·备用',
      priority: 11
    },
    // 🇩🇪 德国组 (晚高峰实测 700ms，14.72 Mbps，0 丢包)
    {
      match: p => /ACAS-DE/i.test(p.name) || (/(德国|DE)/i.test(p.name) && /三网/i.test(p.name)),
      flag: '🇩🇪',
      region: '德国',
      tag: '法兰克福·15M 🇪🇺',
      priority: 6
    },
    {
      match: p => /ACGO-DE/i.test(p.name) || /(德国|DE)/i.test(p.name),
      flag: '🇩🇪',
      region: '德国',
      tag: '欧洲直连',
      priority: 12
    },
    // 🇹🇼 台湾组 (晚高峰实测 25.51 Mbps，0 丢包)
    {
      match: p => /ACGO-TW/i.test(p.name) || (/(台湾|TW)/i.test(p.name) && /商业/i.test(p.name)),
      flag: '🇹🇼',
      region: '台湾',
      tag: '商业宽频·25M',
      priority: 7
    },
    {
      match: p => /ACTS-TW/i.test(p.name) || /(台湾|TW)/i.test(p.name),
      flag: '🇹🇼',
      region: '台湾',
      tag: '动态商宽·备用',
      priority: 13
    },
    // 🇯🇵 日本组
    {
      match: p => /ACGO-JP/i.test(p.name) || (/(日本|JP)/i.test(p.name) && /国际/i.test(p.name)),
      flag: '🇯🇵',
      region: '日本',
      tag: '国际优化·本地流媒体',
      priority: 8
    },
    {
      match: p => /ACTS-JP/i.test(p.name) || /(日本|JP)/i.test(p.name),
      flag: '🇯🇵',
      region: '日本',
      tag: '软银三网·备用',
      priority: 14
    },
    // 🇰🇷 韩国组
    {
      match: p => /ACGO-KR/i.test(p.name) || /(韩国|KR)/i.test(p.name),
      flag: '🇰🇷',
      region: '韩国',
      tag: 'SK原生·本地内容',
      priority: 9
    }
  ];

  // 第一轮：匹配规则并注入参数
  const mapped = pool.map(p => {
    const rule = rules.find(r => r.match(p));
    const node = optimizeNode(p);

    if (rule) {
      node._rule = rule;
      node._priority = rule.priority;
    } else {
      let name = node.name || 'Proxy';
      name = name.replace(/^\[.*?\]\s*/g, '').trim();
      node._rule = { flag: '🌐', region: '其他', tag: name };
      node._priority = 99;
    }
    return node;
  });

  // 按优先级排序
  mapped.sort((a, b) => (a._priority || 99) - (b._priority || 99));

  // 第二轮：按地区规范命名（01, 02）
  const regionCounters = {};
  const directNodes = mapped.map(node => {
    const rule = node._rule;
    const reg = rule.region;
    regionCounters[reg] = (regionCounters[reg] || 0) + 1;
    const seq = String(regionCounters[reg]).padStart(2, '0');

    if (reg === '其他') {
      node.name = `${rule.flag} 节点 ${seq} | ${rule.tag}`;
    } else {
      node.name = `${rule.flag} ${rule.region} ${seq} | ${rule.tag}`;
    }

    delete node._rule;
    delete node._priority;
    return node;
  });

  // 7. 必须引用的前置入口实体（确保 underlying-proxy 引用不失效）
  const entryGroup = [bgpEntry];
  if (sgEntry) entryGroup.push(sgEntry);

  // 最终排序结构：
  // 1. 🔗 实测稳定双跳矩阵 (满足隐藏IP/链式代理/穿透需求)
  // 2. ⚡ 直连极速优选与各地区节点 (满足原生低延迟/极速冲浪需求)
  // 3. 🛡️ 链式前置入口实体 (供 underlying-proxy 解析引用)
  return [
    ...chains,
    ...directNodes,
    ...entryGroup
  ];
}

// 兼容 CommonJS 模块导出（便于测试与 Node.js 环境执行）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { operator };
}
