import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as data from '../public/data.mjs';
import {validateSnapshot} from '../public/save-format.mjs';

// Execute the actual map and travel handlers with the real world and models.
// Only the DOM, timers and save transport are replaced; no WebGL is needed.
export async function checkTravelUI(world){
 const elements=new Map(),labels=[];
 const ctx=new Proxy({fillText(text){labels.push(text);}}, {get(target,key){return target[key]??(()=>{});}});
 const element=id=>{
  if(!elements.has(id))elements.set(id,{
   hidden:true,open:false,style:{},dataset:{},width:960,height:680,innerHTML:'',
   showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},setAttribute(){},
   querySelectorAll(selector){
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
 const context=vm.createContext({...data,performance,console,
  document:{getElementById:element,querySelector:element},Accounts:class{},SaveClient:Saves,
  setTimeout(){return 0;},clearTimeout(){}
 });
 const source=await readFile(new URL('../public/game.mjs',import.meta.url),'utf8');
 vm.runInContext(source.replace(/^import .*;\r?\n/gm,'').replace(/^init\(\);\s*$/m,'')+`
 globalThis.game={state,saves,openPanel,closePanel,interact,snapshot,setWorld(value){world=value;},get locked(){return lock;}};`,context,{filename:'game.mjs'});
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
 console.log('PASS: actual map buttons on all four islands; befriend Lapras; sail 1→2→3→4→2→1; save before arrival; restore origin');
}
