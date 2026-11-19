// 🚗 純電動車（以 Tesla Model Y 的配置為原型）
// 依據：軸距 2,890mm、車長約 4.75m、寬約 1.92m；結構電池包分 4 區、冷卻流道沿車身縱向；前後一體壓鑄接電池包（Munro 拆解、InsideEVs/Electrek 報導）。
// 座標：+x＝車頭，y 朝上，z＝左右（+z 為右側）。
import {gridScene} from './kit.js';
const WB=2.89, FA=WB/2, RA=-WB/2, TR=.82, WR=.35, W=1.88;

function profile(){ // 車身側面輪廓（含輪拱）
  const P=[];
  P.push([-2.3,.4]);
  for(let i=0;i<=12;i++){const a=Math.PI-(i/12)*Math.PI;P.push([RA+Math.cos(a)*.43,.36+Math.sin(a)*.43]);}
  for(let i=0;i<=12;i++){const a=Math.PI-(i/12)*Math.PI;P.push([FA+Math.cos(a)*.43,.36+Math.sin(a)*.43]);}
  P.push([2.3,.38],[2.37,.55],[2.33,.78],[1.9,.95],[1.0,1.08],[.35,1.55],[-.4,1.63],[-1.4,1.6],[-2.05,1.3],[-2.33,1.02],[-2.37,.62]);
  return P;
}
function wheel(K,x,z){ K.at(x,WR,z,T=>{T.cyl(WR,WR,.255,'tire',0,0,0,'z',36);T.cyl(.24,.24,.262,'alu',0,0,0,'z',24);
  for(let i=0;i<5;i++)T.box(.2,.035,.27,'casting',Math.cos(i/5*Math.PI*2)*.1,Math.sin(i/5*Math.PI*2)*.1,0,0,0,i/5*Math.PI*2);
  T.cyl(.17,.17,.03,'steel',0,0,-Math.sign(z)*.09,'z',28);T.box(.08,.11,.06,'red',.13,.06,-Math.sign(z)*.1);}); }

function body(K){
  K.extrude(profile(),W,'paint',0,0,0);                                    // 外板（沖壓件＋烤漆，半透明以看內部）
  for(const s of[-1,1]){K.box(2.2,.12,.12,'alu',0,.42,s*.86);              // 門檻縱樑
    K.tube([[1.0,1.08,s*.82],[.4,1.5,s*.78],[-.4,1.6,s*.76],[-1.4,1.57,s*.78],[-2.0,1.28,s*.82]],.03,'steel',20);  // 車頂側樑
    K.box(.07,.95,.08,'steel',.05,1.0,s*.84,0,0,-.15); K.box(.08,1.0,.1,'steel',-.55,.98,s*.84);}            // A 柱／B 柱
  for(const x of[FA,RA])for(const s of[-1,1])wheel(K,x,s*TR);
  for(const x of[FA,RA])for(const s of[-1,1]){K.tube([[x,WR,s*TR*.82],[x+.05,WR+.08,s*.45],[x,WR+.05,s*.25]],.022,'dsteel',8);K.cyl(.035,.035,.42,'nickel',x+.04,.62,s*.62,'y',12);}  // 懸吊
  K.cyl(.012,.012,1.2,'steel',FA-.15,.38,0,'z',8);                          // 轉向橫拉桿
  castings(K);                                                               // 前後一體壓鑄件
}
function castings(K){ K.box(.62,.42,1.45,'casting',1.75,.55,0); K.box(.75,.48,1.45,'casting',-1.85,.58,0);
  for(let i=0;i<5;i++){K.box(.02,.4,1.4,'alu',1.5+i*.12,.56,0);K.box(.02,.45,1.4,'alu',-2.15+i*.15,.6,0);} }
function battery(K){ K.box(2.05,.12,1.5,'dsteel',-.05,.24,0); K.box(2.0,.01,1.45,'black',-.05,.305,0);
  for(let s=0;s<4;s++)K.box(.46,.004,1.38,'gray',-.82+s*.51,.312,0); }
function edrive(K){ for(const [x,dir] of[[RA,1],[FA,-1]])K.at(x,.42,0,T=>{T.cyl(.13,.13,.38,'casting',0,0,-.08,'z',24);T.box(.3,.26,.24,'casting',0,0,.18);T.box(.28,.1,.3,'alu',dir*.06,.18,-.05);T.cyl(.03,.03,1.4,'steel',0,0,0,'z',10);}); }
function power(K){ K.box(.4,.12,.55,'lgray',-.95,.37,0); K.box(.12,.12,.04,'black',-1.88,.86,-.93); K.cyl(.035,.035,.03,'black',-1.88,.86,-.95,'z',16); charger(K); }
function charger(K){ K.at(-3.0,0,-1.2,T=>{T.box(.25,1.5,.2,'white',0,.75,0);T.box(.2,.16,.005,'red',0,1.3,.1);T.tube([[0,1.05,.1],[.15,.7,.4],[.4,.85,.9],[.52,.86,1.0]],.025,'black',20);T.box(.3,.04,.3,'concrete',0,.02,0);}); }
function thermal(K){ K.at(1.85,.75,0,T=>{T.box(.08,.4,1.2,'alu',.45,-.05,0);T.fins(14,.06,.36,1.15,.45,-.05,0,'alu','z');T.box(.3,.22,.28,'black',0,0,.15);T.cyl(.07,.07,.2,'gray',-.05,-.1,-.25,'x',16);T.box(.12,.12,.14,'blue',.05,.05,-.05);}); }
function cockpit(K){ K.box(.08,.25,1.6,'plastic',.72,.92,0); K.box(.04,.24,.38,'black',.6,1.12,0,0,0,-.25); K.box(.006,.22,.36,'screen',.62,1.12,0,0,0,-.25);
  K.torus(.18,.02,'plastic',.62,1.02,-.37,'x'); K.box(.28,.06,.22,'chip',.62,.86,.4); }
function adas(K){ K.box(.06,.03,.16,'black',.6,1.4,0); for(const s of[-1,1]){K.box(.02,.03,.03,'black',-.55,1.18,s*.89);K.box(.03,.02,.02,'black',1.35,.82,s*.92);}
  K.box(.02,.03,.04,'black',-2.36,.88,0); K.box(.04,.08,.12,'dsteel',2.36,.52,0); K.box(.22,.04,.16,'pcbdk',.66,.8,.42); }
function harness(K){ for(const s of[-1,1])K.tube([[1.9,.6,s*.7],[1,.5,s*.8],[-1,.5,s*.8],[-2,.7,s*.7]],.012,'black',16);
  K.tube([[-.95,.4,.2],[-1.1,.36,.1],[RA,.45,.15]],.018,'orange',12); K.tube([[-.95,.4,-.2],[.2,.32,-.3],[FA-.2,.42,-.15]],.018,'orange',16);
  K.tube([[-.95,.4,-.25],[-1.5,.5,-.7],[-1.85,.84,-.9]],.014,'orange',12); }
function exterior(K){ K.box(.1,.035,1.5,'led',2.33,.8,0); for(const s of[-1,1])K.box(.08,.06,.45,'red',-2.34,1.0,s*.6);
  K.box(.12,.32,1.9,'plastic',2.32,.5,0); K.box(.12,.34,1.9,'plastic',-2.32,.55,0);
  K.box(.02,.5,1.5,'tint',.68,1.3,0,0,0,-.95); K.box(1.9,.01,1.5,'tint',-.5,1.62,0);
  for(const x of[-.15,-1.05])for(const s of[-1,1])K.at(x,.55,s*.4,T=>{T.box(.5,.12,.5,'plastic',0,0,0);T.box(.12,.62,.5,'plastic',-.24,.33,0,0,0,.12);});
  K.box(.55,.12,1.3,'plastic',-1.25,.55,0); }
function assembly(K){ K.box(6.5,.02,3.6,'ground',0,-.01,0); for(let i=-3;i<=3;i++)K.box(.04,.022,3.6,'yellow',i,-.0,0); }

export const EV_ROOT={view:[.9,.55,1.25],parts:{
  'ev.body':{build:body,ex:[0,1.0,0],note:'車身與底盤：沖壓鋼／鋁外板（半透明顯示）、門檻縱樑與 A/B 柱構成乘員艙，四輪懸吊與轉向掛在前後壓鑄件上。軸距 2.89m。'},
  'ev.battery':{build:battery,ex:[0,-.75,0],note:'電池包：平鋪在前後軸之間的車底，是全車最重（約 500kg 以上）也最貴的部件。Model Y 4680 結構電池包把座椅直接裝在電池蓋上，電池包本身就是地板。'},
  'ev.edrive':{build:edrive,ex:[0,-.35,0],note:'電驅動三合一：馬達＋逆變器＋減速器整合成一個單元，裝在後軸（雙馬達版前軸也有一個），直接驅動半軸。'},
  'ev.power':{build:power,ex:[0,.2,-1.0],note:'高壓充電與電源轉換：電池包上方的高壓接線盒（Tesla 稱 penthouse）整合 PDU、車載充電器 OBC 與 DC-DC；充電座在左後尾燈旁，車外是直流快充樁。'},
  'ev.thermal':{build:thermal,ex:[1.2,0,0],note:'熱管理：前艙的熱泵（電動壓縮機＋多通閥 Octovalve＋冷凝器）同時照顧車廂空調、電池與電驅溫度，冬天回收馬達廢熱。'},
  'ev.cockpit':{build:cockpit,ex:[0,.35,1.5],note:'智慧座艙：15 吋中控大螢幕、方向盤、儀表台，以及藏在副駕置物箱後方的車用電腦（座艙 SoC＋記憶體）。'},
  'ev.adas':{build:adas,ex:[0,1.55,0],note:'ADAS：擋風玻璃上緣 3 鏡頭、B 柱與前葉子板側邊各 2、車尾 1，共約 8 顆鏡頭（部分車型另有前雷達）；影像送進自駕運算電腦。'},
  'ev.harness':{build:harness,ex:[0,-.2,1.3],note:'線束：橘色是高壓線（電池→前後電驅、→充電座），黑色是低壓與訊號線束沿門檻走。新架構改用區域控制器以大幅縮短線束。'},
  'ev.exterior':{build:exterior,ex:[0,0,-1.6],note:'車燈與內外飾：前燈條、尾燈、前後保險桿、全景玻璃車頂與擋風玻璃、5 人座椅與中央扶手。'},
  'ev.assembly':{build:assembly,ex:[0,-1.2,0],note:'整車組裝：在總裝線把車身、電池包、電驅、內裝「合車」，再做檢測與路試；品牌車廠或代工（鴻海 MIH 等）。'},
}};

// —— 電池包內部 ——
function packTray(K){ K.box(2.05,.02,1.5,'dsteel',0,.01,0); for(const s of[-1,1])K.box(2.05,.12,.05,'alu',0,.07,s*.73); K.box(.05,.12,1.5,'alu',1.0,.07,0); K.box(.05,.12,1.5,'alu',-1.0,.07,0); }
function packLid(K){ K.box(2.05,.012,1.5,K.m('dsteel',{transparent:true,opacity:.45}),0,.0,0); for(const x of[.35,-.45])for(const s of[-1,1])K.box(.06,.02,.06,'steel',x,.015,s*.35); }
function cells(K){ const pts=[]; for(let sec=0;sec<4;sec++)for(let i=0;i<8;i++)for(let j=0;j<26;j++)pts.push([-.86+sec*.5+i*.054+(j%2)*.027,.06,-.65+j*.052]); K.cylInst(.023,.08,'blue',pts,'y',14); }
function ccs(K){ for(let sec=0;sec<4;sec++)for(let i=0;i<8;i++)K.box(.012,.004,1.32,'alu',-.86+sec*.5+i*.054,.103,0); for(let sec=0;sec<4;sec++)K.box(.42,.002,.04,'orange',-.69+sec*.5,.106,.68); }
function bms(K){ K.at(.97,.07,0,T=>{T.box(.08,.1,.5,'black',0,0,0);T.box(.004,.08,.44,'pcb',-.042,0,0);for(let i=0;i<5;i++)T.box(.006,.012,.012,'chip',-.046,0,-.16+i*.08);}); }
export const EV_BATTERY={view:[.7,1.1,1.0],decor:[{build:packTray,ex:[0,-.25,0]}],parts:{
  'ev.battery.pack':{build:packLid,ex:[0,.5,0],note:'電池包殼體與結構：鋁擠型邊框＋底板＋上蓋，要防水、防撞、散熱；結構電池包的上蓋同時是車廂地板（圖中半透明者）。'},
  'ev.battery.cell':{build:cells,ex:[0,.12,0],note:'電芯：Model Y 4680 版本約 800 多顆大圓柱電芯（直徑 46mm），分成 4 區、以結構膠固定；每顆電芯內是正極、負極、隔離膜捲在一起。'},
  'ev.battery.ccs':{build:ccs,ex:[0,.28,0],note:'CCS 電池連接系統：鋁排把電芯串並聯，FPC 軟板（橘色）沿線收集每串電壓與溫度送給 BMS。'},
  'ev.battery.bms':{build:bms,ex:[.35,.1,0],note:'BMS 電池管理系統：監控每串電芯電壓、溫度並做平衡，計算剩餘電量，異常時切斷高壓；核心是電池監控 AFE 晶片。'},
}};
// —— 4680 電芯拆解 ——
function can(K){ K.at(-.18,0,0,T=>{T.cyl(.023,.023,.08,K.m('nickel',{transparent:true,opacity:.35}),0,.04,0,'y',28);T.cyl(.023,.023,.004,'nickel',0,.082,0,'y',28);},0,0,0,3); }
function sheet(mat,coat){return K=>{K.at(0,0,0,T=>{T.box(.22,.0015,.08,mat,0,0,0);if(coat)T.box(.21,.0015,.075,coat,0,.0015,0);},0,0,0,1.6);};}
function electrolyte(K){ K.at(.25,0,0,T=>{T.cyl(.03,.03,.06,'glass',0,.03,0,'y',20);T.cyl(.028,.028,.04,K.m('cyan',{transparent:true,opacity:.5}),0,.02,0,'y',20);},0,0,0,2); }
function cellEquip(K){ K.at(.3,0,.25,T=>{T.box(.25,.3,.12,'lgray',0,.15,0);for(let i=0;i<4;i++)for(let j=0;j<3;j++)T.box(.04,.06,.01,'black',-.08+i*.055,.06+j*.08,.062);T.box(.1,.06,.005,'screen',0,.27,.063);}); }
export const EV_CELL={view:[.6,.9,1.1],parts:{
  'ev.battery.cell.cathode':{build:K=>K.at(0,.12,0,sheet('alu','gray')),ex:[0,.08,0],note:'正極材料：鎳錳鈷（NMC）或磷酸鋰鐵（LFP）粉末塗在鋁箔上，決定電池的能量密度與成本，是電芯最貴的材料。'},
  'ev.battery.cell.separator':{build:K=>K.at(0,.09,0,sheet('white')),ex:[0,.05,0],note:'隔離膜：幾十微米厚的多孔塑膠膜，夾在正負極之間防止短路，只讓鋰離子通過。'},
  'ev.battery.cell.anode':{build:K=>K.at(0,.06,0,sheet('copper','black')),ex:[0,.02,0],note:'負極材料：石墨（可摻矽）塗在銅箔上，充電時鋰離子嵌進石墨層間儲存。'},
  'ev.battery.cell.copperfoil':{build:K=>K.at(0,.03,0,sheet('copper')),ex:[0,-.02,0],note:'鋰電銅箔：負極的集流體，越薄（6μm 以下）電池越輕、能量密度越高；台灣有長春、金居等。'},
  'ev.battery.cell.electrolyte':{build:electrolyte,ex:[.1,0,0],note:'電解液：鋰鹽溶在有機溶劑中，充滿電芯內部，是鋰離子在正負極之間移動的通道。'},
  'ev.battery.cell.equipment':{build:cellEquip,ex:[.1,0,.1],note:'電芯製造與化成檢測設備：塗佈、捲繞、注液後要「化成」（首次充放電）與分容檢測，一顆顆篩選品質。'},
}};
EV_CELL.decor=[{build:can,ex:[-.15,0,0]}];

// —— 電驅動 ——
function housing(K){ K.at(0,.2,0,T=>{T.cyl(.16,.16,.36,K.m('casting',{transparent:true,opacity:.3}),-.1,0,0,'z',28);T.box(.32,.32,.22,K.m('casting',{transparent:true,opacity:.3}),.15,0,.05);}); }
function motor(K){ K.at(-.1,.2,0,T=>{T.cyl(.14,.14,.3,'dsteel',0,0,0,'z',32);for(let i=0;i<24;i++){const a=i/24*Math.PI*2;T.box(.012,.02,.34,'copper',Math.cos(a)*.115,Math.sin(a)*.115,0,0,0,a);}T.cyl(.07,.07,.3,'steel',0,0,0,'z',24);T.cyl(.018,.018,.5,'nickel',0,0,.05,'z',12);}); }
function reducer(K){ K.at(.16,.2,.05,T=>{T.cyl(.06,.06,.04,'steel',0,.06,.08,'z',24);T.cyl(.12,.12,.04,'steel',0,-.06,.08,'z',32);T.cyl(.03,.03,.04,'steel',0,.06,.14,'z',16);T.cyl(.025,.025,.6,'nickel',0,-.06,0,'z',12);}); }
function inverter(K){ K.at(.1,.42,-.02,T=>{T.box(.3,.09,.26,'alu',0,0,0);T.box(.1,.02,.08,'black',-.06,.055,0);T.box(.12,.05,.1,'yellow',.07,.06,0);}); }
export const EV_EDRIVE={view:[.8,.7,1.1],decor:[{build:housing,ex:[0,-.3,0]}],parts:{
  'ev.edrive.motor':{build:motor,ex:[-.35,0,0],note:'驅動馬達：外圈定子（矽鋼片疊層＋銅繞組）、中間轉子（內嵌永久磁鐵）。主流是永磁同步馬達，轉速可達 2 萬 rpm 以上。'},
  'ev.edrive.inverter':{build:inverter,ex:[0,.3,0],note:'逆變器：把電池直流電轉成三相交流電控制馬達轉速與扭力；核心是 SiC／IGBT 功率模組（黑）與薄膜電容（黃）。'},
  'ev.edrive.reducer':{build:reducer,ex:[.35,0,0],note:'減速器：馬達轉太快、扭力不夠，用一組齒輪減速增扭（約 9:1）再送到半軸與車輪；電動車只需單速。'},
}};
function lam(K){ for(let i=0;i<12;i++)K.cyl(.12,.12,.003,'dsteel',0,.06+i*.005,0,'y',32); K.cyl(.06,.06,.08,'black',0,.09,0,'y',24); }
function magnets(K){ for(let i=0;i<8;i++){const a=i/8*Math.PI*2;K.box(.04,.015,.06,'nickel',Math.cos(a)*.07,.06,Math.sin(a)*.07,0,-a,0);} }
function hairpin(K){ for(let i=0;i<10;i++){const a=i/10*Math.PI*2;K.tube([[Math.cos(a)*.1,.0,Math.sin(a)*.1],[Math.cos(a)*.1,.12,Math.sin(a)*.1],[Math.cos(a+.3)*.1,.15,Math.sin(a+.3)*.1],[Math.cos(a+.6)*.1,.12,Math.sin(a+.6)*.1],[Math.cos(a+.6)*.1,0,Math.sin(a+.6)*.1]],.006,'copper',16);} }
export const EV_MOTOR=gridScene({
  'ev.edrive.motor.steel':{build:lam,note:'無方向性電磁鋼片：0.2～0.35mm 薄矽鋼片一片片疊成定子與轉子，降低渦流損失；中鋼是台灣主要供應商。'},
  'ev.edrive.motor.magnet':{build:magnets,note:'稀土永磁（釹鐵硼）：嵌在轉子裡的強力磁鐵，讓永磁馬達效率高、體積小；原料高度集中在中國。'},
  'ev.edrive.motor.winding':{build:hairpin,note:'扁線與漆包線：新一代馬達用「髮夾式」扁銅線（hairpin）繞組，槽滿率高、散熱好、功率密度大。'},
},.35);
function sicModule(K){ K.box(.12,.02,.08,'black',0,.01,0); for(let i=0;i<3;i++)K.box(.025,.004,.03,'die',-.035+i*.035,.022,0); for(let i=0;i<6;i++)K.box(.006,.03,.004,'copper',-.05+i*.02,.03,.045); }
function filmCap(K){ K.box(.14,.07,.1,'yellow',0,.035,0); K.box(.13,.01,.02,'copper',0,.075,.03); }
export const EV_INVERTER=gridScene({
  'ev.edrive.inverter.module':{build:sicModule,s:1.4,note:'功率模組（SiC／IGBT）：多顆功率晶片封裝在一起，每秒開關數萬次把直流切成交流。SiC 耐高壓、損耗低，800V 平台必備。'},
  'ev.edrive.inverter.passive':{build:filmCap,s:1.4,note:'薄膜電容與車用被動元件：直流匯流排上的大容量薄膜電容吸收開關造成的電壓漣波，耐高溫、壽命長。'},
},.3);

// —— 車身子層 ——
function giga(K){ K.box(.62,.42,1.45,'casting',.5,.25,0); K.box(.75,.48,1.45,'casting',-.6,.27,0); for(let i=0;i<5;i++){K.box(.02,.4,1.4,'alu',.25+i*.12,.25,0);K.box(.02,.45,1.4,'alu',-.9+i*.15,.27,0);} }
function stamping(K){ K.extrude([[0,0],[1.4,0],[1.4,.5],[1.1,.85],[.2,.85],[0,.55]],.04,'paint',0,0,0); K.extrude([[0,0],[1.4,0],[1.4,.5],[1.1,.85],[.2,.85],[0,.55]],.01,'steel',0,0,-.05); }
function chassis(K){ K.cyl(.17,.17,.03,'steel',0,.35,0,'z',28); K.box(.08,.11,.07,'red',.13,.4,.02); K.tube([[0,.35,0],[.1,.4,.3],[.05,.38,.55]],.02,'dsteel',8); K.cyl(.035,.035,.42,'nickel',.04,.6,.12,'y',12); K.cyl(.01,.01,.5,'steel',-.15,.33,.3,'z',8); }
function tire(K){ wheel(K,0,0); }
function safety(K){ K.cyl(.12,.12,.06,'plastic',0,.3,0,'y',24); K.box(.03,.4,.003,'gray',.2,.3,0); K.sphere(.09,'white',-.2,.35,0); }
export const EV_BODY=gridScene({
  'ev.body.gigacasting':{build:giga,s:.8,note:'一體化壓鑄件：用 6,000～9,000 噸級壓鑄機一次壓出整個前／後車體骨架，取代原本 70 多個沖壓焊接件，降低成本與重量。'},
  'ev.body.stamping':{build:stamping,s:.8,note:'白車身沖壓件與結構件：車門、側圍、車頂等鋼／鋁板沖壓成形再焊接，外層烤漆。'},
  'ev.body.chassis':{build:chassis,note:'底盤：懸吊（避震器、控制臂）、轉向機構、煞車碟盤與卡鉗；新車型導入線控煞車與線控轉向。'},
  'ev.body.tire':{build:tire,note:'輪胎與輪圈：電動車重、扭力大，需專用低滾阻、高承載輪胎；正新、建大等台廠供應。'},
  'ev.body.safety':{build:safety,note:'被動安全零件：安全氣囊模組、安全帶捲收器、氣囊感測器等，撞擊時毫秒級觸發。'},
},1.4);
function press(K){ K.box(1.4,1.0,1.0,'yellow',0,.5,0); K.box(1.2,.5,.8,'dsteel',0,1.25,0); for(const s of[-1,1])K.cyl(.08,.08,1.6,'steel',s*.5,.8,.35,'y',16); K.box(1.6,.06,1.2,'concrete',0,.03,0); }
function ingots(K){ for(let i=0;i<3;i++)for(let j=0;j<2;j++)K.box(.5,.08,.12,'alu',0,.04+i*.085,-.07+j*.14); }
export const EV_GIGA=gridScene({
  'ev.body.gigacasting.press':{build:press,note:'大型壓鑄機（Giga Press）：鎖模力 6,000～9,000 噸，體積像一棟小房子，把熔融鋁合金高速壓進模具一次成形。'},
  'ev.body.gigacasting.alloy':{build:ingots,s:1.5,note:'免熱處理鋁合金：特殊配方鋁錠，壓鑄後不需熱處理就有足夠強度，避免大件熱處理變形。'},
},1.8);

// —— 其他模組：零件方陣 ——
const box=(w,h,d,m,extra)=>K=>{K.box(w,h,d,m,0,h/2,0);if(extra)extra(K);};
export const EV_POWER=gridScene({
  'ev.power.obc':{build:box(.3,.1,.25,'alu',K=>K.fins(10,.28,.02,.22,0,.11,0)),note:'車載充電器 OBC：用家用交流電充電時，把交流轉成直流給電池（約 11kW）。'},
  'ev.power.dcdc':{build:box(.22,.08,.18,'alu',K=>K.box(.05,.03,.05,'orange',.06,.095,0)),note:'DC-DC 轉換器：把 400/800V 高壓降成 12V（或 48V）給車燈、電腦等低壓系統。'},
  'ev.power.pdu':{build:box(.3,.12,.22,'lgray',K=>{for(let i=0;i<3;i++)K.cyl(.02,.02,.04,'orange',-.08+i*.08,.13,.06,'y',12);}),note:'高壓配電盒 PDU：高壓繼電器、保險絲與預充電路，把電池電力分配到電驅、空調壓縮機、充電座。'},
  'ev.power.inlet':{build:K=>{K.box(.12,.12,.05,'black',0,.06,0);for(let i=0;i<5;i++)K.cyl(.008,.008,.02,'brass',-.03+i*.015,.07,.03,'z',8);K.box(.06,.06,.25,'black',0,.06,.2);},s:1.5,note:'充電座與充電槍：車身端的插座（NACS／CCS），內含大電流端子與溫度感測。'},
  'ev.power.charger':{build:K=>{K.box(.25,1.2,.2,'white',0,.6,0);K.box(.2,.14,.005,'red',0,1.0,.1);},s:.5,note:'充電樁：直流快充樁把電網交流轉成直流，直接高功率灌進電池。'},
},.6);
function chargerModule(K){ K.box(.42,.09,.5,'lgray',0,.045,0); K.fins(10,.4,.02,.2,0,.1,-.12); for(let i=0;i<3;i++)K.sphere(.006,'led',-.1+i*.03,.06,.25,8); }
function liquidCable(K){ K.tube([[0,.05,0],[.2,.2,.1],[.4,.1,.3],[.6,.15,.2]],.03,'black',24); K.box(.1,.1,.18,'black',.62,.15,.2); }
export const EV_CHARGER=gridScene({
  'ev.power.charger.module':{build:chargerModule,note:'充電樁電源模組：每個 30～60kW 的 AC-DC 模組並聯堆疊出樁的總功率，內含 SiC 功率元件；台達、飛宏等。'},
  'ev.power.charger.cable':{build:liquidCable,note:'充電線纜：大功率快充電流可達 500A 以上，線內有冷卻液循環（液冷線纜）才不會過熱。'},
},.8);
export const EV_THERMAL=gridScene({
  'ev.thermal.heatpump':{build:K=>{K.cyl(.08,.08,.22,'gray',0,.08,0,'x',20);K.box(.12,.1,.12,'alu',.12,.08,0);},s:1.4,note:'熱泵空調與電動壓縮機：用電動壓縮機搬運熱量，冬天比電熱絲省電 2～3 倍，是電動車冬季續航的關鍵。'},
  'ev.thermal.valve':{build:K=>{K.box(.2,.12,.2,'black',0,.06,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;K.cyl(.012,.012,.05,'alu',Math.cos(a)*.09,.06,Math.sin(a)*.09,'y',10);}},s:1.4,note:'電子膨脹閥與集成模組：Tesla Octovalve 一個八通閥切換十幾種冷熱模式；三花、拓普等供應。'},
  'ev.thermal.coldplate':{build:K=>{K.box(.4,.01,.25,'alu',0,.005,0);for(let i=0;i<6;i++)K.box(.38,.006,.012,'nickel',0,.012,-.1+i*.04);},s:1.2,note:'電控與電池液冷散熱模組：冷卻液流過電池底部／側邊的鋁製液冷板，以及逆變器的散熱基板。'},
},.6);
export const EV_COCKPIT=gridScene({
  'ev.cockpit.display':{build:K=>{K.box(.38,.24,.02,'black',0,.12,0);K.box(.36,.22,.005,'screen',0,.12,.012);},note:'車用顯示器：15 吋左右中控螢幕與儀表，要耐高低溫、抗陽光眩光；友達、群創。'},
  'ev.cockpit.soc':{build:K=>{K.box(.25,.04,.2,'alu',0,.02,0);K.box(.05,.01,.05,'chip',0,.045,0);},note:'座艙晶片與車機：AMD／高通等 SoC 跑娛樂系統與介面，也有整合自駕運算的設計。'},
  'ev.cockpit.memory':{build:K=>{for(let i=0;i<4;i++)K.box(.03,.004,.04,'chip',-.05+i*.035,.002,0);},s:2,note:'車用記憶體：DRAM 與 NAND 需通過車規 AEC-Q100，溫度範圍與壽命要求遠高於消費性產品；南亞科、華邦電等。'},
  'ev.cockpit.pcb':{build:K=>{K.box(.25,.004,.18,'pcb',0,.002,0);for(let i=0;i<6;i++)K.box(.02,.006,.02,'chip',-.08+i*.03,.006,.03);},note:'車用 PCB：耐熱、耐震要求高，自駕與雷達板使用高頻 HDI 板材；敬鵬、健鼎、定穎等。'},
  'ev.cockpit.network':{build:K=>{K.box(.12,.03,.1,'black',0,.015,0);for(let i=0;i<4;i++)K.box(.015,.012,.02,'blue',-.04+i*.026,.03,.05);},s:1.5,note:'車用網通與乙太網路：車內改用高速車用乙太網串接區域控制器，取代龐雜的 CAN 線束。'},
},.5);
export const EV_ADAS=gridScene({
  'ev.adas.camera':{build:K=>{K.box(.05,.04,.06,'black',0,.02,0);K.cyl(.012,.012,.02,'glass',0,.02,.035,'z',16);},s:3,note:'車用鏡頭與攝像模組：全車 8 顆以上，鏡頭模組＝鏡片組＋影像感測器；大立光、玉晶光、亞光。'},
  'ev.adas.radar':{build:K=>{K.box(.1,.07,.025,'dsteel',0,.035,0);K.box(.09,.06,.005,'white',0,.035,.014);},s:2,note:'毫米波雷達與超音波感測：77GHz 雷達測距測速，不受雨霧影響；超音波用於泊車。'},
  'ev.adas.lidar':{build:K=>{K.box(.12,.05,.1,'black',0,.025,0);K.box(.1,.03,.005,'tint',0,.03,.051);},s:2,note:'光達 LiDAR：發射雷射掃描建立 3D 點雲，中國車廠大量採用；Tesla 則堅持純視覺。'},
  'ev.adas.soc':{build:K=>{K.box(.24,.03,.18,'pcbdk',0,.015,0);for(const x of[-.05,.05])K.box(.04,.008,.04,'chip',x,.034,0);},note:'自駕運算晶片：處理所有鏡頭影像跑神經網路（Tesla FSD 晶片、NVIDIA DRIVE Thor），以先進製程在台積電生產。'},
},.5);
export const EV_CAMERA=gridScene({'ev.adas.camera.cis':{build:K=>{K.box(.06,.004,.05,'substrate',0,.002,0);K.box(.03,.002,.025,'die',0,.005,0);},s:3,note:'車用影像感測器 CIS：把光轉成電訊號的晶片，車用要求高動態範圍與 LED 防閃爍；Sony、onsemi、豪威。'}},.4);
export const EV_ADASSOC=gridScene({
  'ev.adas.soc.foundry':{build:K=>{K.cyl(.15,.15,.004,'die',0,.002,0,'y',48);for(let i=-3;i<=3;i++)K.box(.3,.0045,.002,'chip',0,.002,i*.04);},note:'先進製程晶圓代工：自駕晶片多用台積電 7/5/4/3 奈米製程（圖為晶圓）。'},
  'ev.adas.soc.osat':{build:K=>{K.box(.05,.004,.05,'substrate',0,.002,0);K.box(.035,.003,.035,'lid',0,.0055,0);},s:3,note:'車用晶片封測：封裝與車規可靠度測試（溫度循環、老化），日月光、京元電等。'},
},.45);
export const EV_HARNESS=gridScene({
  'ev.harness.hv':{build:K=>K.tube([[0,.02,0],[.15,.08,.05],[.3,.03,.1]],.018,'orange',16),note:'高壓線束：橘色外皮是高壓警示色，連接電池、電驅、充電座，要遮蔽電磁干擾與耐高溫。'},
  'ev.harness.connector':{build:K=>{K.box(.06,.04,.05,'black',0,.02,0);K.box(.06,.04,.05,'gray',.065,.02,0);},s:2,note:'車用連接器與端子：全車上千個連接點，高壓連接器需防水、防觸電互鎖；貿聯、良維、胡連。'},
  'ev.harness.wire':{build:K=>{K.cyl(.08,.08,.06,'copper',0,.04,0,'z',24);K.cyl(.03,.03,.07,'wood',0,.04,0,'z',16);},note:'銅導線與線材：線束的原料銅線，電動車用銅量約是燃油車的 3～4 倍。'},
},.5);
export const EV_EXTERIOR=gridScene({
  'ev.exterior.lamp':{build:K=>{K.box(.3,.06,.08,'plastic',0,.03,0);K.box(.28,.02,.005,'led',0,.04,.042);},note:'車燈：LED 頭燈、尾燈與貫穿式燈條，高階有矩陣式／像素頭燈；堤維西、帝寶。'},
  'ev.exterior.bumper':{build:K=>K.extrude([[0,0],[.5,0],[.55,.15],[.5,.3],[0,.3]],.12,'plastic',0,0,0),note:'保險桿與外飾件：塑膠射出件，內藏雷達、感測器與吸能結構。'},
  'ev.exterior.glass':{build:K=>K.box(.5,.01,.35,'tint',0,.1,0,.3),note:'車用玻璃：擋風玻璃、全景玻璃車頂、側窗，要隔熱、隔音、支援抬頭顯示。'},
  'ev.exterior.interior':{build:K=>{K.box(.5,.12,.5,'plastic',0,.06,0);K.box(.12,.6,.5,'plastic',-.22,.36,0,0,0,.12);},s:.8,note:'座椅與內飾：座椅骨架、加熱通風、儀表板與門板飾件。'},
},.6);
export const EV_LAMP=gridScene({'ev.exterior.lamp.led':{build:K=>{K.box(.03,.008,.03,'ceramic',0,.004,0);K.box(.016,.003,.016,'led',0,.009,0);},s:4,note:'車用 LED：頭燈與尾燈的光源晶粒，車規需耐高溫高亮度；億光、隆達、晶電。'}},.4);
export const EV_ASSEMBLY=gridScene({
  'ev.assembly.brand':{build:K=>{K.box(.6,.35,.4,'white',0,.175,0);K.box(.4,.12,.01,'blue',0,.3,.205);},note:'電動車品牌車廠：Tesla、比亞迪等自己設計、組裝、銷售整車。'},
  'ev.assembly.contract':{build:K=>{K.box(.8,.3,.5,'lgray',0,.15,0);for(let i=0;i<4;i++)K.box(.12,.12,.01,'tint',-.27+i*.18,.18,.255);},note:'電動車代工與平台：鴻海 MIH 等提供開放平台或代工組裝，讓新品牌不必自建工廠。'},
},1.0);
export const EV_BMS=gridScene({'ev.battery.bms.afe':{build:K=>{K.box(.04,.004,.04,'substrate',0,.002,0);K.box(.025,.003,.025,'chip',0,.005,0);for(let i=0;i<8;i++)K.box(.003,.002,.006,'nickel',-.0175+i*.005,.002,.023);},s:3,note:'電池監控晶片 AFE：每顆監控 12～18 串電芯的電壓與溫度並做被動平衡，車規安全等級要求 ASIL-D；ADI、TI、恩智浦。'}},.4);
export const EV_DISPLAY=gridScene({'ev.cockpit.display.driver':{build:K=>{K.box(.06,.002,.01,'chip',0,.001,0);K.box(.1,.001,.03,'yellow',0,.0005,.02);},s:3,note:'顯示驅動 IC：控制面板上每個畫素的電壓，細長形晶片貼在面板邊緣或軟板上；聯詠、奇景、瑞鼎。'}},.4);
