import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../public/vendor/three.module.min.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('three');
const {questModel}=await import('../public/quest-models.mjs');
const {PokemonAnimator,attackSpec,ANIMATION_PROFILES}=await import('../public/pokemon-animation.mjs');
const {World}=await import('../public/world.mjs');
const {classicFixtures}=await import('./classic-fixtures.mjs');
const {ALL_IDS,createState,newPokemon}=await import('../public/data.mjs');
const {resolveTurn}=await import('../public/battle.mjs');

assert.deepEqual(Object.keys(ANIMATION_PROFILES).map(Number),ALL_IDS);
const pose=m=>Object.fromEntries(Object.entries(m.userData.parts).map(([n,b])=>[n,[...b.position.toArray(),...b.quaternion.toArray()]]));
const signatures=new Set();
for(const id of ALL_IDS){
 const model=questModel(id),other=questModel(id),g=model.geometry,bones=model.skeleton.bones;
 assert.ok(model.isSkinnedMesh);assert.equal(g,other.geometry);assert.equal(model.material,other.material);
 assert.notEqual(model.skeleton,other.skeleton);assert.ok(bones.every(b=>!other.skeleton.bones.includes(b)));
 for(let i=0;i<g.attributes.skinIndex.count;i++){
  assert.ok(g.attributes.skinIndex.getX(i)<bones.length);assert.equal(g.attributes.skinWeight.getX(i),1);
 }
 const idle=new PokemonAnimator(other),walk=new PokemonAnimator(model),rest=pose(other),vertex=new THREE.Vector3(),raw=new THREE.Vector3();
 // The unanimated sculpture is unchanged by the rig, including translated pivots.
 for(let i=0;i<g.attributes.position.count;i+=31){model.getVertexPosition(i,vertex);raw.fromBufferAttribute(g.attributes.position,i);assert.ok(vertex.distanceTo(raw)<1e-6);}
 let moved=false;
 for(let i=0;i<30;i++){walk.update(1/30,2.2);idle.update(1/30,0);const a=pose(model),b=pose(other);moved||=Object.keys(a).some(n=>n!=='body'&&a[n].some((v,j)=>Math.abs(v-b[n][j])>.08));}
 const walking=pose(model),standing=pose(other);
 assert.ok(moved,`${id} articulates appendages when walking`);
 signatures.add(JSON.stringify(walking));
 const untouched=pose(other),actions=[];
 for(const kind of ['normal','special']){
  let casts=0,hits=0,completes=0;
  const animator=new PokemonAnimator(model),spec=animator.play(kind,{onCast:()=>casts++,onImpact:()=>hits++,onComplete:ok=>{assert.ok(ok);completes++;}});
  animator.update(spec.duration*(spec.impact-.001));assert.equal(hits,0);actions.push(pose(model));
  animator.update(spec.duration*.002);assert.equal(hits,1);assert.equal(casts,1);
  for(let i=0;i<40;i++)animator.update(spec.duration/40);
  assert.equal(hits,1);assert.equal(casts,1);assert.equal(completes,1);assert.equal(animator.action,null);assert.equal(animator.travel,0);
  assert.deepEqual(pose(other),untouched,'Other instances are unaffected');
  for(const b of bones)assert.ok([...b.position.toArray(),...b.quaternion.toArray()].every(Number.isFinite));
  animator.resetPose();assert.deepEqual(pose(model),rest,'Actions return to bind pose');
 }
 assert.notDeepEqual(actions[0],actions[1],`${id}: ordinary and signature strikes differ`);
 model.skeleton.dispose();other.skeleton.dispose();
}
assert.equal(signatures.size,ALL_IDS.length,'Every species has a distinct walking pose');
assert.equal(attackSpec(133,'special').effect,'dash');assert.equal(attackSpec(133,'normal').effect,'hit');
console.log('PASS: 31 rigid rigs, bind poses, articulated locomotion, 62 attack clips, independent instances and one-shot impact markers');

// Run the real world/attack/effect integration using rendered time (no GPU needed).
const world=Object.create(World.prototype);
Object.assign(world,{
 models:await classicFixtures(),scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(46,16/9,.1,260),viewportHeight:720,renderer:{render(){}},
 playerPos:new THREE.Vector3(0,0,18),trainer:new THREE.Group(),ring:new THREE.Group(),shadowTexture:null,wild:[],pickups:[],clouds:[],
 motes:new THREE.Group(),portalGlow:{material:{}},clock:0
});
for(const id of ALL_IDS)for(const kind of ['normal','special']){
 world.beginBattle(id,25);let hits=0,finished=false;
 const original=world.battleOwn.position.clone(),baseChildren=world.scene.children.length;
 const promise=world.attackAnimation(false,kind,()=>hits++).then(ok=>{assert.ok(ok);finished=true;});
 world.tick(0);assert.equal(hits,0);assert.equal(finished,false);
 const frames=Math.ceil(attackSpec(id,kind).duration/.04)+2;
 for(let i=0;i<frames;i++){
  world.tick(.04,{paused:true}); // Input lock must not pause an attack.
  world.scene.updateMatrixWorld(true);
  for(const child of world.currentAttack?.effect.group.children??[])assert.ok(child.matrixWorld.elements.every(Number.isFinite),'Finite animated effect geometry');
 }
 await promise;assert.equal(hits,1);assert.ok(finished);assert.equal(world.currentAttack,null);assert.deepEqual(world.battleOwn.position,original);
 assert.equal(world.scene.children.length,baseChildren,'Effect removed on completion');world.endBattle();
}
world.beginBattle(9,26);let hits=0,completed;
const promise=world.attackAnimation(true,'special',()=>hits++).then(ok=>completed=ok);
globalThis.document={hidden:true};world.tick(5);assert.equal(hits,0);assert.equal(world.currentAttack.model.userData.animator.action.time,0);
document.hidden=false;world.tick(.12);const effect=world.currentAttack.effect;
world.endBattle();await promise;assert.equal(completed,false);assert.ok(effect.disposed);assert.equal(world.currentAttack,null);assert.equal(hits,0);
delete globalThis.document;
console.log('PASS: all effects, awaited turns, contact travel/reset, hidden-tab pause, enemy attack and cancellation cleanup');

// Snapshot HP and explicit animation kind, including Normal-type Eevee's special.
const state=createState();state.party=[newPokemon(133,20),newPokemon(7,20),newPokemon(25,30)];
let battle={own:state.party[0],enemy:newPokemon(55,40),specialCooldown:0,turn:2,wild:{}};
let result=resolveTurn(state,battle,'special',()=>.99);
assert.equal(result.events[0].type,'normal');assert.equal(result.events[0].animation,'special');assert.equal(result.events[0].targetHp,battle.enemy.hp);
assert.equal(result.events.find(e=>e.actor==='enemy').animation,'special');
state.active=0;state.party[0]=newPokemon(133,20);state.party[1].hp=1;battle={own:state.party[0],enemy:newPokemon(55,50),specialCooldown:0,turn:0,wild:{}};
result=resolveTurn(state,battle,{type:'switch',index:1},()=>.99);
const switches=result.events.filter(e=>e.switch);
assert.equal(switches.length,2);assert.equal(switches[0].species,7);assert.equal(switches[0].pokemon.hp,1);
assert.equal(result.events.find(e=>e.actor==='enemy').targetHp,0);assert.equal(switches[1].species,battle.own.species);
assert.notEqual(switches[0].species,switches[1].species,'Each switch animates the fighter at that point in the turn');
console.log('PASS: Normal-type signature animation, impact HP snapshots and same-turn replacement ordering');
