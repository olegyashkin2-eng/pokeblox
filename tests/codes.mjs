import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import * as data from '../public/data.mjs';
import * as codes from '../public/codes.mjs';
import {resolveTurn} from '../public/battle.mjs';
import {validateSnapshot} from '../public/save-format.mjs';
import {SaveClient} from '../public/saving.mjs';
import {createApp} from '../server/index.mjs';

const now=1800000000000;
function trainer(){
 const state=data.createState();Object.assign(state,{started:true,candies:3,party:[data.newPokemon(25,5)],seen:new Set([25]),caught:new Set([25])});return state;
}
function snapshot(state=trainer()){
 return {version:7,state:{...state,party:state.party.map(p=>({...p})),codeRewards:structuredClone(state.codeRewards),seen:[...state.seen],caught:[...state.caught],pickedStones:[],visited:[]},regions:{},battle:null,raid:null,settings:{soundEnabled:false},world:{position:[0,18],rotation:0,yaw:0,pitch:.52,distance:12,playedSeconds:4,wild:Array.from({length:15},(_,key)=>({key,id:25,visible:true,nextChangeAt:0,x:0,z:0,phase:0})),pickups:Array.from({length:13},(_,key)=>({key,readyAt:0}))}};
}
const boosted=trainer();
assert.equal(codes.redeemCode(boosted,'  PiKaCoDe  ',now).code,'pikacode');
assert.equal(boosted.codeRewards.xpUntil,now+300000);
codes.redeemCode(boosted,'pokeblox4ever',now);
assert.equal(boosted.codeRewards.catchUntil,now+600000);
assert.deepEqual(codes.activeCodeBoosts(boosted,now).map(b=>b.remaining),['5:00','10:00']);
assert.deepEqual(codes.activeCodeBoosts(boosted,now+300000).map(b=>b.remaining),['5:00']);
assert.deepEqual(codes.activeCodeBoosts(boosted,now+600000),[]);
const saved=validateSnapshot(snapshot(boosted));
assert.equal(codes.xpMultiplier(saved.state,now+299999),2);
assert.equal(codes.xpMultiplier(saved.state,now+300000),1);
assert.equal(codes.redeemCode(saved.state,'pikacode',now+999999).error,'CODE_USED','Expired codes cannot restart their timers');
const legacy=snapshot();legacy.version=5;delete legacy.state.codeRewards;
const migrated=validateSnapshot(legacy);
assert.equal(migrated.version,7);assert.deepEqual(migrated.state.codeRewards,codes.emptyCodeRewards());assert.deepEqual(migrated.world,legacy.world);assert.deepEqual(migrated.state.party,legacy.state.party);

function encounter(action,bonus,at=now){
 const state=trainer();if(bonus)state.codeRewards=structuredClone(boosted.codeRewards);
 const battle={own:state.party[0],enemy:data.newPokemon(133,5),turn:0,specialCooldown:0,wild:{}};
 if(action==='attack')battle.enemy.hp=1;
 return {state,battle,outcome:resolveTurn(state,battle,action,()=>action==='catch'?.3:.99,at)};
}
assert.equal(encounter('attack',false).outcome.reward.xp,155);
assert.equal(encounter('attack',true).outcome.reward.xp,310);
assert.equal(encounter('attack',true,now+300000).outcome.reward.xp,155);
assert.equal(encounter('catch',false).outcome.result,null);
const capture=encounter('catch',true);
assert.equal(capture.outcome.result,'catch');assert.equal(capture.outcome.reward.xp,218);
assert.equal(encounter('catch',true,now+600000).outcome.result,null);
const wild=data.newPokemon(133,5),base=data.catchChance(wild);
assert.equal(data.catchChance(wild,boosted,now),base*2);
wild.hp=1;assert.equal(data.catchChance(wild,boosted,now),1);
const gift=trainer();gift.party[0].uid=123456;
assert.equal(codes.redeemCode(gift,'mrdragonforce',now).code,'mrdragonforce');
assert.equal(gift.balls,270);assert.equal(gift.party.length,2);assert.equal(gift.party[1].species,147);assert.equal(gift.party[1].level,5);assert.equal(gift.party[1].hp,data.hpMax(gift.party[1]));assert.equal(gift.party[1].uid,123457);assert.ok(gift.seen.has(147)&&gift.caught.has(147));
const before=structuredClone(gift);assert.equal(codes.redeemCode(gift,'mrdragonforce',now).error,'CODE_USED');assert.deepEqual(gift,before);
console.log('PASS: exact code rewards, simultaneous real-time boosts, battle XP and catches, cap, expiration and v5 migration');

const dir=await mkdtemp(join(tmpdir(),'pokeblox-codes-')),dbPath=join(dir,'codes.db');
let app,baseUrl;
const originalFetch=globalThis.fetch,clients=[];
async function start(){app=await createApp({dbPath,backups:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));baseUrl=`http://127.0.0.1:${app.server.address().port}`;}
async function request(path,auth,body){
 const response=await originalFetch(baseUrl+path,{method:body?'POST':'GET',headers:{...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrfToken}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json()};
}
async function register(username){const response=await originalFetch(baseUrl+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:'local-code-test-password'})});assert.equal(response.status,201);return {...await response.json(),cookie:response.headers.get('set-cookie').split(';')[0]};}
function makeClient(auth){const statuses=[],client=new SaveClient(auth,status=>statuses.push(status));client.draft=async()=>null;client.statuses=statuses;clients.push(client);return client;}
try{
 await start();const a=await register('code_trainer_a'),b=await register('code_trainer_b');
 let loseAcks=0,redeemRequests=0;
 globalThis.fetch=async(url,options={})=>{
  const response=await originalFetch(new URL(url,baseUrl),{...options,headers:{...options.headers,Cookie:a.cookie}});
  if(url==='/api/redeem'){redeemRequests++;if(loseAcks){loseAcks--;await response.text();throw Error('Lost acknowledgement after commit');}}
  return response;
 };
 const client=makeClient(a);assert.equal(await client.load(),null);
 let current=snapshot();current.state.balls=17;client.enqueue(current);
 loseAcks=1;
 const redeemed=await client.redeem(current,' MRDRAGONFORCE ');
 assert.equal(redeemRequests,2);assert.ok(redeemed.snapshot);assert.equal(client.revision,2);
 current=redeemed.snapshot;assert.equal(current.state.balls,267);assert.equal(current.state.party.length,2);
 assert.equal((await client.redeem(current,'mrdragonforce')).error,'CODE_USED');assert.equal(client.revision,2);
 const t0=Date.now();current=(await client.redeem(current,'pikacode')).snapshot;
 assert.ok(current.state.codeRewards.xpUntil>=t0+300000&&current.state.codeRewards.xpUntil<=Date.now()+300000);
 const xpUntil=current.state.codeRewards.xpUntil;
 current=(await client.redeem(current,'pokeblox4ever')).snapshot;
 assert.equal(current.state.codeRewards.xpUntil,xpUntil);
 assert.ok(current.state.codeRewards.catchUntil>=t0+600000&&current.state.codeRewards.catchUntil<=Date.now()+600000);
 const count=client.revision;assert.equal((await client.redeem(current,'not-a-code')).error,'CODE_UNKNOWN');assert.equal(client.revision,count);
 client.enqueue(current);assert.ok(await client.flushAll());
 const revision=client.revision;
 for(const mutate of [s=>s.state.codeRewards=codes.emptyCodeRewards(),s=>s.state.codeRewards.xpUntil+=100000,s=>s.version=5]){
  const invalid=structuredClone(current);mutate(invalid);
  assert.equal((await request('/api/save',a,{snapshot:invalid,revision,writeId:crypto.randomUUID()})).status,409,'Save cannot clear history, extend a bonus, or downgrade the account');
 }
 const second=makeClient(a);const secondSave=await second.load();
 assert.deepEqual(secondSave,current,'Another tab restores every reward and expiration');
 const staleRevision=second.revision;client.enqueue(current);await client.flushAll();
 assert.equal((await request('/api/redeem',a,{snapshot:secondSave,revision:staleRevision,writeId:crypto.randomUUID(),code:'mrdragonforce'})).status,409);
 const full=snapshot();full.state.party=Array.from({length:data.MAX_PARTY},(_,i)=>({...full.state.party[0],uid:i+1}));
 assert.equal((await request('/api/redeem',b,{snapshot:full,revision:0,writeId:crypto.randomUUID(),code:'mrdragonforce'})).body.error,'PARTY_FULL');
 assert.equal((await request('/api/save',b)).body.snapshot,null,'Full party grant is completely rolled back');
 const personalGift=await request('/api/redeem',b,{snapshot:snapshot(),revision:0,writeId:crypto.randomUUID(),code:'mrdragonforce'});
 assert.equal(personalGift.status,200);assert.equal(personalGift.body.snapshot.state.balls,270,'Codes are independent per account');
 assert.equal((await request('/api/redeem',null,{snapshot:current,revision:0,writeId:crypto.randomUUID(),code:'pikacode'})).status,401);
 assert.equal((await request('/api/redeem',{cookie:a.cookie},{snapshot:current,revision:0,writeId:crypto.randomUUID(),code:'pikacode'})).status,403);
 await app.close();app=null;await start();
 const restored=(await request('/api/save',a)).body;
 assert.deepEqual(restored.snapshot,current,'Rewards, timers, world and session survive a real server restart');
 assert.equal((await request('/api/redeem',a,{snapshot:current,revision:restored.revision,writeId:crypto.randomUUID(),code:'mrdragonforce'})).body.error,'CODE_USED');

 // If both acknowledgements disappear, block old local state and recover from
 // the account; otherwise an autosave could silently remove the gift.
 globalThis.fetch=async(url,options={})=>{
  const response=await originalFetch(new URL(url,baseUrl),{...options,headers:{...options.headers,Cookie:b.cookie}});
  if(url==='/api/redeem'){await response.text();throw Error('Still offline after commit');}return response;
 };
 const offline=makeClient(b),old=await offline.load();
 assert.equal((await offline.redeem(old,'pikacode')).error,'REDEEM_UNCONFIRMED');assert.ok(offline.blocked);assert.ok(offline.statuses.includes('redeem-check'));
 offline.enqueue(old);assert.equal(offline.pending,null);
 const recovery=makeClient(b),recovered=await recovery.load();assert.ok(recovered.state.codeRewards.redeemed.includes('pikacode'));assert.equal(recovered.state.balls,270);
 console.log('PASS: atomic account grants, retries after lost replies, once per account, full-team rollback, stale tabs and real restart');
}finally{
 globalThis.fetch=originalFetch;for(const c of clients){c.blocked=true;clearTimeout(c.timer);}if(app)await app.close();await rm(dir,{recursive:true,force:true});
}

// Run the real bag handlers, including submit, server response application,
// countdown, repeat feedback, and the candy action (no WebGL required).
const elements=new Map();
const element=id=>{
 if(!elements.has(id))elements.set(id,{hidden:true,open:false,style:{},dataset:{},value:'',innerHTML:'',textContent:'',showModal(){this.open=true;},close(){this.open=false;},setAttribute(){},querySelector(){return {};},querySelectorAll(){return [];}});
 return elements.get(id);
};
class UISaves{
 ready=true;blocked=false;redeeming=false;
 enqueue(value){validateSnapshot(JSON.parse(JSON.stringify(value)));}
 async redeem(value,code){
  const snapshot=validateSnapshot(JSON.parse(JSON.stringify(value))),result=codes.redeemCode(snapshot.state,code);
  return result.error?result:{snapshot:validateSnapshot(snapshot)};
 }
}
const context=vm.createContext({...data,...codes,performance,document:{getElementById:element,querySelector:element},Accounts:class{},SaveClient:UISaves,setTimeout(){return 0;},clearTimeout(){}});
const source=await readFile(new URL('../public/game.mjs',import.meta.url),'utf8');
vm.runInContext(source.replace(/^import .*;\r?\n/gm,'').replace(/^init\(\);\s*$/m,'')+`\nglobalThis.game={state,openPanel,updateCodeBonuses,feedCandy,setWorld(value){world=value;}};`,context);
const game=context.game;
Object.assign(game.state,trainer());game.setWorld({portraits:{},snapshotWorld:()=>snapshot().world});
game.openPanel('bag');assert.ok(element('panel-content').innerHTML.includes('Коды и подарки'));assert.equal(element('panel').open,true);
element('code-input').value='mrdragonforce';await element('code-form').onsubmit({preventDefault(){}});
assert.equal(game.state.balls,270);assert.equal(game.state.party[1].species,147);assert.ok(element('code-message').textContent.includes('250'));assert.equal(element('balls-count').textContent,270);
element('code-input').value='mrdragonforce';await element('code-form').onsubmit({preventDefault(){}});assert.equal(element('code-message').dataset.kind,'error');assert.equal(game.state.balls,270);
element('code-input').value='pikacode';await element('code-form').onsubmit({preventDefault(){}});game.updateCodeBonuses();assert.ok(element('code-boosts').innerHTML.includes('5:00'));
const level=game.state.party[0].level;game.feedCandy();assert.equal(game.state.party[0].level,level+1,'XP code does not multiply guaranteed candy levels');
game.state.codeRewards.xpUntil=1;game.updateCodeBonuses();assert.ok(element('code-boosts').innerHTML.includes('нет активных'));
const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');assert.ok(sw.includes("'/codes.mjs'")&&sw.includes("'/codes.css'"));
console.log('PASS: actual bag form, Dratini and inventory refresh, duplicate feedback, timer expiry, candy behavior and offline assets');
