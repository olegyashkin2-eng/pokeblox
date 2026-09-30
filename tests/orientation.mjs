import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../public/vendor/three.module.min.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('../public/vendor/three.module.min.js');
const {World,viewportFov}=await import('../public/world.mjs');
const {classicSculpture:questModel}=await import('../public/classic-sculptures.mjs');
const {classicFixtures}=await import('./classic-fixtures.mjs');
const {ALL_IDS}=await import('../public/data.mjs');
const {EvolutionScene}=await import('../public/evolution-scene.mjs');
const world=Object.create(World.prototype);
let width=390,height=844;
Object.assign(world,{
 canvas:{getBoundingClientRect:()=>({width,height})},renderer:{setSize(w,h){assert.equal(w,width);assert.equal(h,height);},render(){}},
 camera:new THREE.PerspectiveCamera(46,1,.1,260),scene:new THREE.Scene(),models:await classicFixtures(),
 shadowTexture:null,ring:new THREE.Group(),trainer:new THREE.Group(),playerPos:new THREE.Vector3(0,0,18),wild:[],pickups:[],clouds:[],motes:new THREE.Group(),portalGlow:{material:{}},
 cameraDistance:13,cameraYaw:.2,cameraPitch:.52,clock:10
});
const originalPosition=world.playerPos.clone(),originalDistance=world.cameraDistance;
function bounds(model,camera){
 camera.updateMatrixWorld(true);world.scene.updateMatrixWorld(true);model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model,true),xs=[],ys=[];
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const v=new THREE.Vector3(x,y,z).project(camera);xs.push(v.x);ys.push(v.y);
 }
 return {bottom:(1-Math.min(...ys))*height/2,x:Math.max(...xs.map(Math.abs)),y:Math.max(...ys.map(Math.abs))};
}
for(const [w,h] of [[568,320],[320,568],[390,844],[844,390],[768,1024],[1024,768],[1024,1366],[1366,1024],[390,844]]){
 width=w;height=h;world.resize();assert.equal(world.camera.aspect,w/h);assert.ok(Number.isFinite(viewportFov(w/h)));
 for(const id of ALL_IDS){world.beginBattle(id,6);world.tick(1);const battle=world.battleGroup;
 for(const model of [world.battleOwn,world.battleEnemy]){const b=bounds(model,world.camera);assert.ok(b.x<.98,`Both fighters fit horizontally at ${w}×${h}: ${b.x}`);assert.ok(b.y<.98);if(w>h&&h<450)assert.ok(b.bottom<h-129,`Fighters clear the short landscape action panel at ${w}×${h}`);}
 world.resize();assert.equal(world.battleGroup,battle,'Rotation keeps the running encounter');assert.deepEqual(world.playerPos,originalPosition);assert.equal(world.cameraDistance,originalDistance,'User zoom survives rotation');world.endBattle();}
}
// Reframe an in-progress evolution without resetting its phase, time or models.
const evolution=new EvolutionScene(world.makePokemon(133,2.15),world.makePokemon(136,2.3),{stone:'fire',aspect:844/390});
evolution.update(2);const old=evolution.old,next=evolution.next;
for(const aspect of [390/844,844/390,768/1024,1024/768,320/568]){
 evolution.update(0,aspect);assert.equal(evolution.time,2);assert.equal(evolution.phase,'charge');assert.equal(evolution.old,old);assert.equal(evolution.next,next);
 assert.ok(bounds(evolution.old,evolution.camera).x<.98,'Evolution silhouette fits portrait and landscape');
}
evolution.dispose();
console.log('PASS: phone/tablet camera framing; rotation preserves encounter, position, zoom and evolution phase');
