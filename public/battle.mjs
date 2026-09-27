import {SPECIES,hpMax,newPokemon,damageFor,catchChance,MAX_PARTY,gainXP} from './data.mjs';
export function resolveTurn(state,battle,action,rng=Math.random){
 if(battle.resolved)return {error:'Встреча уже завершена'};const {own,enemy}=battle,events=[];let result=null;
 if(action==='flee'){battle.resolved=true;return {result:'flee',events:[{text:'Ты спокойно покидаешь встречу.'}]};}
 if(!['attack','special','catch','heal'].includes(action))return {error:'Неизвестное действие'};
 if(action==='special'&&battle.specialCooldown>0)return {error:'Приём ещё не восстановился'};
 if(action==='catch'&&(!state.balls||state.party.length>=MAX_PARTY))return {error:state.balls?'Команда заполнена':'Покеболы закончились'};
 if(action==='heal'&&(!state.potions||own.hp>=hpMax(own)))return {error:'Лечение сейчас недоступно'};
 if(action==='attack'||action==='special'){
  const hit=damageFor(own,enemy,action==='special',rng);enemy.hp=Math.max(0,enemy.hp-hit.damage);events.push({actor:'own',type:action==='special'?SPECIES[own.species].type:'normal',text:`${SPECIES[own.species].name}: ${action==='special'?SPECIES[own.species].move:'атака'}! −${hit.damage} HP.${hit.critical?' Критический удар!':''}${hit.eff>1?' Очень эффективно!':hit.eff<1?' Не очень эффективно…':''}`});if(action==='special')battle.specialCooldown=2;if(!enemy.hp){state.wins++;result='victory';}
 }else if(action==='catch'){
  state.balls--;const caught=rng()<catchChance(enemy);events.push({throw:true,text:'Покебол в полёте…'});if(caught){state.party.push(newPokemon(enemy.species,enemy.level));state.caught.add(enemy.species);state.seen.add(enemy.species);state.captured++;result='catch';events.push({caught:true,text:`${SPECIES[enemy.species].name} пойман и присоединился к команде!`});}else events.push({text:`${SPECIES[enemy.species].name} выбрался из покебола!`});
 }else{state.potions--;own.hp=Math.min(hpMax(own),own.hp+45);events.push({heal:true,text:`${SPECIES[own.species].name} восстановил до 45 HP.`});}
 if(!result){const hit=damageFor(enemy,own,battle.turn%3===2,rng),damage=Math.max(2,Math.round(hit.damage*.78));own.hp=Math.max(0,own.hp-damage);events.push({actor:'enemy',type:battle.turn%3===2?SPECIES[enemy.species].type:'normal',text:`${SPECIES[enemy.species].name} отвечает: −${damage} HP.`});if(!own.hp){result='defeat';events.push({text:'Напарник устал. В лагере помогут восстановиться.'});}battle.turn++;battle.specialCooldown=Math.max(0,battle.specialCooldown-1);}
 let reward=null;if(result==='victory'||result==='catch'){const xp=Math.round((95+own.level*12)*(result==='catch'?.7:1)),levels=gainXP(own,xp);reward={xp,levels};events.push({win:true,text:`${result==='victory'?'Победа!':'Успешная ловля!'} +${xp} опыта.${levels?` Новый уровень: ${own.level}!`:''}`});}
 if(result)battle.resolved=true;return {result,events,reward};
}
