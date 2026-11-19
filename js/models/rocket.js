// 🚀 運載火箭（以 SpaceX Falcon 9 Block 5 為原型）
// 依據：全高 69.8m、直徑 3.7m、一級約 41m、二級約 13.8m、整流罩 13.1m×5.2m；一級 9 具 Merlin 1D（Octaweb：8 具環繞＋1 具中央），
// 二級 1 具 Merlin 1D Vacuum（擴張比 165:1）；柵格翼為鑄造後加工的鈦合金；一級液氧槽在上、煤油槽在下。
import {gridScene} from './kit.js';
const R=1.85;                                   // 箭體半徑
const Y={eng:0,b0:2.4,b1:40,is1:46.5,s2:55.8,f0:56.6,f1:69.8};

function merlin(K,x,y,z,s=1,vac=false){ K.at(x,y,z,T=>{
  const nz=vac?[[1.6,-3.0],[1.05,-1.6],[.42,-.55],[.2,0]]:[[.46,-1.1],[.33,-.6],[.19,-.15],[.15,0]];
  T.lathe(nz,vac?'niobium':'soot',0,0,0,32,vac?'mvac':'m1d');
  T.cyl(.2,.17,.5,'inconel',0,.25,0,'y',20); T.cyl(.13,.13,.3,'steel',.25,.45,0,'y',14); T.tube([[.25,.3,0],[.4,.1,.15],[.42,-.3,.2]],.05,'soot',10);
},0,0,0,s); }
function engines(K){ K.cyl(R*.92,R,.9,'dsteel',0,Y.b0-.45,0,'y',32);
  merlin(K,0,1.5,0); for(let i=0;i<8;i++){const a=i/8*Math.PI*2;merlin(K,Math.cos(a)*1.2,1.5,Math.sin(a)*1.2);} }
function booster(K){ K.cyl(R,R,Y.b1-Y.b0,'white',0,(Y.b0+Y.b1)/2,0,'y',40); K.cyl(R*1.003,R*1.003,4,'soot',0,Y.b0+2,0,'y',40);
  K.box(.18,Y.b1-Y.b0-2,.12,'lgray',0,(Y.b0+Y.b1)/2,R+.04);                    // 外部線槽 raceway
  for(const y of[16.2,30])K.cyl(R*1.004,R*1.004,.05,'lgray',0,y,0,'y',40); }
function interstage(K){ K.cyl(R,R,Y.is1-Y.b1,'carbon',0,(Y.b1+Y.is1)/2,0,'y',40); }
function upper(K){ K.cyl(R,R,Y.s2-Y.is1,'white',0,(Y.is1+Y.s2)/2,0,'y',40); merlin(K,0,Y.is1,0,1,true); }
function fairing(K){ const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push([2.6*Math.sqrt(Math.max(0,1-Math.pow(Math.max(0,t-.45)/.55,2))),t*13.1]);}
  K.lathe(pts,'white',0,Y.f0,0,40,'fair'); K.box(.04,13,5.25,'lgray',0,Y.f0+6.5,0); K.cyl(R,2.6,.8,'white',0,Y.s2+.4,0,'y',40); }
function recovery(K){ for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4, c=Math.cos(a), s=Math.sin(a);
    K.at(c*(R+.12),5.5,s*(R+.12),T=>{T.box(.35,9,.18,'carbon',0,0,0);T.box(.4,.5,.25,'dsteel',0,-4.4,0);},0,-a,0);
    K.at(c*(R+.1),Y.is1-.9,s*(R+.1),T=>{for(let k=0;k<6;k++){T.box(1.2,.02,.06,'dsteel',0,-.5+k*.2,0);T.box(.02,1.1,.06,'dsteel',-.55+k*.22,0,0);}},0,-a+Math.PI/2,0);}
  for(const s of[-1,1])K.box(.3,.4,.3,'lgray',s*(R+.1),Y.is1-.3,0); }
function avionics(K){ for(const y of[Y.b1-.6,Y.s2-.5])for(let i=0;i<6;i++){const a=i/6*Math.PI*2;K.box(.35,.25,.25,'dsteel',Math.cos(a)*(R-.3),y,Math.sin(a)*(R-.3));} }
function power(K){ for(let i=0;i<3;i++)K.box(.3,.2,.2,'black',Math.cos(i*2.1)*(R-.25),Y.b1-.2,Math.sin(i*2.1)*(R-.25)); K.box(.06,Y.b1-Y.b0-3,.05,'orange',.12,(Y.b0+Y.b1)/2,R+.11); }
function propellant(K){ K.at(9,0,0,T=>{T.sphere(2.2,'white',0,2.6,-2.5);T.cyl(1.4,1.4,7,'lgray',0,1.6,3,'x',24);for(let i=0;i<6;i++)T.cyl(.3,.3,3,'yellow',-3+i*.7,1.5,7,'y',14);
  T.tube([[-1,1,0],[-4,.6,0],[-7,.5,0],[-8.2,1.5,0]],.15,'lgray',20);}); }
function ground(K){ K.box(26,1,22,'concrete',0,-.5,0); K.box(4,1.02,22,'soot',0,-.5,0);
  K.at(-5,0,0,T=>{for(const s of[-1,1])T.box(.3,60,.3,'gray',-.6,30,s*1.2);for(let j=0;j<20;j++)T.box(.2,.2,2.6,'gray',-.6,2+j*3,0);for(let j=0;j<4;j++)T.box(3.1,.2,.2,'gray',.9,12+j*14,0);});
  K.at(-9,0,-7,T=>{T.cyl(.3,.4,3,'lgray',0,1.5,0);T.lathe([[2,0],[1.4,.6],[.2,1]],'white',0,3.2,0,24,'trk');}); }

export const ROCKET_ROOT={view:[1.1,.25,1.35],parts:{
  'rocket.fairing':{build:fairing,ex:[0,9,0],note:'整流罩：高 13.1m、直徑 5.2m 的碳纖維蜂巢夾層殼，分成兩半保護衛星穿過大氣層，入軌前分離；Falcon 9 會用降落傘回收重複使用。'},
  'rocket.upper':{build:upper,ex:[0,5,0],note:'上面級（二級）：單一具 Merlin 真空版引擎，大型噴嘴延伸段平時藏在級間段裡；把酬載從約 70km 高度推到軌道，可多次點火。'},
  'rocket.interstage':{build:interstage,ex:[0,2.5,0],note:'級間段：黑色碳纖維結構，連接一、二級並包住二級引擎噴嘴，內有氣動推桿負責分離；頂部裝柵格翼與冷氣推進器。'},
  'rocket.avionics':{build:avionics,ex:[7,0,0],note:'航電與導引控制：一、二級各有航電艙，三重備援飛行電腦、慣性導航、遙測，負責姿態控制、引擎節流與回收導航。'},
  'rocket.booster':{build:booster,ex:[0,0,0],note:'一級：約 41m 高的鋁鋰合金推進劑槽（液氧在上、煤油在下），外側長條是線槽；回收後可重複飛行 20 次以上。'},
  'rocket.engine':{build:engines,ex:[0,-5,0],note:'引擎：9 具 Merlin 1D（Octaweb 排列：8 具環繞＋1 具中央），合計起飛推力約 7,600kN；中央與周圍部分引擎可重新點火用於回收。'},
  'rocket.recovery':{build:recovery,ex:[-5,0,0],note:'回收系統：級間段頂部 4 片鈦合金柵格翼控制下降方向、底部 4 支碳纖維著陸腿落地前展開、冷氣推進器做姿態微調，最後降落在海上無人船。'},
  'rocket.propellant':{build:propellant,ex:[6,0,0],note:'推進劑與加注：發射台旁的低溫儲槽（液氧球槽、煤油槽、氦氣瓶組）經臍帶管路在發射前幾十分鐘快速加注過冷推進劑。'},
  'rocket.power':{build:power,ex:[0,0,5],note:'電力與線束：飛行電池供應航電與致動器，外部線槽內的線束連接各級；配電單元控制火工品與閥件時序。'},
  'rocket.ground':{build:ground,ex:[0,-4,0],note:'地面設施：發射台（含導焰槽）、豎立火箭並提供臍帶連接的起豎架、遠處的測控追蹤天線。'},
}};

// —— Merlin 引擎拆解 ——
function chamber(K){ K.at(0,.9,0,T=>{T.lathe([[.46,-1.1],[.33,-.6],[.19,-.15],[.15,0],[.2,.3],[.2,.55]],'soot',0,0,0,32,'ch');}); }
function nozzleExt(K){ K.lathe([[.9,-1.6],[.6,-.8],[.42,0]],'niobium',0,1.6,0,32,'nze'); }
function turbopump(K){ K.at(.7,1.2,0,T=>{T.cyl(.16,.16,.5,'inconel',0,0,0,'y',20);T.cyl(.22,.22,.12,'steel',0,.28,0,'y',24);T.cyl(.18,.18,.12,'steel',0,-.28,0,'y',24);T.tube([[0,-.34,0],[.2,-.6,.1],[.3,-1.1,.15]],.06,'soot',10);}); }
function injector(K){ K.at(0,1.75,0,T=>{T.cyl(.22,.22,.08,'steel',0,0,0,'y',28);T.cyl(.04,.04,.18,'nickel',0,-.12,0,'y',12);}); }
function valves(K){ for(let i=0;i<3;i++)K.at(-.6,1.4+i*.2,(i-1)*.25,T=>{T.box(.14,.14,.14,'alu',0,0,0);T.cyl(.04,.04,.25,'steel',0,0,0,'x',10);}); }
function ignition(K){ K.at(-.35,2.0,.35,T=>{T.cyl(.08,.08,.3,'lgray',0,0,0,'y',14);T.tube([[0,-.15,0],[.15,-.3,-.1],[.3,-.25,-.35]],.015,'steel',8);}); }
function fasteners(K){ for(let i=0;i<8;i++)K.at(.5+i*.06,.2,.5,T=>{T.cyl(.012,.012,.1,'nickel',0,0,0,'y',8);T.cyl(.022,.022,.02,'nickel',0,.05,0,'y',6);}); }
function wholeEngine(K){ merlin(K,-1.3,1.3,-.6,.8); }
export const ROCKET_ENGINE={view:[.9,.4,1.2],parts:{
  'rocket.engine.chamber':{build:chamber,ex:[0,-.6,0],note:'燃燒室與噴嘴：煤油與液氧在燃燒室以約 3,300°C 燃燒，經喉部加速、鐘形噴嘴膨脹產生推力；壁內有冷卻流道讓燃料先流過降溫（再生冷卻）。'},
  'rocket.engine.turbopump':{build:turbopump,ex:[.6,0,0],note:'渦輪泵：燃氣發生器驅動渦輪，帶動泵把推進劑以極高壓力打進燃燒室，轉速數萬 rpm；旁邊黑色管是渦輪排氣。'},
  'rocket.engine.injector':{build:injector,ex:[0,.5,0],note:'噴注器：燃燒室頂端把燃料與氧化劑霧化混合；Merlin 用針栓式（pintle）噴注器，結構簡單、燃燒穩定。'},
  'rocket.engine.valves':{build:valves,ex:[-.5,0,0],note:'閥件與調節器：主閥控制推進劑流量，實現節流與關機重啟；需在極低溫與高壓下精準動作。'},
  'rocket.engine.ignition':{build:ignition,ex:[-.3,.4,.3],note:'點火系統：Merlin 用 TEA-TEB（三乙基鋁／三乙基硼）一接觸氧氣就自燃，冒出綠色火焰點燃引擎，可多次點火。'},
  'rocket.engine.fasteners':{build:fasteners,ex:[.3,-.3,.4],note:'航太扣件與精密加工件：高溫合金螺栓、管接頭與機加零件，數量多、認證嚴；台灣有航太扣件廠打入供應鏈。'},
  'rocket.engine.brand':{build:wholeEngine,ex:[-.4,0,-.3],note:'引擎整機：完整的一具 Merlin 1D，單具海平面推力約 845kN、推重比超過 150。'},
}};
function billets(K){ K.box(.3,.12,.15,'copper',-.1,.06,0); K.box(.3,.12,.15,'inconel',.25,.06,0); }
function am(K){ K.box(.8,1.2,.7,'lgray',0,.6,0); K.box(.5,.4,.01,'tint',0,.75,.356); K.box(.15,.1,.01,'screen',.25,1.05,.356); }
export const ROCKET_CHAMBER=gridScene({
  'rocket.engine.chamber.alloy':{build:billets,s:2,note:'銅合金與鎳基超合金：燃燒室內壁用高導熱銅合金（如 GRCop）散熱，外殼與渦輪用 Inconel 等鎳基超合金耐高溫。'},
  'rocket.engine.chamber.am':{build:am,note:'金屬 3D 列印設備：引擎噴注器、燃燒室冷卻流道等複雜零件用雷射粉床熔融列印，大幅減少零件數與製程。'},
  'rocket.engine.chamber.nozzle':{build:nozzleExt,s:.6,note:'噴嘴延伸段：接在主噴嘴後端的薄殼，真空版引擎用鈮合金做成大型輻射冷卻延伸段，擴張比 165:1。'},
},1.6);
function impeller(K){ K.cyl(.15,.15,.04,'inconel',0,.02,0,'y',32); for(let i=0;i<10;i++){const a=i/10*Math.PI*2;K.box(.12,.05,.012,'inconel',Math.cos(a)*.08,.06,Math.sin(a)*.08,0,-a,0);} }
export const ROCKET_TURBO=gridScene({'rocket.engine.turbopump.casting':{build:impeller,s:3,note:'精密鑄鍛件與葉輪：渦輪泵的葉輪與渦輪盤，以超合金精密鑄造再五軸加工，要承受高速旋轉與溫差。'}},.6);

// —— 一級結構 ——
function tanks(K){ K.cyl(R,R,12,K.m('lgray',{transparent:true,opacity:.35}),0,9,0,'y',40); K.cyl(R*.98,R*.98,11,'liquidrp1',0,9,0,'y',40);
  K.cyl(R,R,22,K.m('lgray',{transparent:true,opacity:.35}),0,27.2,0,'y',40); K.cyl(R*.98,R*.98,21,'liquidlox',0,27.2,0,'y',40);
  for(const y of[3,15,16.2,38.2])K.sphere(R*.98,'alu',0,y,0,24).scale.set(1,.35,1); K.cyl(.25,.25,13,'alu',0,9,0,'y',14); }
function fsw(K){ K.at(6,0,0,T=>{for(const s of[-1,1])T.box(.4,6,.4,'yellow',0,3,s*3);T.box(.6,.6,6.8,'yellow',0,6,0);T.box(.6,1,.6,'dsteel',0,5.2,0);T.cyl(.08,.08,.6,'steel',0,4.5,0,'y',12);T.cyl(2,2,2,'alu',0,1,0,'y',32);}); }
function octaweb(K){ K.cyl(R,R,.9,'dsteel',0,1.6,0,'y',40); for(let i=0;i<8;i++){const a=i/8*Math.PI*2;K.box(.15,.8,R*1.8,'steel',0,1.6,0,0,a,0);} K.cyl(.5,.5,.9,'steel',0,1.6,0,'y',20); }
function srb(K){ K.at(-6,0,0,T=>{T.cyl(.8,.8,16,'white',0,9,0,'y',28);T.lathe([[.8,0],[.5,1.5],[.05,2.4]],'white',0,17,0,28,'srbn');T.lathe([[.7,-1.4],[.4,0]],'soot',0,1,0,24,'srbz');}); }
export const ROCKET_BOOSTER={view:[1.1,.3,1.3],parts:{
  'rocket.booster.tank':{build:tanks,ex:[0,0,0],note:'推進劑槽體：一級上方是液氧槽（淺藍）、下方是 RP-1 煤油槽（黃），液氧經中央輸送管穿過煤油槽送到引擎；槽壁是鋁鋰合金，兩槽之間以艙壁（圓頂封頭）分隔。'},
  'rocket.booster.fsw':{build:fsw,ex:[2,0,0],note:'摩擦攪拌銲設備：用高速旋轉的銲頭把鋁鋰合金板「攪」在一起，不熔化母材，焊縫強度高；巨大的龍門設備銲接整段槽體。'},
  'rocket.booster.thrust':{build:octaweb,ex:[0,-2,0],note:'推力結構 Octaweb：一級底部的八角形結構，把 9 具引擎的推力（約 7,600kN）傳到箭體，也保護引擎間的管線。'},
  'rocket.booster.srb':{build:srb,ex:[-2,0,0],note:'固體助推器：Falcon 9 沒有使用，但許多火箭（亞利安、H3、宇宙神）在芯級旁綁 0～6 具固體助推器增加起飛推力。'},
}};
function plates(K){ for(let i=0;i<4;i++)K.box(1.2,.03,.8,'alu',0,.015+i*.035,0); }
function coil(K){ K.cyl(.45,.45,.5,'steel',0,.45,0,'z',32); K.cyl(.2,.2,.52,'dsteel',0,.45,0,'z',20); }
function domes(K){ for(let i=0;i<4;i++)K.lathe([[.6,0],[.55,.15],[.35,.32],[.02,.38]],'alu',-.9+i*.6,0,0,32,'dome'); }
export const ROCKET_TANK=gridScene({
  'rocket.booster.tank.alli':{build:plates,note:'鋁鋰合金板材：比傳統鋁合金輕約 10%、強度更高，用於 Falcon 9 的推進劑槽壁。'},
  'rocket.booster.tank.ss':{build:coil,note:'不鏽鋼板捲：SpaceX 星艦改用 30X 系列不鏽鋼，便宜、耐超低溫且耐再入高溫；以板捲焊成圓環。'},
  'rocket.booster.tank.dome':{build:domes,s:.8,note:'槽頂封頭：每個推進劑槽上下各一個圓頂形封頭（一級共 4 個），以旋壓或拼焊成形。'},
},1.6);

// —— 上面級 ——
function s2tank(K){ K.cyl(R,R,8.5,K.m('white',{transparent:true,opacity:.35}),0,5,0,'y',40); K.cyl(R*.98,R*.98,4.8,'liquidlox',0,3.4,0,'y',40); K.cyl(R*.98,R*.98,3.2,'liquidrp1',0,7.5,0,'y',40); }
function mvac(K){ merlin(K,0,.75,0,1,true); }
function copv(K){ for(let i=0;i<3;i++){const a=i/3*Math.PI*2;K.at(Math.cos(a)*.9,3.4,Math.sin(a)*.9,T=>{T.cyl(.3,.3,1.4,'carbon',0,0,0,'y',20);T.sphere(.3,'carbon',0,.7,0,16);T.sphere(.3,'carbon',0,-.7,0,16);});} }
function rcs(K){ for(const s of[-1,1])K.at(s*(R+.1),9,0,T=>{T.box(.25,.35,.3,'lgray',0,0,0);for(let k=0;k<3;k++)T.cyl(.03,.05,.12,'steel',s*.15,-.1+k*.1,0,'x',10);}); }
export const ROCKET_UPPER={view:[1.1,.35,1.3],parts:{
  'rocket.upper.tank':{build:s2tank,ex:[0,2,0],note:'二級推進劑槽：同樣是鋁鋰合金的液氧槽與煤油槽，長度比一級短得多。'},
  'rocket.upper.mvac':{build:mvac,ex:[0,-3,0],note:'真空版引擎 Merlin 1D Vacuum：深灰色大噴嘴（鈮合金延伸段）在真空中讓燃氣充分膨脹，推力約 934kN（短噴嘴版約 840kN），可多次點火。'},
  'rocket.upper.copv':{build:copv,ex:[3.2,0,0],note:'高壓氣瓶 COPV：碳纖維纏繞的高壓氦氣瓶，泡在液氧槽內，用來給推進劑槽增壓；2016 年 AMOS-6 爆炸即與 COPV 有關，之後改良為 COPV 2.0。'},
  'rocket.upper.rcs':{build:rcs,ex:[0,2,3],note:'二級姿態控制系統：用氮氣冷氣推進器微調姿態，讓二級在滑行段轉向、部署衛星。'},
}};
// —— 整流罩 ——
function halves(K){ const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push([2.6*Math.sqrt(Math.max(0,1-Math.pow(Math.max(0,t-.45)/.55,2))),t*13.1]);}
  const half=K.m('white',{side:2});
  K.lathe(pts,half,0,0,-.5,40,'fair',0,Math.PI); K.lathe(pts,half,0,0,.5,40,'fair',Math.PI,Math.PI); }
function prepreg(K){ K.cyl(.6,.6,1.6,'carbon',0,.6,0,'z',28); K.box(1.6,.01,1.2,'carbon',0,.005,1.3); }
function sepMech(K){ for(let i=0;i<4;i++)K.at(0,1+i*3,2.6,T=>{T.cyl(.08,.08,.5,'nickel',0,0,0,'z',10);T.box(.2,.2,.1,'dsteel',0,0,-.25);}); }
function parafoil(K){ K.at(0,10,-6,T=>{for(let i=0;i<8;i++)T.box(1,.15,5,i%2?'red':'white',-3.5+i*1,0,0,.0,0,0);for(let i=0;i<8;i++)T.tube([[-3.5+i,0,0],[-1+i*.3,-4,0],[0,-8,0]],.02,'lgray',8);}); }
function adapter(K){ K.lathe([[1.85,0],[1.2,1.2],[.8,1.4]],'alu',0,-1.5,0,32,'pa'); K.torus(.82,.06,'nickel',0,-.1,0); }
export const ROCKET_FAIRING={view:[1,.35,1.3],parts:{
  'rocket.fairing.shell':{build:halves,ex:[0,0,0],note:'整流罩殼體 ×2 片：左右兩半在入軌前沿中線縱向分開，各自掉落後由船隻回收、翻新再用（每對約值數百萬美元）。'},
  'rocket.fairing.cfrp':{build:prepreg,ex:[4,0,0],note:'碳纖維與預浸材：整流罩是碳纖維面板＋鋁蜂巢芯的夾層結構，用預浸材（已含樹脂的碳布）鋪層後進熱壓罐固化；台灣有碳纖維廠。'},
  'rocket.fairing.sep':{build:sepMech,ex:[0,0,2],note:'整流罩分離機構：Falcon 9 用氣動推桿與非火工分離系統把兩半推開，減少震動、避免碎屑污染衛星。'},
  'rocket.fairing.recovery':{build:parafoil,ex:[0,2,-2],note:'整流罩回收系統：每半片有冷氣推進器控制姿態、翼傘（parafoil）滑翔減速，濺落海面後由回收船吊起。'},
  'rocket.fairing.adapter':{build:adapter,ex:[0,-3,0],note:'酬載適配器與分離環：錐形結構連接二級與衛星，夾緊帶在入軌後鬆開、彈簧把衛星推離。'},
}};
// —— 其他模組 ——
export const ROCKET_INTERSTAGE=gridScene({
  'rocket.interstage.shell':{build:K=>K.cyl(R,R,6.5,'carbon',0,3.25,0,'y',36),s:.4,note:'級間段殼體：碳纖維複合材料圓筒（黑色），既是結構也包住二級的真空引擎噴嘴。'},
  'rocket.interstage.sep':{build:K=>{for(let i=0;i<4;i++)K.at(Math.cos(i*1.57)*.6,0,Math.sin(i*1.57)*.6,T=>{T.cyl(.08,.08,.6,'nickel',0,.3,0,'y',12);T.box(.2,.12,.2,'dsteel',0,0,0);});},note:'分離推桿與火工品：Falcon 9 用氣動推桿把兩級推開（可重複測試），許多火箭則用爆炸螺栓或線性切割索等火工品。'},
  'rocket.interstage.hotstage':{build:K=>{K.cyl(1.2,1.2,.5,'steel',0,.25,0,'y',36,true);for(let i=0;i<16;i++){const a=i/16*Math.PI*2;K.box(.2,.4,.06,'dsteel',Math.cos(a)*1.2,.25,Math.sin(a)*1.2,0,-a,0);}},s:.7,note:'熱分離環：星艦採用的「熱分離」——二級引擎在分離前就點火，燃氣從環上的開口排出；省下分離時的速度損失。'},
},1.8);
export const ROCKET_RECOVERY=gridScene({
  'rocket.recovery.gridfin':{build:K=>{for(let k=0;k<7;k++){K.box(1.4,.04,.08,'dsteel',0,.1+k*.2,0);K.box(.04,1.25,.08,'dsteel',-.6+k*.2,.7,0);}},note:'柵格翼 ×4：像窗格的翼面，高超音速時仍能有效控制方向；Block 5 改用一體鑄造再加工的鈦合金，不怕再入高溫、可重複使用。'},
  'rocket.recovery.legs':{build:K=>{K.box(.35,4,.2,'carbon',0,2,0,0,0,.4);K.box(.12,3,.12,'alu',.7,1.5,0,0,0,-.2);K.box(.5,.15,.4,'dsteel',-.8,.07,0);},s:.6,note:'著陸腿 ×4：碳纖維＋鋁蜂巢結構，飛行時收在一級底部，落地前以氦氣展開；後來改為可自動調平。'},
  'rocket.recovery.cgt':{build:K=>{K.box(.4,.5,.4,'lgray',0,.25,0);for(let k=0;k<3;k++)K.cyl(.03,.06,.15,'steel',.25,.12+k*.13,0,'x',10);},s:1.5,note:'冷氣推進器：用高壓氮氣噴出產生小推力，一級分離後翻轉箭體、調整姿態。'},
  'rocket.recovery.droneship':{build:K=>{K.box(10,1,5,'dsteel',0,.5,0);K.box(10,.05,5,'gray',0,1.03,0);K.cyl(1.6,1.6,.02,'white',0,1.06,0,'y',36,true);K.box(.8,2,4.6,'dsteel',-4.7,2,0);},s:.3,note:'海上回收船（無人駁船）：一級在海上降落的平台，靠推進器精準定位；甲板中央是降落目標。'},
  'rocket.recovery.catch':{build:K=>{K.box(.6,8,.6,'gray',0,4,0);for(let j=0;j<8;j++)K.box(.5,.08,.7,'gray',0,j+.5,0);for(const s of[-1,1])K.box(3,.3,.25,'gray',1.5,6,s*.9,0,s*.25,0);},s:.4,note:'發射塔捕捉臂：星艦用發射塔上的「筷子」機械臂直接接住返航的助推器，省去著陸腿的重量。'},
},1.6);
function boxDev(w,h,d,m,extra){return K=>{K.box(w,h,d,m,0,h/2,0);if(extra)extra(K);};}
export const ROCKET_AVIONICS=gridScene({
  'rocket.avionics.fc':{build:K=>{for(let i=0;i<3;i++)K.box(.12,.08,.16,'dsteel',-.14+i*.14,.04,0);},s:1.5,note:'飛行電腦 ×3 備援：三台電腦同時運算並投票，任一台出錯仍可安全飛行；SpaceX 使用商用處理器加上備援架構。'},
  'rocket.avionics.ins':{build:boxDev(.12,.1,.12,'black',K=>K.cyl(.03,.03,.02,'steel',0,.11,0)),s:1.8,note:'慣性導航（IMU/GPS）：陀螺儀與加速度計測量姿態與加速度，結合 GPS 定位，是導引控制的基礎。'},
  'rocket.avionics.telemetry':{build:K=>{K.box(.15,.04,.1,'alu',0,.02,0);K.box(.12,.005,.12,'white',.15,.05,0,0,0,.3);},s:1.6,note:'遙測與通訊：把上千個感測數據與影像即時傳回地面，飛行中也接收指令；天線貼在箭體外側。'},
  'rocket.avionics.fts':{build:boxDev(.14,.08,.12,'orange'),s:1.6,note:'自主飛行終止系統（AFTS）：火箭偏離安全範圍時由機上電腦自行判斷並引爆終止，不需地面人員下令。'},
  'rocket.avionics.tvc':{build:K=>{K.cyl(.04,.04,.4,'nickel',0,.2,0,'y',12);K.cyl(.025,.025,.3,'steel',0,.5,0,'y',10);K.box(.1,.08,.1,'dsteel',.07,.1,0);},s:1.3,note:'推力向量控制致動器：每具引擎 2 支液壓／電動致動器推動噴嘴擺動（gimbal），改變推力方向來轉向。'},
},.5);
export const ROCKET_FC=gridScene({
  'rocket.avionics.fc.pcb':{build:K=>{K.box(.2,.004,.15,'pcbblue',0,.002,0);for(let i=0;i<5;i++)K.box(.02,.005,.02,'chip',-.06+i*.03,.005,.03);},s:1.5,note:'高可靠度 PCB 與基板材料：航太板要通過熱循環與振動測試，常用聚醯亞胺等耐高溫材料。'},
  'rocket.avionics.fc.chip':{build:K=>{K.box(.05,.005,.05,'ceramic',0,.0025,0);K.box(.03,.003,.03,'lid',0,.0065,0);},s:3,note:'處理器與功率晶片：抗輻射或經篩選的處理器、FPGA 與功率元件，陶瓷封裝耐溫耐震。'},
},.45);
export const ROCKET_GRIDFIN=gridScene({'rocket.recovery.gridfin.ti':{build:K=>{for(let i=0;i<3;i++)K.box(.5,.1,.3,'nickel',0,.05+i*.11,0);},s:1.5,note:'鈦合金材料：耐熱、比強度高，Falcon 9 柵格翼以鈦合金一體鑄造後加工，可承受多次再入加熱。'}},.6);
export const ROCKET_PROPELLANT=gridScene({
  'rocket.propellant.lox':{build:K=>{K.sphere(.5,'white',0,.6,0,24);K.box(.1,.6,.1,'gray',0,.1,0);},note:'液態氧：-183°C 的氧化劑，Falcon 9 進一步過冷到約 -207°C 讓密度更高、裝更多推進劑。'},
  'rocket.propellant.rp1':{build:K=>K.cyl(.35,.35,1.2,'lgray',0,.4,0,'x',24),note:'火箭煤油（RP-1）：高度精煉的煤油，密度高、常溫可儲存，Falcon 9 也把它冷卻以增加密度。'},
  'rocket.propellant.ch4':{build:K=>{K.cyl(.35,.35,1.2,'blue',0,.6,0,'y',24);K.sphere(.35,'blue',0,1.2,0);},note:'液態甲烷／液化天然氣：星艦與新一代引擎改用甲烷，燃燒乾淨、積碳少，有利重複使用，也可在火星製造。'},
  'rocket.propellant.gas':{build:K=>{for(let i=0;i<5;i++)K.cyl(.1,.1,.9,i%2?'green':'yellow',-.24+i*.12,.45,0,'y',14);},note:'氦氣與氮氣：氦氣給推進劑槽增壓與驅動閥件，氮氣用於冷氣推進器與吹除管路。'},
  'rocket.propellant.gse':{build:K=>{K.box(.15,1.5,.15,'gray',0,.75,0);K.tube([[0,1.3,0],[.4,1.2,0],[.8,.6,0],[1,.3,0]],.04,'lgray',12);},note:'低溫加注設備：絕熱管路、閥門與泵，發射前數十分鐘把低溫推進劑快速灌進火箭。'},
},1.3);
export const ROCKET_POWER=gridScene({
  'rocket.power.battery':{build:boxDev(.2,.12,.15,'black',K=>K.box(.18,.01,.13,'yellow',0,.125,0)),s:1.5,note:'飛行電池：鋰電池組供應航電、閥件與致動器，一級回收段也要撐到落地。'},
  'rocket.power.harness':{build:K=>{for(let i=0;i<4;i++)K.tube([[0,.02+i*.02,0],[.2,.06+i*.02,.1],[.4,.03+i*.02,.15]],.008,i%2?'black':'orange',12);K.box(.05,.04,.05,'nickel',.42,.05,.15);},s:1.3,note:'線束與航太連接器：耐振動、耐溫差的線束與圓形連接器，貫穿各級傳電力與訊號。'},
  'rocket.power.pdu':{build:boxDev(.18,.1,.14,'alu',K=>{for(let i=0;i<4;i++)K.box(.02,.02,.01,'chip',-.05+i*.033,.06,.075);}),s:1.5,note:'配電單元與功率元件：分配電力並控制火工品、閥件的開關時序。'},
},.5);
export const ROCKET_GROUND=gridScene({
  'rocket.ground.pad':{build:K=>{K.box(2,.3,2,'concrete',0,.15,0);K.box(.5,.32,2,'soot',0,.16,0);K.box(.12,2.5,.12,'gray',-.8,1.25,0);},note:'發射台與發射塔：承受起飛時的高溫與震動，導焰槽把火焰導開；塔架提供臍帶連接與人員通道。'},
  'rocket.ground.test':{build:K=>{K.box(1.2,.2,1.2,'concrete',0,.1,0);for(const s of[-1,1])K.box(.15,1.6,.15,'gray',s*.4,1,0);K.box(1,.15,.3,'gray',0,1.8,0);merlin(K,0,1.5,0,.6);},note:'引擎試車台：引擎出廠前要在台上點火試車，驗證推力與耐久；SpaceX 在德州麥格雷戈測試。'},
  'rocket.ground.taiwan':{build:K=>{K.cyl(.12,.12,1.6,'white',0,.9,0,'y',16);K.lathe([[.12,0],[.06,.2],[.01,.3]],'white',0,1.7,0,16,'twn');K.box(.25,.08,.25,'concrete',0,.04,0);},note:'台灣國產火箭計畫：國家太空中心推動自主發射能力，民間如晉陞太空開發小型火箭，並建置發射場。'},
  'rocket.ground.tracking':{build:K=>{K.cyl(.08,.12,.8,'lgray',0,.4,0);K.lathe([[.6,0],[.4,.25],[.05,.4]],'white',0,.85,0,24,'trk2');},note:'測控與追蹤站：大型天線追蹤火箭與衛星、接收遙測並發送指令。'},
},1.6);
