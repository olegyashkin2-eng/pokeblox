import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createApp,hashPassword} from '../server/index.mjs';
import {createState,newPokemon,hpMax,MAX_PARTY} from '../public/data.mjs';
import {redeemCode} from '../public/codes.mjs';
import {validateSnapshot} from '../public/save-format.mjs';

function fresh(){
 const state=createState();Object.assign(state,{started:true,candies:0,party:[newPokemon(25,5)],seen:[25],caught:[25],pickedStones:[],visited:[]});
 return validateSnapshot({version:7,state,regions:{},battle:null,raid:null,settings:{soundEnabled:false},world:{position:[0,18],rotation:0,yaw:0,pitch:.52,distance:12,playedSeconds:4,wild:Array.from({length:15},(_,key)=>({key,id:25,visible:true,nextChangeAt:0,x:0,z:0,phase:0})),pickups:Array.from({length:13},(_,key)=>({key,readyAt:0}))}});
}
const reward=fresh(),balls=reward.state.balls;
assert.equal(redeemCode(reward.state,' A ').code,'a');
assert.equal(reward.state.party.at(-1).species,150);assert.equal(reward.state.party.at(-1).level,5);assert.equal(reward.state.party.at(-1).hp,hpMax(reward.state.party.at(-1)));
assert.equal(reward.state.balls,balls);assert.ok(reward.state.seen.includes(150)&&reward.state.caught.includes(150));assert.deepEqual(validateSnapshot(reward),reward);
const unchanged=structuredClone(reward);assert.equal(redeemCode(reward.state,'a').error,'CODE_USED');assert.deepEqual(reward,unchanged);

const dir=await mkdtemp(join(tmpdir(),'pokeblox-limited-')),dbPath=join(dir,'game.db'),apps=[];
const password='local-only-quota-test-password';
let first,second;
async function start(){const app=await createApp({dbPath,backups:false});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));app.url=`http://127.0.0.1:${app.server.address().port}`;apps.push(app);return app;}
async function request(app,path,auth,body){
 const response=await fetch(app.url+path,{method:body?'POST':'GET',headers:{...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrfToken}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function account(username,login=false){const result=await request(first,login?'/api/login':'/api/register',null,{username,password});assert.equal(result.status,login?200:201);return {...result.body,cookie:result.cookie};}
const grant=(snapshot=fresh(),revision=0,code='a')=>({snapshot,revision,writeId:crypto.randomUUID(),code});
const count=()=>first.db.prepare('SELECT COUNT(*) AS n FROM limited_code_redemptions').get().n;
try{
 // Upgrade the deployed v1 schema with existing account and progress intact.
 const legacy=new DatabaseSync(dbPath);legacy.exec(await readFile(new URL('../server/migrations/001_accounts.sql',import.meta.url),'utf8'));legacy.exec('PRAGMA user_version=1');
 const saved=fresh();redeemCode(saved.state,'pikacode');
 legacy.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run('existing-player','existing_player','existing_player',await hashPassword(password),new Date().toISOString());
 legacy.prepare('INSERT INTO game_saves VALUES (?,?,?,?,?)').run('existing-player',JSON.stringify(saved),8,'previous-write-id',new Date().toISOString());legacy.close();
 first=await start();second=await start();
 assert.equal(first.db.prepare('PRAGMA user_version').get().user_version,2);assert.equal(count(),0);
 const a=await account('existing_player',true),b=await account('limited_b'),c=await account('limited_c'),d=await account('limited_d');
 assert.deepEqual((await request(first,'/api/save',a)).body.snapshot,saved,'Migration preserves old save and bonus timer');
 const full=fresh();full.state.party=Array.from({length:MAX_PARTY},(_,i)=>({...full.state.party[0],uid:i+1}));
 assert.equal((await request(first,'/api/redeem',b,grant(full))).body.error,'PARTY_FULL');assert.equal(count(),0);
 assert.equal((await request(first,'/api/redeem',{...b,csrfToken:'invalid'},grant())).status,403);assert.equal(count(),0);
 const battle=fresh();battle.battle={wildKey:0,enemy:newPokemon(25,5),ownUid:battle.state.party[0].uid,turn:0,specialCooldown:0};
 assert.equal((await request(first,'/api/redeem',b,grant(battle))).body.error,'CODE_IN_BATTLE');assert.equal(count(),0);
 const invalid=fresh();invalid.state.party[0].hp=999;
 assert.equal((await request(first,'/api/redeem',b,grant(invalid))).body.error,'INVALID_SAVE');assert.equal(count(),0);
 // A save failure after reserving a place must roll back both ledger and gift.
 first.db.exec("CREATE TRIGGER simulate_failed_save BEFORE INSERT ON game_saves BEGIN SELECT RAISE(ABORT,'test save failure'); END;");
 assert.equal((await request(first,'/api/redeem',b,grant())).status,500);assert.equal(count(),0);first.db.exec('DROP TRIGGER simulate_failed_save');
 assert.equal((await request(first,'/api/save',b)).body.snapshot,null);
 const original=grant(saved,8,' A '),won=await request(first,'/api/redeem',a,original);
 assert.equal(won.status,200);assert.equal(count(),1);assert.equal(won.body.snapshot.state.party.at(-1).species,150);assert.equal(won.body.snapshot.state.balls,saved.state.balls);
 const retry=await request(second,'/api/redeem',a,original);
 assert.deepEqual(retry.body,won.body,'Retry after a lost reply returns the committed reward');assert.equal(count(),1);
 assert.equal((await request(second,'/api/redeem',a,grant(won.body.snapshot,won.body.revision))).body.error,'CODE_USED');assert.equal(count(),1);
 const forged=structuredClone(won.body.snapshot);forged.state.codeRewards.redeemed=forged.state.codeRewards.redeemed.filter(code=>code!=='a');
 assert.equal((await request(first,'/api/save',a,grant(forged,won.body.revision))).status,409,'Ordinary save cannot erase used code');
 assert.equal((await request(first,'/api/redeem',a,grant(saved,8))).status,409,'Stale tab cannot claim again');
 // Three accounts race for one place via two independent DB connections.
 const racers=[b,c,d],race=await Promise.all(racers.map((user,i)=>request(i%2?second:first,'/api/redeem',user,grant())));
 assert.equal(race.filter(r=>r.status===200).length,1);assert.equal(count(),2);
 assert.equal(race.filter(r=>r.body.error==='CODE_EXHAUSTED').length,2);
 const winner=race.findIndex(r=>r.status===200),losers=racers.filter((_,i)=>i!==winner);
 assert.equal(race[winner].body.snapshot.state.party.filter(p=>p.species===150).length,1);
 for(const user of losers)assert.equal((await request(first,'/api/save',user)).body.snapshot,null,'Exhausted code creates no gift or save');
 await second.close();apps.splice(apps.indexOf(second),1);await first.close();apps.splice(apps.indexOf(first),1);
 first=await start();assert.equal(count(),2);
 assert.deepEqual((await request(first,'/api/save',a)).body.snapshot,won.body.snapshot,'Mewtwo and old bonus survive restart');
 for(const user of losers)assert.equal((await request(first,'/api/redeem',user,grant())).body.error,'CODE_EXHAUSTED');
 const oldGift=await request(first,'/api/redeem',losers[0],grant(fresh(),0,'mrdragonforce'));
 assert.equal(oldGift.status,200);assert.equal(oldGift.body.snapshot.state.balls,250+balls);assert.equal(oldGift.body.snapshot.state.party.at(-1).species,147);assert.equal(count(),2,'Other codes do not share the Mewtwo quota');
 console.log('PASS: Mewtwo reward, v1 database upgrade, full-party/failure rollback, retry, account uniqueness, 3-account race across 2 connections, restart and old codes');
}finally{for(const app of apps.reverse())await app.close();await rm(dir,{recursive:true,force:true});}
