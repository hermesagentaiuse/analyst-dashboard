// 共用小工具：格式化、fetch、escape、統計
'use strict';
const fmt=(v,suf='')=>(v==null||isNaN(v))?'—':(Number(v).toFixed(1)+suf);
const cls=v=>v==null||isNaN(v)?'neu':(v>0?'up':v<0?'dn':'neu');
function lv(v){return v==null||isNaN(v)?'—':Number(v).toLocaleString('zh-TW',{maximumFractionDigits:1});}

// HTML escape（所有新程式碼插入資料時使用）
function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
// 只允許 http(s) 連結
function safeUrl(u){
  const s=String(u||'').trim();
  return /^https?:\/\//i.test(s)?s:'';
}

async function jget(u){try{const r=await fetch(u+'?ts='+Date.now());if(!r.ok)return null;return await r.json()}catch(e){return null}}

function median(arr){
  const a=arr.filter(v=>v!=null&&!isNaN(v)).map(Number).sort((x,y)=>x-y);
  if(!a.length)return null;
  const m=a.length>>1;
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function sum(arr){
  const a=arr.filter(v=>v!=null&&!isNaN(v));
  return a.length?a.reduce((x,y)=>x+Number(y),0):null;
}
// 台股代號：4~6 位數字（可帶英文字尾，如 00631L）
function isTwCode(c){return /^\d{4}[0-9A-Z]{0,2}$/.test(String(c||''));}
