// 總經卡（融資維持率、景氣燈號）與 法人×融資 趨勢 SVG 圖 —— 自原 index.html 原樣搬出
'use strict';
const LIGHT_HEX={'紅燈':'#f85149','黃紅燈':'#ff9f40','綠燈':'#3fb950','黃藍燈':'#58a6ff','藍燈':'#a5d6ff','黃燈':'#e3b341'};
function renderMacro(){
  const el=document.getElementById('macro'); const cards=[];
  if(MARGIN){
    const r=MARGIN.non_etf_ratio;
    const col=r>=180?'var(--bad)':r>=160?'#ff9f40':r>=140?'#e3b341':'var(--ok)'; // 好壞語意，不隨漲跌色互換
    const P=MARGIN.published;
    let pubLine='';
    if(P&&P.wg_listed!=null){
      pubLine=`<br>📌 網路公布(帳戶成本口径)：上市扣除ETF <b style="color:${P.wg_listed<150?'var(--bad)':P.wg_listed<165?'#ff9f40':'var(--tx)'}">${P.wg_listed}%</b>｜上櫃 ${P.wg_otc!=null?P.wg_otc+'%':'—'}<span class=mitem>（融資金額 ${P.wg_loan_億??'—'} 億／上櫃 ${P.wg_loan_otc_億??'—'} 億・玩股網 ${P.date||''}）</span>`;
    }
    // 30日 sparkline：玩股網上市扣除ETF vs 方法A（官方借款口径）
    let spark='';
    const S=(MARGIN.published_series||[]).filter(x=>x.wg_listed!=null);
    if(S.length>=5){
      const W=200,H=42,pad=3;
      const vals=S.flatMap(x=>[x.wg_listed,x.blave].filter(v=>v!=null));
      const lo=Math.min(...vals)-2,hi=Math.max(...vals)+2;
      const X=i=>pad+i*(W-2*pad)/(S.length-1), Y=v=>H-pad-(v-lo)/(hi-lo)*(H-2*pad);
      const poly=k=>S.map((x,i)=>x[k]!=null?`${X(i).toFixed(1)},${Y(x[k]).toFixed(1)}`:null).filter(Boolean).join(' ');
      const lastWg=S[S.length-1].wg_listed, lastBl=S[S.length-1].blave;
      spark=`<svg width="${W}" height="${H}" style="margin-top:4px">
        <polyline points="${poly('blave')}" fill="none" stroke="#8b949e" stroke-width="1.2" stroke-dasharray="3 2"/>
        <polyline points="${poly('wg_listed')}" fill="none" stroke="#58a6ff" stroke-width="1.6"/>
        <text x="${W-2}" y="10" text-anchor="end" font-size="9" fill="#58a6ff">${lastWg!=null?lastWg+'%':''} 玩股網</text>
        <text x="${W-2}" y="21" text-anchor="end" font-size="9" fill="#8b949e">${lastBl!=null?lastBl+'%':''} Blave</text></svg>`;
    }
    cards.push(`<div class=mcard><div class=mt>💹 大盤融資維持率（扣除ETF）</div>
      <div class=mv style="color:${col}">${r!=null?r+'%':'—'}<span class=mitem style="font-weight:400"> 官方借款口径A｜B ${MARGIN.method_b_non_etf!=null?MARGIN.method_b_non_etf+'%':'—'}</span></div>
      <div class=ms>${MARGIN.level||''}｜保證金 ${MARGIN.margin_collateral_億??'—'} 億｜融資 ${MARGIN.margin_zhang?.toLocaleString?MARGIN.margin_zhang.toLocaleString():'—'} 張${pubLine}${spark}<br>
      <span class=mitem>資料日 ${MARGIN.date||'—'}｜130%斷頭線 140%警戒 180%過熱｜實線=玩股網帳戶成本口径（媒體公布同源） 虛線=Blave市值口径（≈方法A）｜${MARGIN.source||''}</span></div></div>`);
  }
  if(SHORTCOV&&SHORTCOV.rows&&SHORTCOV.rows.length){
    const R=SHORTCOV.rows, last=R[R.length-1];
    const SIG_COL={'回補上漲':'var(--ok)','回補平淡':'#e3b341','加空下跌':'var(--bad)','中性':'var(--tx)'};
    const SIG_ICON={'回補上漲':'📈','回補平淡':'↔️','加空下跌':'📉','中性':'—'};
    // sparkline：外資期現合一淨部位（口）
    let spark='';
    const S=R.filter(x=>x.tx_all_net!=null);
    if(S.length>=5){
      const W=200,H=42,pad=3;
      const vals=S.map(x=>x.tx_all_net);
      const lo=Math.min(...vals)-500,hi=Math.max(...vals)+500;
      const X=i=>pad+i*(W-2*pad)/(S.length-1), Y=v=>H-pad-(v-lo)/((hi-lo)||1)*(H-2*pad);
      const poly=S.map((x,i)=>`${X(i).toFixed(1)},${Y(x.tx_all_net).toFixed(1)}`).join(' ');
      const lastV=S[S.length-1].tx_all_net;
      spark=`<svg width="${W}" height="${H}" style="margin-top:4px"><polyline points="${poly}" fill="none" stroke="#4da3ff" stroke-width="1.6"/>
        <text x="${W-2}" y="10" text-anchor="end" font-size="9" fill="#4da3ff">${lastV.toLocaleString()} 口</text>
        <text x="2" y="${H-3}" font-size="8" fill="#888">外資臺系期現合一淨部位（負＝淨空）</text></svg>`;
    }
    // 近5日明細表
    let tbl='';
    const recent=R.slice(-5).reverse();
    tbl='<table style="font-size:10px;width:100%;margin-top:4px;border-collapse:collapse"><tr style="color:#8b949e"><th align=left>日期</th><th align=right>大盤%</th><th align=right>期貨淨部位Δ</th><th align=right>融券Δ(張)</th><th>訊號</th></tr>';
    for(const x of recent){
      const c=SIG_COL[x.signal]||'var(--tx)';
      tbl+=`<tr><td>${x.date.slice(5)}</td><td align=right style="color:${x.taimex>0?'var(--bad)':x.taimex<0?'var(--ok)':'var(--tx)'}">${x.taimex!=null?(x.taimex>0?'+':'')+x.taimex+'%':'—'}</td><td align=right>${x.tx_delta!=null?(x.tx_delta>0?'+':'')+x.tx_delta.toLocaleString():'—'}</td><td align=right style="color:${x.sq_delta!=null&&x.sq_delta<0?'var(--bad)':'var(--tx)'}">${x.sq_delta!=null?(x.sq_delta>0?'+':'')+x.sq_delta.toLocaleString():'—'}</td><td style="color:${c}">${SIG_ICON[x.signal]||''}${x.signal||'—'}</td></tr>`;    }
    tbl+='</table>';
    cards.push(`<div class=mcard><div class=mt>🛡️ 空單回補監測（外資期貨＋融券）</div>
      <div class=mv style="color:${SIG_COL[last.signal]||'var(--tx)'}">${last.signal||'資料不足'}<span class=mitem style="font-weight:400"> ${last.date||''}</span></div>
      <div class=ms>${last.note||''}<br>
      <span class=mitem>判讀：外資期貨淨部位<b>增加</b>＝空單回補（買回平倉，利空出盡訊號）；<b>減少</b>＝加空。融券餘額<b>減少</b>＝現券回補（軋空）。三大法人現貨賣超≠期货空頭，兩者要分開看</span>
      ${spark}${tbl}<br><span class=mitem>資料源：TAIFEX 三大法人期貨部位＋臺證/櫃買融券餘額｜每晚更新｜${SHORTCOV.generated_at?('生成 '+SHORTCOV.generated_at.slice(0,10)):''}</span></div></div>`);
  }
  if(BIZ){
    let lamps='';
    if(BIZ.items) for(const [k,v] of Object.entries(BIZ.items))
      lamps+=`<span title="${k}：${v}" style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><span class=lamp style="background:${LIGHT_HEX[v]||'#8b949e'}"></span><span class=mitem>${k}</span></span>`;
    cards.push(`<div class=mcard><div class=mt>🚦 國發會景氣對策信號（${BIZ.month||'—'}）</div>
      <div class=mv style="color:${LIGHT_HEX[BIZ.light]||'var(--tx)'}">${BIZ.light||'—'} ${BIZ.score!=null?BIZ.score+'分':''}</div>
      <div class=ms>${BIZ.consecutive||''}｜前月 ${BIZ.prev_score!=null?BIZ.prev_score+'分':'—'}<div class=lights>${lamps}</div>
      <span class=mitem>${BIZ.published?'發布 '+BIZ.published+'｜':''}${BIZ.source||''}</span></div></div>`);
  }
  el.innerHTML=cards.join('');
}

// —— 法人×融資趨勢圖（純 SVG）：上=三大法人買賣超(千股)折線，下=融資餘額(張)面積 ——
function flowChartHtml(code){
  if(!FLOW||!FLOW.codes||!FLOW.codes[code])return `<div class=neu>無法人/融資趨勢資料（新代號於下次夜間排程後自動補齊）</div>`;
  const arr=FLOW.codes[code], dates=FLOW.dates;
  const n=dates.length; if(!n)return '';
  const W=560,h1=130,h2=90,padL=44,padR=8,padT=14,padB=16;
  const x=i=>padL+(W-padL-padR)*(n===1?0.5:i/(n-1));
  function series(j){return arr.map(r=>r?r[j]:null);}
  function path(vals,ymin,ymax,h,off){
    let d='',pen=false;
    vals.forEach((v,i)=>{
      if(v==null){pen=false;return;}
      const y=off+padT+(h-padT-padB)*(1-(v-ymin)/((ymax-ymin)||1));
      d+=(pen?'L':'M')+x(i).toFixed(1)+','+y.toFixed(1);pen=true;
    });
    return d;
  }
  const instCols=[['f','#4da3ff','外資'],['t','#ffb84d','投信'],['d','#b07dff','自營']];
  const ivs=instCols.map(c=>series(c[0]==='f'?0:c[0]==='t'?1:2));
  // 法人合計：三家加總（全 null 的日子才 null）
  const tvals=arr.map(r=>{
    if(!r)return null;
    const parts=[r[0],r[1],r[2]].filter(v=>v!=null);
    return parts.length?parts.reduce((a,b)=>a+b,0):null;
  });
  let lo=0,hi=0;
  ivs.forEach(vs=>vs.forEach(v=>{if(v!=null){lo=Math.min(lo,v);hi=Math.max(hi,v);}}));
  tvals.forEach(v=>{if(v!=null){lo=Math.min(lo,v);hi=Math.max(hi,v);}});
  if(hi===lo&&lo===0){hi=1;lo=-1;}
  const mvs=series(3);
  let mlo=Math.min(...mvs.filter(v=>v!=null)), mhi=Math.max(...mvs.filter(v=>v!=null));
  if(!isFinite(mlo)){mlo=0;mhi=1;}
  if(mhi===mlo){mhi=mlo+1;}
  const H=h1+8+h2;
  let svg=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
  // zero line + 圖表一
  const zy=padT+(h1-padT-padB)*(1-(0-lo)/((hi-lo)||1));
  svg+=`<line x1="${padL}" y1="${zy}" x2="${W-padR}" y2="${zy}" stroke="#333" stroke-dasharray="3 3"/>`;
  svg+=`<text x="2" y="${(padT+6).toFixed(0)}" fill="#888" font-size="9">${lv(hi)}</text><text x="2" y="${(h1-4).toFixed(0)}" fill="#888" font-size="9">${lv(lo)}</text>`;
  ivs.forEach((vs,k)=>{svg+=`<path d="${path(vs,lo,hi,h1,0)}" fill="none" stroke="${instCols[k][1]}" stroke-width="1.6"/>`;});
  svg+=`<path d="${path(tvals,lo,hi,h1,0)}" fill="none" stroke="#e8e8e8" stroke-width="2.4"/>`;
  // 圖表二：融資餘額面積
  const off2=h1+8;
  svg+=`<path d="${path(mvs,mlo,mhi,h2,off2)}" fill="none" stroke="#ff6b6b" stroke-width="1.6"/>`;
  svg+=`<text x="2" y="${(off2+padT+6).toFixed(0)}" fill="#888" font-size="9">${lv(mhi)}</text><text x="2" y="${(off2+h2-4).toFixed(0)}" fill="#888" font-size="9">${lv(mlo)}</text>`;
  // x 軸日期（首、中、末）
  [[0,'start'],[Math.floor((n-1)/2),'mid'],[n-1,'end']].forEach(([i])=>{
    svg+=`<text x="${x(i).toFixed(1)}" y="${H-3}" fill="#888" font-size="9" text-anchor="${i===0?'start':i===n-1?'end':'middle'}">${dates[i].slice(5)}</text>`;
  });
  svg+=`</svg>`;
  const last=arr[n-1]||[];
  const tv=tvals[n-1];
  const legend=`<span style="color:#e8e8e8">━合計 ${tv!=null?lv(tv):'—'}</span>　<span style="color:#4da3ff">■外資 ${last[0]!=null?lv(last[0]):'—'}</span>　<span style="color:#ffb84d">■投信 ${last[1]!=null?lv(last[1]):'—'}</span>　<span style="color:#b07dff">■自營 ${last[2]!=null?lv(last[2]):'—'}</span>（千股，${dates[n-1]||''}）　<span style="color:#ff6b6b">▬融資餘額 ${last[3]!=null?lv(last[3]):'—'} 張</span>`;
  return svg+`<div style="font-size:10px;margin-top:2px">${legend}</div>`;
}
