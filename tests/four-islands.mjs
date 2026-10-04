import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../public/vendor/three.module.min.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('three');
const data=await import('../public/data.mjs');
const {ALL_IDS,ISLAND2_SPAWNS,ISLAND3_IDS,ISLAND4_IDS,TIDAL_ENCOUNTERS,rollTidal,createState,newPokemon,evolve,hpMax,canBattle,travelReason,befriendLapras,PICKUP_LAYOUTS,islandRadius}=data;
const {validateSnapshot}=await import('../public/save-format.mjs');
const {classicFixtures}=await import('./classic-fixtures.mjs');
const {World}=await import('../public/world.mjs');
const {resolveTurn}=await import('../public/battle.mjs');
const {EvolutionScene}=await import('../public/evolution-scene.mjs');
assert.equal(ALL_IDS.length,151);assert.deepEqual(ISLAND3_IDS,[27,28,56,57,66,67,68,106,107]);
assert.deepEqual(ISLAND4_IDS.filter(id=>id!==151).sort((a,b)=>a-b),[10,11,12,13,14,15,35,36,39,40,43,44,45,46,47,48,49,63,64,65,69,70,71,96,97,108,122,124,132,137]);
assert.equal(TIDAL_ENCOUNTERS.reduce((s,[,p])=>s+p,0),100);
const frequencies={};for(let i=0;i<1e6;i++){const id=rollTidal(()=>(i+.5)/1e6);frequencies[id]=(frequencies[id]??0)+1;}
assert.deepEqual(frequencies,{120:449950,121:300000,131:200000,144:50,147:50000});
assert.ok(!ISLAND2_SPAWNS.some(p=>[148,149].includes(p.id)));assert.equal(ISLAND2_SPAWNS[19].id,55,'Original boss save key retained');
for(const [old,next,stone] of [[147,148,'dragon'],[148,149,'dragon'],[35,36,'moon'],[39,40,'moon'],[44,45,'leaf'],[70,71,'leaf'],[120,121,'water']]){
 const state=createState(),p=newPokemon(old,50);assert.equal(evolve(p,state,next),false,'Levels alone cannot replace a stone');state.stones[stone]=1;assert.ok(evolve(p,state,next));assert.equal(state.stones[stone],0);assert.equal(p.hp,hpMax(p));assert.equal(evolve(p,state,next),false);
}
const state=createState();state.started=true;state.candies=3;state.party=[newPokemon(25,30),newPokemon(149,36)];state.caught=new Set([25,149]);state.seen=new Set([25,149]);
assert.ok(travelReason(state,2));state.wins=3;assert.equal(travelReason(state,2),'');assert.ok(travelReason(state,3));
assert.equal(befriendLapras(state),true);assert.equal(befriendLapras(state),false);assert.equal(state.party.length,2);assert.ok(state.caught.has(131));assert.equal(travelReason(state,3),'');assert.equal(travelReason(state,4),'');
assert.equal(canBattle(131),false);const laprasBattle={own:state.party[0],enemy:newPokemon(131,5),turn:0,specialCooldown:0,wild:{}};assert.ok(resolveTurn(state,laprasBattle,'catch').error);assert.equal(state.balls,20);
console.log('PASS: literal photo rosters, exact rare probabilities, exclusive dragon evolution, all new stones and peaceful Lapras');

globalThis.document={hidden:false,createElement:()=>({width:0,height:0,getContext:()=>({fillText(){}})})};
const world=Object.create(World.prototype);Object.assign(world,{island:1,layouts:{},sun:new THREE.DirectionalLight(),shadowTexture:null,models:await classicFixtures(),scene:new THREE.Scene(),environment:new THREE.Group(),pickups:[],obstacles:[],wild:[],clock:0,camera:new THREE.PerspectiveCamera(46,390/844,.1,260),cameraMode:'explore',cameraYaw:0,cameraPitch:.52,cameraDistance:12,playerPos:new THREE.Vector3(0,0,18),trainer:new THREE.Group(),ring:new THREE.Group(),renderer:{render(){}}});
world.scene.background=new THREE.Color();world.scene.fog=new THREE.Fog(0xffffff,65,145);world.buildTerrain();world.buildNature();world.buildCamp();world.buildPickups();world.buildAtmosphere();world.buildTrainer();world.scene.add(world.environment);world.spawnWild();
const regions={1:world.snapshotWorld()};
function reachable(){
 const visited=new Set(),queue=[[0,18]],key=(x,z)=>`${x},${z}`;visited.add(key(0,18));
 for(let n=0;n<queue.length;n++){const [x,z]=queue[n];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!visited.has(k)&&!world.blocked(nx,nz)){visited.add(k);queue.push([nx,nz]);}}}
 for(const p of [...world.wild.map(w=>w.home),...world.pickups])assert.ok(queue.some(([x,z])=>Math.hypot(x-p.x,z-p.z)<2.5),`Island ${world.island}: reachable ${p.x},${p.z}`);
}
for(const id of [2,3,4]){world.configureIsland(id);assert.equal(world.wild.length,{2:31,3:9,4:33}[id]);assert.equal(world.pickups.length,PICKUP_LAYOUTS[id].length);assert.ok(world.wild.every(w=>w.group.userData.modelSource==='original-glb'));reachable();regions[id]=world.snapshotWorld();}
assert.ok(islandRadius(4)>islandRadius(3));
assert.throws(()=>world.beginBattle(131,25));assert.throws(()=>world.beginBattle(25,131));
world.configureIsland(3);world.restoreWorld(regions[3]);world.playerPos.set(-31,world.ground(-31,14),14);state.island=3;state.visited.add('Кактусовая роща');
const save={version:7,state:{...state,seen:[...state.seen],caught:[...state.caught],visited:[...state.visited],pickedStones:[]},regions:{1:regions[1],2:regions[2],4:regions[4]},world:world.snapshotWorld(),battle:null,raid:null,settings:{soundEnabled:false}};
assert.deepEqual(validateSnapshot(save),save);assert.ok(JSON.stringify(save).length<64000,'Fits unload keepalive budget');
const invalid=structuredClone(save);invalid.state.party.push(newPokemon(131,5));assert.throws(()=>validateSnapshot(invalid));
const bad=structuredClone(save);bad.world.position=[35,4];assert.throws(()=>validateSnapshot(bad));
for(const [a,b,stone] of [[147,148,'dragon'],[148,149,'dragon'],[35,36,'moon'],[44,45,'leaf']]){const evo=new EvolutionScene(world.makePokemon(a,2.15),world.makePokemon(b,2.3),{stone});evo.update(8);assert.equal(evo.done,true);evo.dispose();}
let complete=false;const journey=world.startVoyage(2,3).then(()=>complete=true);world.tick(2);const voyage=world.voyageScene;document.hidden=true;world.tick(20);assert.equal(voyage.time,2);document.hidden=false;
const at=voyage.time;for(const aspect of [390/844,844/390,768/1024,1024/768]){voyage.update(0,aspect);assert.equal(voyage.time,at);assert.ok(voyage.camera.projectionMatrix.elements.every(Number.isFinite));}
assert.equal(complete,false);assert.equal(save.state.island,3,'Destination committed before voyage completion');world.tick(5);await journey;assert.equal(complete,true);assert.equal(world.voyageScene,null);assert.equal(voyage.scene.children.length,0);
console.log('PASS: actual new biomes, accessible encounters and pickups, four region saves, new evolution scenes, voyage rotation/pause/completion');

const {checkTravelUI}=await import('./travel-ui.mjs');await checkTravelUI(world);

const {createApp}=await import('../server/index.mjs');const dir=await mkdtemp(tmpdir()+'/pokeblox-four-');let app;
try{
 const start=async()=>{app=await createApp({dbPath:dir+'/game.db',production:false,backups:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+app.server.address().port;};let base=await start();
 const response=await fetch(base+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'four_island_test',password:'temporary-test-password'})});assert.equal(response.status,201);const cookie=response.headers.get('set-cookie').split(';')[0],auth=await response.json();
 const write=async(snapshot,revision,writeId)=>fetch(base+'/api/save',{method:'POST',headers:{'Content-Type':'application/json',cookie,'X-CSRF-Token':auth.csrfToken},body:JSON.stringify({snapshot,revision,writeId})});
 assert.equal((await write(save,0,'four-islands-save')).status,200);await app.close();app=null;base=await start();
 const restored=await (await fetch(base+'/api/save',{headers:{cookie}})).json();assert.deepEqual(restored.snapshot,save,'Every region, party member, item and Lapras survives a real restart');
 const legacy=structuredClone(save);legacy.version=3;legacy.state.island=1;legacy.world=regions[1];legacy.regions={2:{...regions[2],wild:regions[2].wild.slice(0,20),pickups:regions[2].pickups.slice(0,13)}};
 assert.equal((await write(legacy,1,'legacy-v3-reject')).status,409,'An old tab cannot discard the two new islands');
}finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
for(const file of ['islands.mjs','island-biomes.mjs','voyage-scene.mjs'])assert.ok((await readFile(new URL('../public/sw.js',import.meta.url),'utf8')).includes(`'/${file}'`));
console.log('PASS: accounts and all four islands persist after server restart; v3 overwrite rejected; expansion cached offline');
