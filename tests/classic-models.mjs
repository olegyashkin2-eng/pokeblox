import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../public/vendor/three.module.min.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const THREE=await import('three');
const {classicFixtures}=await import('./classic-fixtures.mjs');
const {makeClassicPokemon,disposePokemon,ORIGINAL_IDS}=await import('../public/classic-models.mjs');
const {EvolutionScene}=await import('../public/evolution-scene.mjs');
const {ALL_IDS}=await import('../public/data.mjs');
const templates=await classicFixtures();
const bones=root=>{const b=[];root.traverse(o=>{if(o.isBone)b.push(o);});return b;};
for(const id of ALL_IDS){
 const template=templates.get(id),a=makeClassicPokemon(id,2,template),b=makeClassicPokemon(id,2,template);
 assert.equal(a.userData.modelSource,ORIGINAL_IDS.includes(id)?'original-glb':'classic-sculpture');
 a.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(a,true);
 assert.ok(Math.abs(box.min.y)<1e-4,`${id}: feet meet the ground`);
 assert.ok(Math.abs(box.max.y-2)<1e-4,`${id}: correct upright height`);
 assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite));
 const ab=bones(a),bb=bones(b);assert.ok(ab.every(bone=>!bb.includes(bone)),'Independent skeleton clones');
 const rest=bb.map(bone=>bone.quaternion.toArray());
 a.userData.animator.update(.2,2);
 assert.deepEqual(bb.map(bone=>bone.quaternion.toArray()),rest);
 for(const kind of ['normal','special']){
  let hits=0,finished=0;const anim=a.userData.animator;
  const spec=anim.play(kind,{onImpact:()=>hits++,onComplete:ok=>{assert.ok(ok);finished++;}});
  anim.update(spec.duration*(spec.impact-.001));assert.equal(hits,0);
  anim.update(spec.duration*.002);assert.equal(hits,1);
  anim.update(spec.duration);assert.equal(hits,1);assert.equal(finished,1);assert.equal(anim.travel,0);
  assert.ok(a.userData.socket('head',[0,1,.5]).toArray().every(Number.isFinite));
 }
 disposePokemon(a);disposePokemon(b);
}
const bulbasaur=makeClassicPokemon(1,2,templates.get(1)),pikachu=makeClassicPokemon(25,2,templates.get(25));
bulbasaur.userData.animator.update(.2,2);assert.match(bulbasaur.userData.animator.currentClip.getClip().name,/walk/i);
pikachu.userData.animator.play('special');assert.match(pikachu.userData.animator.currentClip.getClip().name,/Impactrueno/);
disposePokemon(bulbasaur);disposePokemon(pikachu);
// Imported assets may contain material arrays or unlit materials.
const unlit=new THREE.MeshBasicMaterial({color:'red'}),lit=new THREE.MeshStandardMaterial({color:'blue'});
const mixed=new THREE.Group();mixed.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),[unlit,lit]));
const next=makeClassicPokemon(26,2,templates.get(26));
const scene=new EvolutionScene(makeClassicPokemon(25,2,{scene:mixed,animations:[]}),next);
scene.update(2);assert.equal(lit.emissive.getHex(),0);assert.equal(scene.modelMaterials.length>=2,true);scene.dispose();
const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
for(const id of ORIGINAL_IDS)assert.ok(sw.includes(`'/assets/${id}.glb'`),`Offline asset ${id}`);
for(const path of ['classic-models.mjs','classic-animation.mjs','vendor/GLTFLoader.js','vendor/SkeletonUtils.js','vendor/DRACOLoader.js','vendor/draco/draco_decoder.wasm','vendor/draco/draco_wasm_wrapper.js'])assert.ok(sw.includes(`'/${path}'`),`Offline dependency ${path}`);
console.log('PASS: 149 real GLBs, upright bounds, independent clones, native clips, impact markers, mixed materials and offline cache');
