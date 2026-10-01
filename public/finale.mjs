import {SPECIES,battleStat,hpMax,canBattle,effectiveness} from './data.mjs';
import {collectionCount,VOLCANO_ISLAND} from './expansion.mjs';

export const BOSS_HP=15000;
export const BOSS_MOVES=Object.freeze([
 {name:'Ядовитый прилив',dna:'Граймер',type:'poison',effect:'psychic',all:true,power:20},
 {name:'Пламя химер',dna:'Чаризард',type:'fire',effect:'fire',all:false,power:34},
 {name:'Психический разлом',dna:'Мью',type:'psychic',effect:'psychic',all:true,power:24},
 {name:'Таран Нидокинга',dna:'Нидокинг',type:'ground',effect:'rock',all:false,power:42}
]);
export const bossMove=raid=>BOSS_MOVES[raid.turn%BOSS_MOVES.length];
export const raidMembers=(state,raid)=>raid.uids.map(uid=>state.party.find(p=>p.uid===uid));
export function createRaid(state,uids){
 if(state.island!==VOLCANO_ISLAND||collectionCount(state)!==149)throw Error('Для вулкана нужна коллекция 149/149.');
 if(!Array.isArray(uids)||uids.length!==2||new Set(uids).size!==2)throw Error('Выбери двух разных покемонов.');
 const party=uids.map(uid=>state.party.find(p=>p.uid===uid));
 if(party.some(p=>!p||p.hp<=0||!canBattle(p.species)))throw Error('Нужны два здоровых бойца.');
 return {uids:[...uids],bossHp:BOSS_HP,turn:0,cooldowns:[0,0]};
}
export function resolveRaidTurn(state,raid,orders,rng=Math.random){
 if(!raid||raid.resolved||raid.bossHp<=0)return {error:'Битва уже завершена.'};
 const allies=raidMembers(state,raid),events=[],guards=[false,false],move=bossMove(raid);
 if(allies.some(p=>!p))return {error:'Бойцы не найдены.'};
 if(allies.every(p=>!p.hp))return {error:'Оба бойца устали. Вернись в лагерь.'};
 if(!Array.isArray(orders)||orders.length!==2)return {error:'Выбери действия двух бойцов.'};
 let healing=0;
 for(let i=0;i<2;i++){
  if(!allies[i].hp)continue;
  if(!['attack','special','heal','guard'].includes(orders[i]))return {error:'Выбери действие.'};
  if(orders[i]==='special'&&raid.cooldowns[i]>0)return {error:'Особый приём ещё восстанавливается.'};
  if(orders[i]==='heal'){if(allies[i].hp===hpMax(allies[i]))return {error:'Этот покемон уже здоров.'};healing++;}
 }
 if(healing>state.potions)return {error:'Не хватает зелий для выбранных действий.'};
 const phase=raid.bossHp<=BOSS_HP*.3?1.3:raid.bossHp<=BOSS_HP*.6?1.12:1;
 for(let slot=0;slot<2;slot++){
  const p=allies[slot],action=orders[slot];if(!p.hp)continue;
  if(action==='guard'){guards[slot]=true;events.push({kind:'guard',slot,text:`${SPECIES[p.species].name} готовится отразить удар.`});}
  else if(action==='heal'){state.potions--;p.hp=Math.min(hpMax(p),p.hp+Math.max(65,Math.round(hpMax(p)*.6)));events.push({kind:'heal',slot,hp:p.hp,text:`${SPECIES[p.species].name} восстановил здоровье.`});}
  else{
   const special=action==='special',eff=special?effectiveness(SPECIES[p.species].type,move.type):1;
   // The volcano's resonance amplifies this pair only, keeping normal battles unchanged.
   const damage=Math.max(20,Math.round((battleStat(p,special?'spAttack':'attack')*(special?9:5)+p.level*2.7)*eff*(.94+rng()*.12)));
   raid.bossHp=Math.max(0,raid.bossHp-damage);if(special)raid.cooldowns[slot]=3;
   events.push({kind:'attack',slot,special,hp:raid.bossHp,text:`${SPECIES[p.species].name}: ${special?SPECIES[p.species].move:'атака'} — ${damage} урона!`});
  }
  if(!raid.bossHp)break;
 }
 if(!raid.bossHp){raid.resolved=true;state.finalDefeated=true;state.finalCreditsSeen=false;state.wins++;state.island10Wins++;return {result:'victory',events};}
 const healthy=allies.map((p,i)=>p.hp>0?i:-1).filter(i=>i>=0),targets=move.all?healthy:[healthy[raid.turn%healthy.length]];
 for(const slot of targets){
  const p=allies[slot],resistance=Math.min(1.4,Math.max(.65,100/battleStat(p,move.type==='ground'?'defense':'spDefense')));
  const damage=Math.max(2,Math.round(move.power*phase*resistance*effectiveness(move.type,SPECIES[p.species].type)*(guards[slot]?.25:1)));
  p.hp=Math.max(0,p.hp-damage);events.push({kind:'boss',slot,effect:move.effect,hp:p.hp,text:`Нечто-Р · ${move.name}: ${SPECIES[p.species].name} теряет ${damage} HP.${guards[slot]?' Защита смягчила удар!':''}`});
 }
 raid.turn++;raid.cooldowns=raid.cooldowns.map(n=>Math.max(0,n-1));
 if(allies.every(p=>p.hp===0)){raid.resolved=true;return {result:'defeat',events};}
 return {result:null,events};
}
