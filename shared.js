const APP_VERSION="1.0.5";
const STORAGE_KEY="newcatsle_yut_final_v1";
const CHANNEL_NAME="newcatsle_yut_channel_v1";
const DEFAULT_TEAMS=["트슈 · 단솔","니코 · 하윤","듀듀 · 미스","냥코 · 으니","뉴다 · 복실","도랑 · 재욱","아송 · 쫑알","막현 · 퀸주","아깽 · 대휘","키링 · 갑숙","봉구 · 빵지니","난강 · 밍또","유즈 · 성균","건욱 · 키키","액구 · 유성","두링 · 성준"];
const SLOT_POSITIONS={
L0:[83,268,157,30],L1:[83,326,157,30],L2:[83,386,157,30],L3:[83,444,157,30],L4:[83,507,157,30],L5:[83,566,157,30],L6:[83,627,157,30],L7:[83,685,157,30],
R0:[1303,268,148,30],R1:[1303,326,148,30],R2:[1303,386,148,30],R3:[1303,444,148,30],R4:[1303,507,148,30],R5:[1303,566,148,30],R6:[1303,627,148,30],R7:[1303,685,148,30],
LQ0:[304,301,91,28],LQ1:[304,417,91,28],LQ2:[304,540,91,28],LQ3:[304,660,91,28],
RQ0:[1138,301,91,28],RQ1:[1138,417,91,28],RQ2:[1138,540,91,28],RQ3:[1138,660,91,28],
LS0:[462,361,96,29],LS1:[462,598,96,29],RS0:[977,361,96,29],RS1:[977,598,96,29],
LF:[520,461,90,30],RF:[926,461,90,30],CHAMP:[680,489,176,38],TL:[566,719,142,31],TR:[824,719,142,31]
};
function blankState(){return {teams:Array(16).fill(""),started:false,results:{},podiumNonce:0,updatedAt:Date.now()};}
function loadState(){
  try{
    const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(v&&Array.isArray(v.teams)&&v.teams.length===16)return {...blankState(),...v,results:v.results||{}};
  }catch(e){}
  return blankState();
}
const channel=("BroadcastChannel" in window)?new BroadcastChannel(CHANNEL_NAME):null;
function saveState(state){
  state.updatedAt=Date.now();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(channel)channel.postMessage(state);
}
function watchState(cb){
  window.addEventListener("storage",e=>{if(e.key===STORAGE_KEY&&e.newValue){try{cb(JSON.parse(e.newValue));}catch(_){}}});
  if(channel)channel.addEventListener("message",e=>cb(e.data));
}
function matchup(state,key){
  const t=state.teams,r=state.results||{};
  if(/^L16_/.test(key)){const i=+key.split("_")[1];return[t[i*2]||"",t[i*2+1]||""];}
  if(/^R16_/.test(key)){const i=+key.split("_")[1];return[t[8+i*2]||"",t[8+i*2+1]||""];}
  if(/^L8_/.test(key)){const i=+key.split("_")[1];return[r["L16_"+i*2]||"",r["L16_"+(i*2+1)]||""];}
  if(/^R8_/.test(key)){const i=+key.split("_")[1];return[r["R16_"+i*2]||"",r["R16_"+(i*2+1)]||""];}
  if(key==="L4")return[r.L8_0||"",r.L8_1||""];
  if(key==="R4")return[r.R8_0||"",r.R8_1||""];
  if(key==="FINAL")return[r.L4||"",r.R4||""];
  if(key==="THIRD")return[semiLoser(state,"L"),semiLoser(state,"R")];
  return["",""];
}
function semiLoser(state,side){
  const key=side==="L"?"L4":"R4",m=matchup(state,key),w=state.results[key];
  if(!m[0]||!m[1]||!w)return "";
  return m[0]===w?m[1]:m[0];
}
function downstream(key){
  if(key.startsWith("L16_"))return["L8_"+Math.floor((+key.split("_")[1])/2),"L4","FINAL","THIRD"];
  if(key.startsWith("R16_"))return["R8_"+Math.floor((+key.split("_")[1])/2),"R4","FINAL","THIRD"];
  if(key.startsWith("L8_"))return["L4","FINAL","THIRD"];
  if(key.startsWith("R8_"))return["R4","FINAL","THIRD"];
  if(key==="L4"||key==="R4")return["FINAL","THIRD"];
  return[];
}
function chooseWinner(state,key,team){
  const m=matchup(state,key);
  if(!team||!m.includes(team))return state;
  for(const k of downstream(key))delete state.results[k];
  state.results[key]=team;
  return state;
}
function rankings(state){
  const f=matchup(state,"FINAL"),first=state.results.FINAL||"";
  const second=first&&f[0]&&f[1]?(first===f[0]?f[1]:f[0]):"";
  const third=state.results.THIRD||"";
  return {first,second,third,complete:!!(first&&second&&third)};
}
function slotTeam(state,id){
  if(!state.started)return "";
  const r=state.results,t=state.teams;
  if(/^L\d$/.test(id))return t[+id.slice(1)]||"";
  if(/^R\d$/.test(id))return t[8+(+id.slice(1))]||"";
  if(/^LQ\d$/.test(id))return r["L16_"+(+id.slice(2))]||"";
  if(/^RQ\d$/.test(id))return r["R16_"+(+id.slice(2))]||"";
  if(id==="LS0")return r.L8_0||""; if(id==="LS1")return r.L8_1||"";
  if(id==="RS0")return r.R8_0||""; if(id==="RS1")return r.R8_1||"";
  if(id==="LF")return r.L4||""; if(id==="RF")return r.R4||"";
  return "";
}
function keyForSlot(id){
  if(/^L\d$/.test(id))return "L16_"+Math.floor((+id.slice(1))/2);
  if(/^R\d$/.test(id))return "R16_"+Math.floor((+id.slice(1))/2);
  if(/^LQ\d$/.test(id))return "L8_"+Math.floor((+id.slice(2))/2);
  if(/^RQ\d$/.test(id))return "R8_"+Math.floor((+id.slice(2))/2);
  if(/^LS\d$/.test(id))return "L4"; if(/^RS\d$/.test(id))return "R4";
  if(id==="LF"||id==="RF")return "FINAL";
  return "";
}
function applyPosition(el,id){
  const [x,y,w,h]=SLOT_POSITIONS[id];
  el.style.left=(x/1536*100)+"%";el.style.top=(y/864*100)+"%";
  el.style.width=(w/1536*100)+"%";el.style.height=(h/864*100)+"%";
}
async function checkForUpdate(){
  try{
    const res=await fetch("./version.json?_="+Date.now(),{cache:"no-store"});
    if(!res.ok)return;
    const v=await res.json();
    if(v.version&&v.version!==APP_VERSION)location.reload();
  }catch(e){}
}
setTimeout(checkForUpdate,5000);setInterval(checkForUpdate,30000);
