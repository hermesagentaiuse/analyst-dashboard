// 🛰️ 低軌衛星（以 Starlink V2 Mini 衛星＋Standard 標準版天線為原型）
// 依據：V2 Mini 約 800kg、機身約 4m、兩片太陽能板各約 52.5m²、氬氣霍爾推進器、E 頻段回傳（SpaceX／Spaceflight Now／The Register）；
// 用戶天線依 Starlink 官方規格：盤面 513×303mm、立桿 Ø34mm、X 型底座 563×328×122mm、內建馬達自動對星；路由器 254×180×65mm。
// 根層為「示意比例」：衛星縮小約 1/8、天線放大約 2.5 倍，方便同框比較。
import {gridScene} from './kit.js';

// —— 衛星（實際尺寸，公尺；機身長邊 x，太陽能板沿 ±z 展開，-y 朝地球）——
function satBus(K){ K.box(4.1,.35,2.7,'mylar',0,0,0); K.box(4.12,.02,2.72,'foil',0,.18,0);
  for(const s of[-1,1]){K.box(.3,.12,.5,'dsteel',0,0,s*1.6);}                                   // 太陽能板根部鉸鏈
  K.at(2.1,0,0,T=>{T.cyl(.2,.25,.3,'dsteel',.1,0,0,'x',20);T.cyl(.12,.12,.32,'blue',.12,0,0,'x',16);});   // 霍爾推進器
  for(const x of[-1.5,-1.1])K.box(.15,.12,.15,'black',x,.24,.9);                               // 星追蹤器
  K.box(1.2,.02,.9,'white',-1.2,.19,-.6); }                                                      // 散熱面
function solar(K){ for(const s of[-1,1])K.at(0,0,s*(1.85+6.4),T=>{T.box(4.1,.04,12.8,'solar',0,0,0);
  for(let i=1;i<10;i++)T.box(4.12,.045,.02,'nickel',0,0,-6.4+i*1.28);for(let j=1;j<4;j++)T.box(.02,.045,12.8,'nickel',-2.05+j*1.025,0,0);
  T.box(.08,.06,1.6,'dsteel',0,0,-s*7.0);}); }
function payload(K){ for(let i=0;i<4;i++)K.box(1.6,.06,1.1,'lgray',-1.0+(i%2)*2.0,-.21,-.6+Math.floor(i/2)*1.2);
  K.cyl(.25,.25,.05,'white',1.6,-.2,.9,'y',20);                                                  // E 頻段回傳天線
  for(const [x,z] of[[1.8,-1.1],[-1.8,-1.1],[-1.8,1.1]])K.at(x,.28,z,T=>{T.cyl(.12,.14,.2,'dsteel',0,0,0,'y',16);T.sphere(.1,'mylar',0,.14,0,14);});  // 星間雷射 ×3
}
function satellite(K,s=1){ K.at(0,0,0,T=>{satBus(T);solar(T);payload(T);},0,0,0,s); }

// —— 用戶天線（實際尺寸）——
function dishPanel(K){ const pts=[],r=.06,w=.303,h=.513; for(let i=0;i<4;i++){const cx=(i===0||i===3?1:-1)*(w/2-r),cy=(i<2?1:-1)*(h/2-r);for(let k=0;k<=6;k++){const a=(i*Math.PI/2)+k/6*Math.PI/2;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}} return pts; }
function terminal(K,s=1){ K.at(0,0,0,T=>{
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4+.4*(i%2?1:-1);T.box(.32,.02,.03,'white',Math.cos(a)*.15,.04,Math.sin(a)*.15,0,-a,-.25);}  // X 型底座
  T.cyl(.017,.017,.4,'white',0,.24,0,'y',16);                                                  // 立桿（內含對星馬達）
  T.at(0,.46,0,U=>{U.extrude(dishPanel(),.035,'white',0,0,0);U.extrude(dishPanel(),.003,'offwhite',0,0,.02);},-.75,0,0);
  T.tube([[0,.05,0],[.1,.01,.05],[.4,.01,.2]],.004,'black',12);
},0,0,0,s); }
function router(K){ K.extrude([[0,0],[.065,0],[.04,.254],[.0,.254]],.18,'white',0,0,0); K.box(.18,.01,.075,'offwhite',.03,.005,0); }

// —— 地面站 ——
function gateway(K,s=1){ K.at(0,0,0,T=>{T.box(7,.05,5,'concrete',0,.025,0);
  for(let i=0;i<8;i++){const x=-2.6+(i%4)*1.75,z=(i<4?-1:1)*1.1;T.cyl(.35,.4,.5,'lgray',x,.3,z,'y',16);T.sphere(.75,'white',x,1.25,z,24);}
  T.box(1.6,1.2,1,'lgray',2.6,.6,0); for(let i=0;i<22;i++)T.box(.04,.8,.04,'gray',-3.5+i*(7/21),.4,2.5);
},0,0,0,s); }

function beams(K){ const b=K.m('cyan',{transparent:true,opacity:.12,emissive:0x37b6d6,emissiveIntensity:.3});
  K.tube([[0,5.6,0],[-1.2,2.8,.5],[-2.4,.9,1]],.04,b,10); K.tube([[0,5.6,0],[1.5,2.8,-.5],[3,.6,-1]],.06,b,10); }

export const LEO_ROOT={view:[.9,.45,1.3],decor:[{build:beams,ex:[0,0,0]}],parts:{
  'leo.sat':{build:K=>K.at(0,6,0,T=>satellite(T,.17),.45,.5,0),ex:[0,1.5,0],note:'衛星本體（示意縮小）：Starlink V2 Mini 約 800kg，扁平機身約 4m，兩片太陽能板展開翼展約 30m；朝地球那面是相位陣列天線，上方有星間雷射。運行高度約 550km。'},
  'leo.terminal':{build:K=>K.at(-2.4,0,1,T=>{terminal(T,2.5);T.at(.8,0,.3,router,0,-.4,0,2.5);}),ex:[-1.2,0,.6],note:'用戶終端（示意放大）：Standard 天線盤面 51×30cm，立桿內馬達讓天線自動朝向最佳角度；搭配 Wi-Fi 路由器。平均耗電 50～75W。'},
  'leo.ground':{build:K=>K.at(3,0,-1,T=>gateway(T,.35)),ex:[1.4,0,-.6],note:'地面站與閘道：一圈白色天線罩（內有約 1.5m 碟形天線）追蹤頭頂經過的衛星，把用戶流量接上光纖網路；一個閘道服務數百公里範圍。'},
}};

// —— 衛星本體拆解（實際尺寸）——
function satStack(K){ K.at(9,0,0,T=>{for(let i=0;i<10;i++)T.box(4.1,.3,2.7,i%2?'mylar':'foil',0,.15+i*.32,0);T.box(.3,3.4,.3,'dsteel',2.2,1.7,1.5);T.box(.3,3.4,.3,'dsteel',2.2,1.7,-1.5);}); }
function boards(K){ for(let i=0;i<4;i++)K.at(-1.4+i*.95,.05,0,T=>{T.box(.8,.02,.6,'pcbblue',0,0,0);for(let j=0;j<6;j++)T.box(.08,.02,.08,'chip',-.3+j*.12,.02,.15);});
  K.tube([[-1.8,.06,-.8],[-.5,.1,-.9],[.8,.08,-.85],[1.9,.06,-.8]],.03,'orange',20); }
export const LEO_SAT={view:[.8,.7,1.2],parts:{
  'leo.sat.payload':{build:payload,ex:[0,-1.6,0],note:'酬載：朝地面的 4 片大型相位陣列天線（Ku/Ka 波段服務用戶）、E 頻段回傳天線，以及 3 具星間雷射（上方）讓衛星彼此傳資料、不必每次落地。'},
  'leo.sat.bus':{build:K=>{satBus(K);solar(K);},ex:[0,0,0],note:'衛星平台：扁平機身（外覆金色隔熱膜）、兩片各約 52.5m² 的太陽能板、氬氣霍爾推進器（機身一端）、星追蹤器與散熱面，提供電力、姿態、推進與熱控。'},
  'leo.sat.interconnect':{build:boards,ex:[0,1.8,0],note:'衛星 PCB、連接器與線束：機身內的電子板（射頻、電源、星載電腦）與線束（圖為抽出示意），需耐輻射與真空。'},
  'leo.sat.integration':{build:satStack,ex:[2,0,0],note:'衛星整合組裝：扁平設計讓衛星像一疊鬆餅般堆疊（Falcon 9 一次約 20～60 顆依版本而定），在 SpaceX 華盛頓州工廠量產，每天可造數顆。'},
}};
export const LEO_PAYLOAD=gridScene({
  'leo.sat.payload.array':{build:K=>{K.box(1.6,.06,1.1,'lgray',0,.03,0);for(let i=0;i<16;i++)for(let j=0;j<11;j++)K.box(.06,.008,.06,'gold',-.75+i*.1,.064,-.5+j*.1);},s:.5,note:'衛星相位陣列天線 ×4～6：上千個天線單元由晶片個別控制相位，電子式改變波束方向，同時服務多個地面區域。'},
  'leo.sat.payload.rf':{build:K=>{K.box(.6,.04,.4,'pcbblue',0,.02,0);for(let i=0;i<5;i++)K.box(.06,.02,.06,'chip',-.2+i*.1,.05,0);K.box(.1,.08,.1,'alu',.25,.04,.15);},note:'Ku/Ka/E 頻段射頻鏈：放大器、混頻器、濾波器，把數位訊號轉成高頻無線電；GaAs／GaN 晶片為主（穩懋、宏捷科）。'},
  'leo.sat.payload.isl':{build:K=>{K.cyl(.12,.14,.2,'dsteel',0,.1,0,'y',16);K.sphere(.1,'mylar',0,.24,0,14);},s:1.6,note:'星間雷射鏈路 ×3～4：衛星之間用雷射光通訊組成太空網狀網路，海上與偏遠地區也能不經地面站傳輸。'},
},.9);
function battPack(K){ for(let i=0;i<3;i++)for(let j=0;j<4;j++)K.cyl(.03,.03,.14,'blue',-.06+i*.065,.07,-.1+j*.065,'y',14); }
function wheels(K){ for(let i=0;i<3;i++)K.at(-.25+i*.25,.12,0,T=>{T.cyl(.1,.1,.06,'dsteel',0,0,0,'y',24);T.cyl(.04,.04,.08,'steel',0,0,0,'y',12);}); K.box(.12,.1,.12,'black',.5,.05,0); }
function hall(K){ K.cyl(.2,.25,.3,'dsteel',0,.15,0,'y',20); K.torus(.15,.03,'blue',0,.31,0); K.cyl(.12,.12,.5,'lgray',.5,.25,0,'y',16); }
export const LEO_BUS=gridScene({
  'leo.sat.bus.structure':{build:K=>{K.box(1.2,.1,.8,'alu',0,.05,0);for(let i=0;i<4;i++)K.box(.04,.1,.8,'nickel',-.45+i*.3,.1,0);},s:.6,note:'結構與機構件：鋁合金／碳纖維機身框架，以及太陽能板展開鉸鏈、分離機構。'},
  'leo.sat.bus.solar':{build:K=>{K.box(1.0,.02,.6,'solar',0,.01,0);for(let i=1;i<6;i++)K.box(.01,.025,.6,'nickel',-.5+i*.167,.012,0);},s:.6,note:'太陽能板 ×2：衛星唯一的能源，矽或砷化鎵太陽電池；V2 Mini 兩片各約 52.5m²。'},
  'leo.sat.bus.battery':{build:battPack,s:1.4,note:'鋰電池組：衛星進入地球陰影時（每圈約 30 分鐘）靠電池供電。'},
  'leo.sat.bus.eps':{build:K=>{K.box(.3,.1,.25,'alu',0,.05,0);K.fins(8,.28,.03,.2,0,.115,0);},s:1.2,note:'電源調節與配電：管理太陽能板與電池之間的充放電，穩定供電給酬載與各系統。'},
  'leo.sat.bus.adcs':{build:wheels,s:.9,note:'姿態控制：反作用輪（旋轉的飛輪）調整衛星朝向，星追蹤器（拍星空比對）判斷姿態，讓天線始終對準地面。'},
  'leo.sat.bus.propulsion':{build:hall,s:.9,note:'霍爾推進器：用電場把氬氣離子加速噴出，推力很小（約 170mN）但極省燃料；負責升軌、維持軌道與壽命結束時離軌墜毀。'},
  'leo.sat.bus.thermal':{build:K=>{K.box(.6,.01,.4,'white',0,.005,0);K.box(.6,.005,.4,'foil',0,.02,.0);},s:.9,note:'熱控與散熱：多層隔熱膜（金色）擋住陽光，白色散熱面把電子設備的熱輻射到太空。'},
  'leo.sat.bus.obc':{build:K=>{K.box(.25,.08,.2,'dsteel',0,.04,0);K.box(.2,.005,.15,'pcbblue',0,.085,0);},s:1.3,note:'星載電腦：管理衛星運作、處理路由與指令，Starlink 使用大量商用級晶片搭配軟體容錯，以低成本量產。'},
},.8);
export const LEO_INTERCONNECT=gridScene({
  'leo.sat.interconnect.pcb':{build:K=>{K.box(.3,.006,.22,'pcbblue',0,.003,0);for(let i=0;i<4;i++)K.box(.03,.006,.03,'chip',-.09+i*.06,.008,.04);},s:1.4,note:'太空級 HDI／多層板：高頻射頻與高密度數位板，需耐熱循環與輻射；華通是 Starlink 衛星板的主要供應商之一。'},
  'leo.sat.interconnect.harness':{build:K=>{for(let i=0;i<3;i++)K.tube([[0,.02+i*.02,0],[.15,.05+i*.02,.08],[.3,.03+i*.02,.1]],.008,i?'black':'orange',12);},s:1.4,note:'太空線束與連接線：耐真空、低釋氣的線材與連接器。'},
  'leo.sat.interconnect.solder':{build:K=>{K.cyl(.05,.05,.07,'nickel',0,.035,0,'y',20);K.box(.08,.002,.06,'nickel',.1,.001,0);},s:2,note:'錫膏與焊接材料：把元件焊在 PCB 上，太空用需耐熱循環不裂；升貿等台廠供應。'},
},.5);

// —— 用戶天線拆解（實際尺寸，公尺）——
function dishShell(K){ K.at(0,.3,0,T=>{T.extrude(dishPanel(),.03,'white',0,0,-.02);},-Math.PI/2,0,0); }
function antennaBoard(K){ K.at(0,.33,0,T=>{T.extrude(dishPanel(),.004,'pcbdk',0,0,0);const pts=[];for(let i=0;i<14;i++)for(let j=0;j<24;j++)pts.push([-.13+i*.02,-.23+j*.02,.004]);T.boxInst(.012,.012,.002,'gold',pts);},-Math.PI/2,0,0); }
function mainboard(K){ K.at(0,.27,.0,T=>{T.box(.16,.003,.12,'pcb',0,0,0);T.box(.025,.004,.025,'chip',0,.003,0);for(let i=0;i<3;i++)T.box(.012,.003,.015,'chip',.05,.003,-.03+i*.025);}); }
function psu(K){ K.at(.25,.03,.15,T=>{T.box(.13,.05,.08,'white',0,0,0);T.tube([[.07,0,0],[.15,0,.05],[.2,.0,.12]],.004,'black',10);}); }
function mech(K){ K.cyl(.017,.017,.4,'white',0,.08,0,'y',16); K.cyl(.02,.02,.06,'dsteel',0,.25,0,'y',16);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4+.4*(i%2?1:-1);K.box(.32,.02,.03,'white',Math.cos(a)*.15,-.12,Math.sin(a)*.15,0,-a,-.25);} }
function cable(K){ K.tube([[-.05,-.1,0],[-.2,-.13,.1],[-.35,-.12,.25],[-.5,-.13,.3]],.004,'black',16); K.box(.02,.015,.03,'black',-.5,-.13,.3); }
function ems(K){ K.at(-.75,0,-.55,T=>{T.box(.35,.25,.25,'lgray',0,.125,0);T.box(.25,.12,.005,'tint',0,.16,.128);T.box(.4,.02,.08,'dsteel',0,.06,.2);}); }
export const LEO_TERMINAL={view:[.8,.9,1.2],parts:{
  'leo.terminal.antenna':{build:antennaBoard,ex:[0,.18,0],note:'相位陣列天線板：盤面內整片大型多層 PCB，正面排滿上千個天線單元（金色），背面是大量波束成形晶片，電子式控制波束追蹤高速飛過的衛星。'},
  'leo.terminal.mainboard':{build:mainboard,ex:[0,.05,.2],note:'主控板與晶片：數據機／主控 SoC 處理訊號、加密與軟體，連接路由器。'},
  'leo.terminal.power':{build:psu,ex:[.15,0,.1],note:'電源供應與 PoE：把市電轉成天線所需電力，經同一條線纜供電與傳資料（Standard 版電源整合在路由器內，早期版本為獨立電源盒）。'},
  'leo.terminal.router':{build:K=>K.at(.35,0,-.2,router),ex:[.2,0,-.1],note:'WiFi 路由器：楔形機身 254×180×65mm，雙頻 Wi-Fi，可再串接最多 12 個 Mesh 節點。'},
  'leo.terminal.mech':{build:mech,ex:[0,-.15,0],note:'機構件與外殼：白色天線罩與背殼、立桿與 X 型底座；立桿內的對星馬達讓天線自動傾斜到最佳角度。'},
  'leo.terminal.cable':{build:cable,ex:[-.1,-.08,.1],note:'線纜與連接器：15m 戶外線纜同時傳電力與資料，接頭要防水。'},
  'leo.terminal.ems':{build:ems,ex:[-.15,0,-.1],note:'終端組裝代工：天線板 SMT 打件、組裝與測試；SpaceX 自建產線並委託台廠（如啟碁等）代工部分產品。'},
}};
LEO_TERMINAL.decor=[{build:dishShell,ex:[0,.32,0]}];
export const LEO_ANTENNA=gridScene({
  'leo.terminal.antenna.pcb':{build:K=>{K.box(.25,.006,.18,'pcbdk',0,.003,0);for(let i=0;i<8;i++)K.box(.25,.0005,.18,i%2?'copper':'pcbdk',0,-.001-i*.0007,0);},s:1.2,note:'天線高頻多層 PCB：使用低損耗高頻板材的大尺寸多層板，天線、饋線與數位線路疊在一起。'},
  'leo.terminal.antenna.beamformer':{build:K=>{for(let i=0;i<5;i++)for(let j=0;j<4;j++)K.box(.02,.003,.02,'chip',-.05+i*.025,.0015,-.04+j*.025);},s:2,note:'終端波束成形／RF 晶片：每顆控制數個天線單元的相位與增益，整片天線需要數百顆；STMicro 等供應。'},
  'leo.terminal.antenna.rffe':{build:K=>{K.box(.03,.004,.03,'substrate',0,.002,0);K.box(.015,.002,.015,'die',0,.005,0);},s:3,note:'射頻前端 PA／LNA：功率放大器把發射訊號放大、低雜訊放大器放大微弱的接收訊號；穩懋代工大量 GaAs 晶片。'},
  'leo.terminal.antenna.element':{build:K=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++)K.box(.018,.002,.018,'gold',-.03+i*.02,.001,-.03+j*.02);},s:2.5,note:'天線單元、饋源與模組：一個個印刷在板上的貼片天線，排成陣列發射與接收。'},
},.35);
export const LEO_MAINBOARD=gridScene({
  'leo.terminal.mainboard.soc':{build:K=>{K.box(.03,.004,.03,'substrate',0,.002,0);K.box(.022,.003,.022,'lid',0,.0055,0);},s:3,note:'數據機／主控 SoC：Starlink 自研或客製晶片，負責調變解調與控制整個終端。'},
  'leo.terminal.mainboard.smt':{build:K=>{K.cyl(.03,.03,.05,'nickel',0,.025,0,'y',18);K.box(.06,.002,.04,'pcb',.07,.001,0);},s:2,note:'主板與天線板焊料：上千顆晶片與元件以錫膏 SMT 焊接，大尺寸板要控制翹曲。'},
},.3);
export const LEO_MECH=gridScene({
  'leo.terminal.mech.housing':{build:K=>K.at(0,.05,0,T=>T.extrude(dishPanel(),.03,'white',0,0,0),-Math.PI/2,0,0),note:'盤體結構、支架與外殼：耐候塑膠天線罩、鋁背板與支架，要扛風雪（可融雪每小時 40mm）。'},
  'leo.terminal.mech.motor':{build:K=>{K.cyl(.02,.02,.05,'dsteel',0,.025,0,'y',16);K.cyl(.012,.012,.03,'steel',0,.065,0,'y',12);K.box(.03,.02,.02,'black',.025,.02,0);},s:3,note:'對星馬達：藏在立桿裡，開機時讓天線自動轉到最佳仰角；天線再以電子波束追蹤衛星。'},
},.6);
export const LEO_CABLE=gridScene({
  'leo.terminal.cable.power':{build:K=>{K.tube([[0,.01,0],[.08,.02,.04],[.16,.01,.06]],.004,'black',10);K.box(.04,.03,.025,'black',.18,.015,.06);},s:2.5,note:'電源線與連接線：戶外線纜與電源線材。'},
  'leo.terminal.cable.harness':{build:K=>{K.box(.03,.015,.02,'black',0,.008,0);K.box(.015,.01,.006,'nickel',.02,.008,0);},s:3,note:'接收器線束與路由器插座：天線與路由器端的連接器與內部線束。'},
},.3);
export const LEO_GROUND={view:[.9,.6,1.2],parts:{
  'leo.ground.gateway':{build:gateway,ex:[0,0,-1.5],note:'閘道站：圍籬內 8 個左右白色天線罩，每個內有可轉動的碟形天線同時追蹤不同衛星，旁邊機房放射頻設備與伺服器。'},
  'leo.ground.backhaul':{build:K=>{K.box(.1,.1,9,'orange',4.2,.05,0);K.at(4.2,0,4.8,T=>{T.box(1.2,1.4,1,'dsteel',0,.7,0);for(let i=0;i<6;i++)T.box(1,.06,.01,'black',0,.3+i*.18,.505);});},ex:[1.5,0,0],note:'光纖回程：閘道經光纖接到網際網路交換點（PoP），用高速光模組與光纖被動元件傳輸。'},
  'leo.ground.ops':{build:K=>K.at(-5,0,2.5,T=>{T.box(2.2,1.2,1.6,'lgray',0,.6,0);T.box(2,.6,.02,'screen',0,.8,.81);}),ex:[-1.5,0,0],note:'網管、營運與經銷：網路營運中心監控數千顆衛星與流量；各國經銷與電信合作負責銷售與服務。'},
  'leo.ground.d2c':{build:K=>K.at(-4,0,-3,T=>{T.box(.08,.16,.01,'black',0,.5,0);T.box(.07,.14,.003,'screen',0,.5,.006);T.at(0,3,0,U=>{U.box(1.2,.08,.8,'mylar',0,0,0);U.box(2.4,.03,2.4,'lgray',0,-.08,0);},0,.5,0);}),ex:[-1,1,0],note:'手機直連衛星（Direct-to-Cell）：衛星上裝超大型陣列天線（約 25m²），直接和一般手機的 LTE 訊號連線；T-Mobile 等電信合作。'},
}};
export const LEO_GATEWAY=gridScene({
  'leo.ground.gateway.antenna':{build:K=>{K.cyl(.12,.15,.4,'lgray',0,.2,0);K.lathe([[.6,0],[.45,.18],[.05,.3]],'white',0,.45,0,24,'gwd');},note:'閘道天線與饋源：直徑約 1.5m 的碟形天線，放在白色天線罩內防風雨。'},
  'leo.ground.gateway.rf':{build:K=>{K.box(.3,.15,.2,'alu',0,.075,0);K.fins(8,.28,.04,.18,0,.17,0);},s:1.5,note:'閘道射頻設備（BUC／LNB／收發）：上變頻放大器把訊號送上衛星、低雜訊降頻器接收下行訊號。'},
  'leo.ground.gateway.site':{build:K=>{K.box(1,.02,.8,'concrete',0,.01,0);for(let i=0;i<8;i++)K.box(.02,.25,.02,'gray',-.5+i*.143,.125,.4);},note:'閘道建置與在地營運：選址、土建、電力與光纖接入，以及各國頻譜執照與在地維運。'},
},1.0);
export const LEO_BACKHAUL=gridScene({
  'leo.ground.backhaul.optics':{build:K=>{K.box(.022,.013,.1,'alu',0,.007,0);K.fins(6,.022,.006,.06,0,.016,-.01);},s:4,note:'高速光模組：把閘道與資料中心之間的流量轉成光訊號，400G 等級。'},
  'leo.ground.backhaul.passive':{build:K=>{K.box(.08,.03,.05,'blue',0,.015,0);for(let i=0;i<6;i++)K.tube([[-.03+i*.012,.015,-.025],[-.03+i*.012,.03,-.08],[0,.02,-.15]],.002,'yellow',8);},s:3,note:'光纖被動元件：光纖連接器、分光器、跳線等。'},
},.5);
export const LEO_D2C=gridScene({
  'leo.ground.d2c.chip':{build:K=>{K.box(.03,.003,.03,'substrate',0,.0015,0);K.box(.018,.002,.018,'die',0,.004,0);},s:3,note:'NTN 數據機晶片：支援 3GPP 非地面網路標準的手機基頻晶片，讓手機能直接連衛星；聯發科、高通。'},
  'leo.ground.d2c.carrier':{build:K=>{K.box(.06,.6,.06,'gray',0,.3,0);for(let i=0;i<3;i++)K.box(.04,.12,.02,'white',Math.cos(i*2.1)*.06,.55,Math.sin(i*2.1)*.06);},note:'電信合作夥伴：衛星業者與電信商共用頻譜，讓用戶在沒有基地台的地方也能傳訊息。'},
  'leo.ground.d2c.sat':{build:K=>{K.box(.5,.04,.35,'mylar',0,.3,0);K.box(1,.015,1,'lgray',0,.26,0);},note:'直連衛星大型陣列：衛星上展開的大型相位陣列天線，才能收到手機微弱的訊號。'},
},.9);
