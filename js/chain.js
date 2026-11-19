// 🧩 產業鏈頁：產品列表、產品樹＋節點面板、上中下游泳道、題材頁
'use strict';
function chainHref(pid,code){return '#/chain/'+encodeURIComponent(pid)+(code?'/'+encodeURIComponent(code):'');}
const LANES=[['equipment','設備'],['material','材料'],['component','元件'],['module','模組'],['assembly','組裝'],['brand','品牌/設計']];
const VIEWS=['3d','tree','lanes'];
const isMobileW=()=>window.innerWidth<700;
const ChainUI={
  // 檢視：桌機預設 🧊 3D、手機預設 🌳 樹狀；使用者切換後依「桌機/手機」分別記住
  view:null, metric:'ret90', theme:null, onlyTheme:false, expanded:new Set(), pid:null, views:{},
  load(){try{const s=JSON.parse(localStorage.getItem('chainUI')||'{}');if(METRICS[s.metric])this.metric=s.metric;
    if(s.views&&typeof s.views==='object')this.views=s.views;}catch(e){}
    const v=this.views[isMobileW()?'m':'d'];this.view=VIEWS.includes(v)?v:(isMobileW()?'tree':'3d');},
  save(){this.views[isMobileW()?'m':'d']=this.view;try{localStorage.setItem('chainUI',JSON.stringify({metric:this.metric,views:this.views}));}catch(e){}},
};
ChainUI.load();

function chainEl(){return document.getElementById('viewChain');}
function stageBadge(s){return `<span class="sb sb-${esc(s||'x')}">${esc(Concepts.stageName(s))}</span>`;}
function tagBadges(tags){return (tags||[]).map(t=>`<span class="tb tb-${esc(t)}">${esc(Concepts.tagName(t))}</span>`).join('');}
function swatch(node){
  const codes=Concepts.subtreeTwCodes(node);
  const r=metricValue(ChainUI.metric,codes);
  return `<span class="sw" style="background:${metricColor(ChainUI.metric,r.v)}" title="${esc(METRICS[ChainUI.metric].label)}：${esc(metricText(ChainUI.metric,r.v))}（覆蓋 ${r.n}/${r.m}）">${esc(metricText(ChainUI.metric,r.v))}<small>${r.n}/${r.m}</small></span>`;
}
function srcNote(){
  return Concepts.src&&Concepts.src.includes('sample')?`<div class="note">⚠️ 目前顯示的是<b>樣本資料</b>（data/concepts.sample.json），僅供版面測試；正式 concepts.json 產生後會自動改用。</div>`:'';
}
function emptyState(msg){
  const why=msg?`<a href="#/chain">← 回產業鏈列表</a>`:`<div class=neu style="margin-top:6px">找不到 data/concepts.json（也沒有樣本檔），或檔案格式無法解析。其他分頁不受影響。</div><a href="#/">← 回首頁</a>`;
  return `<div class="empty"><div style="font-size:32px">🧩</div><div>${msg||'產業鏈資料尚未提供'}</div>${why}</div>`;
}

async function renderChainRoute(r){
  const el=chainEl();
  if(!Concepts.data&&!Concepts.failed)el.innerHTML=`<div class="neu" style="padding:20px">載入產業鏈資料…</div>`;
  await Promise.all([Concepts.load(),ensureAllChannels()]);
  if(!Concepts.data){chainLeave();el.innerHTML=emptyState();return;}
  if(r.type!=='product')chainLeave();
  if(r.type==='chain')renderChainList();
  else if(r.type==='product')renderProduct(r.pid,r.node);
  else if(r.type==='theme')renderTheme(r.tid);
}

// —— 產品列表 ——
function renderChainList(){
  const D=Concepts.data;
  let h=`<div class="crumb"><b>🧩 產業鏈</b></div>${srcNote()}`;
  if(D.generated_at)h+=`<div class="sub">資料產生：${esc(D.generated_at)}　｜　卡片數字：節點數・台股公司數・近 90 日成分股報酬中位數・分析師 90 日提及總數</div>`;
  h+=`<div class="pcards">`;
  for(const p of D.products){
    if(!p.root)continue;
    const codes=Concepts.subtreeTwCodes(p.root);
    const ret=metricValue('ret90',codes), men=metricValue('ment',codes);
    h+=`<a class="pcard" href="${chainHref(p.id)}"><div class="pc-t">${esc(p.name)}${p.name_en?` <span class=neu>${esc(p.name_en)}</span>`:''}</div>
      <div class="pc-d">${esc(p.desc||'')}</div>
      <div class="pc-s"><span><b>${Concepts.countNodes(p.root)}</b> 節點</span><span><b>${codes.length}</b> 台股</span>
      <span>90日中位 <b class="${twc(ret.v)}">${metricText('ret90',ret.v)}</b></span><span>提及 <b>${men.v!=null?Math.round(men.v):'—'}</b></span></div></a>`;
  }
  h+=`</div>`;
  if(D.themes.length){
    h+=`<h3 class="h3">🏷 題材</h3><div class="tchips">`+D.themes.map(t=>`<a class="tchip" href="#/theme/${encodeURIComponent(t.id)}" title="${esc(t.desc||'')}">${esc(t.name)}</a>`).join('')+`</div>`;
  }
  chainEl().innerHTML=h;
}

// —— 產品頁 ——
function renderProduct(pid,nodeCode){
  const p=Concepts.product(pid);
  if(!p||!p.root){chainLeave();chainEl().innerHTML=emptyState('找不到產品：'+esc(pid));return;}
  if(ChainUI.pid!==pid){ChainUI.pid=pid;ChainUI.theme=null;ChainUI.onlyTheme=false;ChainUI.expanded=new Set([pid+'|'+p.root.code]);
    for(const c of p.root.children)ChainUI.expanded.add(pid+'|'+c.code);
    V3.focus=null;V3.exploded=false;V3.nextStart=null;}
  const selKey=pid+'|'+(nodeCode||p.root.code);
  const info=Concepts.nodes.get(selKey)||Concepts.nodes.get(pid+'|'+p.root.code);
  info.path.forEach(n=>ChainUI.expanded.add(pid+'|'+n.code)); // 展開到選取節點
  let view=ChainUI.view, note='';
  if(view==='3d'&&!v3Available()){view='tree';note=`<div class="note">⚠️ ${esc(V3.why||'此瀏覽器無法使用 WebGL')}，已自動改用 🌳 樹狀檢視（其他功能不受影響）。</div>`;}
  const crumbs=[`<a href="#/chain">🧩 產業鏈</a>`].concat(info.path.map((n,i)=>i===info.path.length-1?`<b>${esc(n.name)}</b>`:`<a href="${chainHref(pid,i?n.code:null)}">${esc(n.name)}</a>`)).join(' › ');
  const themes=Concepts.data.themes.filter(t=>Concepts.flatten(p).some(n=>Concepts.themeMatch(t,Concepts.nodes.get(pid+'|'+n.code))));
  const VL={'3d':'🧊 3D','tree':'🌳 樹狀','lanes':'🏊 上中下游'};
  let h=`<div class="crumb">${crumbs}</div>${srcNote()}${note}<div class="ctools">
    <div class="seg">${VIEWS.map(v=>`<button data-view="${v}" class="${view===v?'on':''}" ${v==='3d'&&!v3Available()?'disabled title="此裝置不支援 WebGL"':''}>${VL[v]}</button>`).join('')}</div>
    <label class="msel">上色指標 <select id="metricSel">${Object.entries(METRICS).map(([k,m])=>`<option value="${k}" ${k===ChainUI.metric?'selected':''}>${esc(m.label)}</option>`).join('')}</select></label>
    <span class="legend"><i style="background:rgba(63,185,80,.85)"></i>低/跌 <i style="background:rgba(139,148,158,.35)"></i> <i style="background:rgba(248,81,73,.85)"></i>高/漲　<small class=neu>數字為中位數（提及數為加總），n/m＝有資料/台股供應商數</small></span>
  </div>`;
  if(themes.length){
    h+=`<div class="tchips"><span class=neu style="font-size:12px">題材：</span>`+themes.map(t=>`<button class="tchip ${ChainUI.theme===t.id?'on':''}" data-theme="${esc(t.id)}" title="${esc(t.desc||'')}">${esc(t.name)}</button>`).join('')
      +(ChainUI.theme?`<label class="only"><input type="checkbox" id="onlyTheme" ${ChainUI.onlyTheme?'checked':''}> 只顯示題材節點</label> <a href="#/theme/${encodeURIComponent(ChainUI.theme)}" style="font-size:12px">題材頁 →</a>`:'')+`</div>`;
  }
  let keep=null;
  if(view==='3d'){
    const F=v3Focus(p,info);
    h+=`<div class="clay3"><div class="v3wrap">${v3BarHtml(p,F,info)}<div id="v3slot" class="v3stage"><div class="v3msg">載入 3D 引擎…</div></div>
      <div class="v3hint">拖曳旋轉・滾輪／雙指縮放・右鍵拖曳平移｜點模組＝看說明，再點一次或按「進入」往下拆一層</div></div>
      <div class="cpanel" id="cpanel">${panelHtml(info)}</div></div>`;
    if(V3.inst&&V3.stage){keep=V3.stage;keep.remove();} // 保留 WebGL 畫布，換頁面其餘部分
  }else{
    chainLeave();
    if(view==='tree') h+=`<div class="clay"><div class="ctree" id="ctree">${treeHtml(p)}</div><div class="cpanel" id="cpanel">${panelHtml(info)}</div></div>`;
    else h+=`<div id="clanes">${lanesHtml(p,selKey)}</div><div class="cpanel" id="cpanel" style="margin-top:12px">${panelHtml(info)}</div>`;
  }
  const el=chainEl();
  el.innerHTML=h;
  if(view==='3d'){v3BindBar(p,info);v3Mount(p,info,keep);}
  // 事件
  el.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{ChainUI.view=b.dataset.view;ChainUI.save();renderProduct(pid,nodeCode);});
  const ms=el.querySelector('#metricSel'); if(ms)ms.onchange=()=>{ChainUI.metric=ms.value;ChainUI.save();renderProduct(pid,nodeCode);};
  el.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{ChainUI.theme=ChainUI.theme===b.dataset.theme?null:b.dataset.theme;if(!ChainUI.theme)ChainUI.onlyTheme=false;renderProduct(pid,nodeCode);});
  const ot=el.querySelector('#onlyTheme'); if(ot)ot.onchange=()=>{ChainUI.onlyTheme=ot.checked;renderProduct(pid,nodeCode);};
  const tr=el.querySelector('#ctree');
  if(tr)tr.onclick=e=>{
    const t=e.target.closest('[data-toggle]'); if(!t)return;
    e.preventDefault();const k=t.dataset.toggle;
    ChainUI.expanded.has(k)?ChainUI.expanded.delete(k):ChainUI.expanded.add(k);
    tr.innerHTML=treeHtml(p);
  };
  // 手機：點了節點後把面板捲到可見處
  if(nodeCode&&window.innerWidth<900&&view!=='3d'){const pn=el.querySelector('#cpanel');if(pn)pn.scrollIntoView({block:'start'});}
}
function treeHtml(p){
  const pid=p.id, sel=decodeURIComponent((location.hash.split('/')[3])||'')||p.root.code;
  const theme=ChainUI.theme?Concepts.theme(ChainUI.theme):null;
  const visible=info=>{ // 只顯示模式：本身屬題材，或有子孫屬題材
    if(!theme||!ChainUI.onlyTheme)return true;
    if(Concepts.themeMatch(theme,info))return true;
    const has=n=>(n.children||[]).some(c=>Concepts.themeMatch(theme,Concepts.nodes.get(pid+'|'+c.code))||has(c));
    return has(info.node);
  };
  const row=(n)=>{
    const key=pid+'|'+n.code, info=Concepts.nodes.get(key);
    if(!info||!visible(info))return '';
    const kids=n.children.length, open=ChainUI.expanded.has(key);
    const hit=theme&&Concepts.themeMatch(theme,info);
    const nTw=Concepts.subtreeTwCodes(n).length;
    let h=`<div class="tn ${n.code===sel?'sel':''} ${theme?(hit?'hit':'dim'):''}" style="padding-left:${(info.depth-1)*14+4}px">
      ${kids?`<button class="tg" data-toggle="${esc(key)}" aria-label="${open?'收合':'展開'}">${open?'▾':'▸'}</button>`:'<span class="tg tg0">·</span>'}
      <a class="tn-a" href="${chainHref(pid,info.depth===1?null:n.code)}"><span class="tn-n">${esc(n.name)}</span>${n.qty_label?`<span class="qty">${esc(n.qty_label)}</span>`:''}
      ${stageBadge(n.stage)}${tagBadges(n.tags)}<span class="tn-c">${nTw}家</span></a>${swatch(n)}</div>`;
    if(kids&&open)h+=n.children.map(row).join('');
    return h;
  };
  return row(p.root);
}
function supplierTable(n){
  const sups=n.suppliers||[];
  if(!sups.length)return `<div class=neu style="font-size:12px">此節點未直接列供應商${n.children.length?'（見子節點）':''}</div>`;
  const pfSet=new Set(((PF&&PF.stocks)||[]).map(s=>s.code));
  let h=`<div class="tw-wrap"><table class="stbl"><thead><tr><th>公司</th><th>角色</th><th>可信度</th><th>價格/漲跌</th><th>90日%</th><th>提及（分析師）</th><th>勝率5/20</th></tr></thead><tbody>`;
  const sorted=[...sups].sort((a,b)=>(b.primary?1:0)-(a.primary?1:0));
  for(const s of sorted){
    const conf=s.confidence==='inferred'?'<span class="cb cb-inf">推測</span>':(s.confidence==='reported'?(s.source&&safeUrl(s.source.url)?`<a class="cb cb-rep" href="${esc(safeUrl(s.source.url))}" target=_blank rel="noopener noreferrer" title="${esc((s.source.title||'')+' '+(s.source.date||''))}">報導↗</a>`:'<span class="cb cb-rep">報導</span>'):'—');
    const nameCell=`${s.primary?'<b>':''}${esc(s.name||'')}${s.primary?'</b>':''}`;
    if(!isTw(s)){
      h+=`<tr class="ext"><td>${nameCell} <span class="lb">${esc(s.listed||s.market||'')}</span>${s.code?` <span class=neu>${esc(s.code)}</span>`:''}</td><td class="role">${esc(s.role||'')}</td><td>${conf}</td><td colspan=4 class=neu>非台股，不提供量化數據</td></tr>${partnersHtml(s)}`;
      continue;
    }
    const st=STATS[s.code], q=QUOTE[s.code]||{}, mb=mentionsBy(String(s.code));
    const price=q.price!=null?q.price:(st&&st.last);
    const who=mb?Object.entries(mb.ch).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${esc(k)}×${v}`).join('、'):'';
    h+=`<tr ${st?`class="go" data-go="#/stock/${encodeURIComponent(s.code)}"`:''}>
      <td>${nameCell} <span class=neu>${esc(s.code)}</span> <span class="lb">${esc(s.listed||'')}</span>${pfSet.has(String(s.code))?' <span class="pfm">📌持股</span>':''}</td>
      <td class="role">${esc(s.role||'')}</td><td>${conf}</td>
      <td>${lv(price)} <span class="${twc(q.chg_pct)}">${q.chg_pct!=null?fmt(q.chg_pct,'%'):''}</span></td>
      <td class="${twc(st&&st.ret_90d_pct)}">${fmt(st&&st.ret_90d_pct,'%')}</td>
      <td class="who">${st&&st.mentions_90d!=null?st.mentions_90d:(mb?mb.count:'—')}${who?`<div class=neu>${who}</div>`:''}</td>
      <td>${st&&st.win_rate_5d_pct!=null?st.win_rate_5d_pct+'%':'—'} / ${st&&st.win_rate_20d_pct!=null?st.win_rate_20d_pct+'%':'—'}</td></tr>${partnersHtml(s)}`;
  }
  return h+`</tbody></table></div><div class="foot" style="text-align:left">價格/漲跌與 RSI 取自頻道/持股快照（無則顯示 stats 收盤價、漲跌留空）；可點列開啟個股抽屜。顏色採台股紅漲綠跌。</div>`;
}
function panelHtml(info){
  const n=info.node, pid=info.product.id;
  const codes=Concepts.subtreeTwCodes(n);
  const themes=Concepts.data.themes.filter(t=>Concepts.themeMatch(t,info));
  let h=`<div class="np-h">第 ${info.depth} 層・${esc(Concepts.stageName(n.stage))}${n.qty_label?`・用量 ${esc(n.qty_label)}`:''}</div>
    <h3 class="np-t">${esc(n.name)}${n.name_en?` <span class=neu style="font-size:12px;font-weight:400">${esc(n.name_en)}</span>`:''}</h3>
    <div>${stageBadge(n.stage)}${tagBadges(n.tags)}</div>
    ${n.desc?`<p class="np-d">${esc(n.desc)}</p>`:''}
    <div class="np-m">`;
  for(const mk of Object.keys(METRICS)){
    const r=metricValue(mk,codes);
    h+=`<span class="np-mi"><i style="background:${metricColor(mk,r.v)}"></i>${esc(METRICS[mk].label)}：<b>${esc(metricText(mk,r.v))}</b> <small class=neu>${r.n}/${r.m}</small></span>`;
  }
  h+=`</div>`;
  if(themes.length)h+=`<div class="tchips" style="margin:6px 0">`+themes.map(t=>`<a class="tchip" href="#/theme/${encodeURIComponent(t.id)}">🏷 ${esc(t.name)}</a>`).join('')+`</div>`;
  h+=upstreamHtml(info)+downstreamHtml(info);
  h+=`<h4 class="np-s">🏭 誰製造（${(n.suppliers||[]).length}）</h4>${supplierTable(n)}`;
  return h;
}
// —— 面板：上游（由什麼構成）／下游（被用在哪）／合作關係 ——
function repSuppliers(n,k=3){const sp=n.suppliers||[];const prim=sp.filter(s=>s.primary);return (prim.length?prim:sp).slice(0,k);}
function supLink(s){return isTw(s)?`<a href="#/stock/${encodeURIComponent(s.code)}">${esc(s.name||s.code)} <span class=neu>${esc(s.code)}</span></a>`:`${esc(s.name||'')}${s.listed||s.market?` <span class=neu>${esc(s.listed||s.market)}</span>`:''}`;}
function upstreamHtml(info){
  const n=info.node, pid=info.product.id;
  let h=`<h4 class="np-s">⬆ 上游：由什麼構成（${n.children.length}）</h4>`;
  if(!n.children.length)return h+`<div class=neu style="font-size:12px">已是最上游（原料／設備／單一元件），資料未再往下拆分。</div>`;
  return h+`<div class="kids">`+n.children.map(c=>{
    const reps=repSuppliers(c);
    return `<div class="kid"><a class="kid-a" href="${chainHref(pid,c.code)}"><span class="kid-n">${esc(c.name)}${c.qty_label?` <span class="qty">${esc(c.qty_label)}</span>`:''}</span>${stageBadge(c.stage)}${tagBadges(c.tags)}<span class="tn-c">${Concepts.subtreeTwCodes(c).length}家・${c.children.length}子</span></a>${swatch(c)}
      <div class="kid-p">${reps.length?'代表：'+reps.map(supLink).join('、'):`<span class=neu>代表廠商：—${c.children.length?'（見其子節點）':''}</span>`}</div></div>`;
  }).join('')+`</div>`;
}
function downstreamHtml(info){
  const n=info.node, p=info.product;
  let h=`<h4 class="np-s">⬇ 下游：被用在哪</h4>`;
  const up=info.path.slice(0,-1).reverse();
  if(!up.length)h+=`<div class=neu style="font-size:12px">這是終端產品本身（最下游）。</div>`;
  else h+=`<div class="dchain"><b>${esc(n.name)}</b>${up.map((a,i)=>` <span class="arr">→ ${i===0?'裝進':'組成'}</span> <a href="${chainHref(p.id,a===p.root?null:a.code)}">${esc(a.name)}</a>`).join('')}</div>`;
  const keys=new Set([...(Concepts.codeIdx.get(n.code)||[]),...Concepts.sameNameKeys(n.name)]);
  const others=[...keys].map(k=>Concepts.nodes.get(k)).filter(x=>x&&x.product.id!==p.id);
  if(others.length){
    h+=`<div class=neu style="font-size:12px;margin:8px 0 2px">其他產品也有同名節點：</div>`+others.map(o=>{
      const path=[`<a href="${chainHref(o.product.id)}">${esc(o.product.name)}</a>`].concat(o.path.slice(1).map(x=>`<a href="${chainHref(o.product.id,x.code)}">${esc(x.name)}</a>`)).join(' › ');
      return `<div class="cpos-row">${path}</div>`;
    }).join('');
  }
  return h;
}
const REL_NAME={customer:'客戶',supplier:'供應商',partner:'合作夥伴'};
function partnersHtml(s){
  const ps=(Array.isArray(s.partners)?s.partners:[]).filter(x=>x&&x.name);
  if(!ps.length)return '';
  const g={};for(const x of ps)(g[x.relation||'']=g[x.relation||'']||[]).push(x);
  const order=['customer','supplier','partner'].concat(Object.keys(g).filter(k=>!REL_NAME[k]));
  const txt=order.filter(k=>g[k]).map(k=>`${esc(REL_NAME[k]||k||'關係')}：`+g[k].map(x=>{
    const code=x.code&&isTwCode(x.code)?` <a href="#/stock/${encodeURIComponent(x.code)}">${esc(x.code)}</a>`:(x.code?` <span class=neu>${esc(x.code)}</span>`:'');
    return `<span${x.note?` title="${esc(x.note)}"`:''}>${esc(x.name)}${code}</span>`;
  }).join('、')).join('／');
  return `<tr class="prt"><td colspan=7>${txt}</td></tr>`;
}
function lanesHtml(p,selKey){
  const lanes=LANES.map(([k,l])=>({k,l,items:[]}));const other={k:'x',l:'其他',items:[]};
  const theme=ChainUI.theme?Concepts.theme(ChainUI.theme):null;
  for(const n of Concepts.flatten(p)){
    const info=Concepts.nodes.get(p.id+'|'+n.code);
    if(info.depth===1)continue; // 根節點＝產品本身
    if(theme&&ChainUI.onlyTheme&&!Concepts.themeMatch(theme,info))continue;
    const st=n.stage==='design'?'brand':n.stage;
    (lanes.find(x=>x.k===st)||other).items.push(info);
  }
  if(other.items.length)lanes.push(other);
  let h=`<div class="lanes">`;
  for(const ln of lanes){
    h+=`<div class="lane"><div class="lane-h">${esc(ln.l)} <span class=neu>${ln.items.length}</span></div>`;
    if(!ln.items.length)h+=`<div class="neu" style="font-size:11px;padding:6px">—</div>`;
    for(const info of ln.items){
      const n=info.node;
      const prim=(n.suppliers||[]).filter(s=>s.primary);
      const reps=(prim.length?prim:(n.suppliers||[])).slice(0,3);
      const hit=theme&&Concepts.themeMatch(theme,info);
      h+=`<a class="lcard ${info.key===selKey?'sel':''} ${theme?(hit?'hit':'dim'):''}" href="${chainHref(p.id,n.code)}">
        <div class="lc-t">${esc(n.name)}${n.qty_label?` <span class="qty">${esc(n.qty_label)}</span>`:''}${swatch(n)}</div>
        <div class="lc-p neu">${esc(info.parent?info.parent.name:'')}${tagBadges(n.tags)}</div>
        <div class="lc-s">${reps.map(s=>esc(s.name)+(isTw(s)?` <span class=neu>${esc(s.code)}</span>`:'')).join('、')||'<span class=neu>—</span>'}</div></a>`;
    }
    h+=`</div>`;
  }
  return h+`</div>`;
}

// —— 題材頁 ——
function renderTheme(tid){
  const t=Concepts.theme(tid);
  if(!t){chainEl().innerHTML=emptyState('找不到題材：'+esc(tid));return;}
  const keys=(t.nodes||[]).flatMap(c=>Concepts.codeIdx.get(c)||[]);
  const codes=[...Concepts.themeTwCodes(t)];
  const ret=metricValue('ret90',codes), win=metricValue('win20',codes), men=metricValue('ment',codes);
  let h=`<div class="crumb"><a href="#/chain">🧩 產業鏈</a> › 題材 › <b>${esc(t.name)}</b></div>${srcNote()}
    <p class="np-d">${esc(t.desc||'')}</p>
    <div class="pc-s" style="margin-bottom:10px"><span><b>${keys.length}</b> 節點</span><span><b>${codes.length}</b> 台股（含子節點）</span>
    <span>90日中位 <b class="${twc(ret.v)}">${metricText('ret90',ret.v)}</b> <small class=neu>${ret.n}/${ret.m}</small></span>
    <span>20日勝率中位 <b>${metricText('win20',win.v)}</b></span><span>提及 <b>${men.v!=null?Math.round(men.v):'—'}</b></span></div>`;
  if(!keys.length)h+=`<div class=neu>此題材的節點在產品樹中找不到對應</div>`;
  for(const k of keys){
    const info=Concepts.nodes.get(k); if(!info)continue;
    const path=[`<a href="${chainHref(info.product.id)}">${esc(info.product.name)}</a>`].concat(info.path.slice(1).map(n=>`<a href="${chainHref(info.product.id,n.code)}">${esc(n.name)}</a>`)).join(' › ');
    h+=`<div class="tnode"><div class="crumb" style="margin:0 0 4px">${path} ${stageBadge(info.node.stage)}${tagBadges(info.node.tags)} ${swatch(info.node)}</div>`;
    h+=supplierTable(info.node);
    if(info.node.children.length)h+=`<div class=neu style="font-size:12px;margin-top:4px">子節點：${info.node.children.map(c=>`<a href="${chainHref(info.product.id,c.code)}">${esc(c.name)}</a>`).join('、')}</div>`;
    h+=`</div>`;
  }
  chainEl().innerHTML=h;
}

// —— 🧊 3D 拆解圖（viewer3d.js 以 ES module 延遲載入；WebGL 不可用時退回樹狀）——
const V3_VER='20261119a'; // 改 viewer3d.js 時更新，避開瀏覽器模組快取
const V3={inst:null,stage:null,modP:null,tok:0,pid:null,focus:null,exploded:false,nextStart:null,gl:null,failed:false,why:''};
function webglOK(){
  if(V3.gl!=null)return V3.gl;
  try{const c=document.createElement('canvas');const g=c.getContext('webgl2')||c.getContext('webgl');V3.gl=!!g;
    if(g){const ext=g.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();}}catch(e){V3.gl=false;}
  if(!V3.gl)V3.why='此瀏覽器無法使用 WebGL';
  return V3.gl;
}
function v3Available(){return !V3.failed&&webglOK();}
function v3Load(){
  if(!V3.modP){
    V3.modP=import(new URL('js/viewer3d.js?v='+V3_VER,document.baseURI).href).then(async m=>{await m.loadConfig();return m;});
    V3.modP.catch(()=>{V3.modP=null;});
  }
  return V3.modP;
}
// 離開產品 3D 頁（切換檢視、產業鏈列表、題材頁、主頁）時釋放 WebGL 資源
function chainLeave(){
  V3.tok++;
  if(V3.inst){try{V3.inst.dispose();}catch(e){console.warn(e);}}
  V3.inst=null;V3.stage=null;V3.focus=null;V3.pid=null;V3.exploded=false;V3.nextStart=null;window.__v3d=null;
}
// 焦點（目前拆開的那一層）：選取節點是焦點本身或其子節點→維持；否則有子節點→進入它，沒有→看它的父層
function v3Focus(p,S){
  let F=V3.pid===p.id&&V3.focus?Concepts.nodes.get(p.id+'|'+V3.focus):null;
  if(!F||!(S.node===F.node||S.parent===F.node))F=S.node.children.length?S:(S.parent?Concepts.nodes.get(p.id+'|'+S.parent.code):S);
  V3.pid=p.id;V3.focus=F.node.code;
  return F;
}
function v3Go(p,code){
  const href=chainHref(p.id,code&&code!==p.root.code?code:null);
  if(location.hash===href)renderProduct(p.id,code&&code!==p.root.code?code:null);else location.hash=href;
}
function v3BarHtml(p,F,S){
  const crumbs=F.path.map((n,i)=>i===F.path.length-1?`<b>${esc(n.name)}</b>`:`<a href="#" data-v3focus="${esc(n.code)}">${esc(n.name)}</a>`).join(' › ');
  const canEnter=S.node!==F.node&&S.node.children.length>0;
  return `<div class="v3bar"><div class="v3crumb">🧊 ${crumbs} <span class=neu>・${F.node.children.length||1} 塊</span></div><div class="v3btns">
    <button id="v3up" ${F.depth>1?'':'disabled'} title="回上一層">⬅ 上一層</button>
    <button id="v3ex" class="${V3.exploded?'on':''}">${V3.exploded?'🧲 組合':'💥 拆解'}</button>
    <button id="v3in" ${canEnter?'':'disabled'} title="${canEnter?'拆開「'+esc(S.node.name)+'」':'先點選一個可再拆的模組'}">⤵ 進入${canEnter?'「'+esc(S.node.name)+'」':''}</button>
    <button id="v3fit" title="重設視角">⟲</button></div></div>`;
}
function v3Enter(p,code){V3.focus=code;V3.exploded=true;V3.nextStart=0;v3Go(p,code);}
function v3BindBar(p,S){
  const el=chainEl(), F=Concepts.nodes.get(p.id+'|'+V3.focus);
  el.querySelectorAll('[data-v3focus]').forEach(a=>a.onclick=e=>{e.preventDefault();V3.focus=a.dataset.v3focus;V3.exploded=true;V3.nextStart=1;v3Go(p,a.dataset.v3focus);});
  const up=el.querySelector('#v3up'); if(up)up.onclick=()=>{if(!F||!F.parent)return;V3.focus=F.parent.code;V3.exploded=true;V3.nextStart=1;v3Go(p,F.node.code);};
  const ex=el.querySelector('#v3ex'); if(ex)ex.onclick=()=>{V3.exploded=!V3.exploded;ex.classList.toggle('on',V3.exploded);ex.textContent=V3.exploded?'🧲 組合':'💥 拆解';if(V3.inst)V3.inst.setExploded(V3.exploded);};
  const inb=el.querySelector('#v3in'); if(inb)inb.onclick=()=>{if(S.node.children.length)v3Enter(p,S.node.code);};
  const fit=el.querySelector('#v3fit'); if(fit)fit.onclick=()=>{if(V3.inst)V3.inst.fit();};
}
function v3Pick(code){
  const p=Concepts.product(V3.pid); if(!p)return;
  const sel=decodeURIComponent((location.hash.split('/')[3])||'')||p.root.code;
  const info=Concepts.nodes.get(p.id+'|'+code); if(!info)return;
  if(code===sel&&code!==V3.focus&&info.node.children.length)v3Enter(p,code); // 再點一次＝進入
  else v3Go(p,code);
}
function v3LabelHtml(n){
  const r=metricValue(ChainUI.metric,Concepts.subtreeTwCodes(n));
  return `<div class="v3n">${esc(n.name)}${n.qty_label?` <span class="qty">${esc(n.qty_label)}</span>`:''}</div>
    <div class="v3m"><i style="background:${metricColor(ChainUI.metric,r.v)}"></i>${esc(metricText(ChainUI.metric,r.v))} <small>${r.n}/${r.m}</small></div>
    ${n.children.length?`<div class="v3k">可再拆 ${n.children.length} 項 ⤵</div>`:''}`;
}
async function v3Mount(p,S,keep){
  const tok=++V3.tok;
  const slot=chainEl().querySelector('#v3slot'); if(!slot)return;
  if(keep)slot.replaceWith(keep);
  let mod;
  try{mod=await v3Load();}
  catch(e){console.warn('3D 引擎載入失敗',e);V3.failed=true;V3.why='3D 引擎載入失敗';if(tok===V3.tok)renderProduct(p.id,S.depth>1?S.node.code:null);return;}
  if(tok!==V3.tok)return;
  if(!V3.inst){
    const stage=chainEl().querySelector('.v3stage'); if(!stage)return;
    stage.innerHTML='';
    try{V3.inst=new mod.Viewer(stage,{onPick:v3Pick});}
    catch(e){console.warn('WebGL 初始化失敗',e);V3.failed=true;V3.why='無法建立 WebGL 繪圖環境';stage.innerHTML='';renderProduct(p.id,S.depth>1?S.node.code:null);return;}
    V3.stage=stage; window.__v3d=V3.inst;
  }
  const F=Concepts.nodes.get(p.id+'|'+V3.focus)||S;
  const key=p.id+'|'+F.node.code;
  let startT;
  if(V3.inst.key!==key){
    if(V3.nextStart!=null)startT=V3.nextStart;
    else if(F.depth>1){V3.exploded=true;startT=0;}   // 直接開子層：組合→自動拆開
    else startT=V3.exploded?1:0;
  }
  V3.nextStart=null;
  const ex=chainEl().querySelector('#v3ex'); if(ex){ex.classList.toggle('on',V3.exploded);ex.textContent=V3.exploded?'🧲 組合':'💥 拆解';}
  const theme=ChainUI.theme?Concepts.theme(ChainUI.theme):null;
  const tset=theme?new Set(theme.nodes||[]):null;
  const hitOf=theme?(n=>{
    const info=Concepts.nodes.get(p.id+'|'+n.code);
    if(info&&Concepts.themeMatch(theme,info))return 'full';
    const has=x=>(x.children||[]).some(c=>tset.has(c.code)||has(c));
    return has(n)?'part':null;
  }):null;
  const colorOf=n=>metricColor(ChainUI.metric,metricValue(ChainUI.metric,Concepts.subtreeTwCodes(n)).v);
  V3.inst.show({key,product:p,focus:F.node,isRoot:F.depth===1,selected:S.node===F.node?null:S.node.code,
    explode:V3.exploded,startT,colorOf,labelHtml:v3LabelHtml,hitOf,onlyTheme:ChainUI.onlyTheme});
}
