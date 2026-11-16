// Hash 路由
//  #/                         首頁（預設分頁：有持股→持股，否則全域共識）
//  #/analyst/<id>             分析師分頁（id＝頻道 id 或 all）
//  #/portfolio                我的持股
//  #/portfolio/<code>         持股抽屜（疊在目前頁面上）
//  #/stock/<code>             個股抽屜（疊在目前頁面上；直接開啟時底下為首頁）
//  #/chain                    產業鏈產品列表
//  #/chain/<pid>[/<node>]     產品樹＋節點面板
//  #/theme/<tid>              題材頁
'use strict';
const Router={
  baseKey:null, baseHash:'#/', oldHash:null, initial:true,
  parse(h){
    const parts=(h||'').replace(/^#\/?/,'').split('/').filter(Boolean).map(s=>{try{return decodeURIComponent(s)}catch(e){return s}});
    const [a,b,c]=parts;
    if(a==='analyst'&&b)return {type:'main',tab:b};
    if(a==='portfolio')return b?{type:'drawer',pf:true,code:b}:{type:'main',tab:'pf'};
    if(a==='stock'&&b)return {type:'drawer',code:b};
    if(a==='chain')return b?{type:'product',pid:b,node:c||null}:{type:'chain'};
    if(a==='theme'&&b)return {type:'theme',tid:b};
    return {type:'main',tab:null};
  },
  key(r){return r.type==='main'?'main:'+(r.tab||defaultTab()):JSON.stringify(r);},
  isDrawerRoute(){return this.parse(location.hash).type==='drawer';},
  norm(h){return h&&h!=='#'?h:'#/';},
  leaveDrawer(){
    // 從底頁點進來 → 上一頁；直接開啟的連結 → 前往底頁
    if(!this.initial&&this.norm(this.oldHash)===this.norm(this.baseHash))history.back();
    else location.hash=this.baseHash;
  },
  async handle(){
    const r=this.parse(location.hash);
    if(r.type==='drawer'){
      if(!this.baseKey){await this.renderBase({type:'main',tab:null});this.baseKey=this.key({type:'main',tab:null});this.baseHash='#/';}
      r.pf?openPfDrawer(r.code):openDrawer(r.code);
      return;
    }
    hideDrawer();
    const k=this.key(r);
    this.baseHash=this.norm(location.hash);
    if(k===this.baseKey)return;
    this.baseKey=k;
    await this.renderBase(r);
  },
  async renderBase(r){
    if(r.type==='main'){if(typeof chainLeave==='function')chainLeave();await showMain(r.tab||defaultTab());return;}
    cur='chain'; highlightChip('chain'); setView('chain');
    const pid=r.type==='product'?r.pid:null;
    if(!pid||pid!==this._lastPid)window.scrollTo(0,0);   // 同產品內切換節點不捲回頂端
    this._lastPid=pid;
    await renderChainRoute(r);
  },
  start(){
    window.addEventListener('hashchange',e=>{
      this.initial=false;
      try{this.oldHash=new URL(e.oldURL).hash;}catch(_){this.oldHash=null;}
      this.handle();
    });
    this.handle();
  },
};
