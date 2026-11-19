// 🧰 仿真模型工具組：材質庫＋幾何小工具。每個「塊」建一個 Kit，材質各自獨立（才能各別高亮／半透明）。
// 單位：公尺；y 朝上；各模型自己決定 +z（機櫃）或 +x（車頭）為正面。
import * as THREE from '../vendor/three.module.js';

export const MAT = {
  steel:{color:0x9aa3ad,metalness:.75,roughness:.38}, dsteel:{color:0x3b4048,metalness:.6,roughness:.48},
  black:{color:0x15171b,metalness:.25,roughness:.55}, plastic:{color:0x262a30,metalness:0,roughness:.72},
  gray:{color:0x6b7280,metalness:.3,roughness:.6}, lgray:{color:0xb8bec6,metalness:.2,roughness:.55},
  white:{color:0xe9edf1,metalness:.05,roughness:.45}, offwhite:{color:0xd8dcd6,metalness:.05,roughness:.6},
  alu:{color:0xc4cad1,metalness:.8,roughness:.32}, casting:{color:0x8e959c,metalness:.65,roughness:.55},
  copper:{color:0xc77a4a,metalness:.92,roughness:.28}, brass:{color:0xc9a24e,metalness:.9,roughness:.3},
  gold:{color:0xd2a94e,metalness:.95,roughness:.25}, nickel:{color:0xa9adb3,metalness:.9,roughness:.25},
  pcb:{color:0x1d5c33,metalness:.1,roughness:.5}, pcbdk:{color:0x14301f,metalness:.1,roughness:.55},
  pcbblue:{color:0x1d3557,metalness:.1,roughness:.5}, chip:{color:0x22252b,metalness:.3,roughness:.4},
  die:{color:0x404d6e,metalness:.7,roughness:.22}, lid:{color:0xbfc5cc,metalness:.85,roughness:.25},
  substrate:{color:0x2f5d3c,metalness:.15,roughness:.5}, hbm:{color:0x1b1d22,metalness:.4,roughness:.35},
  rubber:{color:0x1a1a1a,metalness:0,roughness:.92}, tire:{color:0x161616,metalness:0,roughness:.95},
  glass:{color:0x9cc4dc,metalness:0,roughness:.05,transparent:true,opacity:.28},
  tint:{color:0x2a3946,metalness:.2,roughness:.08,transparent:true,opacity:.55},
  paint:{color:0x4f7fc0,metalness:.45,roughness:.3,transparent:true,opacity:.3},
  hoseblue:{color:0x2563eb,metalness:.1,roughness:.5}, hosered:{color:0xd23a2a,metalness:.1,roughness:.5},
  hoseblk:{color:0x111214,metalness:.1,roughness:.6}, teal:{color:0x58c4b8,metalness:.25,roughness:.45},
  orange:{color:0xf07c1c,metalness:.1,roughness:.5}, yellow:{color:0xf2c21b,metalness:.1,roughness:.5},
  green:{color:0x3fa34d,metalness:.1,roughness:.5}, red:{color:0xc0392b,metalness:.1,roughness:.5},
  blue:{color:0x2f6fd6,metalness:.2,roughness:.45}, cyan:{color:0x37b6d6,metalness:.2,roughness:.4},
  solar:{color:0x1a2c55,metalness:.45,roughness:.22}, carbon:{color:0x1d1f23,metalness:.35,roughness:.42},
  soot:{color:0x2c2a28,metalness:.1,roughness:.85}, foil:{color:0xd8a93c,metalness:.95,roughness:.35},
  mylar:{color:0xd9dde2,metalness:.95,roughness:.18}, ceramic:{color:0xe6e1d6,metalness:0,roughness:.7},
  concrete:{color:0x8a8d90,metalness:0,roughness:.95}, ground:{color:0x2d3540,metalness:0,roughness:.95},
  niobium:{color:0x5a4a62,metalness:.85,roughness:.3}, inconel:{color:0x7a6a5e,metalness:.8,roughness:.4},
  led:{color:0x7dd3fc,metalness:0,roughness:.3,emissive:0x3aa0d8,emissiveIntensity:.6},
  screen:{color:0x0b1220,metalness:.2,roughness:.15,emissive:0x1e3a5f,emissiveIntensity:.5},
  liquidlox:{color:0x7fb7e6,metalness:0,roughness:.2,transparent:true,opacity:.5},
  liquidrp1:{color:0xc8a86a,metalness:0,roughness:.2,transparent:true,opacity:.5},
  water:{color:0x2e6f9e,metalness:.1,roughness:.3}, wood:{color:0x8b6a45,metalness:0,roughness:.8},
};

// 共用幾何快取（同一次建構內重複使用；Viewer 清除時統一 dispose）
export function geoCache(){ return new Map(); }

export class Kit{
  constructor(cache){ this.cache=cache; this.mats=new Map(); this.root=new THREE.Group(); this.cur=this.root; }
  m(name,over){
    const key=over?name+JSON.stringify(over):name;
    let mt=this.mats.get(key);
    if(!mt){
      const spec={...(MAT[name]||MAT.gray),...(over||{})};
      mt=new THREE.MeshStandardMaterial(spec); mt.userData.base=mt.color.clone();
      mt.userData.baseOpacity=spec.transparent?spec.opacity:1; mt.userData.baseTransparent=!!spec.transparent;
      mt.userData.baseEmissive=mt.emissive.clone(); mt.userData.baseEI=mt.emissiveIntensity;
      if(spec.transparent){mt.depthWrite=false;}
      this.mats.set(key,mt);
    }
    return mt;
  }
  geo(key,make){ let g=this.cache.get(key); if(!g){g=make();this.cache.set(key,g);} return g; }
  _add(geo,mat,x,y,z,rx,ry,rz){
    const mesh=new THREE.Mesh(geo,typeof mat==='string'?this.m(mat):mat);
    mesh.position.set(x||0,y||0,z||0); if(rx||ry||rz)mesh.rotation.set(rx||0,ry||0,rz||0);
    this.cur.add(mesh); return mesh;
  }
  // 方塊：中心點座標
  box(w,h,d,mat,x,y,z,rx,ry,rz){ return this._add(this.geo(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),mat,x,y,z,rx,ry,rz); }
  // 圓柱：axis = 'x'|'y'|'z'
  cyl(rt,rb,len,mat,x,y,z,axis='y',seg=24,open=false){
    const g=this.geo(`c${rt},${rb},${len},${axis},${seg},${open}`,()=>{const c=new THREE.CylinderGeometry(rt,rb,len,seg,1,open);
      if(axis==='x')c.rotateZ(Math.PI/2);else if(axis==='z')c.rotateX(Math.PI/2);return c;});
    return this._add(g,mat,x,y,z);
  }
  sphere(r,mat,x,y,z,seg=20){ return this._add(this.geo(`s${r},${seg}`,()=>new THREE.SphereGeometry(r,seg,Math.max(8,seg*.6|0))),mat,x,y,z); }
  torus(r,t,mat,x,y,z,axis='y',seg=24){
    const g=this.geo(`t${r},${t},${axis}`,()=>{const o=new THREE.TorusGeometry(r,t,10,seg);if(axis==='y')o.rotateX(Math.PI/2);else if(axis==='x')o.rotateY(Math.PI/2);return o;});
    return this._add(g,mat,x,y,z);
  }
  // 迴轉體：pts = [[r,y],...]，沿 y 軸
  lathe(pts,mat,x,y,z,seg=32,key,phi0=0,phiLen=Math.PI*2){
    const g=this.geo((key?'l'+key:'l'+JSON.stringify(pts)+seg)+(phiLen<6.28?`p${phi0}`:''),()=>new THREE.LatheGeometry(pts.map(([r,yy])=>new THREE.Vector2(Math.max(1e-4,r),yy)),seg,phi0,phiLen));
    const mesh=this._add(g,mat,x,y,z); return mesh;
  }
  // 管線：沿點列的圓管
  tube(pts,r,mat,seg=24){
    const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.2);
    return this._add(new THREE.TubeGeometry(curve,seg,r,8,false),mat);
  }
  // 擠出：2D 外形（x,y）沿 z 擠出 depth，置中
  extrude(shapePts,depth,mat,x,y,z,bevel=0){
    const s=new THREE.Shape(shapePts.map(([a,b])=>new THREE.Vector2(a,b)));
    const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});
    g.translate(0,0,-depth/2); return this._add(g,mat,x,y,z);
  }
  // 子群組：在 (x,y,z) 旋轉 r 後畫 fn
  at(x,y,z,fn,rx=0,ry=0,rz=0,s=1){
    const g=new THREE.Group(); g.position.set(x,y,z); g.rotation.set(rx,ry,rz); if(s!==1)g.scale.setScalar(s);
    const prev=this.cur; this.cur.add(g); this.cur=g; try{fn(this);}finally{this.cur=prev;} return g;
  }
  // —— 常用零件 ——
  // 晶片封裝：基板＋（可選）上蓋或裸晶
  chipPkg(w,d,x,y,z,{sub='substrate',lid='lid',h=.003,lidH=.003,lidInset=.12,dies=0}={}){
    this.box(w,h,d,sub,x,y+h/2,z);
    if(lid)this.box(w*(1-lidInset),lidH,d*(1-lidInset),lid,x,y+h+lidH/2,z);
    return y+h+(lid?lidH:0);
  }
  // 風扇：方框＋扇葉轂（axis 為吹風方向）
  fan(s,depth,x,y,z,axis='z'){
    this.at(x,y,z,K=>{
      const t=s*.08;
      if(axis==='z'){K.box(s,t,depth,'plastic',0,s/2-t/2,0);K.box(s,t,depth,'plastic',0,-s/2+t/2,0);K.box(t,s,depth,'plastic',s/2-t/2,0,0);K.box(t,s,depth,'plastic',-s/2+t/2,0,0);
        K.cyl(s*.2,s*.2,depth*.9,'black',0,0,0,'z',16);for(let i=0;i<7;i++)K.box(s*.36,s*.02,depth*.5,'black',Math.cos(i/7*Math.PI*2)*s*.22,Math.sin(i/7*Math.PI*2)*s*.22,0,0,0,i/7*Math.PI*2+.4);}
      else{K.box(depth,s,s,'plastic',0,0,0);K.cyl(s*.42,s*.42,depth*1.02,'black',0,0,0,'x',20);K.cyl(s*.18,s*.18,depth*1.05,'gray',0,0,0,'x',16);}
    });
  }
  // 大量重複的同形零件（電芯、錫球…）：InstancedMesh，pts=[[x,y,z],...]
  inst(geoKey,make,mat,pts){
    const g=this.geo(geoKey,make), m=new THREE.InstancedMesh(g,typeof mat==='string'?this.m(mat):mat,pts.length), o=new THREE.Object3D();
    pts.forEach((p,i)=>{o.position.set(p[0],p[1],p[2]);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
    m.instanceMatrix.needsUpdate=true; m.computeBoundingBox(); m.computeBoundingSphere(); this.cur.add(m); return m;
  }
  cylInst(r,len,mat,pts,axis='y',seg=14){ return this.inst(`ci${r},${len},${axis},${seg}`,()=>{const c=new THREE.CylinderGeometry(r,r,len,seg);if(axis==='x')c.rotateZ(Math.PI/2);else if(axis==='z')c.rotateX(Math.PI/2);return c;},mat,pts); }
  boxInst(w,h,d,mat,pts){ return this.inst(`bi${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d),mat,pts); }
  // 一排小方塊（連接埠、硬碟槽…）
  row(n,w,h,d,gap,mat,x0,y,z,axis='x'){ for(let i=0;i<n;i++){const o=(i-(n-1)/2)*(w+gap);axis==='x'?this.box(w,h,d,mat,x0+o,y,z):this.box(d,h,w,mat,x0,y,z+o);} }
  // 散熱鰭片
  fins(n,w,h,d,x,y,z,mat='alu',axis='x'){ const gap=(axis==='x'?w:d)/n; for(let i=0;i<n;i++){const o=-((axis==='x'?w:d)/2)+gap*(i+.5); axis==='x'?this.box(gap*.35,h,d,mat,x+o,y,z):this.box(w,h,gap*.35,mat,x,y,z+o);} }
}

// —— 簡易攝影棚環境光（給金屬材質反射；免外部 HDR）——
export function studioEnv(renderer){
  const pm=new THREE.PMREMGenerator(renderer);
  const sc=new THREE.Scene();
  const room=new THREE.Mesh(new THREE.BoxGeometry(20,10,20),new THREE.MeshBasicMaterial({color:0x2a3240,side:THREE.BackSide}));
  room.position.y=3; sc.add(room);
  const lite=(c,i,x,y,z,w,h,ry=0,rx=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.set(rx,ry,0);sc.add(m);};
  lite(0xffffff,6,0,7.9,0,12,6,0,Math.PI/2);       // 頂燈
  lite(0xdfe8ff,3,-9.9,3,0,10,4,Math.PI/2);         // 左牆
  lite(0xfff1dd,2.5,9.9,4,2,8,3,-Math.PI/2);        // 右牆
  lite(0xffffff,1.5,0,3,-9.9,14,3);                 // 後牆
  const env=pm.fromScene(sc,.04).texture;
  sc.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}}); pm.dispose();
  return env;
}

export const deg=d=>d*Math.PI/180;

// 模組層級沒有固定實物配置時：把各零件排成方陣（每格 S 公尺），拆解時向外散開並浮起
// parts={code:{build,note,s?}}，s＝該零件縮放（讓大小差很多的零件都看得清楚）
export function gridScene(parts,S=1,view){
  const codes=Object.keys(parts), n=codes.length, cols=Math.ceil(Math.sqrt(n));
  const out={};
  codes.forEach((code,i)=>{
    const p=parts[code], r=Math.floor(i/cols), c=i%cols, cx=c-(cols-1)/2, cz=r-(Math.ceil(n/cols)-1)/2;
    out[code]={note:p.note,ex:[cx*S*.35,S*.25+(i%2)*S*.12,cz*S*.35],build:K=>K.at(cx*S,0,cz*S,p.build,0,0,0,p.s||1)};
  });
  return {view:view||[.8,.9,1.2],parts:out};
}
