import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {ALL_IDS,SPECIES,baseStats,createState,newPokemon,travelReason,ISLAND4_SPAWNS,PICKUP_LAYOUTS} from '../public/data.mjs';
import {ENCOUNTER_TABLES,EXPANSION_SPAWNS,rollTable,OPTIONAL_RARE_IDS,VOLCANO_REQUIRED_IDS,VOLCANO_REQUIRED_COUNT,volcanoCollectionCount} from '../public/expansion.mjs';
import {createRaid} from '../public/finale.mjs';
import {resolveTurn} from '../public/battle.mjs';
import {redeemCode} from '../public/codes.mjs';
import {validateSnapshot} from '../public/save-format.mjs';
import {createApp} from '../server/index.mjs';

for(const [table,id,expected,spawns] of [['mythic',151,10,ISLAND4_SPAWNS],['ruins',150,50,EXPANSION_SPAWNS[6]]]){
 assert.equal(ENCOUNTER_TABLES[table].reduce((n,row)=>n+row[1],0),100);
 let count=0;for(let i=0;i<1e6;i++)if(rollTable(table,()=>(i+.5)/1e6)===id)count++;
 assert.equal(count,expected,`${SPECIES[id].name}: exact chance per million outcomes`);
 const threshold=ENCOUNTER_TABLES[table][0][1]/100;
 assert.equal(rollTable(table,()=>threshold-1e-12),id);assert.notEqual(rollTable(table,()=>threshold),id);
 assert.equal(spawns.filter(p=>p.table===table).length,3);
 assert.ok(!spawns.some(p=>p.id===id),'No guaranteed legendary spawn');
}
assert.equal(ALL_IDS.length,151);assert.equal(baseStats(150).total,680);assert.equal(baseStats(151).total,600);
assert.deepEqual(OPTIONAL_RARE_IDS,[144,145,146,150,151]);assert.equal(VOLCANO_REQUIRED_COUNT,146);assert.ok(VOLCANO_REQUIRED_IDS.includes(131));
console.log('PASS: Mew 0.001%, Mewtwo 0.005%, three random encounter spots each, complete 151-species catalog');

function trainer(){
 const state=createState();Object.assign(state,{started:true,candies:3,wins:3,laprasUnlocked:true,party:[newPokemon(25,40),newPokemon(6,40)],caught:new Set(VOLCANO_REQUIRED_IDS),seen:new Set(VOLCANO_REQUIRED_IDS)});return state;
}
function world(id){
 const spawns=id===4?ISLAND4_SPAWNS:EXPANSION_SPAWNS[id];
 return {position:[0,18],rotation:0,yaw:0,pitch:.52,distance:12,playedSeconds:123,wild:spawns.map((p,key)=>({key,id:p.id,x:p.x,z:p.z,phase:1.5,visible:true,nextChangeAt:1800000000000+key*1000})),pickups:PICKUP_LAYOUTS[id].map((p,key)=>({key,readyAt:1800000000000+key*2000}))};
}
function snapshot(state){
 return {version:7,state:{...state,party:structuredClone(state.party),codeRewards:structuredClone(state.codeRewards),seen:[...state.seen],caught:[...state.caught],visited:[...state.visited],pickedStones:[...state.pickedStones]},world:world(state.island),regions:{},battle:null,raid:null,settings:{soundEnabled:false}};
}
const state=trainer();assert.equal(volcanoCollectionCount(state),146);assert.equal(travelReason(state,10),'');
for(const missing of OPTIONAL_RARE_IDS){const optional=trainer();optional.caught=new Set(ALL_IDS.filter(id=>id!==missing));assert.equal(travelReason(optional,10),'');}
const incomplete=trainer();incomplete.caught=new Set(ALL_IDS.filter(id=>id!==1));assert.equal(incomplete.caught.size,150);assert.match(travelReason(incomplete,10),/145\/146/);
incomplete.island=10;assert.throws(()=>createRaid(incomplete,incomplete.party.map(p=>p.uid)));
state.island=10;const save=snapshot(state);save.raid=createRaid(state,state.party.map(p=>p.uid));assert.deepEqual(validateSnapshot(save),save);
for(const missing of [1,131,149]){const invalid=structuredClone(save);invalid.state.caught=invalid.state.caught.filter(id=>id!==missing);assert.throws(()=>validateSnapshot(invalid));}
const victory=structuredClone(save);victory.raid=null;victory.state.finalDefeated=true;assert.ok(validateSnapshot(victory).state.finalDefeated);
console.log('PASS: volcano travel, raid and victory need the 146 specified species, independently of all five optional finds');

for(const version of [5,6])for(const island of [4,6]){
 const legacyState=trainer();legacyState.island=island;if(version===6){redeemCode(legacyState,'pikacode',1800000000000);redeemCode(legacyState,'mrdragonforce',1800000000000);}
 const old=snapshot(legacyState);old.version=version;old.world.wild=old.world.wild.slice(0,-3);const other=island===4?6:4;old.regions[other]=world(other);old.regions[other].wild=old.regions[other].wild.slice(0,-3);
 old.battle={wildKey:0,enemy:newPokemon(old.world.wild[0].id,20),ownUid:legacyState.party[0].uid,turn:3,specialCooldown:1};if(version===5)delete old.state.codeRewards;
 const migrated=validateSnapshot(old);
 assert.equal(migrated.version,7);assert.equal(migrated.world.wild.length,old.world.wild.length+3);
 assert.deepEqual(migrated.world.wild.slice(0,-3),old.world.wild);assert.deepEqual(migrated.regions[other].wild.slice(0,-3),old.regions[other].wild);
 assert.deepEqual(migrated.world.pickups,old.world.pickups);assert.deepEqual(migrated.state.party,old.state.party);assert.deepEqual(migrated.battle,old.battle);assert.deepEqual(migrated.state.codeRewards,legacyState.codeRewards);
 assert.deepEqual(validateSnapshot(migrated),migrated,'Migration is stable after first load');
}
const captured=trainer();captured.island=4;
for(const id of [151,150]){
 const battle={own:captured.party[0],enemy:newPokemon(id,25),turn:0,specialCooldown:0,wild:{}};
 assert.equal(resolveTurn(captured,battle,'catch',()=>0).result,'catch');assert.ok(captured.caught.has(id));
}
const collection=snapshot(captured);assert.deepEqual(validateSnapshot(collection).state.party.slice(-2).map(p=>p.species),[151,150]);
for(const [island,id] of [[4,151],[6,150]]){
 const active=trainer();active.island=island;const encounter=snapshot(active),key=encounter.world.wild.length-1;encounter.world.wild[key].id=id;
 encounter.battle={wildKey:key,enemy:newPokemon(id,25),ownUid:active.party[0].uid,turn:2,specialCooldown:0};
 assert.deepEqual(validateSnapshot(encounter),encounter,'A live legendary encounter can be resumed');
}
console.log('PASS: v5/v6 migration preserves battles, keys, inventory and code timers; new species can be caught and saved');

// The lowered gate must also survive server validation and a real process restart.
const dir=await mkdtemp(tmpdir()+'/pokeblox-legendaries-');let app;
try{
 const start=async()=>{app=await createApp({dbPath:dir+'/game.db',backups:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+app.server.address().port;};let base=await start();
 const response=await fetch(base+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'legendary_test',password:'local-legendary-test-password'})});assert.equal(response.status,201);
 const auth=await response.json(),cookie=response.headers.get('set-cookie').split(';')[0];
 for(const [revision,value] of [[0,collection],[1,save]]){
  const result=await fetch(base+'/api/save',{method:'POST',headers:{'Content-Type':'application/json',cookie,'X-CSRF-Token':auth.csrfToken},body:JSON.stringify({snapshot:value,revision,writeId:'legendary-save-'+revision})});assert.equal(result.status,200);
  await app.close();app=null;base=await start();
  assert.deepEqual((await(await fetch(base+'/api/save',{headers:{cookie}})).json()).snapshot,value);
 }
}finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
console.log('PASS: caught Mew/Mewtwo and a volcano raid without the five rare species survive server restarts');
