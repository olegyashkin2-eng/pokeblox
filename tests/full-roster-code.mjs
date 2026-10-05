import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/index.mjs';
import {ALL_IDS,canBattle,createState,newPokemon,hpMax,MAX_PARTY,partyLimit,reserveUids,travelReason} from '../public/data.mjs';
import {redeemCode} from '../public/codes.mjs';
import {validateSnapshot} from '../public/save-format.mjs';
import {resolveTurn} from '../public/battle.mjs';

function fresh(){
 const state=createState();Object.assign(state,{started:true,candies:3,party:[newPokemon(25,5)],seen:[25],caught:[25],pickedStones:[],visited:[]});
 return validateSnapshot({version:7,state,regions:{},battle:null,raid:null,settings:{soundEnabled:false},world:{position:[0,18],rotation:0,yaw:0,pitch:.52,distance:12,playedSeconds:4,wild:Array.from({length:15},(_,key)=>({key,id:25,visible:true,nextChangeAt:0,x:0,z:0,phase:0})),pickups:Array.from({length:13},(_,key)=>({key,readyAt:0}))}});
}
function checkGift(before,after){
 const old=before.state,s=after.state,gifts=s.party.slice(old.party.length);
 assert.equal(gifts.length,150);assert.deepEqual(gifts.map(p=>p.species),ALL_IDS.filter(canBattle));
 assert.ok(gifts.every(p=>p.level===5&&p.xp===0&&p.hp===hpMax(p)));
 assert.equal(new Set(s.party.map(p=>p.uid)).size,s.party.length);
 assert.deepEqual(s.party.slice(0,old.party.length),old.party,'No existing Pokemon is replaced, healed or levelled down');
 assert.equal(s.active,old.active);assert.equal(s.laprasUnlocked,true);
 for(const key of ['seen','caught'])assert.deepEqual([...s[key]].sort((a,b)=>a-b),ALL_IDS);
 assert.ok(!s.party.some(p=>p.species===131),'Lapras remains a non-combat travel companion');
 assert.equal(travelReason({...s,caught:new Set(s.caught)},10),'','All 146 required species unlock the volcano');
 const restored=structuredClone(after);restored.state.party=structuredClone(old.party);restored.state.seen=[...old.seen];restored.state.caught=[...old.caught];restored.state.laprasUnlocked=old.laprasUnlocked;restored.state.codeRewards=structuredClone(old.codeRewards);
 assert.deepEqual(restored,before,'World, inventory, progress and boost timers are otherwise unchanged');
 assert.deepEqual(validateSnapshot(after),after);
}

const full=fresh();full.state.party=Array.from({length:MAX_PARTY},(_,i)=>({...full.state.party[0],uid:10000+i,level:40,xp:25,hp:3}));full.state.active=MAX_PARTY-1;
const reward=structuredClone(full);assert.equal(redeemCode(reward.state,'  MRDragon  ').code,'mrdragon');checkGift(full,reward);
assert.equal(reward.state.party.length,330);assert.equal(partyLimit(reward.state),330);assert.equal(partyLimit(full.state),180);
const unchanged=structuredClone(reward);assert.equal(redeemCode(reward.state,'mrdragon').error,'CODE_USED');assert.deepEqual(reward,unchanged);
const fake=structuredClone(reward);fake.state.codeRewards.redeemed=[];assert.throws(()=>validateSnapshot(fake),'Extra slots require the reward history');
const overflow=fresh();overflow.state.party[0].uid=1e9;const beforeOverflow=structuredClone(overflow);assert.equal(redeemCode(overflow.state,'mrdragon').error,'PARTY_FULL');assert.deepEqual(overflow,beforeOverflow);
const setState=fresh().state;setState.seen=new Set(setState.seen);setState.caught=new Set(setState.caught);redeemCode(setState,'mrdragon');assert.equal(setState.caught.size,151);assert.ok(setState.seen.has(131));
// The same capacity governs capture, gifts and save validation after activation.
const captureState=structuredClone(reward.state);captureState.seen=new Set(captureState.seen);captureState.caught=new Set(captureState.caught);captureState.party.pop();reserveUids(captureState.party);
const battle={own:captureState.party[captureState.active],enemy:newPokemon(133,5),turn:0,specialCooldown:0,wild:{}};
assert.equal(resolveTurn(captureState,battle,'catch',()=>0).result,'catch');assert.equal(captureState.party.length,330);
assert.ok(resolveTurn(captureState,{own:battle.own,enemy:newPokemon(25,5),turn:0,specialCooldown:0,wild:{}},'catch',()=>0).error);
console.log('PASS: complete 151-species gift, full old party retained, level 5, Lapras, capacity and UID safety');

const dir=await mkdtemp(join(tmpdir(),'pokeblox-mrdragon-')),dbPath=join(dir,'game.db'),apps=[];
let first,second;
async function start(){const app=await createApp({dbPath,backups:false});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));app.url=`http://127.0.0.1:${app.server.address().port}`;apps.push(app);return app;}
async function request(app,path,auth,body){const response=await fetch(app.url+path,{method:body?'POST':'GET',headers:{...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrfToken}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function account(name){const result=await request(first,'/api/register',null,{username:name,password:'local-only-full-roster-test'});assert.equal(result.status,201);return {...result.body,cookie:result.cookie};}
const grant=(snapshot=fresh(),revision=0,code='mrdragon')=>({snapshot,revision,writeId:crypto.randomUUID(),code});
const count=code=>first.db.prepare('SELECT COUNT(*) AS n FROM limited_code_redemptions WHERE code = ?').get(code).n;
try{
 first=await start();
 // Simulate the deployed v2 ledger, including exhausted historical Mewtwo claims.
 for(const id of ['historical-a-1','historical-a-2'])first.db.prepare('INSERT INTO limited_code_redemptions VALUES (?,?,?)').run('a',id,'2026-10-04T00:00:00Z');
 const a=await account('roster_a'),b=await account('roster_b'),c=await account('roster_c'),d=await account('roster_d'),e=await account('roster_e'),f=await account('roster_f');
 assert.equal((await request(first,'/api/save',a,grant(full))).status,200);
 await first.close();apps.splice(apps.indexOf(first),1);first=await start();second=await start();
 assert.equal(first.db.prepare('PRAGMA user_version').get().user_version,2);assert.equal(count('a'),2);assert.equal(count('mrdragon'),0);
 assert.deepEqual((await request(first,'/api/save',a)).body.snapshot,full);
 assert.equal((await request(first,'/api/redeem',b,grant(fresh(),0,'a'))).body.error,'CODE_EXHAUSTED');
 // Even a failure after reserving the gift rolls back the entire ledger/save.
 first.db.exec("CREATE TRIGGER simulate_failed_roster BEFORE INSERT ON game_saves BEGIN SELECT RAISE(ABORT,'test save failure'); END;");
 assert.equal((await request(first,'/api/redeem',a,grant(full,1))).status,500);assert.equal(count('mrdragon'),0);
 first.db.exec('DROP TRIGGER simulate_failed_roster');assert.deepEqual((await request(first,'/api/save',a)).body.snapshot,full);
 const original=grant(full,1,' MRDRAGON '),won=await request(first,'/api/redeem',a,original);
 assert.equal(won.status,200);checkGift(full,won.body.snapshot);assert.equal(count('mrdragon'),1);
 assert.deepEqual((await request(second,'/api/redeem',a,original)).body,won.body,'Lost-reply retry returns the committed gift');assert.equal(count('mrdragon'),1);
 assert.equal((await request(first,'/api/redeem',a,grant(won.body.snapshot,won.body.revision))).body.error,'CODE_USED');
 assert.equal((await request(first,'/api/save',a,grant(full,won.body.revision))).status,409,'Old client cannot erase the gift history');
 const saved=await request(first,'/api/save',a,grant(won.body.snapshot,won.body.revision));assert.equal(saved.status,200,'Expanded party can be saved normally');
 const other=await request(first,'/api/redeem',b,grant(fresh(),0,'mrdragonforce'));assert.equal(other.status,200);assert.equal(count('mrdragon'),1);
 const secondGift=await request(second,'/api/redeem',b,grant(other.body.snapshot,other.body.revision));assert.equal(secondGift.status,200);checkGift(other.body.snapshot,secondGift.body.snapshot);
 const thirdGift=await request(first,'/api/redeem',c,grant());assert.equal(thirdGift.status,200);assert.equal(count('mrdragon'),3);
 // Three different accounts compete for the fourth and final claim.
 const racers=[d,e,f],race=await Promise.all(racers.map((auth,i)=>request(i%2?second:first,'/api/redeem',auth,grant())));
 assert.equal(race.filter(r=>r.status===200).length,1);assert.equal(race.filter(r=>r.body.error==='CODE_EXHAUSTED').length,2);
 assert.equal(count('mrdragon'),4);assert.equal(count('a'),2);
 const losers=racers.filter((_,i)=>race[i].status!==200);
 for(const loser of losers)assert.equal((await request(first,'/api/save',loser)).body.snapshot,null);
 await second.close();apps.splice(apps.indexOf(second),1);await first.close();apps.splice(apps.indexOf(first),1);first=await start();
 assert.equal(count('mrdragon'),4);assert.equal(count('a'),2);assert.deepEqual((await request(first,'/api/save',a)).body.snapshot,won.body.snapshot);
 for(const loser of losers)assert.equal((await request(first,'/api/redeem',loser,grant())).body.error,'CODE_EXHAUSTED');
 assert.equal((await request(first,'/api/redeem',a,grant(won.body.snapshot,saved.body.revision))).body.error,'CODE_USED');
 console.log('PASS: existing v2 saves/quotas retained, atomic rollback, retries, once per account, fourth-claim race, normal saves and restart');
}finally{for(const app of apps.reverse())await app.close();await rm(dir,{recursive:true,force:true});}
