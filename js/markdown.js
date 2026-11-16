// 簡易 Markdown 渲染：標題、粗體/斜體、行內程式碼、清單、表格、連結、分隔線、引用
// 先整段 HTML escape 再套用規則，連結只允許 http(s)，避免 XSS。
'use strict';
function mdInline(s){
  let t=esc(s);
  // 行內程式碼先抽出，避免被其他規則影響
  const codes=[];
  t=t.replace(/`([^`]+)`/g,(_,c)=>{codes.push(c);return '\u0000'+(codes.length-1)+'\u0000';});
  // 連結 [text](url)
  t=t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,txt,url)=>{
    const u=safeUrl(url.replace(/&amp;/g,'&'));
    return u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${txt}</a>`:txt;
  });
  t=t.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
  t=t.replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g,'$1<i>$2</i>');
  t=t.replace(/\u0000(\d+)\u0000/g,(_,i)=>`<code>${codes[+i]}</code>`);
  return t;
}
function mdRender(src){
  const lines=String(src||'').replace(/\r\n?/g,'\n').split('\n');
  const out=[];let i=0;
  const isTableSep=l=>/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells=l=>l.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
  while(i<lines.length){
    const l=lines[i];
    if(!l.trim()){i++;continue;}
    let m;
    if((m=l.match(/^(#{1,6})\s+(.*)$/))){
      const n=Math.min(m[1].length+1,6);
      out.push(`<h${n}>${mdInline(m[2])}</h${n}>`);i++;continue;
    }
    if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)){out.push('<hr>');i++;continue;}
    if(l.includes('|')&&i+1<lines.length&&isTableSep(lines[i+1])){
      const head=cells(l);i+=2;
      let h='<div class="md-tw"><table class="md-t"><thead><tr>'+head.map(c=>`<th>${mdInline(c)}</th>`).join('')+'</tr></thead><tbody>';
      while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){
        h+='<tr>'+cells(lines[i]).map(c=>`<td>${mdInline(c)}</td>`).join('')+'</tr>';i++;
      }
      out.push(h+'</tbody></table></div>');continue;
    }
    if(/^\s*[-*+]\s+/.test(l)||/^\s*\d+[.)]\s+/.test(l)){
      const ordered=/^\s*\d+[.)]\s+/.test(l);
      const tag=ordered?'ol':'ul';
      let h=`<${tag}>`;
      while(i<lines.length&&(/^\s*[-*+]\s+/.test(lines[i])||/^\s*\d+[.)]\s+/.test(lines[i]))){
        const sub=/^\s{2,}/.test(lines[i]);
        const txt=lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/,'');
        h+=`<li${sub?' class="md-sub"':''}>${mdInline(txt)}</li>`;i++;
      }
      out.push(h+`</${tag}>`);continue;
    }
    if(/^\s*>/.test(l)){
      let q=[];
      while(i<lines.length&&/^\s*>/.test(lines[i])){q.push(mdInline(lines[i].replace(/^\s*>\s?/,'')));i++;}
      out.push(`<blockquote>${q.join('<br>')}</blockquote>`);continue;
    }
    // 段落：連續非空、非特殊行
    const p=[];
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,6})\s/.test(lines[i])&&!/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])
      &&!/^\s*>/.test(lines[i])&&!/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
      &&!(lines[i].includes('|')&&i+1<lines.length&&isTableSep(lines[i+1]))){
      p.push(mdInline(lines[i]));i++;
    }
    if(p.length)out.push(`<p>${p.join('<br>')}</p>`);else i++;
  }
  return out.join('\n');
}
