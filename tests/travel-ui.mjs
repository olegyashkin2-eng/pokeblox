import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as data from '../public/data.mjs';
import * as expansion from '../public/expansion.mjs';
import * as finale from '../public/finale.mjs';
import {height} from '../public/world.mjs';
import {validateSnapshot} from '../public/save-format.mjs';

// Execute the actual map and travel handlers with the real world and models.
// Only the DOM, timers and save transport are replaced; no WebGL is needed.
export async function checkTravelUI(world,expanded=false){
 const elements=new Map(),labels=[];
 const ctx=new Proxy({fillText(text){labels.push(text);}}, {get(target,key){return target[key]??(()=>{});}});
 const element=id=>{
  if(!elements.has(id))elements.set(id,{
   hidden:true,open:false,style:{},dataset:{},width:960,height:680,innerHTML:'',
   showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},setAttribute(){},querySelector(){return {};},
   querySelectorAll(selector){
    if(selector==='[data-raid-pick]')return this.picks=[...this.innerHTML.matchAll(/<input\b[^>]*data-raid-pick="(\d+)"([^>]*)>/g)].map(([,id,rest])=>({dataset:{raidPick:id},checked:/\bchecked\b/.test(rest),disabled:/\bdisabled\b/.test(rest)}));
    assert.equal(selector,'[data-travel]');
    return this.routes=[...this.innerHTML.matchAll(/<button\b[^>]*data-travel="(\d+)"([^>]*)>/g)].map(([,id,rest])=>({dataset:{travel:id},disabled:/\bdisabled\b/.test(rest)}));
   }
  });
  return elements.get(id);
 };
 class Saves{
  ready=true;blocked=false;writes=[];
  enqueue(value){this.writes.push(validateSnapshot(JSON.parse(JSON.stringify(value))));}
  async flushAll(){return true;}
 }
 const context=vm.createContext({...data,...expansion,...finale,height,performance,console,
  document:{getElementById:element,querySelector:element},Accounts:class{},SaveClient:Saves,
  setTimeout(fn){queueMicrotask(fn);return 0;},clearTimeout(){}
 });
 const source=await readFile(new URL('../public/game.mjs',import.meta.url),'utf8');
 vm.runInContext(source.replace(/^import .*;\r?\n/gm,'').replace(/^init\(\);\s*$/m,'')+`
 globalThis.game={state,saves,openPanel,closePanel,interact,snapshot,startFinale,raidAction,leaveRaid,finishCredits,endRaid,setWorld(value){world=value;},get locked(){return lock;},get raid(){return raid;},get orders(){return raidOrders;},resume(value){state.started=false;loadedSnapshot=value;accounts.user={id:1};startGame();}};`,context,{filename:'game.mjs'});
 const {game}=context;game.setWorld(world);world.portraits={};
 Object.assign(game.state,data.createState(),{started:true,candies:3,wins:3,party:[data.newPokemon(25,30)],caught:new Set([25]),seen:new Set([25])});
 world.configureIsland(1);world.begin(25);
 function openMap(){labels.length=0;game.openPanel('map');assert.equal(element('panel').open,true,'Map dialog opens');const expected=data.EXTRA_LANDMARKS[game.state.island]??(game.state.island===2?data.ISLAND2_LANDMARKS:data.LANDMARKS);for(const {label} of expected)assert.ok(labels.includes(label),`Island ${game.state.island} map shows ${label}`);return element('panel-content').routes;}
 function route(id){return openMap().find(button=>Number(button.dataset.travel)===id);}
 async function sail(id){
  const button=route(id);assert.equal(button.disabled,false,`Route ${id} enabled`);
  const arrival=button.onclick();assert.equal(game.locked,true);assert.equal(element('panel').open,false);
  if(!world.voyageScene)await arrival;
  assert.equal(game.state.island,id);assert.equal(world.island,id);assert.ok(world.voyageScene);
  assert.equal(game.saves.writes.at(-1).state.island,id,'Destination saved before animation');
  world.tick(7);await arrival;
  assert.equal(game.locked,false);assert.equal(element('voyage').hidden,true);assert.equal(world.voyageScene,null);
 }
 assert.equal(route(3).disabled,true,'Distant islands need Lapras');
 await sail(2);assert.equal(route(3).disabled,true);game.closePanel();
 const lapras=world.wild.find(w=>w.table==='tidal');world.rollWild(lapras,131);world.playerPos.copy(lapras.group.position);
 const origin=[world.playerPos.x,world.playerPos.z];game.interact();
 assert.equal(game.state.laprasUnlocked,true);assert.equal(game.state.party.length,1);assert.equal(lapras.visible,false);
 assert.equal(game.saves.writes.at(-1).state.laprasUnlocked,true,'Friendship saved');
 await sail(3);assert.equal(game.saves.writes.at(-1).regions[2].wild[lapras.key].visible,false);
 await sail(4);await sail(2);assert.deepEqual([world.playerPos.x,world.playerPos.z],origin,'Return restores shore position');
 await sail(1);openMap();game.closePanel();
 if(expanded){
  assert.equal(route(10).disabled,true,'Final arena needs all 149');
  for(const id of [5,6,7,8,9])await sail(id);
  game.state.caught=new Set(data.ALL_IDS);game.state.seen=new Set(data.ALL_IDS);game.state.party.push(data.newPokemon(149,50),data.newPokemon(9,50));await sail(10);
  world.playerPos.set(0,height(0,-30,10),-30);game.interact();assert.equal(element('panel').open,true);assert.ok(element('panel-content').innerHTML.includes('15 000 HP'));assert.equal(element('raid-start').disabled,false);
  const picks=element('panel-content').picks;assert.equal(picks.filter(p=>p.checked).length,2);picks[0].checked=false;picks[0].onchange();picks[2].checked=true;picks[2].onchange();element('raid-start').onclick();
  assert.equal(element('raid-ui').hidden,false);assert.equal(game.raid.bossHp,15000);assert.equal(game.saves.writes.at(-1).raid.bossHp,15000);
  async function animate(action){let done=false,result;const work=action().then(r=>{done=true;result=r;});for(let i=0;i<500&&!done;i++){world.tick(.05);await Promise.resolve();await Promise.resolve();}assert.equal(done,true,'Cinematic finishes');await work;return result;}
  await animate(()=>game.raidAction());assert.equal(game.raid.turn,1);assert.ok(game.raid.bossHp<15000);assert.equal(game.locked,false);
  const saved=JSON.parse(JSON.stringify(game.snapshot())),bossHp=saved.raid.bossHp;game.endRaid();game.resume(saved);assert.equal(game.raid.bossHp,bossHp);assert.equal(game.raid.turn,1);assert.equal(element('raid-ui').hidden,false);assert.equal(world.raidScene.allies.length,2);
  game.raid.bossHp=1;await animate(()=>game.raidAction());assert.equal(game.state.finalDefeated,true);assert.equal(element('final-credits').hidden,false);assert.equal(world.raidScene.boss.visible,false);assert.ok(world.raidScene.drops.every(d=>d.mesh.visible));
  const victory=JSON.parse(JSON.stringify(game.snapshot()));game.finishCredits();assert.equal(game.state.finalCreditsSeen,true);assert.equal(element('hud').hidden,false);assert.equal(world.raidScene,null);
  game.resume(victory);assert.equal(element('final-credits').hidden,false,'Closing during explosion resumes credits');game.finishCredits();await sail(8);
  console.log('PASS: actual ten map buttons, roster selection, saved two-fighter turn, resume, explosion, credits/reload and return to islands');
 }
 console.log('PASS: actual map buttons on all four islands; befriend Lapras; sail 1→2→3→4→2→1; save before arrival; restore origin');
}
