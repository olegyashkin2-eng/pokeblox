import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../public/vendor/three.module.min.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('../public/vendor/three.module.min.js');
const {questModel}=await import('../public/quest-models.mjs');
const {EvolutionScene,EVOLUTION_DURATION}=await import('../public/evolution-scene.mjs');
const {createState,newPokemon,evolve,ALL_IDS}=await import('../public/data.mjs');
const {World}=await import('../public/world.mjs');
const world=Object.create(World.prototype);world.models=new Map(ALL_IDS.map(id=>[id,questModel(id)]));
for(const id of ALL_IDS){const g=world.models.get(id).geometry;assert.ok(g.attributes.position.count/3<26000,'Mobile triangle budget');assert.ok(g.attributes.normal.array.every(Number.isFinite));}
for(const [stone,target] of [['fire',136],['water',134],['thunder',135]]){
 const s=createState(),p=newPokemon(133,9);s.stones[stone]=1;assert.ok(evolve(p,s,target));assert.equal(s.stones[stone],0);assert.equal(p.species,target);assert.equal(evolve(p,s,target),false);
 const original=world.models.get(133).material;const scene=new EvolutionScene(world.makePokemon(133,2.15),world.makePokemon(target,2.3),{stone,aspect:16/9});
 assert.ok(scene.old.visible);assert.equal(scene.next.visible,false);assert.ok(scene.stone.visible);
 scene.update(2);assert.equal(scene.phase,'charge');assert.ok(scene.old.visible);assert.equal(scene.done,false);
 scene.update(2.25);assert.equal(scene.phase,'transform');assert.ok(scene.next.visible);assert.equal(scene.old.visible,false);
 scene.update(3);assert.equal(scene.phase,'complete');assert.equal(scene.done,true);assert.equal(scene.next.scale.x,1);assert.equal(scene.flash.material.opacity,0);
 assert.equal(original.emissiveIntensity,1);assert.equal(original.emissive.getHex(),0);assert.notEqual(scene.modelMaterials[0],original);
 scene.dispose();assert.equal(scene.scene.children.length,0);assert.ok(world.makePokemon(target));
}
// Advance on rendered time, including slower devices. Hidden tabs cannot skip the reveal.
const slow=new EvolutionScene(world.makePokemon(25),world.makePokemon(26),{stone:'thunder',reducedMotion:true});
for(let i=0;i<143;i++)slow.update(.05,2);assert.equal(slow.done,false);slow.update(.051,2);assert.ok(slow.done);assert.ok(slow.rays.every(r=>r.material.opacity===0));slow.dispose();
// World resolves once at completion, freezes exploration, and restores camera mode.
world.camera={aspect:2};world.cameraMode='explore';world.clock=42;world.renderer={render(scene,camera){assert.ok(scene.isScene&&camera.isCamera);}};
globalThis.matchMedia=()=>({matches:false});let finished=false;const promise=world.startEvolution(133,136,'fire').then(()=>finished=true);
world.tick(1);assert.equal(world.clock,42);assert.equal(finished,false);world.tick(EVOLUTION_DURATION);await promise;assert.ok(finished);world.finishEvolution();assert.equal(world.cameraMode,'explore');assert.equal(world.evolutionScene,null);
console.log('PASS: sculpture triangle budgets; all Eevee stone paths; cinematic phases, cached-material isolation, reduced motion, completion and cleanup');
