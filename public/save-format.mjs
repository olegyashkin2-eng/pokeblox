import {ALL_IDS,BASES,hpMax,walkable,ISLAND2_IDS,ISLAND2_ZONES,ISLAND2_SPAWNS,ISLAND3_IDS,ISLAND4_IDS,ISLAND3_SPAWNS,ISLAND4_SPAWNS,TIDAL_ADDITIONS,EXTRA_ZONES,PICKUP_LAYOUTS,STONES,canBattle} from './data.mjs';
import {EXPANSION_IDS,EXPANSION_SPAWNS,SUPPLEMENTAL_IDS} from './expansion.mjs';
import {BOSS_HP} from './finale.mjs';
import {CODE_IDS,emptyCodeRewards} from './codes.mjs';
const fail=()=>{throw new Error('INVALID_SAVE');};
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max?v:fail();
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fail();
const bool=v=>typeof v==='boolean'?v:fail();
const pokemon=p=>{if(!p||!ALL_IDS.includes(p.species)||!canBattle(p.species))fail();const r={uid:integer(p.uid,1,1e9),species:p.species,level:integer(p.level,1,50),xp:integer(p.xp,0,500),hp:integer(p.hp,0,1000)};if(r.hp>hpMax(r))fail();return r;};
const list=(a,allowed)=>{if(!Array.isArray(a)||a.length>allowed.length||a.some(x=>!allowed.includes(x)))fail();return [...new Set(a)];};
const spawns={2:ISLAND2_SPAWNS,3:ISLAND3_SPAWNS,4:ISLAND4_SPAWNS,...EXPANSION_SPAWNS};
const allowedWild={1:[...BASES,6],2:[...ISLAND2_IDS,55,...TIDAL_ADDITIONS.filter(id=>![148,149].includes(id)),...SUPPLEMENTAL_IDS[2]],3:ISLAND3_IDS,4:ISLAND4_IDS,...EXPANSION_IDS,10:[]};
export function validateSnapshot(input){
 if(![2,3,4,5,6].includes(input?.version)||!input.state?.started)fail();
 const legacy=input.version<4,expansion=input.version>=5,s=input.state,maxIsland=legacy?2:expansion?10:4;
 if(!Array.isArray(s.party)||s.party.length<1||s.party.length>180)fail();
 const party=s.party.map(pokemon);if(new Set(party.map(p=>p.uid)).size!==party.length)fail();
 const island=s.island??1;integer(island,1,maxIsland);
 const state={island,laprasUnlocked:bool(s.laprasUnlocked??false),bossDefeated:bool(s.bossDefeated??false),started:true,party,active:integer(s.active,0,party.length-1),balls:integer(s.balls,0,1e7),potions:integer(s.potions,0,1e7),candies:integer(s.candies,0,1e7),stones:{},seen:list(s.seen,ALL_IDS),caught:list(s.caught,ALL_IDS),wins:integer(s.wins,0,1e7),evolutions:integer(s.evolutions,0,1e7),captured:integer(s.captured,0,1e7),pickedStones:list(s.pickedStones,Object.keys(STONES)),completed:bool(s.completed),visited:list(s.visited,['Янтарные скалы','Грозовая роща','Лазурное озеро','Лиственный лес','Лагерь исследователей','Солнечная поляна',...ISLAND2_ZONES,...Object.values(EXTRA_ZONES).flat()]),finalDefeated:bool(s.finalDefeated??false),finalCreditsSeen:bool(s.finalCreditsSeen??false)};
 const codes=input.version>=6?s.codeRewards:emptyCodeRewards();
 if(!codes)fail();
 state.codeRewards={redeemed:list(codes.redeemed,CODE_IDS),xpUntil:integer(codes.xpUntil,0,9e15),catchUntil:integer(codes.catchUntil,0,9e15)};
 if((codes.xpUntil>0)!==state.codeRewards.redeemed.includes('pikacode')||(codes.catchUntil>0)!==state.codeRewards.redeemed.includes('pokeblox4ever'))fail();
 for(let id=2;id<=10;id++)state[`island${id}Wins`]=integer(s[`island${id}Wins`]??0,0,1e7);
 for(const key of Object.keys(STONES))state.stones[key]=integer(s.stones?.[key]??(legacy&&!['water','thunder','fire'].includes(key)?0:undefined),0,1e7);
 for(const p of party)if(!state.caught.includes(p.species)||!state.seen.includes(p.species))fail();
 if(state.laprasUnlocked&&(!state.caught.includes(131)||!state.seen.includes(131)))fail();
 if(island>2&&!state.laprasUnlocked)fail();
 if((island===10||state.finalDefeated)&&state.caught.length!==149)fail();
 if(state.finalCreditsSeen&&!state.finalDefeated)fail();
 function validateWorld(w,id){
  if(!w||!Array.isArray(w.position)||w.position.length!==2)fail();
  const position=w.position.map(v=>number(v,-130,130));if(!walkable(...position,id))fail();
  const count=spawns[id]?.length??15,pickupCount=PICKUP_LAYOUTS[id].length;
  const oldCount=legacy?(id===2?20:15):!expansion&&id===2?23:count;
  if(!Array.isArray(w.wild)||w.wild.length!==oldCount||!Array.isArray(w.pickups)||w.pickups.length!==(legacy?13:pickupCount))fail();
  const wild=w.wild.map((v,i)=>{if(v.key!==i||!allowedWild[id].includes(v.id))fail();return {key:i,id:v.id,visible:bool(v.visible),nextChangeAt:number(v.nextChangeAt,0,9e15),x:number(v.x,-130,130),z:number(v.z,-130,130),phase:number(v.phase,0,7)};});
  // Append new encounters; keep every old wild/pickup key and battle intact.
  while(wild.length<count){const p=spawns[id][wild.length];wild.push({key:wild.length,id:p.id,visible:true,nextChangeAt:0,x:p.x,z:p.z,phase:0});}
  const pickups=w.pickups.map((v,i)=>{if(v.key!==i)fail();return {key:i,readyAt:number(v.readyAt,0,9e15)};});
  while(pickups.length<pickupCount)pickups.push({key:pickups.length,readyAt:0});
  return {position,rotation:number(w.rotation,-1e6,1e6),yaw:number(w.yaw,-1e6,1e6),pitch:number(w.pitch,.2,1),distance:number(w.distance,7,22),playedSeconds:number(w.playedSeconds,0,1e9),wild,pickups};
 }
 const world=validateWorld(input.world,island),wild=world.wild,regions={};
 for(const [key,value] of Object.entries(input.regions??{})){const id=Number(key);integer(id,1,maxIsland);if(String(id)!==key)fail();if(id!==island)regions[id]=validateWorld(value,id);}
 let battle=null;if(input.battle!==null){const b=input.battle;if(!b)fail();const key=integer(b.wildKey,0,wild.length-1),enemy=pokemon(b.enemy);if(enemy.species!==wild[key].id||enemy.hp===0||b.ownUid!==party[state.active].uid||party[state.active].hp===0||!wild[key].visible)fail();battle={wildKey:key,enemy,ownUid:b.ownUid,turn:integer(b.turn,0,10000),specialCooldown:integer(b.specialCooldown,0,2)};}
 let raid=null;if(input.raid!=null){
  const r=input.raid;if(!expansion||island!==10||battle||!Array.isArray(r.uids)||r.uids.length!==2||new Set(r.uids).size!==2||!Array.isArray(r.cooldowns)||r.cooldowns.length!==2)fail();
  const allies=r.uids.map(uid=>party.find(p=>p.uid===uid));if(allies.some(p=>!p)||allies.every(p=>!p.hp))fail();
  raid={uids:[...r.uids],bossHp:integer(r.bossHp,1,BOSS_HP),turn:integer(r.turn,0,10000),cooldowns:r.cooldowns.map(n=>integer(n,0,2))};
 }
 return {version:6,state,world,regions,battle,raid,settings:{soundEnabled:bool(input.settings?.soundEnabled)}};
}
