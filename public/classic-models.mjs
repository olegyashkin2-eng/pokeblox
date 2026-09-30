import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
import {clone} from './vendor/SkeletonUtils.js';
import {classicSculpture} from './classic-sculptures.mjs';
import {ClassicAnimator} from './classic-animation.mjs';

export const ORIGINAL_IDS=Object.freeze([1,2,3,4,5,6,7,8,9,25,26,133,134,135,136]);

export async function loadClassicModels(ids,onProgress=()=>{}){
 const models=new Map(),draco=new DRACOLoader();
 draco.setDecoderPath('./vendor/draco/');draco.setWorkerLimit(2);
 const loader=new GLTFLoader();loader.setDRACOLoader(draco);let cursor=0,done=0;
 const worker=async()=>{while(cursor<ids.length){
  const id=ids[cursor++];
  if(ORIGINAL_IDS.includes(id)){
   const gltf=await loader.loadAsync(`./assets/${id}.glb`);
   gltf.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){m.metalness=0;m.roughness=.8;}
   });models.set(id,gltf);
  }else models.set(id,classicSculpture(id));
  onProgress(++done,ids.length);
 }};
 try{const results=await Promise.allSettled([worker(),worker(),worker()]);const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;return models;}
 finally{draco.dispose();}
}

export function makeClassicPokemon(id,height,template,phase=0){
 const imported=!!template?.scene,model=clone(imported?template.scene:template??classicSculpture(id));
 const correction=new THREE.Group();correction.add(model);
 if(imported&&id===25)correction.rotation.x=-Math.PI/2;
 if(imported&&id===136)correction.rotation.y=Math.PI/2;
 correction.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(correction,true),size=bounds.getSize(new THREE.Vector3()),scale=height/Math.max(.001,size.y);
 correction.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
 const visual=new THREE.Group();visual.add(correction);visual.scale.setScalar(scale);
 const motion=new THREE.Group();motion.add(visual);const outer=new THREE.Group();outer.add(motion);
 const animator=new ClassicAnimator(model,{id,root:motion,height,clips:template?.animations??[],phase});
 // Effect sockets use the restored silhouette's dimensions, in upright game
 // coordinates; the former cube-rig bind matrices do not apply to these assets.
 const socket=(name,point)=>{
  const side=Math.sign(point[0]),plant=name==='plant',cannon=name.startsWith('cannon');
  const y=plant?.9:cannon?.79:name==='head'?.7:.53;
  const z=plant?-.12:cannon?.23:.36;
  return motion.localToWorld(new THREE.Vector3(side*size.x*scale*(cannon?.32:.24),height*y,size.z*scale*z));
 };
 outer.userData={id,height,visual,model,animator,socket,span:Math.max(size.x,size.y,size.z)*scale,modelSource:imported?'original-glb':'classic-sculpture'};
 outer.updateMatrixWorld(true);
 return outer;
}

export function disposePokemon(root){
 if(!root)return;root.userData.animator?.dispose();const skeletons=new Set();
 root.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);});for(const skeleton of skeletons)skeleton.dispose();
}
