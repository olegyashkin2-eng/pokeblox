import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../public/vendor/three.module.min.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('three');
const data=await import('../public/data.mjs');
const {ALL_IDS,SPECIES,BASES,ISLAND2_SPAWNS,ISLAND3_SPAWNS,ISLAND4_SPAWNS,createState,newPokemon,hpMax,evolutionOptions,canBattle,travelReason,PICKUP_LAYOUTS,ENCOUNTERS,TIDAL_ENCOUNTERS}=data;
const {PHOTO_ROSTERS,EXPANSION_SPAWNS,ENCOUNTER_TABLES,rollTable,CAMP_PORTAL}=await import('../public/expansion.mjs');
const {BOSS_HP,createRaid,resolveRaidTurn,bossMove}=await import('../public/finale.mjs');
const {validateSnapshot}=await import('../public/save-format.mjs');
const {World}=await import('../public/world.mjs');
const {classicFixtures}=await import('./classic-fixtures.mjs');

assert.deepEqual(ALL_IDS,Array.from({length:149},(_,i)=>i+1));
assert.deepEqual(PHOTO_ROSTERS,{
 5:[81,82,25,26,135,145,100,101],6:[92,93,94,142,138,139,140,141],
 7:[69,70,71,1,2,48,49,123,127,46,47,10,11,12,13,14,15,43,44,45],
 8:[19,20,16,17,18,133,128,52,53,83,84,85,50,51,112,111,115],
 9:[4,5,6,126,146,136,58,59,77,78,37,38]
});
const obtainable=new Set([25,...[ISLAND2_SPAWNS,ISLAND3_SPAWNS,ISLAND4_SPAWNS,...Object.values(EXPANSION_SPAWNS)].flat().map(p=>p.id),...Object.values(ENCOUNTERS).flat().map(p=>p[0]),...TIDAL_ENCOUNTERS.map(p=>p[0]),...Object.values(ENCOUNTER_TABLES).flat().map(p=>p[0])]);
let added=true;while(added){added=false;for(const id of [...obtainable])for(const next of [SPECIES[id].next,...Object.values(SPECIES[id].stones??{})].filter(Boolean)){if(!obtainable.has(next)){obtainable.add(next);added=true;}}}
assert.deepEqual([...obtainable].sort((a,b)=>a-b),ALL_IDS,'All 149 species really can be obtained');
for(const [name,rare] of [['power',145],['fire',146]]){let count=0;for(let i=0;i<1e6;i++)if(rollTable(name,()=>(i+.5)/1e6)===rare)count++;assert.equal(count,50);assert.ok(!EXPANSION_SPAWNS[name==='power'?5:9].some(p=>p.id===rare),'Legendary has no guaranteed spawn');}
assert.equal(TIDAL_ENCOUNTERS.find(p=>p[0]===147)[1],5);
assert.equal(evolutionOptions(newPokemon(129,50),createState()).length,0,'Preserve the previous Magikarp rule');
console.log('PASS: all six photos, complete attainable 149, exact 0.005% Zapdos/Moltres and 5% Dratini');

globalThis.document={hidden:false,createElement:()=>({width:0,height:0,getContext:()=>({fillText(){}})})};
const world=Object.create(World.prototype);Object.assign(world,{island:1,layouts:{},sun:new THREE.DirectionalLight(),shadowTexture:null,models:await classicFixtures(),scene:new THREE.Scene(),environment:new THREE.Group(),pickups:[],obstacles:[],wild:[],clock:0,camera:new THREE.PerspectiveCamera(46,390/844,.1,260),cameraMode:'explore',cameraYaw:0,cameraPitch:.52,cameraDistance:12,playerPos:new THREE.Vector3(0,0,18),trainer:new THREE.Group(),ring:new THREE.Group(),renderer:{render(){}}});
world.scene.background=new THREE.Color();world.scene.fog=new THREE.Fog(0xffffff,65,145);world.buildTerrain();world.buildNature();world.buildCamp();world.buildPickups();world.buildAtmosphere();world.buildTrainer();world.scene.add(world.environment);world.spawnWild();
const regions={};
for(let id=1;id<=10;id++){
 world.configureIsland(id);assert.ok(Math.hypot(world.portal.position.x,world.portal.position.z-22)<=9,'Portal is beside camp');
 assert.deepEqual([world.portal.position.x,world.portal.position.z],[CAMP_PORTAL.x,CAMP_PORTAL.z]);
 const visited=new Set(['0,18']),queue=[[0,18]];
 for(let n=0;n<queue.length;n++){const [x,z]=queue[n];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;if(!visited.has(key)&&!world.blocked(nx,nz)){visited.add(key);queue.push([nx,nz]);}}}
 for(const p of [...world.wild.map(w=>w.home),...world.pickups,CAMP_PORTAL,...(id===10?[{x:0,z:-30}]:[])])assert.ok(queue.some(([x,z])=>Math.hypot(x-p.x,z-p.z)<2.5),`Island ${id}: reachable ${p.x},${p.z}`);
 world.playerPos.set(CAMP_PORTAL.x,world.ground(CAMP_PORTAL.x,CAMP_PORTAL.z),CAMP_PORTAL.z);assert.equal(world.nearest()?.kind,'portal',`Island ${id}: camp portal action`);
 world.playerPos.set(0,world.ground(0,18),18);regions[id]=world.snapshotWorld();
 assert.ok(world.wild.every(w=>w.group.userData.modelSource==='original-glb'));
}
console.log('PASS: ten actual island scenes; paths from camp to every encounter, pickup, portal and volcano arena');

const state=createState();Object.assign(state,{started:true,candies:3,wins:3,laprasUnlocked:true,island:10,party:[newPokemon(149,50),newPokemon(9,50)],caught:new Set(ALL_IDS),seen:new Set(ALL_IDS)});
assert.equal(travelReason({...state,island:1},10),'');assert.ok(travelReason({...state,island:1,caught:new Set(ALL_IDS.slice(1))},10));
assert.throws(()=>createRaid({...state,caught:new Set(ALL_IDS.slice(1))},state.party.map(p=>p.uid)));
assert.throws(()=>createRaid(state,[state.party[0].uid,state.party[0].uid]));
const raid=createRaid(state,state.party.map(p=>p.uid));assert.equal(raid.bossHp,15000);
const snapshot=()=>({version:6,state:{...state,seen:[...state.seen],caught:[...state.caught],visited:[...state.visited],pickedStones:[...state.pickedStones]},world:regions[10],regions:Object.fromEntries(Object.entries(regions).filter(([id])=>id!=='10')),battle:null,raid:raid.resolved?null:structuredClone(raid),settings:{soundEnabled:false}});
const save=structuredClone(snapshot());assert.deepEqual(validateSnapshot(save),save);
// A full 180-member account plus ten regions must fit both API and unload limits.
const large=structuredClone(save);large.state.party=Array.from({length:180},(_,i)=>({...newPokemon(ALL_IDS.filter(canBattle)[i%148],50),uid:9000+i}));large.raid.uids=large.state.party.slice(0,2).map(p=>p.uid);
const bytes=Buffer.byteLength(JSON.stringify({snapshot:validateSnapshot(large),revision:999999,writeId:'12345678-1234-1234-1234-123456789012'}));assert.ok(bytes<62000,`Largest account payload: ${bytes} bytes`);
const v4=structuredClone(save);v4.version=4;v4.raid=null;v4.state.island=2;v4.world={...v4.regions[2],wild:v4.regions[2].wild.slice(0,23)};v4.regions={1:regions[1],3:regions[3],4:regions[4]};v4.battle={wildKey:3,enemy:newPokemon(54,20),ownUid:v4.state.party[0].uid,turn:6,specialCooldown:1};
v4.world.wild[3].id=54;v4.world.wild[3].visible=true;const migrated=validateSnapshot(v4);assert.equal(migrated.world.wild.length,31);assert.deepEqual(migrated.world.wild.slice(0,23),v4.world.wild);assert.deepEqual(migrated.battle,v4.battle);assert.deepEqual(migrated.state.party,v4.state.party);assert.deepEqual(migrated.regions,v4.regions);
for(const mutate of [s=>s.raid.uids[1]=s.raid.uids[0],s=>s.raid.bossHp=15001,s=>s.raid.cooldowns[0]=3,s=>s.state.caught.pop(),s=>s.state.party.forEach(p=>p.hp=0),s=>s.raid.uids[0]=900000]){const bad=structuredClone(save);mutate(bad);assert.throws(()=>validateSnapshot(bad));}
console.log(`PASS: v2/v3/v4 migration path, preserved active battle, v5 raid validation; full account is ${bytes} bytes`);

// Invalid orders cannot partially consume potions or change a completed turn.
state.party.forEach(p=>p.hp--);state.potions=1;const before=JSON.stringify({state,raid});assert.ok(resolveRaidTurn(state,raid,['heal','heal']).error);assert.equal(JSON.stringify({state,raid}),before);state.potions=20;
const moves=new Set();let outcome;
for(let i=0;i<60&&!raid.resolved;i++){
 moves.add(bossMove(raid).name);const orders=state.party.map((p,slot)=>p.hp<hpMax(p)*.55&&state.potions?'heal':raid.cooldowns[slot]===0?'special':'attack');
 outcome=resolveRaidTurn(state,raid,orders,()=>.5);assert.ok(!outcome.error);if(!raid.resolved)assert.deepEqual(validateSnapshot(snapshot()).raid,raid);
}
assert.equal(outcome.result,'victory','Prepared pair can beat 15000 HP');assert.equal(moves.size,4);assert.equal(state.finalDefeated,true);assert.equal(state.finalCreditsSeen,false);assert.equal(state.island10Wins,1);assert.ok(resolveRaidTurn(state,raid,['attack','attack']).error);assert.equal(state.island10Wins,1);
const guarded=createState();Object.assign(guarded,{island:10,caught:new Set(ALL_IDS),party:[newPokemon(25,50),newPokemon(6,50)],potions:5});const defend=createRaid(guarded,guarded.party.map(p=>p.uid));const guardedHP=guarded.party[0].hp;const turn=resolveRaidTurn(guarded,defend,['guard','guard']);assert.ok(turn.events.some(e=>e.text.includes('смягчила')));assert.ok(guardedHP-guarded.party[0].hp<10);
const doomed=createState();Object.assign(doomed,{island:10,caught:new Set(ALL_IDS),party:[newPokemon(25,1),newPokemon(4,1)],potions:0});doomed.party.forEach(p=>p.hp=1);const doomedRaid=createRaid(doomed,doomed.party.map(p=>p.uid));assert.equal(resolveRaidTurn(doomed,doomedRaid,['attack','attack']).result,'defeat');assert.equal(doomed.finalDefeated,false);
console.log('PASS: two-fighter turns, four boss moves, cooldowns, atomic healing, guard, defeat and one-time victory');

const scene=world.startRaid([149,9]),template=world.models.get(34),colors=[];template.scene.traverse(o=>{if(o.isMesh)colors.push((Array.isArray(o.material)?o.material:[o.material]).map(m=>m.color.getHex()));});
for(const [width,height] of [[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768]]){
 const time=scene.time;scene.update(0,width/height,height);assert.equal(scene.time,time);scene.camera.updateMatrixWorld(true);scene.scene.updateMatrixWorld(true);
 for(const model of scene.models){const box=new THREE.Box3().setFromObject(model,true);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const v=new THREE.Vector3(x,y,z).project(scene.camera);assert.ok(Math.abs(v.x)<.98&&Math.abs(v.y)<.98,`Raid frame ${width}x${height}: ${v.toArray()}`);if(width>height&&height<=540){const y=(1-v.y)*height/2;assert.ok(y>=95&&y<height-122,'Fighters clear the boss header and touch controls');}}}
}
for(const [slot,special,effect] of [[0,false,null],[1,true,null],[2,true,'fire'],[2,true,'psychic'],[2,true,'rock']]){
 let hits=0;const promise=scene.attack(slot,special,()=>hits++,effect);for(let i=0;i<180;i++)scene.update(1/60);assert.equal(await promise,true);assert.equal(hits,1);assert.equal(scene.attackState,null);
}
let finished=false;const ending=scene.defeat().then(()=>finished=true);scene.update(1);assert.equal(finished,false);assert.equal(scene.boss.visible,true);scene.update(1);assert.equal(scene.boss.visible,false);assert.ok(scene.drops.every(d=>d.mesh.visible));scene.update(3);await ending;assert.equal(finished,true);scene.dispose();assert.equal(scene.scene.children.length,0);const after=[];template.scene.traverse(o=>{if(o.isMesh)after.push((Array.isArray(o.material)?o.material:[o.material]).map(m=>m.color.getHex()));});assert.deepEqual(after,colors,'Boss never tints other Nidoking models');world.raidScene=null;
console.log('PASS: real three-model raid, phone/tablet framing, attacks, explosion, crawling remnants and material cleanup');

const {checkTravelUI}=await import('./travel-ui.mjs');await checkTravelUI(world,true);
const {createApp}=await import('../server/index.mjs');const dir=await mkdtemp(tmpdir()+'/pokeblox-finale-');let app;
try{
 const start=async()=>{app=await createApp({dbPath:dir+'/game.db',production:false,backups:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+app.server.address().port;};let base=await start();
 const response=await fetch(base+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'finale_test',password:'temporary-finale-test-password'})});assert.equal(response.status,201);const cookie=response.headers.get('set-cookie').split(';')[0],auth=await response.json();
 const write=async(snapshot,revision,writeId)=>fetch(base+'/api/save',{method:'POST',headers:{'Content-Type':'application/json',cookie,'X-CSRF-Token':auth.csrfToken},body:JSON.stringify({snapshot,revision,writeId})});
 assert.equal((await write(save,0,'finale-start-save')).status,200);await app.close();app=null;base=await start();
 const restored=await(await fetch(base+'/api/save',{headers:{cookie}})).json();assert.deepEqual(restored.snapshot,save,'Raid, all islands and full collection survive a real restart');
 assert.equal((await write(v4,1,'old-v4-overwrite')).status,409);assert.equal((await write(validateSnapshot(large),1,'full-party-save')).status,200);
 const victory=validateSnapshot(snapshot());assert.equal((await write(victory,2,'finale-victory-save')).status,200);await app.close();app=null;base=await start();const ended=await(await fetch(base+'/api/save',{headers:{cookie}})).json();assert.ok(ended.snapshot.state.finalDefeated&&!ended.snapshot.state.finalCreditsSeen);assert.equal(ended.snapshot.raid,null);
}finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');for(const file of ['finale.mjs','finale-scene.mjs','finale.css','expansion.mjs','expansion-biomes.mjs','kanto-catalog.mjs'])assert.ok(sw.includes(`'/${file}'`));
console.log('PASS: raid and victory survive server restarts, credits resume, old tabs blocked, all new dependencies cached');
