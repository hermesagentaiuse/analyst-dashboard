// 主頁：資料載入、分析師/持股分頁、主表篩選排序、報告
'use strict';
let MAN=null, cur=null, sortK='mentions', sortAsc=false, filters=new Set(), themeFilter='';
let STATS={}, FUND={}, MENT=null, CHDATA={}, MARGIN=null, BIZ=null, PF=null, PFDATE=null, FLOW=null;
const CHIP_ORDER=['pf','all','zhangzhen','gd1788','we178','s178','gooaye'];
const LAN_URL='http://edgexpert-dd4f.local:8090/';

async function boot(){
  MAN=await jget('data/manifest.json'); if(!MAN){document.getElementById('updated').textContent='載入失敗';return}
  document.getElementById('updated').innerHTML='最後更新：'+esc(MAN.updated_at?new Date(MAN.updated_at).toLocaleString('zh-TW'):'—')+'　｜　點分析師切換、點欄位排序、點股票列看詳情　｜　'+lanLink('✏️ 管理我的持股','color:#d29922');
  [STATS,FUND,MENT,MARGIN,FLOW,BIZ,PF]=await Promise.all(['stats','fundamentals','mentions','margin_ratio','flow_trends','biz_cycle','portfolio'].map(n=>jget('data/'+n+'.json')));
  STATS=STATS||{}; FUND=FUND||{};
  renderMacro();
  const chips=document.getElementById('chips');
  for(const id of CHIP_ORDER){
    if(id==='pf'&&!PF)continue;  // 管線尚未跑過就不顯示
    if(id!=='all'&&id!=='pf'&&!MAN.channels[id])continue;
    const b=document.createElement('a');b.className='chip';b.dataset.id=id;
    b.textContent=id==='all'?'🔎 90天全域共識':(id==='pf'?`📌 我的持股 (${PF.count})`:MAN.channels[id].name);
    b.href=id==='pf'?'#/portfolio':'#/analyst/'+encodeURIComponent(id);
    chips.appendChild(b);
  }
  const c=document.createElement('a');c.className='chip';c.dataset.id='chain';c.textContent='🧩 產業鏈';c.href='#/chain';chips.appendChild(c);
  Router.start();
  // 背景載入產業鏈資料，用來在主表加 🧩 徽章與題材篩選（不阻塞首屏）
  setTimeout(()=>Concepts.load().then(d=>{if(d){setupThemeFilter();if(cur&&cur!=='chain')renderTable();}}),300);
}
function lanLink(txt,style){
  return `<a href="${LAN_URL}" target=_blank style="${style||''}">${txt}</a><span class="lan-note" title="此連結指向區網位址，只有在家用網路內才能開啟">（僅限區網）</span>`;
}
function defaultTab(){return PF?'pf':'all';}
function highlightChip(id){
  document.querySelectorAll('.chip').forEach(c=>{
    const on=c.dataset.id===id;
    c.classList.toggle('on',on);
    c.style.background=on?(id==='all'?'#8957e5':id==='pf'?'#d29922':id==='chain'?'#0e8a7d':((MAN.channels[id]||{}).color||'#58a6ff')):'';
  });
}
function setView(v){
  document.getElementById('viewMain').hidden=v!=='main';
  document.getElementById('viewChain').hidden=v!=='chain';
}

function pfRow(r){
  return {code:r.code,name:r.name,price:r.last,chg_pct:r.chg_pct,rsi14:r.rsi14,
    ma20:r.ma20,ma60:r.ma60,above_ma20:r.above_ma20,above_ma60:r.above_ma60,
    vol5_vs_vol20:r.volratio,mentions:r.heat?r.heat.mentions_90d:null,
    win5:null,win20:null,ret90:r.ret_90d_pct,mdd:r.max_dd_pct,pos90:r.pos_in_range_pct,
    _pf:r};
}
async function selectPortfolio(){
  cur='pf';
  const d=PFDATE?await jget('data/history/portfolio/'+PFDATE+'.json'):PF;
  if(!d){if(PFDATE){PFDATE=null;return selectPortfolio();}return;}
  window._rows=(d.stocks||[]).map(pfRow);
  renderKpisPf(d); renderTable(window._rows);
  document.getElementById('rpttitle').textContent=`📌 我的持股報告（${d.report_date}　更新：${new Date(d.generated_at).toLocaleString('zh-TW')}）`;
  const rb=document.getElementById('rptbody'); rb.className='rbody'; rb.innerHTML=pfCards(d);
}
function renderKpisPf(d){
  const rows=d.stocks||[];
  const hot=rows.filter(r=>r.heat&&r.heat.mentions_30d>=2).length;
  const bull=rows.filter(r=>r.above_ma20).length;
  const strong=rows.filter(r=>r.rel_strength&&r.rel_strength.diff_90d_pct>=3).length;
  document.getElementById('kpis').innerHTML=[
    ['持有檔數',rows.length],['多頭(MA20上)',bull],['30天被提熱股',hot],
    ['跑贏大盤',strong],['報告日',d.report_date]
  ].map(([l,v])=>`<div class=kpi><div class=v>${v}</div><div class=l>${l}</div></div>`).join('');
}
function ladderHtml(L){
  const lad=L.stop_ladder||[];
  if(!lad.length) return `短線 ${lv(L.stop_short&&L.stop_short.price)}｜中線 ${lv(L.stop_mid&&L.stop_mid.price)}`;
  const first=lad.findIndex(s=>!s.breached);
  return lad.map((s,i)=>{
    if(s.breached) return `<span style="color:var(--mut);text-decoration:line-through">✗${s.tag} ${lv(s.price)}</span>`;
    if(i===first) return `<b style="color:#ff6b6b">▶ ${s.tag} ${lv(s.price)}（${s.dist_pct}%）生效中</b>`;
    return `<span style="color:var(--acc)">→ ${s.tag} ${lv(s.price)}（${s.dist_pct}%）</span>`;
  }).join('　');
}
function pfCards(d){
  if(!(d.stocks||[]).length) return '持股清單是空的 — 到 '+lanLink('持股管理頁')+' 加入代號';
  return d.stocks.map(r=>{
    const L=r.levels||{};
    const sig=(L.signals||[]).map(x=>`<span class="tag t-ma">${x}</span>`).join(' ');
    const heat=r.heat||{};
    const heatLbl=heat.mentions_30d>=3?'🔥 高熱度':heat.mentions_30d>=1?'💬 有討論':'💤 無討論';
    const rs=r.rel_strength;
    let hist='';
    if(PF&&PF.dates&&PF.dates.length>1){
      hist=' 歷史：'+PF.dates.slice(-10).reverse().map(dt=>
        `<a href="#" style="color:var(--acc);text-decoration:none" data-pfdate="${esc(dt)}">${esc(dt.slice(5))}</a>`).join(' | ');
    }
    return `<div style="background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:10px;text-align:left">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
      <b style="font-size:16px">${esc(r.code)} ${esc(r.name)}</b>
      <span>成交 ${lv(r.last)}　<span class="${cls(r.chg_pct)}">${fmt(r.chg_pct,'%')}</span>　${sig}</span></div>
    <table class=chk style="margin-top:8px"><tr>
      <td>🎯 停利</td><td>TP1 ${lv(L.tp1&&L.tp1.price)}（${L.tp1?L.tp1.rule:'—'}）<br>TP2 ${lv(L.tp2&&L.tp2.price)}（${L.tp2?L.tp2.rule:'—'}）</td></tr>
    <tr><td>🛑 停損階梯</td><td>${ladderHtml(L)}<br><span style="color:var(--mut);font-size:11px">${L.stop_mid?L.stop_mid.rule:'—'}${L.stop_next?'；跌破後下一道 '+lv(L.stop_next.price)+'（'+(L.stop_next.rule||'')+'）':''}</span></td></tr>
    <tr><td>🔥 熱度</td><td>${heatLbl}｜30天提及 ${heat.mentions_30d!=null?heat.mentions_30d:'—'} 次｜90天 ${heat.mentions_90d!=null?heat.mentions_90d:'—'} 次
      ${(heat.channels_30d||[]).length?'｜提及者：'+esc(heat.channels_30d.join('、')):''}
      ${(heat.recent||[])[0]?`<br><span style="color:var(--mut);font-size:11px">${esc(heat.recent[0].date)} ${esc(heat.recent[0].channel)}：${esc(heat.recent[0].snippet)}…</span>`:''}</td></tr>
    <tr><td>🔄 輪動</td><td>${rs?`${esc(rs.label)}（90日相對大盤 ${rs.diff_90d_pct>0?'+':''}${rs.diff_90d_pct}%）`:'—'}｜區間位置 ${fmt(r.pos_in_range_pct,'%')}</td></tr>
    </table>
    <div style="margin-top:8px"><a href="#/portfolio/${encodeURIComponent(r.code)}" style="color:var(--acc)">展開 8 項基本面檢查＋技術細節 →</a>　${hist}</div>
    </div>`;
  }).join('');
}

// 主畫面分頁（不改 hash；hash → 這裡 由 router 負責）
async function showMain(id){
  if(id!=='pf'&&id!=='all'&&!(MAN.channels[id]))id=defaultTab();
  if(id==='pf'&&!PF)id='all';
  cur=id; highlightChip(id); setView('main');
  if(id==='pf'){PFDATE=null;await selectPortfolio();return;}
  if(id==='all'){
    await ensureAllChannels();
    renderAll();return;
  }
  if(!CHDATA[id])CHDATA[id]=await jget('data/channels/'+id+'.json');
  const d=CHDATA[id]; if(!d)return;
  window._d=d; window._rows=rowsForChannel(d); renderKpis(d); renderTable(window._rows); loadReport(d);
}

function enrich(code,s,st){
  const k=st||STATS[code]||{};
  return Object.assign({},s||{},{
    code,name:(s&&s.name)||k.name||'',
    price:s?s.price:null,chg_pct:s?s.chg_pct:null,rsi14:s?s.rsi14:null,
    ma20:s?s.ma20:null,ma60:s?s.ma60:null,vol5_vs_vol20:s?s.vol5_vs_vol20:null,
    above_ma20:s?s.above_ma20:null,above_ma60:s?s.above_ma60:null,err:s?s.err:null,
    mentions:k.mentions_90d!=null?k.mentions_90d:(s&&s.mentions_90d)||null,
    channels_mentioning:k.channels_mentioning||null,
    win5:k.win_rate_5d_pct!=null?k.win_rate_5d_pct:null,
    win20:k.win_rate_20d_pct!=null?k.win_rate_20d_pct:null,
    ret90:k.ret_90d_pct!=null?k.ret_90d_pct:(s?s.chg_3mo_pct:null),
    mdd:k.max_dd_pct!=null?k.max_dd_pct:null,
    pos90:k.pos_in_range_pct!=null?k.pos_in_range_pct:(s?s.pos_52wk_pct:null),
  });
}
function rowsForChannel(d){return (d.stocks||[]).map(s=>enrich(s.code,s));}
function rowsForAll(){
  const map={};
  const nm={}; if(MENT&&MENT.events) for(const e of MENT.events) nm[e.code]=e.name;
  for(const [c,k] of Object.entries(STATS)) map[c]=enrich(c,null,k);
  for(const cid of Object.keys(MAN.channels)){
    const d=CHDATA[cid]; if(!d)continue;
    for(const s of (d.stocks||[])) map[s.code]=enrich(s.code,s,STATS[s.code]);
  }
  for(const r of Object.values(map)) if(!r.name&&nm[r.code]) r.name=nm[r.code];
  return Object.values(map).filter(r=>r.err==null||r.mentions);
}
function renderKpis(d){
  const rows=window._rows||[];
  const withStat=rows.filter(r=>r.mentions!=null);
  const nCh=Object.keys(MAN.channels).length;
  const avgWin=withStat.filter(r=>r.win5!=null);
  const aw=avgWin.length?Math.round(avgWin.reduce((a,r)=>a+r.win5,0)/avgWin.length):null;
  const cons=withStat.filter(r=>r.mentions>=3).length;
  document.getElementById('kpis').innerHTML=[
    ['股票池',rows.length],['分析師頻道',nCh],
    ['共識≥3次',cons],['平均5日勝率',aw!=null?aw+'%':'—'],
    ['統計資料檔',Object.keys(STATS).length],['報告日',d&&d.report_date||'90天']
  ].map(([l,v])=>`<div class=kpi><div class=v>${v}</div><div class=l>${l}</div></div>`).join('');
}
function renderAll(){
  window._rows=rowsForAll();
  renderKpis(null); renderTable(window._rows);
  document.getElementById('rpttitle').textContent='🔎 90 天全域共識模式：合併五頻道近期所有提及個股';
  const rb=document.getElementById('rptbody'); rb.className='rbody pre';
  rb.textContent='點任意股票列 → 右側展開 8 項基本面檢查、90 日量化統計、分析師提及時間軸。共识數=90天內被提及次數（跨頻道）；勝率=提及後5/20個交易日上漲機率。';
}
function setupThemeFilter(){
  const sel=document.getElementById('themeSel');
  const th=(Concepts.data&&Concepts.data.themes)||[];
  if(!sel||!th.length)return;
  sel.innerHTML='<option value="">🏷 題材：全部</option>'+th.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  sel.hidden=false;
  sel.onchange=()=>{themeFilter=sel.value;renderTable();};
}
function renderTable(rows){
  rows=rows||window._rows||[];
  const q=document.getElementById('q').value.trim();
  const tset=themeFilter&&Concepts.data?Concepts.themeTwCodes(Concepts.theme(themeFilter)||{nodes:[]}):null;
  let rs=rows.filter(s=>{
    if(q && !(String(s.code).includes(q)||(s.name||'').includes(q))) return false;
    if(filters.has('cons') && !(s.mentions>=3)) return false;
    if(filters.has('ma') && !s.above_ma20) return false;
    if(filters.has('rsih') && !(s.rsi14>70)) return false;
    if(filters.has('rsil') && !(s.rsi14!=null&&s.rsi14<30)) return false;
    if(filters.has('vol') && !(s.vol5_vs_vol20>1.5)) return false;
    if(filters.has('low90') && !(s.pos90!=null&&s.pos90<25)) return false;
    if(tset && !tset.has(String(s.code))) return false;
    return true;
  });
  rs.sort((a,b)=>{
    let va=a[sortK],vb=b[sortK];
    if(va==null)return 1; if(vb==null)return -1;
    if(typeof va==='string')return sortAsc?va.localeCompare(vb):vb.localeCompare(va);
    return sortAsc?va-vb:vb-va;
  });
  const inChain=c=>Concepts.data&&Concepts.byCode[c];
  document.getElementById('tbody').innerHTML=rs.map(s=>{
    if(s.err&&!s.mentions) return `<tr><td>${esc(s.code)}</td><td colspan=11 class=err>資料無法取得：${esc(s.err)}</td></tr>`;
    let tags='';
    if(s.mentions>=3)tags+=`<span class="tag t-cons">共識×${s.mentions}</span>`;
    if(s.rsi14>70)tags+='<span class="tag t-hot">過熱</span>';
    if(s.rsi14!=null&&s.rsi14<30)tags+='<span class="tag t-cold">超賣</span>';
    if(s.above_ma20)tags+='<span class="tag t-ma">多頭</span>';else if(s.above_ma20===false)tags+='<span class="tag t-below">空頭</span>';
    if(s.vol5_vs_vol20>1.5)tags+='<span class="tag t-vol">爆量</span>';
    const ch=inChain(s.code);
    if(ch)tags+=`<span class="tag t-chain" title="產業鏈：${esc([...new Set(ch.map(e=>(Concepts.product(e.product)||{}).name||e.product))].join('、'))}">🧩</span>`;
    return `<tr data-code="${esc(s.code)}"><td>${esc(s.code)}</td><td style="text-align:left">${esc(s.name||'')}</td><td>${fmt(s.price)}</td>
    <td class=${cls(s.chg_pct)}>${fmt(s.chg_pct,'%')}</td>
    <td>${s.mentions!=null?s.mentions:'—'}</td>
    <td class=${s.win5!=null?(s.win5>=50?'up':'dn'):'neu'}>${s.win5!=null?s.win5+'%':'—'}</td>
    <td class=${s.win20!=null?(s.win20>=50?'up':'dn'):'neu'}>${s.win20!=null?s.win20+'%':'—'}</td>
    <td class=${cls(s.ret90)}>${fmt(s.ret90,'%')}</td><td class=${cls(s.mdd)}>${fmt(s.mdd,'%')}</td>
    <td>${fmt(s.rsi14)}</td><td>${fmt(s.vol5_vs_vol20,'x')}</td><td style="text-align:left">${tags}</td></tr>`;
  }).join('');
}

async function loadReport(d){
  document.getElementById('rpttitle').textContent=`📄 ${d.name} 報告（${d.report_date||''}）：${d.report_title||''}`;
  const rb=document.getElementById('rptbody'); rb.className='rbody md';
  try{
    const r=await fetch(`data/reports/${encodeURIComponent(d.id)}.md?ts=`+Date.now());
    if(!r.ok)throw new Error(r.status);
    const txt=await r.text();
    if(cur===d.id)rb.innerHTML=mdRender(txt);
  }catch(e){rb.textContent='（報告載入失敗）';}
}

// —— 事件綁定 ——
document.getElementById('q').addEventListener('input',()=>renderTable());
document.querySelectorAll('.fbtn').forEach(b=>b.onclick=()=>{
  const f=b.dataset.f; filters.has(f)?filters.delete(f):filters.add(f);
  b.classList.toggle('on');
  if(cur==='all')renderTable(rowsForAll());else renderTable(window._rows);});
document.querySelectorAll('th[data-k]').forEach(th=>th.onclick=()=>{
  const k=th.dataset.k; if(!k)return;
  if(sortK===k)sortAsc=!sortAsc;else{sortK=k;sortAsc=false;}
  if(cur==='all')renderTable(rowsForAll());else renderTable(window._rows);});
document.getElementById('tbody').addEventListener('click',e=>{
  const tr=e.target.closest('tr[data-code]'); if(tr)location.hash='#/stock/'+encodeURIComponent(tr.dataset.code);
});
document.getElementById('rptbody').addEventListener('click',e=>{
  const a=e.target.closest('a[data-pfdate]'); if(!a)return;
  e.preventDefault(); PFDATE=a.dataset.pfdate; selectPortfolio();
});
// 任何 data-go 的列（產業鏈供應商表、同業表）→ 導向
document.addEventListener('click',e=>{
  if(e.target.closest('a'))return;
  const g=e.target.closest('[data-go]'); if(g)location.hash=g.dataset.go;
});
document.getElementById('backdrop').onclick=closeDrawer;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawerIsOpen())closeDrawer();});
