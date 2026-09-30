import * as THREE from 'three';
import {ANIMATION_PROFILES,attackSpec} from './pokemon-animation.mjs';

// Original GLBs keep their own skeletons. Authored clips take precedence over
// the gentle whole-model movement used by the older, unrigged sculptures.
export class ClassicAnimator{
 constructor(model,{id,root,height,clips=[],phase=0}){
  this.model=model;this.id=id;this.root=root;this.height=height;
  this.profile=ANIMATION_PROFILES[id];this.time=phase;this.phase=phase;
  this.weight=0;this.travel=0;this.action=null;this.recoilTime=1;
  this.mixer=new THREE.AnimationMixer(model);this.currentClip=null;
  const find=re=>clips.find(c=>re.test(c.name));
  this.clips={idle:find(/idle/i),walk:find(/walk/i),run:find(/run/i),
   normal:find(/fight_b/i),special:id===25?find(/Impactrueno/i):find(/fight_d/i)};
 }
 resetPose(){this.root.position.set(0,0,0);this.root.rotation.set(0,0,0);this.root.scale.set(1,1,1);this.travel=0;}
 setClip(clip,once=false,duration=0){
  if(this.currentClip?.getClip()===clip)return;
  this.mixer.stopAllAction();this.currentClip=null;
  if(!clip)return;
  const action=this.mixer.clipAction(clip);action.reset();
  action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
  action.clampWhenFinished=once;action.setEffectiveTimeScale(once?clip.duration/duration:1);
  action.play();this.currentClip=action;
 }
 play(kind='normal',callbacks={}){
  this.cancel();const spec=attackSpec(this.id,kind);
  this.action={...spec,time:0,fired:false,hit:false,...callbacks};
  this.setClip(this.clips[spec.kind],true,spec.duration);return spec;
 }
 cancel(){const a=this.action;this.action=null;this.resetPose();this.setClip(null);a?.onComplete?.(false);}
 recoil(){this.recoilTime=0;}
 update(dt,speed=0){
  dt=Math.max(0,Number.isFinite(dt)?dt:0);speed=Math.max(0,Number.isFinite(speed)?speed:0);
  this.time+=dt;this.recoilTime+=dt;
  const p=this.profile,h=this.height,desired=speed>.045?THREE.MathUtils.clamp(speed/1.1,.45,1):0;
  this.weight+=(desired-this.weight)*(1-Math.exp(-dt*12));
  this.phase+=dt*p.cadence*THREE.MathUtils.clamp(.52+speed*.15,.52,1.9);
  this.resetPose();const a=this.action;
  if(!a)this.setClip(speed>.06?(speed>3?this.clips.run??this.clips.walk:this.clips.walk):this.clips.idle);
  this.mixer.update(dt);
  if(!this.currentClip){
   const wave=Math.sin(this.phase),weight=this.weight;
   this.root.position.y=h*(.007*(1+Math.sin(this.time*2.3))+p.bounce*Math.abs(wave)*weight);
   this.root.rotation.z=p.sway*wave*weight;
   this.root.rotation.x=Math.cos(this.phase*2)*.025*weight;
   if(['fish','seal','seahorse','flop'].includes(p.gait))this.root.rotation.y=wave*p.sway*2*weight;
  }
  if(a){
   a.time=Math.min(a.duration,a.time+dt);const t=a.time/a.duration;
   const hit=Math.max(0,1-Math.abs(t-a.impact)/.24),wind=Math.sin(Math.min(1,t/a.cast)*Math.PI);
   if(a.contact){this.travel=Math.sin(Math.PI*Math.min(1,t/a.impact))*.18+hit*.68;this.root.rotation.x+=hit*.17-wind*.1;this.root.position.y+=h*hit*p.bounce;}
   else{this.root.rotation.x-=wind*.13;this.root.position.y+=h*wind*.05;this.root.rotation.z+=Math.sin(t*20)*wind*p.sway*.35;}
  }
  if(this.recoilTime<.42){const r=this.recoilTime/.42,k=Math.sin(r*Math.PI)*(1-r);this.root.rotation.x-=.2*k;this.root.position.z-=h*.08*k;}
  this.root.updateWorldMatrix(true,true);
  if(a){
   if(!a.fired&&a.time>=a.cast*a.duration){a.fired=true;a.onCast?.(a);}
   if(!a.hit&&a.time>=a.impact*a.duration){a.hit=true;a.onImpact?.(a);}
   if(a.time>=a.duration&&this.action===a){this.action=null;this.travel=0;this.setClip(null);a.onComplete?.(true);}
  }
 }
 dispose(){this.cancel();this.mixer.uncacheRoot(this.model);}
}
