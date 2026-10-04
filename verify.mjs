import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {SPECIES,BASES,ALL_IDS,newPokemon,createState,evolutionOptions,evolve,gainXP,xpNeeded,hpMax,catchChance,chapterComplete,walkable} from './public/data.mjs';
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
// The exact progression matrix is independently specified from the user's two images.
for(const [a,b,level] of [[4,5,16],[5,6,36],[1,2,16],[2,3,32],[7,8,16],[8,9,36]]){
 const s=createState(),p=newPokemon(a,level-1);check(!evolve(p,s,b),`Must not evolve ${a} before level ${level}`);gainXP(p,xpNeeded(p));check(evolutionOptions(p,s).some(o=>o.id===b&&o.available),`Level ${level} unlocks ${b}`);check(evolve(p,s,b),`Evolution ${a} to ${b}`);check(p.species===b&&p.hp===hpMax(p)&&s.caught.has(b),'Evolution updates all state');
}
for(const [a,stone,b] of [[25,'thunder',26],[133,'water',134],[133,'thunder',135],[133,'fire',136]]){
 const s=createState(),p=newPokemon(a,5);check(!evolve(p,s,b),'No free stone evolution');s.stones[stone]=1;check(!evolve(p,s,3),'Invalid target rejected');check(s.stones[stone]===1,'Invalid action does not spend inventory');check(evolve(p,s,b),'Stone evolution succeeds');check(s.stones[stone]===0&&p.species===b,'Exactly one stone consumed');check(!evolve(p,s,b),'Cannot evolve again');
}
for(const id of [3,6,9,26,134,135,136])check(evolutionOptions(newPokemon(id),createState()).length===0,'Final form has no extra invented evolution');
const s=createState();BASES.forEach(id=>s.caught.add(id));s.pickedStones=new Set(['water','thunder','fire']);s.evolutions=1;s.wins=2;check(!chapterComplete(s),'Chapter needs three victories');s.wins=3;check(chapterComplete(s),'Chapter completes when all four goals are met');
const p=newPokemon(25,49);gainXP(p,100000);check(p.level===50&&p.xp===0,'Level cap');const wild=newPokemon(133,5),full=catchChance(wild);wild.hp=1;check(catchChance(wild)>full&&catchChance(wild)<=.97,'Catch chance increases with weakening and remains bounded');
check(walkable(0,18)&&walkable(-28,-35)&&walkable(23,-40)&&walkable(35,27),'All required sites accessible');check(!walkable(35,4)&&!walkable(100,100),'Water and world boundaries block walking');
const html=fs.readFileSync('./public/index.html','utf8'),css=fs.readFileSync('./public/style.css','utf8'),js=fs.readFileSync('./public/game.mjs','utf8'),templates=fs.readFileSync('./public/codes.mjs','utf8');const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);check(new Set(ids).size===ids.length,'Unique HTML IDs');for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g))check(ids.includes(id)||(js+templates).includes('id="'+id+'"'),`UI target exists: ${id}`);
for(const file of ['game.mjs','world.mjs','data.mjs','style.css','vendor/three.module.min.js','vendor/GLTFLoader.js','vendor/DRACOLoader.js','vendor/SkeletonUtils.js','vendor/utils/BufferGeometryUtils.js','vendor/draco/draco_decoder.wasm','vendor/draco/draco_wasm_wrapper.js'])check(fs.existsSync(path.join('public',file)),`Local file ${file}`);
for(const id of [1,2,3,4,5,6,7,8,9,25,26,133,134,135,136]){const b=fs.readFileSync(`./public/assets/${id}.glb`);check(b.toString('utf8',0,4)==='glTF'&&b.readUInt32LE(4)===2,`Valid GLB ${id}`);const length=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+length));check(!(g.buffers||[]).some(x=>x.uri)&&!(g.images||[]).some(x=>x.uri),`Model ${id} self-contained`);}
check(!/@import/.test(css),'No remote stylesheet dependency');
console.log(`PASS: ${checks} checks. Exact 10 evolution routes, full chapter requirements, bounded leveling/catching, local dependencies, UI IDs and all 15 GLBs.`);
