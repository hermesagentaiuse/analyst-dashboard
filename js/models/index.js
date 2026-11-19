// 仿真模型登錄：SCENES[產品 id][焦點節點 code 或 'root'] = {view, parts:{code:{build,ex,note}}, decor:[{build,ex}]}
// parts 的 build 直接用「場景座標」畫（Viewer 會自動以外框中心重新定位），ex＝拆解位移。
import * as R from './rack.js?v=20261119a';
import * as E from './ev.js?v=20261119a';
import * as K from './rocket.js?v=20261119a';
import * as L from './leo.js?v=20261119a';

export const SCENES={
  'ai-rack':{root:R.RACK_ROOT,'rack.compute':R.RACK_COMPUTE,'rack.switch':R.RACK_SWITCH,'rack.powershelf':R.RACK_POWER,
    'rack.spine':R.RACK_SPINE,'rack.bbu':R.RACK_BBU,'rack.busbar':R.RACK_BUSBAR,'rack.cdu':R.RACK_CDU,'rack.manifold':R.RACK_MANIFOLD,
    'rack.network':R.RACK_NETWORK,'rack.hvdc':R.RACK_HVDC,'rack.frame':R.RACK_FRAME,'rack.l11':R.RACK_L11,
    'rack.compute.gpu':R.RACK_GPU,'rack.compute.board':R.RACK_BOARD,'rack.compute.pcb':R.RACK_PCB,'rack.network.optics':R.RACK_OPTICS},
  ev:{root:E.EV_ROOT,'ev.battery':E.EV_BATTERY,'ev.battery.cell':E.EV_CELL,'ev.edrive':E.EV_EDRIVE,'ev.edrive.motor':E.EV_MOTOR,
    'ev.edrive.inverter':E.EV_INVERTER,'ev.body':E.EV_BODY,'ev.body.gigacasting':E.EV_GIGA,'ev.power':E.EV_POWER,'ev.power.charger':E.EV_CHARGER,
    'ev.thermal':E.EV_THERMAL,'ev.cockpit':E.EV_COCKPIT,'ev.adas':E.EV_ADAS,'ev.adas.camera':E.EV_CAMERA,'ev.adas.soc':E.EV_ADASSOC,
    'ev.battery.bms':E.EV_BMS,'ev.cockpit.display':E.EV_DISPLAY,'ev.harness':E.EV_HARNESS,'ev.exterior':E.EV_EXTERIOR,'ev.exterior.lamp':E.EV_LAMP,'ev.assembly':E.EV_ASSEMBLY},
  rocket:{root:K.ROCKET_ROOT,'rocket.engine':K.ROCKET_ENGINE,'rocket.engine.chamber':K.ROCKET_CHAMBER,'rocket.engine.turbopump':K.ROCKET_TURBO,
    'rocket.booster':K.ROCKET_BOOSTER,'rocket.booster.tank':K.ROCKET_TANK,'rocket.upper':K.ROCKET_UPPER,'rocket.fairing':K.ROCKET_FAIRING,
    'rocket.interstage':K.ROCKET_INTERSTAGE,'rocket.recovery':K.ROCKET_RECOVERY,'rocket.recovery.gridfin':K.ROCKET_GRIDFIN,
    'rocket.avionics':K.ROCKET_AVIONICS,'rocket.avionics.fc':K.ROCKET_FC,'rocket.propellant':K.ROCKET_PROPELLANT,'rocket.power':K.ROCKET_POWER,
    'rocket.ground':K.ROCKET_GROUND},
  leo:{root:L.LEO_ROOT,'leo.sat':L.LEO_SAT,'leo.sat.payload':L.LEO_PAYLOAD,'leo.sat.bus':L.LEO_BUS,'leo.sat.interconnect':L.LEO_INTERCONNECT,
    'leo.terminal':L.LEO_TERMINAL,'leo.terminal.antenna':L.LEO_ANTENNA,'leo.terminal.mainboard':L.LEO_MAINBOARD,'leo.terminal.mech':L.LEO_MECH,
    'leo.terminal.cable':L.LEO_CABLE,'leo.ground':L.LEO_GROUND,'leo.ground.gateway':L.LEO_GATEWAY,'leo.ground.backhaul':L.LEO_BACKHAUL,
    'leo.ground.d2c':L.LEO_D2C},
};

export function sceneFor(pid,key){ return (SCENES[pid]&&SCENES[pid][key])||null; }
// 沒有子節點的葉節點：找出它在哪個場景裡出現過，單獨顯示那個零件
export function partFor(pid,code){
  const S=SCENES[pid]; if(!S)return null;
  for(const k in S){const p=S[k].parts&&S[k].parts[code]; if(p)return p;}
  return null;
}
