// 產業鏈資料層：延遲載入 concepts.json（失敗則 concepts.sample.json），建立索引與上色指標
'use strict';
const STAGE_ORDER=['design','equipment','material','component','module','assembly','brand'];
const Concepts={
  data:null, src:null, failed:false, _p:null,
  nodes:new Map(),    // key "pid|code" → {node,product,parent,depth,path:[node...],key}
  byCode:{},          // 台股代號 → [{product,node,role,confidence,key}]
  codeIdx:new Map(),  // node.code → [key...]（題材用；同一 code 可能出現在多個產品）
  stageName(s){return (this.data&&this.data.stages&&this.data.stages[s])||s||'—';},
  tagName(t){return (this.data&&this.data.tags&&this.data.tags[t])||t;},
  product(pid){return this.data?(this.data.products||[]).find(p=>p.id===pid)||null:null;},
  theme(tid){return this.data?(this.data.themes||[]).find(t=>t.id===tid)||null:null;},
  load(){
    if(this._p)return this._p;
    this._p=(async()=>{
      for(const u of ['data/concepts.json','data/concepts.sample.json']){
        const d=await jget(u);
        if(d&&Array.isArray(d.products)&&d.products.length){
          try{this.data=d;this.src=u;this._index();return d;}
          catch(e){console.warn('concepts 索引失敗',u,e);this.data=null;}
        }
      }
      this.failed=true;return null;
    })();
    return this._p;
  },
  _index(){
    const d=this.data;
    d.themes=Array.isArray(d.themes)?d.themes:[];
    d.stages=d.stages||{};d.tags=d.tags||{};
    for(const p of d.products)this._indexProduct(p);
    // 若資料提供 by_code，補上樹中沒有的對應（節點需可解析）
    if(d.by_code&&typeof d.by_code==='object'){
      for(const [code,arr] of Object.entries(d.by_code)){
        if(!Array.isArray(arr))continue;
        for(const e of arr){
          const key=e.product+'|'+e.node;
          if(!this.nodes.has(key))continue;
          const list=this.byCode[code]=this.byCode[code]||[];
          if(!list.some(x=>x.key===key))list.push({product:e.product,node:e.node,role:e.role||'',confidence:e.confidence,key});
        }
      }
    }
  },
  _nameIdx:null,
  // 單一產品索引（也供測試時注入臨時產品：Concepts.addProduct(p)）
  addProduct(p){if(!this.data||!p||!p.id||this.product(p.id))return false;this.data.products.push(p);this._indexProduct(p);return true;},
  _indexProduct(p){
    {
      if(!p.root)return;
      this._nameIdx=null;
      const walk=(n,parent,depth,path)=>{
        if(!n||!n.code)return;
        n.children=Array.isArray(n.children)?n.children:[];
        n.suppliers=Array.isArray(n.suppliers)?n.suppliers:[];
        n.tags=Array.isArray(n.tags)?n.tags:[];
        const key=p.id+'|'+n.code, np=path.concat([n]);
        this.nodes.set(key,{node:n,product:p,parent,depth,path:np,key});
        if(!this.codeIdx.has(n.code))this.codeIdx.set(n.code,[]);
        this.codeIdx.get(n.code).push(key);
        for(const s of n.suppliers){
          if(!isTw(s))continue;
          (this.byCode[s.code]=this.byCode[s.code]||[]).push({product:p.id,node:n.code,role:s.role||'',confidence:s.confidence,key});
        }
        for(const c of n.children)walk(c,n,depth+1,np);
      };
      walk(p.root,null,1,[]);
    }
  },
  // 同名節點（跨產品「下游」用）：名稱正規化後比對
  sameNameKeys(name){
    if(!this._nameIdx){
      this._nameIdx=new Map();
      for(const [k,info] of this.nodes){const nm=normName(info.node.name);if(!nm)continue;if(!this._nameIdx.has(nm))this._nameIdx.set(nm,[]);this._nameIdx.get(nm).push(k);}
    }
    return this._nameIdx.get(normName(name))||[];
  },
  // 節點（含子孫）所有供應商
  subtreeSuppliers(node){
    const out=[];const walk=n=>{for(const s of n.suppliers||[])out.push(s);for(const c of n.children||[])walk(c);};
    walk(node);return out;
  },
  subtreeTwCodes(node){return [...new Set(this.subtreeSuppliers(node).filter(isTw).map(s=>String(s.code)))];},
  countNodes(node){let n=0;const w=x=>{n++;(x.children||[]).forEach(w);};w(node);return n;},
  flatten(product){const out=[];const w=x=>{out.push(x);(x.children||[]).forEach(w);};if(product.root)w(product.root);return out;},
  // 題材：節點本身或任一祖先被列入 → 屬於該題材
  themeMatch(theme,info){return !!theme&&info.path.some(n=>(theme.nodes||[]).includes(n.code));},
  themeKeys(theme){
    const ks=[];
    for(const [k,info] of this.nodes) if(this.themeMatch(theme,info)) ks.push(k);
    return ks;
  },
  themeTwCodes(theme){
    const s=new Set();
    for(const k of this.themeKeys(theme)) for(const sp of this.nodes.get(k).node.suppliers) if(isTw(sp)) s.add(String(sp.code));
    return s;
  },
};
function normName(s){return String(s||'').toLowerCase().replace(/[\s　()（）・·\-_/／]+/g,'');}
// 是否為可對應 stats 的台股供應商
function isTw(s){
  if(!s||!s.code)return false;
  if(s.market&&s.market!=='TW')return false;
  if(s.listed==='海外'||s.listed==='未上市')return false;
  return isTwCode(s.code);
}

// —— 價量補充：stats 沒有 RSI 與當日漲跌，從頻道資料與持股檔補 ——
const QUOTE={};
function buildQuotes(){
  for(const d of Object.values(CHDATA)){
    if(!d)continue;
    for(const s of d.stocks||[]) if(s.code&&!s.err) QUOTE[s.code]=Object.assign(QUOTE[s.code]||{},{price:s.price,chg_pct:s.chg_pct,rsi14:s.rsi14});
  }
  for(const s of (PF&&PF.stocks)||[]) QUOTE[s.code]=Object.assign(QUOTE[s.code]||{},{price:s.last,chg_pct:s.chg_pct,rsi14:s.rsi14});
}
let _allChP=null;
function ensureAllChannels(){
  if(!_allChP)_allChP=(async()=>{
    for(const cid of Object.keys((MAN&&MAN.channels)||{})) if(!CHDATA[cid]) CHDATA[cid]=await jget('data/channels/'+cid+'.json');
    buildQuotes();
  })();
  return _allChP;
}
// —— mentions.json 依代號彙總（次數＋提及的分析師）——
let _mentBy=null;
function mentionsBy(code){
  if(!_mentBy){
    _mentBy={};
    for(const e of (MENT&&MENT.events)||[]){
      const m=_mentBy[e.code]=_mentBy[e.code]||{count:0,ch:{}};
      const c=1;m.count+=c;m.ch[e.channel_name]=(m.ch[e.channel_name]||0)+c;
    }
  }
  return _mentBy[code]||null;
}

// —— 上色指標：節點值＝子孫台股供應商的中位數（提及數為加總）——
const METRICS={
  ret90:{label:'90 日報酬',unit:'%',get:c=>STATS[c]&&STATS[c].ret_90d_pct,agg:median,mid:0,span:30},
  win20:{label:'提及後 20 日勝率',unit:'%',get:c=>STATS[c]&&STATS[c].win_rate_20d_pct,agg:median,mid:50,span:40},
  ment:{label:'分析師 90 日提及數（加總）',unit:'次',get:c=>STATS[c]&&STATS[c].mentions_90d,agg:sum,seq:true,max:150},
  rsi:{label:'RSI14（頻道/持股快照）',unit:'',get:c=>QUOTE[c]&&QUOTE[c].rsi14,agg:median,mid:50,span:25},
  pos:{label:'距 90 日高點',unit:'%',get:c=>{const s=STATS[c];return s&&s.hi90?(s.last/s.hi90-1)*100:null;},agg:median,mid:-20,span:20},
};
function metricValue(mk,codes){
  const M=METRICS[mk];const vals=codes.map(c=>M.get(c)).filter(v=>v!=null&&!isNaN(v));
  return {v:vals.length?M.agg(vals):null,n:vals.length,m:codes.length};
}
// 台股習慣：紅漲綠跌（高＝紅、低＝綠）
function metricColor(mk,v){
  if(v==null||isNaN(v))return 'transparent';
  const M=METRICS[mk];
  if(M.seq){const t=Math.max(0,Math.min(1,v/M.max));return `rgba(248,81,73,${(0.12+0.8*t).toFixed(2)})`;}
  const t=Math.max(-1,Math.min(1,(v-M.mid)/M.span));
  if(Math.abs(t)<0.05)return 'rgba(139,148,158,.35)';
  return t>0?`rgba(248,81,73,${(0.2+0.75*t).toFixed(2)})`:`rgba(63,185,80,${(0.2+0.75*-t).toFixed(2)})`;
}
function metricText(mk,v){
  if(v==null||isNaN(v))return '—';
  const M=METRICS[mk];
  if(mk==='ment')return Math.round(v)+'';
  return (v>0&&(mk==='ret90')?'+':'')+Number(v).toFixed(mk==='rsi'?0:1)+M.unit;
}
// 台股配色的漲跌 class（只用在產業鏈相關畫面）
const twc=v=>v==null||isNaN(v)?'neu':(v>0?'tw-up':v<0?'tw-dn':'neu');
