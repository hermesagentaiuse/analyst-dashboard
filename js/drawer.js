// 個股抽屜：一般抽屜（openDrawer）與持股抽屜（openPfDrawer）共用區塊
'use strict';
const FUND_ORDER=['1_毛利率趨勢','2_庫存佔營收','3_資本支出/營收','4_法人5日買超','5_商譽佔總資產','6_月營收YoY','7_估值','8_技術面90日','✕_產品營收比重'];

function stockName(code){
  const st=STATS[code];
  if(st&&st.name)return st.name;
  const p=(PF&&PF.stocks||[]).find(s=>s.code===code); if(p)return p.name;
  if(MENT&&MENT.events){const e=MENT.events.find(e=>e.code===code); if(e)return e.name;}
  return '';
}

// 🎯 TP1~3 + 停損階梯一行
function tpLadderLine(L){
  return `🎯 TP1 ${lv(L.tp1&&L.tp1.price)}｜TP2 ${lv(L.tp2&&L.tp2.price)}｜TP3 ${lv(L.tp3&&L.tp3.price)}<br>🛑 停損階梯：${ladderHtml(L)}`;
}
// 🧭 目標價錨點交叉表
function anchorsHtml(L){
  if(!(L.anchors&&L.anchors.length))return '';
  let h=`<div style="margin-top:8px;font-size:11px"><b>🧭 目標價錨點交叉</b>（${L.anchors.length} 個方法；±2.5% 內≥2 方法＝共振）<table class=chk style="margin-top:4px">`;
  for(const a of L.anchors){
    const inZone=(L.confluence||[]).some(z=>Math.abs(z.price-a.price)/a.price<=0.03);
    h+=`<tr><td>${a.method}</td><td><span class="${inZone?'v-ok':'neu'}">${Number(a.price).toLocaleString()}</span>${inZone?' <span class=neu>←共振區</span>':''}</td></tr>`;
  }
  return h+'</table></div>';
}
// 🔍 8 項基本面檢查
function fundHtml(f,missingMsg){
  let html=`<div class=sec><h4>🔍 8 項基本面檢查</h4><table class=chk>`;
  if(f&&f.items){
    for(const k of FUND_ORDER){
      const it=f.items[k]||{verdict:'未檢查'};
      const v=it.verdict||'—';
      let cc='v-na';
      if(/改善|正常|成長✓|乾淨|連續買超|偏低✓|合理|重資本/.test(v))cc='v-ok';
      if(/偏高⚠|注意|停滯|無連續|偏多|僅单季/.test(v))cc='v-warn';
      if(/轉折⚠|高減損|過熱/.test(v))cc='v-bad';
      let extra='';
      if(it.series)extra=it.series.map(s=>`${s.period}:${s.gm_pct}%`).join(' ');
      if(it.months)extra=it.months.map(m=>`${m.ym}:${m.yoy_pct!=null?(m.yoy_pct>0?'+':'')+m.yoy_pct+'%':'—'}`).join(' ');
      if(it.pct!=null)extra=`${it.label||''} ${it.pct}%`;
      if(it.pe!=null)extra=`PE ${it.pe??'—'} / PB ${it.pb??'—'} / 殖利率 ${it.div_yield??'—'}%`;
      if(it.streak_days!=null)extra=`連續 ${it.streak_days} 日`;
      html+=`<tr><td>${k.replace(/^\d+_|✕_/,'')}</td><td><span class="${cc}">${v}</span> <span class=neu>${extra}</span><br><span class=neu style="font-size:10px">${it.how||''}</span></td></tr>`;
    }
    html+=`</table><div class=foot style="text-align:left">檢查時間：${f.checked_at||'—'}　（財報採最新已公告季；資料未取得時如實標示，不推估）</div>`;
  } else html+=`<tr><td colspan=2 class=neu>${missingMsg}</td></tr></table>`;
  return html+`</div>`;
}
// 🗓 提及時間軸
function timelineHtml(code,limit,title){
  let html=`<div class=sec><h4>${title}</h4><div class=tl>`;
  if(MENT&&MENT.events){
    const evs=MENT.events.filter(e=>e.code===code).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
    if(!evs.length)html+=`<div class=neu>90 天內無提及紀錄</div>`;
    for(const e of evs){
      const vlink=e.video_id&&e.video_id!=='report'?` <a href="https://www.youtube.com/watch?v=${encodeURIComponent(e.video_id)}" target=_blank>▶影片</a>`:'';
      html+=`<div class=ev><span class=who>${esc(e.channel_name)}</span> ${esc(e.date)}${vlink}<div class=sn>${esc(e.snippet||'')}</div></div>`;
    }
  } else html+=`<div class=neu>時間軸資料載入中…</div>`;
  return html+`</div></div>`;
}
// 🏦 法人×融資趨勢
function flowSecHtml(code){
  return `<div class=sec><h4>🏦 法人×融資趨勢（近 60 交易日）</h4>${flowChartHtml(code)}<div class=foot style="text-align:left;margin-top:4px">上：三大法人每日買賣超（千股，無進出＝斷線非 0）；下：融資餘額（張）。來源：證交所/櫃買每日公告，夜間排程更新</div></div>`;
}
// 🧩 在產業鏈的位置（先放佔位，非同步載入 concepts 後填入）
let _drawerToken=0;
function chainSecHtml(){return `<div class=sec id="chainSec"><h4>🧩 在產業鏈的位置</h4><div class=neu>載入產業鏈資料…</div></div>`;}
async function fillChainSec(code){
  const tok=++_drawerToken;
  await Concepts.load();
  const el=document.getElementById('chainSec');
  if(!el||tok!==_drawerToken)return;
  if(!Concepts.data){el.innerHTML=`<h4>🧩 在產業鏈的位置</h4><div class=neu>產業鏈資料尚未提供</div>`;return;}
  const ents=Concepts.byCode[code]||[];
  if(!ents.length){el.innerHTML=`<h4>🧩 在產業鏈的位置</h4><div class=neu>此檔未收錄於產業鏈資料</div>`;return;}
  let h=`<h4>🧩 在產業鏈的位置</h4><div class="cpos">`;
  const peers=new Map();
  for(const e of ents){
    const info=Concepts.nodes.get(e.key); if(!info)continue;
    const crumbs=[`<a href="#/chain/${encodeURIComponent(info.product.id)}">${esc(info.product.name)}</a>`]
      .concat(info.path.slice(1).map(n=>`<a href="${chainHref(info.product.id,n.code)}">${esc(n.name)}</a>`)).join(' › ');
    h+=`<div class="cpos-row">${crumbs}${e.confidence==='inferred'?' <span class="cb cb-inf">推測</span>':''}<div class=neu>${esc(e.role)}</div></div>`;
    for(const s of info.node.suppliers){
      if(!isTw(s)||String(s.code)===code)continue;
      if(!peers.has(s.code))peers.set(s.code,{s,nodes:[]});
      peers.get(s.code).nodes.push(info.node.name);
    }
  }
  h+=`</div>`;
  if(peers.size){
    h+=`<div style="margin-top:8px;font-size:12px;color:var(--mut)">同節點同業</div><div class="tw-wrap"><table class="ptbl"><thead><tr><th>公司</th><th>節點</th><th>90日%</th><th>勝率5/20</th><th>提及</th></tr></thead><tbody>`;
    const rows=[...peers.values()].sort((a,b)=>((STATS[b.s.code]||{}).ret_90d_pct??-1e9)-((STATS[a.s.code]||{}).ret_90d_pct??-1e9));
    for(const {s,nodes} of rows){
      const st=STATS[s.code]||{};
      h+=`<tr ${STATS[s.code]?`data-go="#/stock/${encodeURIComponent(s.code)}"`:''}><td>${esc(s.code)} ${esc(s.name||st.name||'')}</td><td>${esc([...new Set(nodes)].join('、'))}</td>
        <td class=${cls(st.ret_90d_pct)}>${fmt(st.ret_90d_pct,'%')}</td><td>${st.win_rate_5d_pct??'—'} / ${st.win_rate_20d_pct??'—'}</td><td>${st.mentions_90d??'—'}</td></tr>`;
    }
    h+=`</tbody></table></div>`;
  }
  el.innerHTML=h;
}

function showDrawer(html,code){
  document.getElementById('drawerBody').innerHTML=html;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('backdrop').classList.add('show');
  document.getElementById('drawer').scrollTop=0;
  fillChainSec(code);
}
function hideDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('backdrop').classList.remove('show')}
function drawerIsOpen(){return document.getElementById('drawer').classList.contains('open');}
// ✕／背景：若目前在 #/stock 路由，交給路由回到原頁
function closeDrawer(){if(typeof Router!=='undefined'&&Router.isDrawerRoute())Router.leaveDrawer();else hideDrawer();}

function openDrawer(code){
  const st=STATS[code]||{};
  const f=FUND[code];
  let html=`<h2>${esc(code)} ${esc(stockName(code))}</h2><div class=sub>點背景或 ✕ 關閉　｜　<a href="#/stock/${encodeURIComponent(code)}" class="permalink">🔗 分享連結</a></div>`;
  html+=`<div class=sec><h4>📈 90日量化統計</h4><div class=grid>`;
  const cells=[['90日報酬',st.ret_90d_pct,'%'],['年化波動',st.vol_ann_pct,'%'],['最大回撤',st.max_dd_pct,'%'],
    ['上漲天數',st.up_days_pct,'%'],['區間位置',st.pos_in_range_pct,'%'],['提及次數',st.mentions_90d,'次']];
  for(const [l,v,u] of cells) html+=`<div class=mini><div class=mv>${v!=null?v+u:'—'}</div><div>${l}</div></div>`;
  if(st.win_rate_5d_pct!=null) html+=`<div class=mini><div class=mv>${st.win_rate_5d_pct}%</div><div>提及後5日勝率</div></div>`;
  if(st.avg_fwd5_pct!=null) html+=`<div class=mini><div class="mv ${st.avg_fwd5_pct>0?'up':'dn'}">${st.avg_fwd5_pct}%</div><div>提及後5日均漲跌</div></div>`;
  if(st.avg_fwd20_pct!=null) html+=`<div class=mini><div class="mv ${st.avg_fwd20_pct>0?'up':'dn'}">${st.avg_fwd20_pct}%</div><div>提及後20日均漲跌</div></div>`;
  html+=`</div></div>`;
  const L=st.levels||{};
  if(L.stop_ladder&&L.stop_ladder.length||L.tp1){
    html+=`<div class=sec><h4>🎯 停利／停損（機械化技術規則）</h4><div class=foot style="text-align:left">${tpLadderLine(L)}</div>${anchorsHtml(L)}`;
    html+=`<div class=foot style="text-align:left;margin-top:4px">以 90 日 K 線機械化計算（前高/量度目標/ATR/斐波/整數關卡），非預測；資料缺失顯示 —</div></div>`;
  }
  html+=chainSecHtml();
  html+=fundHtml(f,'尚未生成此檔基本面檢查（首次排程後自動補齊）');
  html+=timelineHtml(code,25,'🗓 90天提及時間軸');
  html+=flowSecHtml(code);
  showDrawer(html,code);
}
function openPfDrawer(code){
  const r=(PF&&PF.stocks||[]).find(s=>s.code===code); if(!r){openDrawer(code);return;}
  const f=r.fund||FUND[code];
  let html=`<h2>${esc(r.code)} ${esc(r.name)}</h2><div class=sub>持股報告（${esc(PF.report_date)}）｜點背景或 ✕ 關閉　｜　<a href="#/stock/${encodeURIComponent(code)}">看 90 日統計版抽屜</a></div>`;
  const L=r.levels||{};
  html+=`<div class=sec><h4>📐 技術面</h4><div class=grid>`;
  const cells=[['成交',r.last,''],['MA20',r.ma20,''],['MA60',r.ma60,''],['RSI14',r.rsi14,''],['K',r.k,''],['D',r.d,''],
    ['MACD DIF',r.macd_dif,''],['MACD SIG',r.macd_sig,''],['量比',r.volratio,'x'],['PER',r.pe,'x'],['PBR',r.pb,'x'],['殖利率',r.divyield,'%']];
  for(const [l,v,u] of cells) html+=`<div class=mini><div class=mv>${v!=null&&!isNaN(v)?Number(v).toLocaleString()+u:'—'}</div><div>${l}</div></div>`;
  html+=`</div>`;
  if(L.signals&&L.signals.length)html+=`<div style="margin-top:6px">${L.signals.map(x=>`<span class="tag t-ma">${x}</span>`).join(' ')}</div>`;
  html+=`<div class=foot style="text-align:left;margin-top:6px">${tpLadderLine(L)}</div>${anchorsHtml(L)}</div>`;
  html+=chainSecHtml();
  html+=fundHtml(f,'尚未生成此檔基本面檢查');
  html+=timelineHtml(code,15,'🗓 90天分析師提及時間軸');
  if(r.peers)html+=`<div class=sec><h4>🔄 同業比較（資金輪動）</h4><pre style="font-size:11px;white-space:pre-wrap">${esc(r.peers)}</pre></div>`;
  html+=flowSecHtml(code);
  showDrawer(html,code);
}
