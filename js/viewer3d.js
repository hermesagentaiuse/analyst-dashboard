// 🧊 產業鏈 3D 拆解圖（Three.js r160，本地 vendor；由 chain.js 以 dynamic import 延遲載入）
// 模型完全由資料程序化產生：每個節點＝一個基本幾何塊，依「造型預設」槽位或自動方陣排列。
import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {Kit,geoCache,studioEnv} from './models/kit.js?v=20261119a';
import {sceneFor,partFor} from './models/index.js?v=20261119a';

// —— data/viewer.json（可選；載入失敗＝全部自動排版）——
let CFG={}, cfgP=null;
export function loadConfig(){
  if(!cfgP)cfgP=fetch('data/viewer.json?ts='+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}))
    .then(j=>{CFG=(j&&typeof j==='object'&&!Array.isArray(j))?j:{};return CFG;});
  return cfgP;
}

// —— 造型預設：槽位依序比對關鍵字（代號末段＋名稱＋英文名），沒比到的節點依序填剩下的槽位，再不夠就沿主軸均分 ——
const PRESET_BY_ID={'ai-rack':'rack',ev:'car',rocket:'rocket',leo:'satellite'};
const PRESETS={
  rack:{ // 直立機櫃：y 朝上，+z 為正面（托盤往前抽出）
    slots:[
      {re:/frame|框架|機殼|滑軌|cabinet|chassis|rail/,deco:true,shape:'frame',pos:[0,1.12,0],size:[.66,2.24,1.16],explode:[0,0,0]},
      {re:/^compute|運算|compute tray|gpu tray/,shape:'stack',pos:[0,.58,.02],size:[.58,.84,1],explode:[0,-.15,1.45]},
      {re:/power ?shelf|電源櫃|電源架|psu/,shape:'stack',count:3,pos:[0,1.15,.02],size:[.58,.24,1],explode:[0,0,2.15]},
      {re:/^switch|交換托盤|nvswitch|switch tray/,shape:'stack',pos:[0,1.52,.02],size:[.58,.36,1],explode:[0,.1,1.45]},
      {re:/bbu|超級電容|supercap|battery|電池/,shape:'box',pos:[0,1.83,.02],size:[.58,.14,1],explode:[0,.35,2.15]},
      {re:/network|\btor\b|交換器|光模組|optic/,shape:'box',pos:[0,2.07,.02],size:[.58,.18,1],explode:[0,.85,.7]},
      {re:/spine|背板|銅纜|backplane|cable/,shape:'panel',pos:[0,1.15,-.52],size:[.5,1.7,.06],explode:[0,0,-1.25]},
      {re:/busbar|匯流排/,shape:'box',pos:[.2,1.12,-.57],size:[.05,2,.04],explode:[.45,0,-2]},
      {re:/pdu|配電/,shape:'box',pos:[-.2,1.12,-.57],size:[.06,1.8,.05],explode:[-.45,0,-2]},
      {re:/manifold|分歧管|快接頭|\bqd\b/,shape:'cyl',axis:'y',mirror:'x',pos:[.27,1.1,-.44],size:[.05,1.9,.05],explode:[.7,0,-.35]},
      {re:/cdu|冷卻|cooling|液冷/,shape:'box',pos:[.8,.9,0],size:[.55,1.8,1],explode:[1.2,0,0]},
      {re:/hvdc|側櫃|800v|sidecar/,shape:'box',pos:[-.84,1,0],size:[.6,2,1],explode:[-1.25,0,0]},
      {re:/l1[01]|組裝|測試|assembly|integration/,shape:'plate',pos:[0,-.04,0],size:[2.6,.06,1.5],explode:[0,-.75,0]},
    ],
    overflow:{from:[1.75,.25,0],to:[1.75,2.0,0],size:[.36,.2,.36],explode:[.8,0,0]},
  },
  car:{ // 電動車：+x 為車頭，車長沿 x
    slots:[
      {re:/body|車身|白車身|biw|外殼|鈑金|shell/,shape:'cabin',pos:[0,.97,0],size:[4.3,.74,1.8],explode:[0,1.6,0]},
      {re:/battery|電池|電芯|cell|pack|儲能/,shape:'box',pos:[0,.43,0],size:[2.7,.14,1.45],explode:[0,-1.25,0]},
      {re:/motor|電機|馬達|drive|驅動|電驅|inverter|逆變|動力/,shape:'cyl',axis:'z',pos:[-1.35,.45,0],size:[.42,.42,.55],explode:[-1.1,-.3,0]},
      {re:/wheel|tire|tyre|輪|胎|煞車|brake/,deco:true,shape:'cyl',axis:'z',mirror:'xz',pos:[1.4,.36,.84],size:[.7,.7,.24],explode:[.5,0,.9]},
      {re:/chassis|底盤|懸吊|suspension|車架|轉向|steer/,shape:'plate',pos:[0,.3,0],size:[4.1,.08,1.6],explode:[0,-.6,0]},
      {re:/adas|自駕|感測|sensor|lidar|光達|雷達|radar|camera|鏡頭/,shape:'box',pos:[.35,1.43,0],size:[.32,.1,.32],explode:[0,2.6,0]},
      {re:/座艙|內裝|interior|cockpit|seat|座椅|display|顯示|面板/,shape:'box',pos:[-.15,.85,0],size:[1.6,.45,1.4],explode:[0,0,2]},
      {re:/chip|晶片|soc|ecu|控制器|電子|semiconductor|半導體|mcu|運算|computer/,shape:'box',pos:[1.55,.75,0],size:[.5,.2,.6],explode:[1.5,.7,0]},
      {re:/熱管理|thermal|空調|hvac|散熱|heat ?pump|熱泵/,shape:'box',pos:[1.8,.6,0],size:[.4,.35,1.2],explode:[1.7,0,0]},
      {re:/充電|charg|obc/,shape:'box',pos:[-2,.7,.6],size:[.3,.3,.3],explode:[-1.4,0,.7]},
      {re:/線束|harness|連接器|connector|cable/,shape:'box',pos:[0,.6,0],size:[3.6,.04,.06],explode:[0,0,-1.9]},
      {re:/燈|light|lamp|玻璃|glass|車窗/,shape:'box',pos:[2.17,.78,0],size:[.08,.22,1.5],explode:[1.3,0,0]},
      {re:/組裝|assembly|品牌|brand|oem|整車/,shape:'plate',pos:[0,-.05,0],size:[5,.06,2.4],explode:[0,-1.9,0]},
    ],
    overflow:{from:[-2,.25,-2.4],to:[2,.25,-2.4],size:[.38,.32,.38],explode:[0,0,-.7]},
  },
  rocket:{ // 運載火箭：沿 y 軸分節
    slots:[
      {re:/fairing|整流罩|酬載|payload|nose/,shape:'ogive',pos:[0,10.7,0],size:[.92,1.8,.92],explode:[0,2.4,0]},
      {re:/upper|上面級|二級|second|stage ?2|\bs2\b/,shape:'cyl',axis:'y',pos:[0,8.8,0],size:[.9,2,.9],explode:[0,1.4,0]},
      {re:/interstage|級間/,shape:'cyl',axis:'y',pos:[0,7.5,0],size:[.92,.6,.92],explode:[0,.65,0]},
      {re:/first|一級|booster|stage ?1|\bs1\b|助推|核心級|core/,deco:true,shape:'cyl',axis:'y',pos:[0,4,0],size:[.9,6.4,.9],explode:[0,0,0]},
      {re:/engine|引擎|發動機|推進器|raptor|merlin|噴嘴|nozzle|渦輪泵|turbopump/,deco:true,shape:'engines',pos:[0,.4,0],size:[.86,.8,.86],explode:[0,-1.6,0]},
      {re:/tank|燃料|推進劑|propellant|液氧|甲烷|煤油|貯箱/,shape:'cyl',axis:'y',pos:[0,4.6,0],size:[.78,3.6,.78],explode:[-1.7,0,0]},
      {re:/avionics|航電|導航|飛控|guidance|電子|控制|computer/,shape:'box',pos:[0,7.05,0],size:[.5,.24,.5],explode:[1.6,.4,0]},
      {re:/legs?\b|著陸|grid ?fin|柵格|landing|回收|reuse/,shape:'box',mirror:'xz',pos:[.36,1.3,.36],size:[.08,1.3,.08],explode:[.7,0,.7]},
      {re:/發射|launch|地面|pad|塔|ground/,shape:'plate',pos:[0,-.12,0],size:[3.2,.2,3.2],explode:[0,-2.4,0]},
    ],
    overflow:{from:[2.6,1,0],to:[2.6,10.5,0],size:[.7,.5,.7],explode:[1,0,0]},
  },
  satellite:{ // 低軌衛星：本體＋左右太陽能板＋底部相位陣列，另有地面用戶終端
    slots:[
      {re:/bus|本體|衛星平台|platform|structure|結構|衛星本體/,shape:'box',pos:[0,0,0],size:[1.2,.45,.9],explode:[0,0,0]},
      {re:/solar|太陽能|太陽板|電源|power/,deco:true,shape:'panel',mirror:'x',pos:[1.95,0,0],size:[2.5,.04,.9],explode:[1.3,0,0]},
      {re:/phased|相位|陣列|antenna|天線|\bka\b|\bku\b|beam|波束/,deco:true,shape:'panel',pos:[0,-.29,0],size:[1.05,.06,.82],explode:[0,-1.1,0]},
      {re:/terminal|終端|碟|dish|用戶|user|接收/,shape:'dish',pos:[0,-3.1,0],size:[1.1,.6,1.1],explode:[0,-.9,0]},
      {re:/laser|雷射|光通訊|\bisl\b|optical|鏡/,shape:'box',mirror:'x',pos:[.45,.33,0],size:[.2,.2,.2],explode:[.35,.9,0]},
      {re:/propul|推進|thruster|霍爾|hall|krypton|氪|ion|離子/,shape:'cyl',axis:'z',pos:[0,0,-.55],size:[.24,.24,.22],explode:[0,0,-1.2]},
      {re:/chip|晶片|處理器|computer|電子|rf|射頻|mmic|gan|soc/,shape:'box',pos:[0,.31,0],size:[.5,.12,.4],explode:[0,1.1,0]},
      {re:/gateway|地面站|閘道|station|雲|cloud/,shape:'box',pos:[2.1,-3.05,0],size:[.6,.7,.6],explode:[.7,-.7,0]},
    ],
    overflow:{from:[-2.6,1.7,0],to:[2.6,1.7,0],size:[.36,.3,.36],explode:[0,.9,0]},
  },
};
export function presetFor(p){
  const c=CFG&&CFG[p.id];
  if(c&&c.preset&&(PRESETS[c.preset]||c.preset==='generic'))return c.preset;
  if(PRESET_BY_ID[p.id])return PRESET_BY_ID[p.id];
  const s=(p.id+' '+(p.name||'')+' '+(p.name_en||'')).toLowerCase();
  if(/rack|機櫃|伺服器|server/.test(s))return 'rack';
  if(/\bev\b|car|vehicle|電動車|汽車/.test(s))return 'car';
  if(/rocket|launch vehicle|火箭/.test(s))return 'rocket';
  if(/satellite|\bleo\b|衛星|starlink/.test(s))return 'satellite';
  return 'generic';
}
const textOf=n=>(String(n.code||'').split('.').pop()+' '+(n.name||'')+' '+(n.name_en||'')).toLowerCase();
const qtyCount=n=>{const m=String(n.qty_label||'').match(/[×xX*]\s*(\d+)/);return m?Math.max(2,Math.min(24,+m[1])):0;};
const countDesc=n=>{let k=0;const w=x=>{for(const c of x.children||[]){k++;w(c);}};w(n);return k;};
const lerp3=(a,b,t)=>[0,1,2].map(i=>a[i]+(b[i]-a[i])*t);
const isVec=v=>Array.isArray(v)&&v.length===3&&v.every(x=>isFinite(+x));

function slotLayout(P,kids){
  const slots=P.slots, used=slots.map(()=>false), out=[], rest=[];
  const take=(c,si)=>{used[si]=true;const s=slots[si];out.push({code:c.code,node:c,shape:s.shape,pos:s.pos.slice(),size:s.size.slice(),explode:s.explode.slice(),mirror:s.mirror,axis:s.axis,count:s.count||qtyCount(c)||0,slot:si});};
  for(const c of kids){const t=textOf(c);const si=slots.findIndex((s,i)=>!used[i]&&s.re.test(t));si>=0?take(c,si):rest.push(c);}
  // 沒比到關鍵字的節點依序填「非裝飾」空槽；裝飾槽（輪子、太陽能板、機櫃框…）留給造型辨識度，空著時畫成半透明不可點的外形
  const left=[];
  for(const c of rest){const si=slots.findIndex((s,i)=>!used[i]&&!s.deco);si>=0?take(c,si):left.push(c);}
  const O=P.overflow;
  left.forEach((c,i)=>out.push({code:c.code,node:c,shape:qtyCount(c)?'stack':'box',count:qtyCount(c),pos:lerp3(O.from,O.to,left.length===1?.5:i/(left.length-1)),size:O.size.slice(),explode:O.explode.slice(),slot:'overflow'}));
  const ord=new Map(kids.map((c,i)=>[c.code,i]));
  out.sort((a,b)=>ord.get(a.code)-ord.get(b.code));
  out.ghosts=slots.filter((s,i)=>!used[i]&&s.deco).map(s=>({shape:s.shape,pos:s.pos.slice(),size:s.size.slice(),explode:s.explode.slice(),mirror:s.mirror,axis:s.axis,count:s.count||6}));
  return out;
}
// 子層／generic：組合時緊密拼成一塊方陣，拆解時拉開並浮起
const STAGE_SHAPE={material:['cyl',.55],component:['plate',.3],equipment:['box',.95],module:['box',.6],assembly:['plate',.24],design:['box',.45],brand:['box',.45]};
function gridLayout(kids){
  const n=kids.length, cols=Math.ceil(Math.sqrt(n)), rows=Math.ceil(n/cols), U=1, GAP=.04, SPREAD=.95;
  return kids.map((c,i)=>{
    const r=Math.floor(i/cols), col=i%cols, q=qtyCount(c);
    let [shape,h]=STAGE_SHAPE[c.stage]||['box',.5];
    h*=1+Math.min(1.2,Math.log2(1+countDesc(c))*.18);
    if(q&&shape!=='cyl')shape='stack';
    const cx=col-(cols-1)/2, cz=r-(rows-1)/2;
    return {code:c.code,node:c,shape,count:q,axis:'y',pos:[cx*(U+GAP),h/2,cz*(U+GAP)],size:[U*.96,h,U*.96],
      explode:[cx*SPREAD,.55+((col+r)%2)*.3,cz*SPREAD],slot:'grid'};
  });
}
export function computeLayout(product,focus,isRoot){
  const kids=focus.children||[];
  // 有仿真模型的層級：依實物配置擺放（沒對應到模型的節點排在旁邊）
  const S=kids.length?sceneFor(product.id,isRoot?'root':focus.code):null;
  if(S){
    const out=[], rest=[];
    for(const c of kids){const p=S.parts&&S.parts[c.code];
      if(p)out.push({code:c.code,node:c,detail:p,pos:[0,0,0],size:[1,1,1],explode:(p.ex||[0,0,0]).slice(),slot:'detail'}); else rest.push(c);}
    for(const c of rest)out.push({code:c.code,node:c,shape:qtyCount(c)?'stack':'box',count:qtyCount(c),pos:[0,0,0],size:[.3,.2,.3],explode:[.4,0,0],slot:'pending'});
    return {preset:'detail',items:out,ghosts:[],decor:S.decor||[],view:S.view||null};
  }
  if(!kids.length){const p=partFor(product.id,focus.code);
    if(p)return {preset:'detail',items:[{code:focus.code,node:focus,detail:p,pos:[0,0,0],size:[1,1,1],explode:[0,0,0],slot:'self'}],ghosts:[],decor:[],view:null};}
  const preset=isRoot?presetFor(product):'generic';
  let items, ghosts=[];
  if(!kids.length)items=[{code:focus.code,node:focus,shape:'box',pos:[0,.5,0],size:[1,1,1],explode:[0,0,0],slot:'self'}];
  else if(PRESETS[preset]){items=slotLayout(PRESETS[preset],kids);ghosts=items.ghosts||[];}
  else items=gridLayout(kids);
  const ov=(CFG[product.id]&&CFG[product.id].nodes)||{};
  for(const it of items){
    const o=ov[it.code]; if(!o||typeof o!=='object')continue;
    for(const k of ['pos','size','explode'])if(isVec(o[k]))it[k]=o[k].map(Number);
    for(const k of ['shape','color','mirror','axis'])if(typeof o[k]==='string')it[k]=o[k];
    if(o.count>0)it.count=Math.min(32,o.count|0);
    it.override=true;
  }
  return {preset,items,ghosts};
}

// —— 幾何 ——
const MIRRORS={x:[[1,1,1],[-1,1,1]],z:[[1,1,1],[1,1,-1]],xz:[[1,1,1],[-1,1,1],[1,1,-1],[-1,1,-1]]};
function cylGeo(rt,rb,len,axis,seg=24){const g=new THREE.CylinderGeometry(rt,rb,len,seg);if(axis==='x')g.rotateZ(Math.PI/2);else if(axis==='z')g.rotateX(Math.PI/2);return g;}
function buildShape(it,mat,lineMat,geos){
  const [w,h,d]=it.size, g=new THREE.Group(), meshes=[];
  const add=(geo,x=0,y=0,z=0,edges=true)=>{geos.add(geo);const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);meshes.push(m);
    if(edges){const eg=new THREE.EdgesGeometry(geo,30);geos.add(eg);const l=new THREE.LineSegments(eg,lineMat);l.position.copy(m.position);l.raycast=()=>{};g.add(l);}return m;};
  switch(it.shape){
    case 'frame':{const t=Math.max(.02,Math.min(w,d)*.06);
      for(const sx of [-1,1])for(const sz of [-1,1])add(new THREE.BoxGeometry(t,h,t),sx*(w/2-t/2),0,sz*(d/2-t/2));
      for(const sy of [-1,1]){for(const sz of [-1,1])add(new THREE.BoxGeometry(w,t,t),0,sy*(h/2-t/2),sz*(d/2-t/2));
        for(const sx of [-1,1])add(new THREE.BoxGeometry(t,t,d),sx*(w/2-t/2),sy*(h/2-t/2),0);}
      break;}
    case 'stack':{const n=Math.max(2,Math.min(32,it.count||6)), slab=h/n, th=slab*.72;
      for(let i=0;i<n;i++)add(new THREE.BoxGeometry(w,th,d),0,-h/2+slab*(i+.5),0);break;}
    case 'cyl':{const ax=it.axis||'y';const len=ax==='x'?w:ax==='z'?d:h;const r=(ax==='x'?Math.min(h,d):ax==='z'?Math.min(w,h):Math.min(w,d))/2;
      add(cylGeo(r,r,len,ax));break;}
    case 'cone':add(cylGeo(Math.min(w,d)*.06,Math.min(w,d)/2,h,'y'));break;
    case 'ogive':{const R=Math.min(w,d)/2, pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push(new THREE.Vector2(Math.max(.001,R*Math.sqrt(1-t*t)),-h/2+t*h));}
      add(new THREE.LatheGeometry(pts,28));break;}
    case 'engines':{const rs=Math.min(w,d)/6;add(cylGeo(rs*.45,rs,h,'y',16));
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(cylGeo(rs*.45,rs,h,'y',16),Math.cos(a)*rs*2.1,0,Math.sin(a)*rs*2.1);}break;}
    case 'dish':{const R=Math.min(w,d)/2, pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector2(Math.max(.001,R*t),h*.15+h*.35*t*t));}
      const m=add(new THREE.LatheGeometry(pts,32),0,0,0,false);m.material=mat;mat.side=THREE.DoubleSide;
      add(cylGeo(R*.06,R*.08,h*.5,'y',12),0,-h*.1,0,false);add(cylGeo(R*.35,R*.4,h*.1,'y',20),0,-h/2+h*.05,0);break;}
    case 'panel':{add(new THREE.BoxGeometry(w,h,d));
      const thin=h<=Math.min(w,d)?'y':(d<=w?'z':'x'), P=[];const nx=6,ny=3;
      if(thin==='y'){const y=h/2+.002;for(let i=1;i<nx;i++){const x=-w/2+w*i/nx;P.push(x,y,-d/2,x,y,d/2);}for(let j=1;j<ny;j++){const z=-d/2+d*j/ny;P.push(-w/2,y,z,w/2,y,z);}}
      else if(thin==='z'){const z=d/2+.002;for(let i=1;i<nx;i++){const y=-h/2+h*i/nx;P.push(-w/2,y,z,w/2,y,z);}for(let j=1;j<ny;j++){const x=-w/2+w*j/ny;P.push(x,-h/2,z,x,h/2,z);}}
      else{const x=w/2+.002;for(let i=1;i<nx;i++){const y=-h/2+h*i/nx;P.push(x,y,-d/2,x,y,d/2);}}
      const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geos.add(lg);
      const l=new THREE.LineSegments(lg,lineMat);l.raycast=()=>{};g.add(l);break;}
    case 'cabin':{add(new THREE.BoxGeometry(w,h*.55,d),0,-h*.225,0);add(new THREE.BoxGeometry(w*.52,h*.45,d*.9),-w*.06,h*.275,0);break;}
    case 'sphere':add(new THREE.SphereGeometry(Math.min(w,h,d)/2,24,16));break;
    default:add(new THREE.BoxGeometry(w,h,d));
  }
  return {g,meshes};
}
function colorFrom(str,fallback){
  const base=new THREE.Color(fallback||'#566173');
  const m=/rgba?\(([^)]+)\)/.exec(str||''); if(!m)return base;
  const [r,g,b,a=1]=m[1].split(',').map(Number);
  return base.lerp(new THREE.Color(`rgb(${r|0},${g|0},${b|0})`),Math.min(1,a*1.1));
}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

// —— 檢視器 ——
export class Viewer{
  constructor(stage,cb){
    this.stage=stage; this.cb=cb||{};
    this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    this.renderer.setClearColor(0x0f141c,1);
    const cv=this.canvas=this.renderer.domElement; cv.className='v3canvas';
    this.lines=document.createElementNS('http://www.w3.org/2000/svg','svg'); this.lines.setAttribute('class','v3lines');
    this.linePath=document.createElementNS('http://www.w3.org/2000/svg','path'); this.lines.appendChild(this.linePath);
    this.labelsEl=document.createElement('div'); this.labelsEl.className='v3labels';
    // 實物說明面板＋顏色模式切換（實物材質／股價指標色）
    this.infoEl=document.createElement('div'); this.infoEl.className='v3info';
    this.toolsEl=document.createElement('div'); this.toolsEl.className='v3tools';
    this.colorMode='real';
    this.colorBtn=document.createElement('button'); this.colorBtn.type='button';
    this.colorBtn.title='切換：實物材質顏色／依股價指標著色';
    this.toolsEl.appendChild(this.colorBtn);
    stage.append(cv,this.lines,this.labelsEl,this.infoEl,this.toolsEl);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.05;
    this.scene=new THREE.Scene();
    try{this.scene.environment=studioEnv(this.renderer);}catch(e){}
    this.scene.add(new THREE.HemisphereLight(0xdde6f0,0x1a1f2a,1.1));
    const d1=new THREE.DirectionalLight(0xffffff,1.8);d1.position.set(3,5,4);this.scene.add(d1);
    const d2=new THREE.DirectionalLight(0x88aaff,.6);d2.position.set(-4,2,-3);this.scene.add(d2);
    this.camera=new THREE.PerspectiveCamera(40,1,.01,500);
    this.controls=new OrbitControls(this.camera,cv);
    this.controls.enableDamping=true; this.controls.dampingFactor=.12; this.controls.enablePan=true; this.controls.screenSpacePanning=true;
    this.root=new THREE.Group(); this.scene.add(this.root);
    this.blocks=[]; this.geos=new Set(); this.mats=[]; this.key=null; this.t=0; this.target=0; this.anim=null;
    this.hover=null; this.selected=null; this.dirty=true; this.mouse=null; this.needPick=false; this.ray=new THREE.Raycaster();
    this.disposed=false;
    this._bind(); this._resize();
    this.ro=new ResizeObserver(()=>this._resize()); this.ro.observe(stage);
    const loop=()=>{if(this.disposed)return;this.raf=requestAnimationFrame(loop);this._frame();}; loop();
  }
  _bind(){
    const cv=this.canvas; let down=null;
    this._on=[];
    const on=(el,ev,fn,opt)=>{el.addEventListener(ev,fn,opt);this._on.push([el,ev,fn,opt]);};
    on(this.controls,'change',()=>{this.dirty=true;});
    on(cv,'pointermove',e=>{this._setMouse(e);this.needPick=true;});
    on(cv,'pointerleave',()=>{this.mouse=null;this._setHover(null);});
    on(cv,'pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};});
    on(cv,'pointerup',e=>{
      if(!down)return; const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y), dt=performance.now()-down.t; down=null;
      if(moved>6||dt>600)return;
      this._setMouse(e); const code=this._pick();
      if(code&&this.cb.onPick)this.cb.onPick(code);
    });
    on(this.labelsEl,'click',e=>{const l=e.target.closest('.v3l');if(l&&this.cb.onPick)this.cb.onPick(l.dataset.code);});
    on(this.labelsEl,'pointerover',e=>{const l=e.target.closest('.v3l');if(l)this._setHover(l.dataset.code);});
    on(this.labelsEl,'pointerout',e=>{const l=e.target.closest('.v3l');if(l&&!l.contains(e.relatedTarget))this._setHover(null);});
    on(this.colorBtn,'click',()=>{this.colorMode=this.colorMode==='real'?'metric':'real';this._restyle();});
  }
  _info(){
    const code=this.hover||this.selected, b=code&&this.blocks.find(x=>x.code===code);
    const anyDetail=this.blocks.some(x=>x.detail);
    this.colorBtn.textContent=this.colorMode==='real'?'🎨 實物色':'📊 指標色';
    this.toolsEl.style.display=anyDetail?'':'none';
    if(!b){this.infoEl.innerHTML=anyDetail?'<span class="v3i-h">👆 指向或點選零件，看它在實物裡是什麼、做什麼</span>':'';this.infoEl.classList.toggle('on',anyDetail);return;}
    const note=(b.it.detail&&b.it.detail.note)||b.node.desc||'';
    const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    this.infoEl.innerHTML=`<b>${esc(b.node.name)}</b>${b.node.qty_label?` <span class="qty">${esc(b.node.qty_label)}</span>`:''}${note?`<div>${esc(note)}</div>`:''}`;
    this.infoEl.classList.add('on');
  }
  _setMouse(e){const r=this.canvas.getBoundingClientRect();this.mouse=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);}
  _pick(){
    if(!this.mouse)return null;
    this.ray.setFromCamera(this.mouse,this.camera);
    const objs=[];for(const b of this.blocks)if(b.visible)for(const m of b.meshes)objs.push(m);
    const hits=this.ray.intersectObjects(objs,false);
    // 機櫃框架這類外框只是細桿：射線先碰到框架、後面還有別的塊時，選後面那塊（框架仍可由標籤點選）
    const isFrame=h=>{const b=this.blocks.find(x=>x.code===h.object.userData.code);return b&&b.it.shape==='frame';};
    const hit=hits.find(h=>!isFrame(h))||hits[0];
    return hit?hit.object.userData.code:null;
  }
  _setHover(code){
    if(this.hover===code)return; this.hover=code; this.canvas.style.cursor=code?'pointer':'grab';
    this._restyle(); this.dirty=true;
    if(this.cb.onHover)this.cb.onHover(code);
  }
  _resize(){
    const w=Math.max(1,this.stage.clientWidth), h=Math.max(1,this.stage.clientHeight);
    this.renderer.setSize(w,h,false); this.canvas.style.width=w+'px'; this.canvas.style.height=h+'px';
    this.lines.setAttribute('viewBox',`0 0 ${w} ${h}`);
    this.camera.aspect=w/h; this.camera.updateProjectionMatrix(); this.dirty=true;
  }
  _clear(){
    for(const b of this.blocks){b.label.remove();}
    // 仿真模型的幾何與材質（含快取共用的）一併釋放
    this.root.traverse(o=>{if(o.isMesh){this.geos.add(o.geometry);if(o.material&&!this.mats.includes(o.material))this.mats.push(o.material);}});
    this.root.clear(); this.blocks=[];
    for(const g of this.geos)g.dispose(); this.geos.clear();
    for(const m of this.mats)m.dispose(); this.mats=[];
    if(this.grid){this.scene.remove(this.grid);this.grid.geometry.dispose();this.grid.material.dispose();this.grid=null;}
  }
  _build(o){
    this._clear();
    const L=computeLayout(o.product,o.focus,o.isRoot), {preset,items,ghosts}=L;
    this.preset=preset; this.ghosts=[]; this.view=L.view||null;
    const cache=geoCache();
    const recenter=g=>{const bx=new THREE.Box3().setFromObject(g);if(bx.isEmpty())return {c:new THREE.Vector3(),s:new THREE.Vector3(.1,.1,.1)};
      const c=bx.getCenter(new THREE.Vector3()), s=bx.getSize(new THREE.Vector3());for(const ch of g.children)ch.position.sub(c);return {c,s};};
    // 裝飾（托盤機殼、機櫃外框…）：不可點、跟著拆解移動
    for(const d of L.decor||[]){
      const K=new Kit(cache); d.build(K); const g=K.root, {c,s}=recenter(g);
      g.traverse(ch=>{if(ch.isMesh)ch.raycast=()=>{};}); this.root.add(g);
      this.ghosts.push({g,base:c,ex:new THREE.Vector3(...(d.ex||[0,0,0])),size:[s.x,s.y,s.z]});
    }
    // 仿真零件
    for(const it of items){
      if(!it.detail)continue;
      const K=new Kit(cache); it.detail.build(K); const g=K.root, {c,s}=recenter(g);
      it.pos=[c.x,c.y,c.z]; it.size=[Math.max(s.x,.01),Math.max(s.y,.01),Math.max(s.z,.01)];
      const meshes=[]; g.traverse(ch=>{if(ch.isMesh){ch.userData.code=it.code;meshes.push(ch);}}); g.userData.code=it.code;
      this.root.add(g);
      const label=document.createElement('div'); label.className='v3l off'; label.dataset.code=it.code; this.labelsEl.appendChild(label);
      this.blocks.push({it,code:it.code,node:it.node,detail:true,mats:[...K.mats.values()],inst:[{g,base:c.clone(),ex:new THREE.Vector3(...it.explode)}],meshes,label,lw:0,lh:0,visible:true,anchorY:it.size[1]/2});
    }
    // 沒有對應模型的節點：排在模型右側一列
    const pend=items.filter(it=>it.slot==='pending');
    if(pend.length){
      const bb=new THREE.Box3(); for(const b of this.blocks)bb.expandByObject(b.inst[0].g); for(const s of this.ghosts)bb.expandByObject(s.g);
      const sz=bb.isEmpty()?1:Math.max(.2,bb.getSize(new THREE.Vector3()).length()*.08);
      pend.forEach((it,i)=>{it.size=[sz,sz*.6,sz];it.pos=[(bb.isEmpty()?0:bb.max.x)+sz*1.2,(bb.isEmpty()?0:bb.min.y)+sz*.3+i*sz*.9,(bb.isEmpty()?0:(bb.min.z+bb.max.z)/2)];it.explode=[sz*.6,0,0];});
    }
    if(ghosts.length){
      const gm=new THREE.MeshStandardMaterial({color:0x8b949e,metalness:.1,roughness:.8,transparent:true,opacity:.22,depthWrite:false});
      const gl=new THREE.LineBasicMaterial({color:0x8b949e,transparent:true,opacity:.35});
      this.mats.push(gm,gl);
      for(const it of ghosts){
        const {g}=buildShape(it,gm,gl,this.geos);
        (MIRRORS[it.mirror]||[[1,1,1]]).forEach((s,i)=>{
          const gi=i?g.clone(true):g; this.root.add(gi);
          this.ghosts.push({g:gi,base:new THREE.Vector3(it.pos[0]*s[0],it.pos[1]*s[1],it.pos[2]*s[2]),ex:new THREE.Vector3(it.explode[0]*s[0],it.explode[1]*s[1],it.explode[2]*s[2]),size:it.size});
        });
      }
    }
    for(const it of items){
      if(it.detail)continue;
      const mat=new THREE.MeshStandardMaterial({color:0x566173,metalness:.25,roughness:.62,transparent:true});
      const lineMat=new THREE.LineBasicMaterial({color:0x0b0f15,transparent:true,opacity:.55});
      this.mats.push(mat,lineMat);
      const {g,meshes}=buildShape(it,mat,lineMat,this.geos);
      const signs=MIRRORS[it.mirror]||[[1,1,1]];
      const inst=[], allMeshes=[];
      signs.forEach((s,i)=>{
        const gi=i?g.clone(true):g;
        const base=new THREE.Vector3(it.pos[0]*s[0],it.pos[1]*s[1],it.pos[2]*s[2]);
        const ex=new THREE.Vector3(it.explode[0]*s[0],it.explode[1]*s[1],it.explode[2]*s[2]);
        gi.traverse(ch=>{if(ch.isMesh){ch.userData.code=it.code;allMeshes.push(ch);}});
        gi.userData.code=it.code; this.root.add(gi); inst.push({g:gi,base,ex});
      });
      const label=document.createElement('div'); label.className='v3l off'; label.dataset.code=it.code;
      this.labelsEl.appendChild(label);
      this.blocks.push({it,code:it.code,node:it.node,mat,lineMat,inst,meshes:allMeshes,label,lw:0,lh:0,visible:true,anchorY:it.size[1]/2});
    }
    // 外框：組合＋拆解兩種狀態的包絡
    const box=new THREE.Box3();
    for(const b of this.blocks)for(const s of b.inst)for(const t of [0,1]){
      const c=s.base.clone().addScaledVector(s.ex,t), hs=new THREE.Vector3(...b.it.size).multiplyScalar(.5);
      box.expandByPoint(c.clone().sub(hs)); box.expandByPoint(c.clone().add(hs));
    }
    for(const s of this.ghosts)for(const t of [0,1]){
      const c=s.base.clone().addScaledVector(s.ex,t), hs=new THREE.Vector3(...s.size).multiplyScalar(.5);
      box.expandByPoint(c.clone().sub(hs)); box.expandByPoint(c.clone().add(hs));
    }
    this.box=box;
    const size=box.getSize(new THREE.Vector3()), span=Math.max(size.x,size.z)*1.3+.5;
    this.grid=new THREE.GridHelper(span,Math.max(4,Math.round(span/(span>8?1:.25))),0x2d333b,0x1a2029);
    this.grid.position.set((box.min.x+box.max.x)/2,box.min.y-.02,(box.min.z+box.max.z)/2);
    this.scene.add(this.grid);
  }
  fit(){
    if(!this.box)return;
    const c=this.box.getCenter(new THREE.Vector3()), r=Math.max(.5,this.box.getSize(new THREE.Vector3()).length()/2);
    const fov=THREE.MathUtils.degToRad(this.camera.fov), hfov=2*Math.atan(Math.tan(fov/2)*this.camera.aspect);
    const sz=this.box.getSize(new THREE.Vector3()), tall=sz.y>1.6*Math.max(sz.x,sz.z);
    const dist=r/Math.sin(Math.min(fov,hfov)/2)*(tall?1.02:.82);
    const dir=new THREE.Vector3(...(this.view||[.85,.55,1.45])).normalize();
    this.camera.position.copy(c).addScaledVector(dir,dist);
    this.camera.near=dist/100; this.camera.far=dist*20; this.camera.updateProjectionMatrix();
    this.controls.target.copy(c); this.controls.minDistance=r*.25; this.controls.maxDistance=r*6; this.controls.update();
    this.dirty=true;
  }
  // o: {key, product, focus, isRoot, selected, explode, startT, colorOf(node), baseColorOf, labelHtml(node), hitOf(node)->'full'|'part'|null|undefined, onlyTheme}
  show(o){
    this.o=o;
    if(o.key!==this.key){
      this.key=o.key; this._build(o); this.fit();
      this.t=o.startT!=null?o.startT:(o.explode?1:0); this.target=this.t; this.anim=null;
    }
    this.setExploded(!!o.explode);
    this.selected=o.selected; this.hover=null;
    for(const b of this.blocks){b.label.innerHTML=o.labelHtml?o.labelHtml(b.node):b.node.name;b.lw=0;}
    this._restyle(); this.dirty=true;
  }
  setExploded(on){
    const to=on?1:0; if(to===this.target&&!this.anim&&this.t===to)return;
    this.target=to; this.anim={from:this.t,to,start:performance.now(),dur:750};
    this.dirty=true;
  }
  _restyle(){
    const o=this.o||{}; const themeOn=!!o.hitOf;
    for(const b of this.blocks){
      const hit=themeOn?o.hitOf(b.node):null;
      b.visible=!(themeOn&&o.onlyTheme&&!hit);
      for(const s of b.inst)s.g.visible=b.visible;
      const sel=b.code===this.selected, hov=b.code===this.hover;
      let em=0x000000, ei=0;
      if(sel){em=0x2f81f7;ei=.6;}else if(hov){em=0x58a6ff;ei=.38;}else if(hit==='full'){em=0x14b8a6;ei=.5;}else if(hit==='part'){em=0x14b8a6;ei=.22;}
      if(b.detail){ // 仿真零件：保留實物材質，高亮用自發光；指標色模式才改成股價顏色
        const dim=themeOn&&!hit&&!sel&&!hov, metric=this.colorMode==='metric';
        const mc=metric?colorFrom(o.colorOf?o.colorOf(b.node):null,'#566173'):null;
        for(const m of b.mats){
          m.color.copy(metric?mc:m.userData.base);
          if(ei>0){m.emissive.setHex(em);m.emissiveIntensity=ei;}else{m.emissive.copy(m.userData.baseEmissive);m.emissiveIntensity=m.userData.baseEI;}
          const tr=dim||m.userData.baseTransparent; if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true;}
          m.opacity=dim?.14:m.userData.baseOpacity; m.depthWrite=!tr;
        }
        b.label.classList.toggle('sel',sel); b.label.classList.toggle('hov',hov);
        b.label.classList.toggle('hit',!!hit); b.label.classList.toggle('dim',dim);
        continue;
      }
      b.mat.color.copy(colorFrom(o.colorOf?o.colorOf(b.node):null,b.it.color));
      b.mat.emissive.setHex(em); b.mat.emissiveIntensity=ei;
      const dim=themeOn&&!hit&&!sel&&!hov;
      b.mat.opacity=dim?.2:(b.it.shape==='frame'?.95:1); b.mat.depthWrite=!dim;
      b.lineMat.color.setHex(sel?0x79c0ff:hov?0xa5d6ff:(hit?0x4fd1c5:0x0b0f15)); b.lineMat.opacity=sel||hov||hit?.95:(dim?.15:.55);
      b.label.classList.toggle('sel',sel); b.label.classList.toggle('hov',hov);
      b.label.classList.toggle('hit',!!hit); b.label.classList.toggle('dim',dim);
    }
    this._info();
    this.dirty=true;
  }
  _frame(){
    if(this.controls.update())this.dirty=true;
    if(this.anim){
      const k=Math.min(1,(performance.now()-this.anim.start)/this.anim.dur);
      this.t=this.anim.from+(this.anim.to-this.anim.from)*ease(k);
      if(k>=1){this.t=this.anim.to;this.anim=null;}
      this.dirty=true;
    }
    if(this.needPick&&this.mouse){this.needPick=false;this._setHover(this._pick());}
    if(!this.dirty)return;
    this.dirty=false;
    for(const b of this.blocks)for(const s of b.inst)s.g.position.copy(s.base).addScaledVector(s.ex,this.t);
    for(const s of this.ghosts||[])s.g.position.copy(s.base).addScaledVector(s.ex,this.t);
    this.renderer.render(this.scene,this.camera);
    this._layoutLabels();
  }
  _layoutLabels(){
    const W=this.stage.clientWidth, H=this.stage.clientHeight, cam=this.camera.position;
    const showAll=this.t>.6, placed=[]; let d='';
    const pr=b=>(b.code===this.selected?0:b.code===this.hover?1:2);
    const order=this.blocks.map(b=>({b,dist:b.inst[0].g.position.distanceTo(cam)})).sort((x,y)=>pr(x.b)-pr(y.b)||x.dist-y.dist);
    const over=(a)=>placed.some(p=>a.x<p.x+p.w+3&&a.x+a.w+3>p.x&&a.y<p.y+p.h+2&&a.y+a.h+2>p.y);
    for(const {b} of order){
      const L=b.label, must=pr(b)<2;
      if(!b.visible||(!showAll&&!must)){L.classList.add('off');continue;}
      const p0=b.inst[0].g.position, v=p0.clone(); v.y+=b.anchorY; v.project(this.camera);
      if(v.z>1||v.z<-1){L.classList.add('off');continue;}
      const c=p0.clone().project(this.camera);
      const ax=(v.x*.5+.5)*W, ay=(-v.y*.5+.5)*H, cx=(c.x*.5+.5)*W, cy=(-c.y*.5+.5)*H;
      if(!b.lw){L.classList.remove('off');b.lw=L.offsetWidth;b.lh=L.offsetHeight;}
      const w=b.lw,h=b.lh, s=h+4; let ok=null;
      // 候選位置：正上方 → 右側/左側（對準塊中心，適合火箭這種細長外形）→ 逐步上下錯開
      const cands=[[ax-w/2,ay-h-10,ax,ay],[cx+16,cy-h/2,cx,cy],[cx-w-16,cy-h/2,cx,cy]];
      for(let k=1;k<=3;k++)cands.push([ax-w/2,ay-h-10-k*s,ax,ay],[cx+16,cy-h/2-k*s,cx,cy],[cx-w-16,cy-h/2-k*s,cx,cy],[cx+16,cy-h/2+k*s,cx,cy],[cx-w-16,cy-h/2+k*s,cx,cy],[ax-w/2,ay+10+(k-1)*s,ax,ay]);
      let anc=null;
      for(const [x,y,qx,qy] of cands){
        const r={x:Math.max(2,Math.min(W-w-2,x)),y,w,h};
        if(r.y<2||r.y+h>H-2)continue;
        if(!over(r)){ok=r;anc=[qx,qy];break;}
      }
      if(!ok&&must){ok={x:Math.max(2,Math.min(W-w-2,ax-w/2)),y:Math.max(2,Math.min(H-h-2,ay-h-10)),w,h};anc=[ax,ay];}
      if(!ok){L.classList.add('off');continue;}
      placed.push(ok); L.classList.remove('off');
      L.style.transform=`translate(${ok.x.toFixed(1)}px,${ok.y.toFixed(1)}px)`;
      const lx=Math.max(ok.x,Math.min(ok.x+w,anc[0])), ly=Math.max(ok.y,Math.min(ok.y+h,anc[1]));
      if(Math.hypot(lx-anc[0],ly-anc[1])>5)d+=`M${lx.toFixed(1)} ${ly.toFixed(1)}L${anc[0].toFixed(1)} ${anc[1].toFixed(1)}`;
    }
    this.linePath.setAttribute('d',d);
  }
  // 測試/除錯用
  screenPos(code){
    const b=this.blocks.find(x=>x.code===code); if(!b)return null;
    const v=b.inst[0].g.position.clone().project(this.camera), r=this.canvas.getBoundingClientRect();
    return {x:r.left+(v.x*.5+.5)*r.width, y:r.top+(-v.y*.5+.5)*r.height};
  }
  stats(){
    return {key:this.key,preset:this.preset,blocks:this.blocks.length,ghosts:(this.ghosts||[]).length,codes:this.blocks.map(b=>b.code),
      slots:this.blocks.map(b=>b.it.slot),labels:this.labelsEl.querySelectorAll('.v3l').length,
      visibleLabels:this.labelsEl.querySelectorAll('.v3l:not(.off)').length,t:this.t,target:this.target,
      selected:this.selected,hover:this.hover,calls:this.renderer.info.render.calls,geometries:this.renderer.info.memory.geometries};
  }
  dispose(){
    if(this.disposed)return; this.disposed=true;
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    for(const [el,ev,fn,opt] of this._on)el.removeEventListener(ev,fn,opt);
    this._clear(); this.controls.dispose(); this.renderer.dispose();
    try{this.renderer.forceContextLoss();}catch(e){}
    if(this.scene.environment)this.scene.environment.dispose();
    this.canvas.remove(); this.lines.remove(); this.labelsEl.remove(); this.infoEl.remove(); this.toolsEl.remove();
  }
}
