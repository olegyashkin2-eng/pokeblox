import {SPECIES,hpMax,newPokemon,damageFor,catchChance,MAX_PARTY,gainXP} from './data.mjs';
export function resolveTurn(state,battle,action,rng=Math.random){
 if(battle.resolved)return {error:'Встреча уже завершена'};let {own,enemy}=battle;const events=[];let result=null;
 if(action==='flee'){battle.resolved=true;return {result:'flee',events:[{text:'Ты спокойно покидаешь встречу.'}]};}
 const switching=typeof action==='object'&&action?.type==='switch';if(switching){const index=action.index;if(!Number.isInteger(index)||!state.party[index]||index===state.active||state.party[index].hp<=0)return {error:'Выбери другого здорового покемона'};state.active=index;own=state.party[index];battle.own=own;battle.specialCooldown=2;events.push({switch:true,text:`В бой вступает ${SPECIES[own.species].name}!`});action='switch';}
 if(action==='catch'&&battle.wild?.boss)return {error:'Босса нельзя поймать. Голдака можно получить эволюцией Псайдака.'};
 if(!['attack','special','catch','heal','switch'].includes(action))return {error:'Неизвестное действие'};
 if(action==='special'&&battle.specialCooldown>0)return {error:'Приём ещё не восстановился'};
 if(action==='catch'&&(!state.balls||state.party.length>=MAX_PARTY))return {error:state.balls?'Команда заполнена':'Покеболы закончились'};
 if(action==='heal'&&(!state.potions||own.hp>=hpMax(own)))return {error:'Лечение сейчас недоступно'};
 if(action==='attack'||action==='special'){
  const hit=damageFor(own,enemy,action==='special',rng);enemy.hp=Math.max(0,enemy.hp-hit.damage);events.push({actor:'own',type:action==='special'?SPECIES[own.species].type:'normal',text:`${SPECIES[own.species].name}: ${action==='special'?SPECIES[own.species].move:'атака'}! −${hit.damage} HP.${hit.critical?' Критический удар!':''}${hit.eff>1?' Очень эффективно!':hit.eff<1?' Не очень эффективно…':''}`});if(action==='special')battle.specialCooldown=2;if(!enemy.hp){state.wins++;result='victory';}
 }else if(action==='catch'){
  state.balls--;const caught=rng()<catchChance(enemy);events.push({throw:true,text:'Покебол в полёте…'});if(caught){state.party.push(newPokemon(enemy.species,enemy.level));state.caught.add(enemy.species);state.seen.add(enemy.species);state.captured++;result='catch';events.push({caught:true,text:`${SPECIES[enemy.species].name} пойман и присоединился к команде!`});}else events.push({text:`${SPECIES[enemy.species].name} выбрался из покебола!`});
 }else if(action==='heal'){state.potions--;own.hp=Math.min(hpMax(own),own.hp+45);events.push({heal:true,text:`${SPECIES[own.species].name} восстановил до 45 HP.`});}
 if(!result){const hit=damageFor(enemy,own,battle.turn%3===2,rng),damage=Math.max(2,Math.round(hit.damage*(battle.wild?.boss?1.12:.78)));own.hp=Math.max(0,own.hp-damage);events.push({actor:'enemy',type:battle.turn%3===2?SPECIES[enemy.species].type:'normal',text:`${SPECIES[enemy.species].name} отвечает: −${damage} HP.`});if(!own.hp){const next=state.party.findIndex(p=>p.hp>0);if(next>=0){state.active=next;battle.own=state.party[next];battle.specialCooldown=0;events.push({switch:true,text:`${SPECIES[own.species].name} устал. Бой продолжает ${SPECIES[battle.own.species].name}!`});}else{result='defeat';events.push({text:'Команда устала. В лагере помогут восстановиться.'});}}battle.turn++;battle.specialCooldown=Math.max(0,battle.specialCooldown-1);}
 if(result==='victory'&&state.island===2){state.island2Wins++;if(battle.wild?.boss&&!state.bossDefeated){state.bossDefeated=true;state.candies+=5;state.balls+=20;events.push({win:true,text:'Голдак побеждён! Значок прилива, 5 конфет и 20 покеболов — твои.'});}}
 let reward=null;if(result==='victory'||result==='catch'){const xp=Math.round((95+own.level*12)*(result==='catch'?.7:1)),levels=gainXP(own,xp);reward={xp,levels};events.push({win:true,text:`${result==='victory'?'Победа!':'Успешная ловля!'} +${xp} опыта.${levels?` Новый уровень: ${own.level}!`:''}`});}
 if(result)battle.resolved=true;return {result,events,reward};
}
