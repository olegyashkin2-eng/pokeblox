import * as THREE from 'three';
import {disposePokemon} from './classic-models.mjs';
export const EVOLUTION_DURATION=7.2;
const clamp=THREE.MathUtils.clamp;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function evolutionPhase(t){return t<1.35?'stone':t<3.65?'charge':t<4.65?'transform':t<EVOLUTION_DURATION?'reveal':'complete';}
// An isolated stage leaves exploration, battle state and cached model materials untouched.
export class EvolutionScene{
 constructor(oldModel,newModel,{stone=null,aspect=1,reducedMotion=false}={}){
  this.time=0;this.done=false;this.reducedMotion=reducedMotion;this.phase='stone';this.disposables=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#071727');this.scene.fog=new THREE.Fog('#071727',14,30);
  this.camera=new THREE.PerspectiveCamera(35,aspect,.1,60);
  this.color=new THREE.Color(({fire:'#ffb567',water:'#68dcff',thunder:'#ffdf69',dragon:'#a899ff',moon:'#ffc9f2',leaf:'#a4edaa'})[stone]||'#95e8ca');
  this.scene.add(new THREE.HemisphereLight('#e0f6ff','#16314b',2));
  const key=new THREE.DirectionalLight('#fff1dc',3.4);key.position.set(-3,6,5);this.scene.add(key);
  const rim=new THREE.DirectionalLight(this.color,4);rim.position.set(3,3,-4);this.scene.add(rim);
  this.light=new THREE.PointLight(this.color,12,12);this.light.position.set(0,2.6,1);this.scene.add(this.light);
  this.old=oldModel;this.next=newModel;this.scene.add(this.old,this.next);this.next.visible=false;
  this.modelFit=Math.max(1,Math.max(this.old.userData.span??0,this.next.userData.span??0)/3.6);
  this.modelMaterials=[];
  for(const root of [this.old,this.next])root.traverse(obj=>{if(!obj.isMesh)return;const copy=m=>{const own=m.clone();this.modelMaterials.push(own);return own;};obj.material=Array.isArray(obj.material)?obj.material.map(copy):copy(obj.material);});
  const basic=(opacity=1)=>new THREE.MeshBasicMaterial({color:this.color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const add=(g,m,pos)=>{const obj=new THREE.Mesh(g,m);if(pos)obj.position.set(...pos);this.scene.add(obj);this.disposables.push(g,m);return obj;};
  this.platform=add(new THREE.CylinderGeometry(2.45,2.6,.2,64),new THREE.MeshStandardMaterial({color:'#183449',roughness:.38,metalness:.25}),[0,-.15,0]);
  this.rings=[];for(let i=0;i<3;i++){const r=add(new THREE.TorusGeometry(1.58+i*.34,.018,6,80),basic(.4),[0,.02,0]);r.rotation.x=Math.PI/2;this.rings.push(r);}
  this.aura=add(new THREE.SphereGeometry(1,24,16),basic(0),[0,1.1,0]);this.aura.scale.set(1.4,1.5,1.4);
  this.flash=add(new THREE.SphereGeometry(1,16,10),new THREE.MeshBasicMaterial({color:'#f0fbff',transparent:true,opacity:0,depthWrite:false,side:THREE.BackSide}),[0,1.2,0]);this.flash.scale.setScalar(12);
  this.stone=add(new THREE.IcosahedronGeometry(.22,0),new THREE.MeshStandardMaterial({color:this.color,emissive:this.color,emissiveIntensity:1,roughness:.2}),[0,1.1,1.2]);this.stone.visible=!!stone;
  const mark=new THREE.Mesh(new THREE.OctahedronGeometry(.09),new THREE.MeshBasicMaterial({color:'#fff4ce'}));mark.scale.set(.6,1.3,.5);mark.position.z=.2;this.stone.add(mark);this.disposables.push(mark.geometry,mark.material);
  this.particleData=Array.from({length:100},(_,i)=>({angle:i*2.399,r:.55+(i%11)*.19,y:(i%17)/17,speed:.6+(i%5)*.11}));
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(300),3));
  const pm=new THREE.PointsMaterial({color:this.color,size:.046,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
  this.particles=new THREE.Points(pg,pm);this.scene.add(this.particles);this.disposables.push(pg,pm);
  this.rays=[];for(let i=0;i<14;i++){const ray=add(new THREE.PlaneGeometry(.026,3.3),basic(0),[0,1.2,0]);ray.rotation.z=i*Math.PI/7;this.rays.push(ray);}
  this.update(0,aspect);
 }
 update(dt,aspect=this.camera.aspect){
  this.time+=Math.max(0,dt);const t=this.time;this.phase=evolutionPhase(t);this.done=t>=EVOLUTION_DURATION;
  this.camera.aspect=aspect;this.camera.updateProjectionMatrix();
  const a=this.reducedMotion?.12:.18+Math.sin(Math.min(t,7)*.35)*.14;
  const distance=Math.max(7.9,6.2/Math.max(aspect,.55))*this.modelFit;this.camera.position.set(Math.sin(a)*distance,2.85,Math.cos(a)*distance);this.camera.lookAt(0,.88,0);
  const charge=ease((t-1.35)/2.3),reveal=ease((t-4.65)/1.05),glow=t<3.65?charge:t<4.65?1:1-reveal;
  this.old.visible=t<4.18;this.next.visible=t>=4.18;
  for(const [index,model] of [this.old,this.next].entries()){
   model.userData.animator?.update(dt);model.position.set(0,.03+Math.sin(Math.min(t,4.65)/4.65*Math.PI)*.45,0);
   model.rotation.y=this.reducedMotion?.08:t<3.65?.12+charge*.3:t<4.65?.42+(t-3.65)*Math.PI*2:.14+(1-reveal)*.25;
   const s=index===0?1-charge*.045:.84+ease((t-4.18)/1.12)*.16;model.scale.setScalar(s);
   model.traverse(obj=>{if(obj.isMesh)for(const m of Array.isArray(obj.material)?obj.material:[obj.material])if(m.emissive){m.emissive.set('#efffff');m.emissiveIntensity=glow*(this.reducedMotion?1.3:3.5);}});
  }
  this.stone.position.set(0,1.3+Math.sin(Math.min(t/1.35,1)*Math.PI)*.45,1.2*(1-ease(t/1.35)));
  this.stone.rotation.set(t*.6,t*1.4,.3);this.stone.scale.setScalar(Math.max(.001,1-ease((t-1)/.5)));
  this.light.intensity=8+glow*22;this.aura.material.opacity=glow*(this.reducedMotion?.065:.16);
  this.aura.scale.setScalar(1+glow*.4);
  // A single gentle bloom instead of strobing between the two silhouettes.
  const flash=Math.max(0,1-Math.abs(t-4.18)/.46);this.flash.material.opacity=flash*(this.reducedMotion?.12:.8);
  for(let i=0;i<this.rings.length;i++){const r=this.rings[i];r.rotation.z=t*(i%2?-.24:.25);r.position.y=.015+(i>0?glow*(.45+i*.32):0);r.material.opacity=.3+glow*.5;r.scale.setScalar(1+glow*.15);}
  const positions=this.particles.geometry.attributes.position;
  this.particleData.forEach((p,i)=>{const angle=p.angle+t*p.speed*(this.reducedMotion?.15:.7),radius=p.r*(1-charge*.35)+reveal*.6;positions.setXYZ(i,Math.sin(angle)*radius,((p.y+t*.17)%1)*3.8-.1,Math.cos(angle)*radius);});positions.needsUpdate=true;
  this.particles.material.opacity=t>7?Math.max(.25,1-(t-7)*.5):.4+glow*.6;
  this.rays.forEach((r,i)=>{r.material.opacity=(this.reducedMotion?0:1)*Math.max(0,1-Math.abs(t-4.7)/1.1)*.42;r.rotation.z=i*Math.PI/7+t*.035;r.scale.y=1+reveal*.6;});
  return this.done;
 }
 dispose(){for(const model of [this.old,this.next])disposePokemon(model);for(const m of this.modelMaterials)m.dispose();for(const item of this.disposables)item.dispose();this.scene.clear();}
}
