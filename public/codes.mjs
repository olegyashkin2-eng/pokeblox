import {ALL_IDS,canBattle,hpMax,partyLimit,MRDRAGON_PARTY_SLOTS} from './data.mjs';

export const CODE_IDS=['pikacode','pokeblox4ever','mrdragonforce','a','mrdragon'];
export const LIMITED_CODE_LIMITS=Object.freeze({a:2,mrdragon:4});
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
 const gifts=[];
 if(['mrdragonforce','a','mrdragon'].includes(code)){
  const species=code==='mrdragon'?ALL_IDS.filter(canBattle):[code==='a'?150:147];
  const capacity=partyLimit(state)+(code==='mrdragon'?MRDRAGON_PARTY_SLOTS:0);
  if(state.party.length+species.length>capacity)return {error:'PARTY_FULL'};
  if(code==='mrdragonforce'&&state.balls>1e7-250)return {error:'BALL_LIMIT'};
  let uid=Math.max(0,...state.party.map(p=>p.uid));
  if(uid+species.length>1e9)return {error:'PARTY_FULL'};
  for(const id of species){const gift={uid:++uid,species:id,level:5,xp:0,hp:0};gift.hp=hpMax(gift);gifts.push(gift);}
 }
 state.codeRewards=rewards;
 if(code==='pikacode')rewards.xpUntil=now+5*60*1000;
 if(code==='pokeblox4ever')rewards.catchUntil=now+10*60*1000;
 for(const gift of gifts){
  if(code==='mrdragonforce')state.balls+=250;state.party.push(gift);
  for(const key of ['seen','caught']){
   if(state[key] instanceof Set)state[key].add(gift.species);
   else if(!state[key].includes(gift.species))state[key].push(gift.species);
  }
 }
 if(code==='mrdragon'){
  state.laprasUnlocked=true;
  for(const key of ['seen','caught']){
   if(state[key] instanceof Set)state[key].add(131);
   else if(!state[key].includes(131))state[key].push(131);
  }
 }
 rewards.redeemed.push(code);
 return {code};
}

export function codePanelHTML(state){
 const disabled=state.started?'':' disabled';
 return `<section class="code-box" aria-labelledby="code-title"><h3 id="code-title">Коды и подарки</h3><p>Введи код и забери награду. Каждый код можно использовать один раз на аккаунт. У некоторых кодов есть общий лимит для всех игроков.</p>${state.started?'':'<p class="code-hint">Войди в аккаунт и начни или продолжи приключение, чтобы активировать код.</p>'}<form id="code-form" class="code-form"><label for="code-input">Код</label><div class="code-entry"><input id="code-input" name="code" type="text" placeholder="Введи код" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" required${disabled}><button id="code-submit" type="submit" class="primary"${disabled}>Активировать</button></div><p id="code-message" class="code-message" role="status" aria-live="polite"></p></form><p>Для активации нужен интернет. Время бонуса идёт и при закрытой игре.</p><div id="code-boosts" class="code-boosts" aria-label="Активные бонусы"></div>${state.codeRewards.redeemed.length?`<details class="code-used"><summary>Использовано кодов: ${state.codeRewards.redeemed.length}</summary><p>${state.codeRewards.redeemed.join(' · ')}</p></details>`:''}</section>`;
}

export function activeCodeBoosts(state,now=Date.now()){
 return [['xpUntil','Опыт ×2'],['catchUntil','Шанс поимки ×2']].flatMap(([key,label])=>{
  const seconds=Math.max(0,Math.ceil(((state.codeRewards?.[key]??0)-now)/1000));
  return seconds?[{label,remaining:`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}]:[];
 });
}
