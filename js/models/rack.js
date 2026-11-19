// 🗄️ AI 整櫃（以 NVIDIA GB200 NVL72 為原型）
// 依據：NVIDIA DGX GB200 使用手冊、NVIDIA OCP 貢獻說明、Lenovo GB300 NVL72 正/背面圖說、ServeTheHome GTC 2024 實拍。
// 機櫃座標：y 朝上，+z＝正面（托盤從正面抽出），x＝左右。1U＝44.45mm。
const U=.04445, Y0=.1;                     // Y0：底座高度
const uy=u=>Y0+(u-1)*U;                    // 第 u 個 U 的底部高度
const TW=.438, TD=.86, TH=.0425, TZ=.04;   // 托盤寬/深/高、托盤中心 z
const FZ=TZ+TD/2;                          // 托盤前緣 z

// —— 托盤正面 ——
function handles(K,y,z=FZ){ for(const s of[-1,1]){K.box(.018,TH*.9,.03,'gold',s*(TW/2+.006),y,z+.012);} }
function computeFront(K,y){ // 由左而右：OSFP 網路埠｜E1.S 硬碟槽 ×8｜管理埠｜BlueField-3
  K.box(TW,TH,.004,'black',0,y,FZ);
  for(let i=0;i<4;i++)K.box(.022,.014,.006,'steel',-.19+i*.027,y+.008,FZ+.003);
  K.box(.012,.01,.006,'steel',-.185,y-.01,FZ+.003);K.box(.012,.01,.006,'steel',-.165,y-.01,FZ+.003);
  for(let i=0;i<8;i++)K.box(.0105,.032,.006,'dsteel',-.06+i*.0135,y,FZ+.003);
  K.box(.012,.009,.006,'steel',.06,y+.009,FZ+.003);K.box(.012,.012,.006,'steel',.06,y-.007,FZ+.003);
  K.box(.016,.012,.006,'steel',.1,y+.008,FZ+.003);K.box(.016,.012,.006,'steel',.12,y+.008,FZ+.003);
  K.box(.06,.012,.004,'gray',.13,y-.009,FZ+.003);
  handles(K,y);
}
function switchFront(K,y){ // 只有左側管理面板（NVLink 線全部走背面卡匣）
  K.box(TW,TH,.004,'lgray',0,y,FZ);
  K.box(.11,TH*.85,.005,'black',-.15,y,FZ+.002);
  for(let i=0;i<4;i++)K.box(.014,.011,.006,'steel',-.19+i*.02,y-.007,FZ+.004);
  K.box(.01,.006,.006,'steel',-.12,y+.01,FZ+.004);
  for(let i=0;i<3;i++)K.sphere(.0018,'led',-.2+i*.006,y+.012,FZ+.005,8);
  handles(K,y);
}
function powerFront(K,y){ // 每層 6 顆 5.5kW 氣冷 PSU
  K.box(TW,TH,.004,'dsteel',0,y,FZ);
  for(let i=0;i<6;i++){const x=-.182+i*.073;K.box(.068,TH*.9,.006,'black',x,y,FZ+.003);K.cyl(.017,.017,.004,'gray',x-.006,y,FZ+.007,'z',18);K.box(.006,.03,.008,'steel',x+.027,y,FZ+.007);}
}
function trayBody(K,y,mat='dsteel'){ K.box(TW,TH,TD,mat,0,y,TZ); }

// —— 根層：整櫃 ——
function rackFrame(K){
  const W=.6, D=1.1, H=2.3, t=.04;
  for(const sx of[-1,1])for(const sz of[-1,1])K.box(t,H,t,'black',sx*(W/2-t/2),H/2,sz*(D/2-t/2));
  for(const sy of[0,1])for(const sz of[-1,1])K.box(W,t,t,'black',0,sy?H-t/2:t/2+.05,sz*(D/2-t/2));
  for(const sy of[0,1])for(const sx of[-1,1])K.box(t,t,D,'black',sx*(W/2-t/2),sy?H-t/2:t/2+.05,0);
  for(const sx of[-1,1])for(const sz of[.47,-.4]){K.box(.016,2.14,.016,'steel',sx*.232,Y0+1.07,sz);} // 19 吋立柱（方孔條）
  K.box(W,.04,D,'dsteel',0,.03,0);                       // 底座
  for(const sx of[-1,1])for(const sz of[-1,1])K.cyl(.02,.02,.03,'gray',sx*.25,.0,sz*.5);
  for(const sx of[-1,1])K.box(.03,1.9,.1,'black',sx*.28,1.2,-.6);               // 背面延伸框
  K.box(.46,.012,.82,'steel',0,uy(7)+.01,TZ);                                     // 漏液接盤
}
function computeTrays(K){ for(let u=8;u<=15;u++)tray(K,u); for(let u=25;u<=34;u++)tray(K,u);
  function tray(K,u){const y=uy(u)+U/2;trayBody(K,y);computeFront(K,y);} }
function switchTrays(K){ for(let u=16;u<=24;u++){const y=uy(u)+U/2;trayBody(K,y,'gray');switchFront(K,y);} }
function powerShelves(K){ for(const u of[3,4,5,6,35,36,37,38]){const y=uy(u)+U/2;trayBody(K,y,'black');powerFront(K,y);} }
function bbuShelf(K){ const y=uy(39)+U/2; K.box(TW,TH,.7,'black',0,y,.12); K.box(TW,TH,.004,'dsteel',0,y,.47);
  for(let i=0;i<4;i++){const x=-.16+i*.107;K.box(.1,TH*.85,.006,'yellow',x,y,.473);K.box(.04,.006,.008,'black',x,y+.01,.477);} }
function mgmtSwitches(K){ for(const u of[46,47]){const y=uy(u)+U/2;K.box(TW,TH,.5,'black',0,y,.22);K.box(TW,TH,.004,'plastic',0,y,.47);
  for(let r=0;r<2;r++)for(let i=0;i<24;i++)K.box(.011,.009,.005,'steel',-.19+i*.0135,y-.008+r*.016,.474);
  for(let i=0;i<4;i++)K.box(.012,.01,.005,'steel',.155+i*.015,y,.474);}
  K.tube([[.15,uy(47)+.03,.3],[.12,2.32,.25],[.05,2.6,.1]],.012,'yellow',16); }
function spine(K){ // 4 個垂直 NVLink 銅纜卡匣：超過 5,000 條同軸銅纜
  const y0=uy(8),y1=uy(35),h=y1-y0;
  for(const x of[-.17,-.075,.075,.17]){K.box(.085,h,.07,'black',x,y0+h/2,-.47);
    for(let i=0;i<6;i++)K.box(.008,h*.98,.02,'carbon',x-.03+i*.012,y0+h/2,-.505);
    for(let j=0;j<6;j++)K.box(.09,.02,.075,'dsteel',x,y0+h*(j+.5)/6,-.47);}
}
function busbar(K){ const y0=uy(3),y1=uy(39); K.box(.05,y1-y0,.03,'copper',0,(y0+y1)/2,-.425); K.box(.07,y1-y0,.01,'plastic',0,(y0+y1)/2,-.44);
  for(const sx of[-1,1]){K.tube([[sx*.12,uy(38)+.02,-.4],[sx*.13,2.2,-.48],[sx*.1,2.55,-.5]],.014,'black',14);
    K.tube([[sx*.12,uy(3)+.02,-.4],[sx*.16,.06,-.5],[sx*.3,.02,-.75]],.014,'black',14);} }
function manifold(K){ const y0=uy(3),y1=uy(36);
  K.cyl(.022,.022,y1-y0,'hoseblue',-.245,(y0+y1)/2,-.42,'y',14); K.cyl(.022,.022,y1-y0,'hosered',.245,(y0+y1)/2,-.42,'y',14);
  for(let u=8;u<=34;u++){const y=uy(u)+U/2;for(const sx of[-1,1]){K.cyl(.008,.008,.04,'brass',sx*.225,y,-.42,'x',8);}}
  for(const sx of[-1,1])for(const sz of[0,1])K.cyl(.03,.03,.06,'brass',sx*.2+(sz?.05*sx:0),.08,-.48-sz*.04,'z',14);
  K.tube([[-.245,.08,-.5],[-.1,.03,-.75],[.6,.03,-.7],[.75,.15,-.4]],.025,'hoseblue',24);
  K.tube([[.245,.08,-.5],[.35,.03,-.75],[.65,.03,-.6],[.8,.2,-.4]],.025,'hosered',24); }
function pdu(K){ for(const sx of[-1,1]){K.box(.05,1.6,.04,'black',sx*.3,1.15,-.6);for(let i=0;i<12;i++)K.box(.03,.03,.01,'plastic',sx*.3,.45+i*.12,-.575);} }
function cdu(K){ const x=.95; K.box(.6,2.0,1.1,'lgray',x,1.0,0,0,0,0);
  K.box(.56,1.9,.01,'tint',x,1.02,.556);
  K.box(.2,.12,.01,'screen',x+.12,1.75,.562);
  for(const dx of[-.12,.12]){K.cyl(.07,.07,.22,'blue',x+dx,.3,.25,'x',18);K.cyl(.09,.09,.08,'steel',x+dx,.3,.4,'z',20);}
  K.box(.32,.5,.14,'steel',x,1.0,.3); for(let i=0;i<14;i++)K.box(.33,.48,.004,'nickel',x,1.0,.235+i*.009);
  K.cyl(.12,.12,.35,'white',x-.12,1.55,.2,'y',20);
  K.tube([[x-.12,.3,.25],[x,.6,.3],[x,.75,.3]],.02,'hoseblue',12); K.tube([[x+.12,.3,.25],[x+.2,.8,.3],[x+.1,1.25,.3]],.02,'hosered',12); }
function hvdc(K){ const x=-.95; K.box(.6,2.0,1.1,'dsteel',x,1.0,0);
  for(let r=0;r<8;r++)for(let c=0;c<3;c++){K.box(.17,.17,.01,'black',x-.19+c*.19,.35+r*.2,.556);K.sphere(.006,'led',x-.19+c*.19+.07,.42+r*.2,.563,8);}
  K.box(.06,1.7,.03,'orange',x+.24,1.0,-.45); }
function floorL11(K){ K.box(3.0,.02,1.9,'ground',0,-.01,.05);
  for(let i=-7;i<=7;i++)K.box(.004,.022,1.9,'gray',i*.2,-.0,.05); for(let j=-4;j<=4;j++)K.box(3.0,.022,.004,'gray',0,-.0,.05+j*.2);
  K.at(-.6,0,1.15,T=>{T.box(.5,.04,.4,'dsteel',0,.75,0);T.box(.03,.75,.03,'steel',-.22,.37,-.17);T.box(.03,.75,.03,'steel',.22,.37,-.17);T.box(.03,.75,.03,'steel',-.22,.37,.17);T.box(.03,.75,.03,'steel',.22,.37,.17);
    T.box(.36,.24,.02,'black',0,.92,-.1,-.2);T.box(.33,.21,.005,'screen',0,.92,-.088,-.2);T.box(.25,.08,.2,'black',0,.81,.05);});
  K.tube([[-.5,.8,1.0],[-.35,.6,.8],[-.2,.55,.55]],.006,'yellow',12); }

export const RACK_ROOT={
  view:[-.35,.35,1.6],
  parts:{
    'rack.frame':{build:rackFrame,ex:[0,0,0],note:'約 48U、寬 600mm 的 MGX 機櫃，為承受 NVLink 背板約 6,000 磅的插拔力加了 100 磅以上的鋼補強；第 7U 有漏液接盤，背面有延伸框保護線材與分歧管。'},
    'rack.compute':{build:computeTrays,ex:[0,0,.95],note:'18 個 1U 運算托盤，上 10 下 8 夾著交換托盤。每盤 2 顆 Grace CPU＋4 顆 Blackwell GPU，CPU/GPU 走液冷，前段網卡與硬碟靠風扇。正面由左而右：OSFP 網路埠、E1.S 硬碟槽、管理埠、BlueField-3。'},
    'rack.switch':{build:switchTrays,ex:[0,.02,.6],note:'9 個 1U NVLink 交換托盤放在正中間，每盤 2 顆 NVLink Switch 晶片。正面只有管理埠——72 顆 GPU 之間的 NVLink 全部經由背面的銅纜卡匣連接。'},
    'rack.powershelf':{build:powerShelves,ex:[0,0,1.35],note:'電源櫃上下各一組（依設定 6～8 個），每個 33kW、裝 6 顆 5.5kW 氣冷 PSU（N+N 備援），把 415V 交流電轉成約 50V 直流，經背面匯流排送到每個托盤。'},
    'rack.bbu':{build:bbuShelf,ex:[0,.15,1.2],note:'選配的 BBU 備援電池層：市電瞬斷時撐住整櫃幾十秒到切換備援電源，GPU 負載劇烈跳動時也用超級電容削峰。'},
    'rack.network':{build:mgmtSwitches,ex:[0,.45,.35],note:'櫃頂 2 台管理交換器（接各托盤 BMC 做帶外管理）。真正跑 AI 流量的 400G/800G 光模組插在運算托盤正面的 OSFP 埠，再拉光纖到機房的 Spine 交換器。'},
    'rack.spine':{build:spine,ex:[0,0,-.85],note:'NVLink 背板：4 個垂直安裝在背面的銅纜卡匣，內有超過 5,000 條同軸銅纜，把 18 個運算托盤和 9 個交換托盤全互連（130TB/s）。用銅不用光，是為了省電與成本。'},
    'rack.busbar':{build:busbar,ex:[0,0,-.45],note:'背面正中央的銅匯流排，額定 1,400A（約現行標準 2 倍）。電源櫃輸出的 50V 直流經它分配；外部的 Power whip 電源線把機房配電接進電源櫃。'},
    'rack.manifold':{build:manifold,ex:[0,0,-1.25],note:'背面左右兩支垂直分歧管（藍＝進水、紅＝回水），每個托盤後端用盲插快接頭（UQD/NVQD）接上；主接頭在櫃底，接到 CDU。'},
    'rack.pdu':{build:pdu,ex:[0,0,-1.6],note:'機櫃兩側的配電條（PDU），供管理交換器等小設備用電；大電力走電源櫃＋匯流排。'},
    'rack.cdu':{build:cdu,ex:[.75,0,0],note:'CDU 冷卻液分配單元（常放在機櫃旁）：泵浦推動二次側冷卻液，經板式熱交換器把熱量交給機房冷水；一櫃約 120kW 幾乎全靠它帶走。'},
    'rack.hvdc':{build:hvdc,ex:[-.75,0,0],note:'下一代 800V 高壓直流電源側櫃：把電源轉換從機櫃內移到旁邊，減少銅用量與轉換損失（Rubin 世代方向）。'},
    'rack.l11':{build:floorL11,ex:[0,-.5,0],note:'L10–L11：整櫃在代工廠組裝、灌液、燒機測試後整櫃出貨（鴻海、廣達、緯創等），旁邊是測試站。'},
  },
};

// —— 運算托盤內部（俯視配置依 GTC 實拍：前段 I/O → 風扇排 → 兩片 Bianca 板，後排 4 顆 GPU → 後緣 NVLink 接頭）——
const BOARD_X=[-.108,.108];                 // 兩片 Bianca 板中心
const GPU_POS=[[-.163,-.19],[-.053,-.19],[.053,-.19],[.163,-.19]];
const CPU_POS=[[-.108,.02],[.108,.02]];
function trayChassis(K){
  K.box(TW,.002,TD,'dsteel',0,.001,0); for(const s of[-1,1])K.box(.002,.04,TD,'dsteel',s*TW/2,.02,0);
  K.box(TW,.04,.004,'black',0,.02,TD/2); handles(K,.021,TD/2);
  K.box(TW*.98,.002,.09,K.m('steel',{transparent:true,opacity:.35}),0,.043,.385);   // 前段金屬上蓋（半透明以便看到內部）
  for(let i=0;i<8;i++)K.box(.0105,.03,.1,'dsteel',-.06+i*.0135,.017,.36);   // E1.S 硬碟
  K.box(.06,.012,.05,'pcbdk',-.12,.008,.27);           // DC-SCM 管理模組
}
function fansRow(K){ for(let i=0;i<8;i++)K.fan(.04,.028,-.19+i*.0543,.021,.235,'z'); }
function nics(K){
  for(let i=0;i<4;i++)K.box(.022,.014,.06,'steel',-.19+i*.027,.012,.39);       // OSFP 籠
  for(const s of[0,1])K.at(.13,.012+s*.016,.36,T=>{T.box(.1,.002,.09,'pcb',0,0,0);T.box(.03,.004,.03,'chip',0,.003,-.01);T.box(.035,.012,.04,'steel',.03,.007,.035);});  // BlueField-3 卡
  for(const x of BOARD_X)K.at(x,.006,.15,T=>{T.box(.025,.003,.025,'chip',0,0,0);T.box(.02,.002,.02,'lid',0,.0025,0);});  // 板上 ConnectX-7
}
function boards(K){ for(const x of BOARD_X)K.at(x,.0,-.08,T=>{T.box(.205,.003,.5,'pcb',0,.0045,0);
  for(let i=0;i<40;i++){const a=(i*7919)%100/100,b=(i*104729)%100/100;T.box(.004,.0015,.002,'ceramic',-.09+a*.18,.007,-.24+b*.12);}
  T.box(.012,.002,.012,'chip',.07,.007,.21);}); }
function pcbStack(K){ for(const x of BOARD_X)K.at(x,-.004,-.08,T=>{for(let i=0;i<9;i++)T.box(.205,.0005,.5,i%2?'copper':'pcbdk',0,-i*.0006,0);}); }
function gpus(K){ for(const [x,z] of GPU_POS)K.at(x,.006,z,T=>{T.box(.075,.003,.06,'substrate',0,.0015,0);T.box(.05,.0015,.04,'die',0,.0037,0);for(const sx of[-1,1])for(const sz of[-1,1])T.box(.009,.0018,.011,'hbm',sx*.03,.0037,sz*.013);}); }
function cpus(K){ for(const [x,z] of CPU_POS)K.at(x,.006,z,T=>{T.box(.05,.003,.05,'substrate',0,.0015,0);T.box(.04,.003,.04,'lid',0,.0045,0);}); }
function memory(K){ for(const [x,z] of CPU_POS)for(const sx of[-1,1])for(let i=0;i<4;i++)K.box(.012,.0015,.014,'chip',x+sx*.045,.007,z-.03+i*.02); }
function vrms(K){ for(const [x,z] of GPU_POS)for(let i=0;i<6;i++){K.box(.007,.004,.007,'black',x-.03+i*.012,.009,z+.05);K.box(.005,.003,.005,'chip',x-.03+i*.012,.008,z+.06);}
  for(const [x,z] of CPU_POS)for(let i=0;i<4;i++)K.box(.007,.004,.007,'black',x-.02+i*.013,.009,z+.04); }
function coldplates(K){ for(const [x,z] of GPU_POS)K.box(.07,.012,.055,'copper',x,.017,z); for(const [x,z] of CPU_POS)K.box(.045,.01,.045,'copper',x,.016,z);
  for(const bx of BOARD_X){const s=Math.sign(bx), g1=bx-.055*s, g2=bx+.055*s, qx=bx+.09*s;
    K.tube([[qx,.02,-.43],[qx,.022,-.3],[g2,.024,-.22]],.005,'hoseblue',16);          // 進水 → 外側 GPU
    K.tube([[g2,.024,-.19],[bx,.026,-.17],[g1,.024,-.19]],.005,'hoseblk',12);          // GPU → GPU
    K.tube([[g1,.024,-.16],[bx-.03*s,.024,-.06],[bx,.022,-.005]],.005,'hoseblk',16);   // GPU → CPU
    K.tube([[bx,.022,.045],[bx+.06*s,.024,.05],[qx+.01*s,.024,-.1],[qx+.012*s,.02,-.43]],.005,'hosered',24);} // CPU → 回水
  for(const s of[-1,1])K.cyl(.007,.007,.03,'brass',s*.2,.02,-.43,'z',10); }
function sockets(K){ for(let i=0;i<4;i++)K.box(.06,.025,.025,'black',-.15+i*.1,.016,-.415); K.box(.03,.03,.02,'copper',0,.02,-.42);
  for(const x of BOARD_X)K.box(.06,.006,.012,'black',x,.009,.19); }

export const RACK_COMPUTE={
  view:[.45,1.35,1.0],
  decor:[{build:trayChassis,ex:[0,-.34,0]}],
  parts:{
    'rack.compute.gpu':{build:gpus,ex:[0,.26,0],note:'4 顆 B200 GPU 排在托盤後段（每片 Bianca 板 2 顆）。每顆是兩個大晶粒＋8 顆 HBM3e 以 CoWoS-L 封裝在一起，單顆功耗約 1,000W 以上，上面壓著水冷板。'},
    'rack.compute.cpu':{build:cpus,ex:[0,.2,.02],note:'2 顆 Grace CPU（Arm 72 核），各在一片 Bianca 板的中前段，透過 NVLink-C2C 與兩顆 GPU 相連，負責資料搬運與排程。'},
    'rack.compute.memory':{build:memory,ex:[0,.14,.03],note:'LPDDR5X：圍在 Grace 兩側的記憶體顆粒，每顆 CPU 約 480GB，GPU 可透過 C2C 直接存取當作延伸記憶體。'},
    'rack.compute.board':{build:boards,ex:[0,-.07,0],note:'Bianca 運算主機板，每盤 2 片（全櫃 36 片）：一片＝1 Grace＋2 Blackwell，板上還有 ConnectX 網路晶片、電源、BMC 介面與大量被動元件。'},
    'rack.compute.pcb':{build:pcbStack,ex:[0,-.19,0],note:'高多層 PCB：AI 主機板動輒 20～30 層以上、使用低損耗 CCL 與 HDI 疊構，才能走 NVLink 等 200Gbps 等級訊號（圖示為層疊示意）。'},
    'rack.compute.fan':{build:fansRow,ex:[0,.12,.06],note:'托盤中段一整排小風扇：CPU/GPU 雖已液冷，前段的網卡、硬碟、BMC 仍要靠氣冷（約 85% 液冷／15% 氣冷）。'},
    'rack.compute.coldplate':{build:coldplates,ex:[0,.4,0],note:'銅水冷板直接壓在 GPU/CPU 上，黑色管路串聯後接到托盤後端的快接頭，再進機櫃分歧管。'},
    'rack.compute.vrm':{build:vrms,ex:[0,.09,.04],note:'VRM 電源模組：把 48V/12V 轉成晶片要的 <1V 大電流（單顆 GPU 上千安培），所以緊貼在 GPU/CPU 旁邊，由一排排電感與功率級組成。'},
    'rack.compute.socket':{build:sockets,ex:[0,.07,-.16],note:'托盤後緣的 NVLink 線纜連接器（插進背板卡匣）、匯流排電源夾，以及板間的高速連接器。'},
    'rack.compute.nic':{build:nics,ex:[0,.06,.24],note:'網卡：4 個 400G OSFP 埠走 ConnectX-7（後端 GPU 網路），2 張 BlueField-3 DPU 走前端／儲存網路；ConnectX 晶片直接焊在 Bianca 板上。'},
  },
};

// —— NVLink 交換托盤內部（依實拍：正面管理面板＋通風孔 → 6 顆風扇 → 兩顆 NVLink Switch → 淺綠色跳線到後緣接頭）——
function swChassis(K){ K.box(TW,.002,TD,'dsteel',0,.001,0); for(const s of[-1,1])K.box(.002,.04,TD,'dsteel',s*TW/2,.02,0);
  K.box(TW,.04,.004,'lgray',0,.02,TD/2); handles(K,.021,TD/2); K.box(TW*.98,.002,.09,K.m('steel',{transparent:true,opacity:.35}),0,.043,.385);
  for(const x of[-.17,-.12,-.03,.03,.12,.17])K.fan(.042,.03,x,.022,.12,'z');
  for(const x of[-.04,.04])K.box(.04,.02,.04,'black',x,.011,.05);
  K.tube([[0,.02,.2],[0,.025,-.1],[0,.02,-.42]],.004,'hosered',12);
  for(const s of[-1,1])K.cyl(.008,.008,.03,'brass',s*.19,.02,-.42,'z',10); }
function swBoard(K){ K.box(.42,.003,.5,'pcbdk',0,.0045,-.16); K.box(.42,.003,.06,'black',0,.0045,-.4); }
function swChips(K){ for(const x of[-.1,.1])K.at(x,.006,-.17,T=>{T.box(.09,.003,.09,'substrate',0,.0015,0);T.box(.06,.003,.06,'lid',0,.0045,0);T.box(.1,.012,.1,'black',0,.012,0);}); }
function overpass(K){ for(const x of[-.1,.1])for(let i=0;i<6;i++){const a=(i-2.5)*.016;K.tube([[x+a,.012,-.12],[x+a*1.6,.03,-.25],[x+a*2.2,.02,-.4]],.0035,'teal',14);}
  for(let i=0;i<8;i++)K.box(.04,.012,.012,'black',-.17+i*.049,.012,-.41); }
export const RACK_SWITCH={view:[.45,1.35,1.0],decor:[{build:swChassis,ex:[0,-.3,0]}],parts:{
  'rack.switch.chip':{build:swChips,ex:[0,.24,0],note:'每盤 2 顆 NVLink Switch 晶片（每顆 72 個 NVLink 埠），9 盤共 18 顆，讓 72 顆 GPU 任兩顆都能以 1.8TB/s 直接互通。'},
  'rack.switch.board':{build:swBoard,ex:[0,-.1,0],note:'交換板 PCB：承載交換晶片與高速走線，層數與材料等級接近 GPU 主機板。'},
  'rack.switch.overpass':{build:overpass,ex:[0,.13,-.1],note:'Overpass 跳線：晶片旁直接拉出的淺綠色 twinax 高速線，跨過 PCB 直達後緣連接器，避免在板上長距離走線造成訊號衰減。'},
}};

// —— 電源櫃 ——
function shelfChassis(K){ K.box(TW,.002,.75,'dsteel',0,.001,0); for(const s of[-1,1])K.box(.002,.042,.75,'dsteel',s*TW/2,.021,0);
  K.box(TW,.042,.01,'black',0,.021,-.37); for(let i=0;i<6;i++)K.box(.05,.02,.02,'copper',-.182+i*.073,.021,-.38); }
function psus(K){ for(let i=0;i<6;i++){const x=-.182+i*.073, z=.05+(i%2)*.18;K.at(x,.021,z,T=>{T.box(.068,.04,.6,'black',0,0,0);T.box(.068,.04,.004,'dsteel',0,0,.3);T.cyl(.017,.017,.004,'gray',-.006,0,.304,'z',18);T.box(.006,.03,.01,'steel',.027,0,.31);});} }
function powerIC(K){ K.at(-.02,.06,.1,T=>{T.box(.12,.002,.3,'pcb',0,0,0);
  for(let i=0;i<6;i++)T.box(.016,.02,.005,'black',-.045+i*.018,.012,-.08);           // TO-247 SiC MOSFET
  for(let i=0;i<4;i++)T.box(.008,.008,.006,'chip',-.03+i*.02,.005,.05);                // GaN
  T.cyl(.012,.012,.03,'blue',-.03,.016,.11);T.cyl(.012,.012,.03,'blue',0,.016,.11);T.box(.035,.025,.035,'copper',.035,.014,.1);}); }
export const RACK_POWER={view:[.6,.9,1.1],decor:[{build:shelfChassis,ex:[0,-.03,0]}],parts:{
  'rack.powershelf.psu':{build:psus,ex:[0,0,.35],note:'電源供應器 PSU：每顆 5.5kW、效率 97.5% 以上（ORv3 規格），從正面熱插拔；台達、光寶是主要供應商。'},
  'rack.powershelf.power-ic':{build:powerIC,ex:[0,.12,.1],note:'PSU 內部的功率半導體：SiC MOSFET（黑色 TO-247 直插）負責高壓 PFC 段，GaN 用在高頻 DC-DC 段，旁邊是電容與磁性元件。'},
}};

// —— 背板銅纜卡匣（放大其中一個）——
function cartFrame(K){ K.box(.09,1.2,.08,'black',0,.6,0); for(let j=0;j<8;j++)K.box(.1,.02,.085,'dsteel',0,.08+j*.15,0); }
function cables(K){ for(let i=0;i<7;i++)for(let k=0;k<3;k++)K.cyl(.0035,.0035,1.16,'carbon',-.033+i*.011,.6,-.02+k*.012,'y',6);
  for(let j=0;j<10;j++)for(let i=0;i<7;i++)K.tube([[-.033+i*.011,.1+j*.11,.005],[-.033+i*.011,.12+j*.11,.035],[-.03+i*.01,.12+j*.11,.05]],.003,'carbon',6); }
function cartConn(K){ for(let j=0;j<10;j++)K.box(.075,.02,.02,'chip',0,.12+j*.11,.055); }
export const RACK_SPINE={view:[1.2,.3,.9],decor:[{build:cartFrame,ex:[-.12,0,0]}],parts:{
  'rack.spine.cable':{build:cables,ex:[0,0,-.06],note:'高速銅纜：每個卡匣內上千條同軸／twinax 銅線，在 1 公尺內傳 200Gbps 等級訊號；用銅取代光模組，可省下約 20kW 電力。'},
  'rack.spine.connector':{build:cartConn,ex:[0,0,.08],note:'背板連接器：卡匣正面一排排高密度連接器，托盤推入時直接盲插對接（安費諾、貿聯等）。'},
}};

// —— BBU ——
function bbuChassis(K){ K.box(.44,.002,.7,'dsteel',0,.001,0); K.box(.44,.044,.004,'dsteel',0,.022,.35); }
function bbuPack(K){ K.at(-.1,.022,.2,T=>{T.box(.1,.04,.6,'black',0,0,0);T.box(.1,.04,.004,'yellow',0,0,.3);}); }
function bbuCells(K){ for(let i=0;i<4;i++)for(let j=0;j<9;j++)K.cyl(.0105,.0105,.07,'blue',.04+i*.023,.04,-.1+j*.023,'y',14); }
function supercap(K){ for(let i=0;i<6;i++)K.cyl(.03,.03,.12,'cyan',.12+(i%3)*.065,.065,.2+Math.floor(i/3)*.065,'y',18); }
export const RACK_BBU={view:[.7,1.0,1.0],decor:[{build:bbuChassis,ex:[0,-.03,0]}],parts:{
  'rack.bbu.pack':{build:bbuPack,ex:[0,.02,.3],note:'BBU 電池模組：可熱插拔的抽屜，內含鋰電池與管理電路，市電中斷時供電數十秒。'},
  'rack.bbu.cell':{build:bbuCells,ex:[0,.08,0],note:'鋰電芯：BBU 內部的圓柱型鋰電池（常見 21700 規格），串並聯成 48V 等級電池組。'},
  'rack.bbu.supercap':{build:supercap,ex:[.05,.08,0],note:'超級電容：反應比電池快，用來吸收 GPU 訓練時毫秒級的負載跳動，保護電網與電源。'},
}};

// —— 匯流排 ——
function busbarBar(K){ K.box(.05,1.6,.03,'copper',0,.8,0); K.box(.07,1.6,.008,'plastic',0,.8,-.02); for(let j=0;j<8;j++)K.box(.06,.03,.04,'nickel',0,.15+j*.19,.02); }
function whips(K){ for(let i=0;i<3;i++){K.tube([[.15+i*.08,1.55,0],[.2+i*.08,1.8,-.1],[.25+i*.06,2.1,-.15]],.016,'black',16);K.box(.07,.05,.05,'orange',.15+i*.08,1.52,0);} }
export const RACK_BUSBAR={view:[1,.6,1],decor:[{build:busbarBar,ex:[-.15,0,0]}],parts:{
  'rack.busbar.whip':{build:whips,ex:[.15,.1,0],note:'Power whip：從機房上方配電盤垂下的粗電源線，前端是 ORv3 連接器，插進電源櫃背面供 415V 交流電。'},
}};

// —— CDU ——
function cduCab(K){ K.box(.6,.04,1.0,'lgray',0,.02,0);K.box(.6,.04,1.0,'lgray',0,1.98,0);
  for(const sx of[-1,1])for(const sz of[-1,1])K.box(.03,2,.03,'lgray',sx*.285,1,sz*.485);
  K.cyl(.12,.12,.4,'white',-.15,1.55,-.2,'y',20); K.box(.22,.14,.04,'black',.12,1.75,.4); K.box(.19,.11,.005,'screen',.12,1.75,.422);
  K.tube([[-.15,1.35,-.2],[-.15,.9,0],[-.12,.45,.25]],.025,'hoseblue',16); K.tube([[.12,.45,.25],[.15,.8,.3],[.05,1.2,.3]],.025,'hosered',16); }
function hex(K){ K.at(0,1.0,.3,T=>{T.box(.36,.6,.03,'blue',0,0,-.11);T.box(.36,.6,.03,'blue',0,0,.11);for(let i=0;i<20;i++)T.box(.33,.56,.005,'nickel',0,0,-.09+i*.0095);
  for(const sx of[-1,1])for(const sy of[-1,1])T.cyl(.025,.025,.06,'steel',sx*.12,sy*.22,.15,'z',14);
  for(const sx of[-1,1])T.cyl(.006,.006,.26,'steel',sx*.17,.3,0,'z',8);}); }
function pumps(K){ for(const x of[-.13,.13])K.at(x,.32,.2,T=>{T.cyl(.07,.07,.2,'blue',0,0,-.05,'z',20);T.cyl(.1,.1,.06,'steel',0,0,.09,'z',24);T.cyl(.03,.03,.08,'steel',0,.1,.09,'y',12);T.box(.12,.05,.25,'dsteel',0,-.08,-.03);}); }
export const RACK_CDU={view:[.9,.6,1.3],decor:[{build:cduCab,ex:[0,0,-.2]}],parts:{
  'rack.cdu.hex':{build:hex,ex:[0,0,.45],note:'板式熱交換器：一片片壓花不鏽鋼板疊在一起，二次側（機櫃冷卻液）和一次側（機房冷水）隔著薄板交換熱量，兩邊液體不混合。'},
  'rack.cdu.pump':{build:pumps,ex:[0,0,.5],note:'循環泵浦：通常 2 台互為備援，推動冷卻液流經分歧管與每片水冷板；流量與壓力由 CDU 控制器即時調整。'},
}};

// —— 分歧管 ——
function cdmPipe(K){ K.cyl(.024,.024,1.4,'hoseblue',0,.7,0,'y',16); for(let j=0;j<14;j++){K.cyl(.009,.009,.05,'brass',.03,.08+j*.095,0,'x',10);} K.cyl(.035,.035,.08,'brass',0,.02,0,'y',16); }
function qd(K){ K.at(0,.7,0,T=>{T.cyl(.03,.03,.09,'brass',-.06,0,0,'x',20);T.cyl(.034,.034,.03,'nickel',-.005,0,0,'x',20);T.cyl(.03,.03,.09,'brass',.06,0,0,'x',20);T.cyl(.012,.012,.12,'hoseblk',.16,0,0,'x',12);T.cyl(.012,.012,.12,'hoseblue',-.16,0,0,'x',12);},0,0,0,2.2); }
export const RACK_MANIFOLD={view:[1,.5,1],parts:{
  'rack.manifold.cdm':{build:cdmPipe,ex:[-.2,0,0],note:'機櫃分歧管（CDM）：直立的不鏽鋼主管，每個托盤高度開一個支路接頭，把 CDU 送來的冷卻液平均分配到每一盤。'},
  'rack.manifold.qd':{build:qd,ex:[.25,0,0],note:'快接頭（UQD/NVQD，圖為放大）：公母頭一推即通、拔開自動封閉不滴漏，托盤可以帶液熱插拔；GB200 用浮動盲插設計自動對位。'},
}};

// —— 網路 ——
function netSwitch(K){ K.at(0,.3,0,T=>{T.box(.44,.044,.5,'black',0,0,0);T.box(.44,.044,.004,'plastic',0,0,.25);for(let r=0;r<2;r++)for(let i=0;i<16;i++)T.box(.022,.014,.008,'steel',-.19+i*.025,-.009+r*.018,.254);
  for(let i=0;i<6;i++)T.fan(.038,.03,-.18+i*.07,0,-.24,'z');}); }
function optics(K){ for(let i=0;i<5;i++)K.at(-.12+i*.06,.3,.35,T=>{T.box(.022,.013,.1,'alu',0,0,0);T.fins(6,.022,.006,.06,0,.009,-.01,'alu','x');T.box(.018,.008,.02,'black',0,0,-.06);}); }
function cpo(K){ K.at(0,.3,-.4,T=>{T.box(.16,.004,.16,'substrate',0,0,0);T.box(.07,.004,.07,'die',0,.004,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;T.box(.022,.004,.022,'chip',Math.cos(a)*.06,.004,Math.sin(a)*.06);T.tube([[Math.cos(a)*.06,.006,Math.sin(a)*.06],[Math.cos(a)*.1,.02,Math.sin(a)*.1],[Math.cos(a)*.14,.01,Math.sin(a)*.14]],.002,'yellow',8);}}); }
export const RACK_NETWORK={view:[.8,.9,1.1],parts:{
  'rack.network.switch':{build:netSwitch,ex:[0,0,0],note:'資料中心交換器：1U 機身前面板滿是 OSFP 埠，負責把很多櫃連成叢集（Spine-Leaf 架構）；Arista、Cisco、NVIDIA，台廠有智邦等。'},
  'rack.network.optics':{build:optics,ex:[0,.1,.2],note:'800G/1.6T 光收發模組（OSFP）：插在交換器或網卡埠上，把電訊號轉成光在光纖上傳；頂部的散熱鰭片是 OSFP 的特徵。'},
  'rack.network.cpo':{build:cpo,ex:[0,.1,-.15],note:'CPO 共同封裝光學：把光引擎（周圍小晶片）直接封裝在交換晶片旁，省掉可插拔模組，降低功耗；NVIDIA Spectrum-X／Quantum-X Photonics 已採用。'},
}};

// —— 800V HVDC ——
function hvdcRack(K){ K.at(-.4,0,0,T=>{T.box(.6,2,1,'dsteel',0,1,0);for(let r=0;r<8;r++)for(let c=0;c<3;c++){T.box(.17,.17,.01,'black',-.19+c*.19,.35+r*.2,.505);T.sphere(.006,'led',-.12+c*.19,.42+r*.2,.512,8);}T.box(.06,1.7,.03,'orange',.24,1,-.48);}); }
function sst(K){ K.at(.5,0,0,T=>{T.box(.9,1.6,.9,'lgray',0,.8,0);for(let i=0;i<4;i++)T.box(.18,1.3,.02,'gray',-.3+i*.2,.8,.46);T.box(.2,.12,.01,'screen',.3,1.4,.462);T.cyl(.05,.05,.3,'ceramic',-.3,1.75,0);T.cyl(.05,.05,.3,'ceramic',0,1.75,0);T.cyl(.05,.05,.3,'ceramic',.3,1.75,0);}); }
export const RACK_HVDC={view:[.9,.5,1.3],parts:{
  'rack.hvdc.rack':{build:hvdcRack,ex:[-.2,0,0],note:'800VDC 電源櫃：一層層整流模組把交流轉成 800V 直流，再用細得多的銅排送進機櫃（同功率下電壓高 16 倍，電流與銅量大降）。'},
  'rack.hvdc.sst':{build:sst,ex:[.2,0,0],note:'固態變壓器 SST：用 SiC 功率電子取代傳統大型油浸變壓器，直接從中壓電網轉出 800V 直流，體積更小、效率更高。'},
}};

// —— 機櫃框架 ——
function cabinet(K){ K.at(-.45,0,0,T=>{T.at(0,0,0,rackFrame,0,0,0,.7);}); }
function chassisPart(K){ K.at(.25,.6,0,T=>{T.box(TW,.002,TD,'dsteel',0,0,0);for(const s of[-1,1])T.box(.002,.04,TD,'dsteel',s*TW/2,.02,0);T.box(TW,.04,.004,'black',0,.02,TD/2);}); }
function rails(K){ for(const s of[-1,1])K.at(.25+s*.24,.3,0,T=>{T.box(.012,.035,.75,'steel',0,0,0);T.box(.01,.028,.6,'nickel',0,0,.3);T.box(.008,.022,.45,'steel',0,0,.55);}); }
export const RACK_FRAME={view:[1,.6,1.3],parts:{
  'rack.frame.cabinet':{build:cabinet,ex:[-.2,0,0],note:'機櫃本體：鋼製框架、19 吋立柱與底座（圖為縮小）。GB200 機櫃要承受數千磅背板插拔力，結構件與補強比一般伺服器櫃厚重。'},
  'rack.frame.chassis':{build:chassisPart,ex:[.1,.2,0],note:'托盤機殼：1U 鈑金外殼，承載主機板、風扇與水冷管路，前面板帶把手。'},
  'rack.frame.rail':{build:rails,ex:[.1,-.1,.2],note:'伺服器滑軌：三節式伸縮滑軌，讓重達數十公斤的托盤能平順抽出維修；NVL72 一櫃約用 27 組（南俊、川湖）。'},
}};

// —— L10-L11 測試 ——
function testStation(K){ K.at(0,0,0,T=>{T.box(.9,.04,.6,'dsteel',0,.85,0);for(const sx of[-1,1])for(const sz of[-1,1])T.box(.04,.85,.04,'steel',sx*.42,.42,sz*.27);
  T.box(.5,.32,.03,'black',-.1,1.1,-.2,-.15);T.box(.47,.29,.005,'screen',-.1,1.1,-.183,-.15);T.box(.3,.15,.3,'lgray',.25,.95,.05);
  for(let i=0;i<4;i++)T.tube([[.25,.95,.2],[.4+i*.05,.6,.4],[.6+i*.05,.2,.6]],.008,i%2?'yellow':'blue',12);}); }
export const RACK_L11={view:[1,.7,1.2],parts:{'rack.l11.test':{build:testStation,ex:[0,0,0],note:'整櫃測試設備：組裝後要做灌液測漏、通電燒機、NVLink 全互連與效能壓測，任何一條銅纜或快接頭有問題都要在出廠前抓出來。'}}};

// —— 第 3 層：GPU 封裝拆解（放大）——
function abf(K){ K.box(.075,.004,.065,'substrate',0,0,0); for(let i=0;i<14;i++)for(let j=0;j<12;j++)K.sphere(.0012,'nickel',-.032+i*.005,-.003,-.027+j*.005,6); }
function cowos(K){ K.box(.058,.002,.048,'die',0,.004,0,0,0,0); for(const sx of[-1,1])K.box(.024,.0025,.03,'chip',sx*.0135,.0065,0); K.box(.004,.0028,.012,'copper',0,.0065,0); }
function hbms(K){ for(const sx of[-1,1])for(const sz of[-1,1])for(const k of[0,1])K.at(sx*.0135+(k?.007:-.007),.0065,sz*.019,T=>{for(let l=0;l<8;l++)T.box(.006,.0006,.0075,l%2?'hbm':'die',0,l*.0007,0);}); }
function gLid(K){ K.box(.07,.002,.06,'lid',0,.022,0); for(const sx of[-1,1])K.box(.003,.008,.06,'lid',sx*.0335,.017,0); }
function gTest(K){ K.at(0,-.03,0,T=>{T.box(.1,.012,.09,'black',0,0,0);for(let i=0;i<10;i++)for(let j=0;j<8;j++)T.cyl(.0008,.0008,.008,'gold',-.03+i*.0066,.009,-.026+j*.0075,'y',6);}); }
export const RACK_GPU={view:[.7,.9,1.1],parts:{
  'rack.compute.gpu.cowos':{build:cowos,ex:[0,.03,0],note:'CoWoS-L：台積電的 2.5D 封裝。兩顆 Blackwell 大晶粒放在一起，中間用嵌入的本地矽橋（LSI，圖中銅色條）以 10TB/s 互連，讓兩顆晶粒像一顆在運作。'},
  'rack.compute.gpu.hbm':{build:hbms,ex:[0,.05,0],note:'HBM3e：8 疊高頻寬記憶體（每疊是多層 DRAM 垂直堆疊，圖示分層），緊貼晶粒排列，總容量 192GB、頻寬約 8TB/s；SK 海力士、美光、三星供應。'},
  'rack.compute.gpu.abf':{build:abf,ex:[0,-.03,0],note:'ABF 載板：封裝最底層的多層有機載板，把晶片上極細的線路放大到底部的錫球，再焊到主機板；欣興、南電、景碩是主要供應商。'},
  'rack.compute.gpu.lid':{build:gLid,ex:[0,.09,0],note:'均熱片／封裝上蓋（與補強框）：保護晶片並把熱均勻傳到水冷板；高階 AI 晶片也有不加蓋、直接讓冷板接觸晶粒的做法。'},
  'rack.compute.gpu.test':{build:gTest,ex:[0,-.06,0],note:'AI 晶片測試：封裝前後要用探針卡與測試座（圖中金色彈簧針）逐顆做電性與燒機測試；京元電、穎崴、旺矽等。'},
}};
function bmc(K){ K.at(-.05,0,0,T=>{T.box(.08,.002,.06,'pcbdk',0,0,0);T.box(.022,.003,.022,'chip',0,.0025,0);T.box(.012,.002,.012,'chip',.025,.002,.015);},0,0,0,2); }
function passives(K){ K.at(.06,0,0,T=>{for(let i=0;i<5;i++)for(let j=0;j<4;j++)T.box(.006,.003,.003,'ceramic',i*.01,.0015,j*.008);for(let i=0;i<3;i++)T.box(.012,.008,.012,'black',.01+i*.016,.004,.04);},0,0,0,2); }
export const RACK_BOARD={view:[.6,1,1],parts:{
  'rack.compute.board.bmc':{build:bmc,ex:[-.03,.02,0],note:'BMC 管理晶片：伺服器的「管家」，獨立於 CPU 運作，負責開關機、溫度風扇監控與遠端管理；信驊（ASPEED）市占過半。'},
  'rack.compute.board.passive':{build:passives,ex:[.03,.02,0],note:'被動元件：MLCC 積層陶瓷電容（米色小方塊）、電感（黑色方塊）、電阻，一片 AI 主機板用量上萬顆；國巨、華新科、奇力新。'},
}};
function ccl(K){ K.at(-.08,0,0,T=>{T.box(.12,.003,.09,'pcbdk',0,0,0);T.box(.12,.0005,.09,'copper',0,.0018,0);T.box(.12,.0005,.09,'copper',0,-.0018,0);},0,0,0,2); }
function drill(K){ K.at(.08,.06,0,T=>{T.cyl(.0015,.0015,.04,'steel',0,0,0,'y',8);T.cyl(.004,.004,.04,'steel',0,.04,0,'y',12);T.cyl(.03,.03,.06,'gray',0,.1,0,'y',20);},0,0,0,2); }
export const RACK_PCB={view:[.6,.8,1],parts:{
  'rack.compute.pcb.ccl':{build:ccl,ex:[-.03,0,0],note:'CCL 銅箔基板：玻纖布含浸樹脂、兩面壓上銅箔，是 PCB 每一層的原料。AI 伺服器要用 Low-Dk/Low-Df 等級材料降低高速訊號損耗；台光電、聯茂、台燿。'},
  'rack.compute.pcb.drill':{build:drill,ex:[.03,.03,0],note:'PCB 鑽針與鑽孔設備：在多層板上鑽出成千上萬個導通孔；板越厚、層數越多，鑽針消耗越快（尖點）。'},
}};
function osfpCut(K){ K.at(0,0,0,T=>{T.box(.022,.013,.1,'alu',0,0,0);T.box(.018,.002,.08,'pcb',0,-.004,0);},0,0,0,3); }
function laser(K){ K.at(-.02,.04,0,T=>{T.box(.006,.002,.004,'die',0,0,0);T.box(.01,.002,.008,'ceramic',0,-.002,0);},0,0,0,6); }
function fiber(K){ K.at(.03,.03,-.1,T=>{T.box(.012,.006,.02,'cyan',0,0,0);for(let i=0;i<8;i++)T.tube([[ -.004+i*.0011,0,-.01],[-.004+i*.0011,.004,-.05],[0,.01,-.12]],.0004,'yellow',8);},0,0,0,3); }
export const RACK_OPTICS={view:[.6,.7,1],decor:[{build:osfpCut,ex:[0,-.03,0]}],parts:{
  'rack.network.optics.laser':{build:laser,ex:[0,.05,0],note:'雷射光源與磊晶：EML 或 CW 雷射晶片（放大示意）是光模組最關鍵的元件，用 InP 磊晶片製作；聯亞、全新做磊晶。'},
  'rack.network.optics.fiber':{build:fiber,ex:[0,.03,-.05],note:'光纖連接與被動元件：MPO 多芯連接頭與光纖、透鏡、隔離器等，把雷射光導進光纖。'},
}};
