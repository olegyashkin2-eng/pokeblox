import {hpMax,MAX_PARTY} from './data.mjs';

export const CODE_IDS=['pikacode','pokeblox4ever','mrdragonforce'];
export const emptyCodeRewards=()=>({redeemed:[],xpUntil:0,catchUntil:0});
export const normalizeCode=value=>typeof value==='string'?value.trim().toLowerCase():'';
export const xpMultiplier=(state,now=Date.now())=>state.codeRewards?.xpUntil>now?2:1;

// Called by the server inside the save transaction. Validate every reward before
// changing the inventory, so a full team never consumes the gift code.
export function redeemCode(state,input,now=Date.now()){
 const code=normalizeCode(input);
 if(!CODE_IDS.includes(code))return {error:'CODE_UNKNOWN'};
 const rewards=state.codeRewards??emptyCodeRewards();
 if(rewards.redeemed.includes(code))return {error:'CODE_USED'};
 let gift;
 if(code==='mrdragonforce'){
  if(state.party.length>=MAX_PARTY)return {error:'PARTY_FULL'};
  if(state.balls>1e7-250)return {error:'BALL_LIMIT'};
  const uid=Math.max(0,...state.party.map(p=>p.uid))+1;
  if(uid>1e9)return {error:'PARTY_FULL'};
  gift={uid,species:147,level:5,xp:0,hp:0};gift.hp=hpMax(gift);
 }
 state.codeRewards=rewards;
 if(code==='pikacode')rewards.xpUntil=now+5*60*1000;
 if(code==='pokeblox4ever')rewards.catchUntil=now+10*60*1000;
 if(gift){
  state.balls+=250;state.party.push(gift);
  for(const key of ['seen','caught']){
   if(state[key] instanceof Set)state[key].add(147);
   else if(!state[key].includes(147))state[key].push(147);
  }
 }
 rewards.redeemed.push(code);
 return {code};
}

export function activeCodeBoosts(state,now=Date.now()){
 return [['xpUntil','Опыт ×2'],['catchUntil','Шанс поимки ×2']].flatMap(([key,label])=>{
  const seconds=Math.max(0,Math.ceil(((state.codeRewards?.[key]??0)-now)/1000));
  return seconds?[{label,remaining:`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}]:[];
 });
}
