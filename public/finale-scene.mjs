import * as THREE from 'three';
import {AttackEffect} from './attack-effects.mjs';
import {disposePokemon} from './classic-models.mjs';

// A single textured Nidoking body carries the other three DNA traits.
// Added parts live under its motion root, so they never float away on attacks.
function makeNechto(body){
 const owned=[],materials=[],motion=body.userData.visual.parent;
 body.traverse(o=>{if(!o.isMesh)return;const list=Array.isArray(o.material)?o.material:[o.material];const copied=list.map(m=>{const c=m.clone();c.color?.lerp(new THREE.Color(0x9471b5),.25);if(c.emissive){c.emissive.set(0x48235f);c.emissiveIntensity=.14;}c.roughness=.55;materials.push(c);return c;});o.material=Array.isArray(o.material)?copied:copied[0];});
 const mat=(color,glow=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.48,emissive:color,emissiveIntensity:glow,side:THREE.DoubleSide});materials.push(m);return m;};
 const skin=mat(0x745584),membrane=mat(0x943f86),vein=mat(0xb18eae),slime=mat(0x674879),glow=mat(0xeabeff,.8);
 const add=(geo,material,parent=motion)=>{const m=new THREE.Mesh(geo,material);m.castShadow=true;parent.add(m);owned.push(geo);return m;};
 const wings=[];
 for(const side of [-1,1]){
  const wing=new THREE.Group();wing.position.set(side*.65,3.05,-.7);wing.scale.x=side;motion.add(wing);wings.push(wing);
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.65,1.1,1.4,1.55,2.95,1.95);shape.lineTo(2.55,.15);shape.quadraticCurveTo(1.9,.65,1.78,-.45);shape.quadraticCurveTo(1.15,.2,.9,-.7);shape.lineTo(0,-.38);
  add(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.03}),membrane,wing);
  for(const end of [[2.95,1.95,0],[2.55,.15,0],[1.78,-.45,0],[.9,-.7,0]]){
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.15,0),new THREE.Vector3(end[0]*.5,end[1]*.65+.23,0),new THREE.Vector3(...end)]);
   add(new THREE.TubeGeometry(curve,12,.06,6,false),vein,wing);
  }
 }
 const tail=new THREE.Group();tail.position.set(.2,1,-.9);motion.add(tail);
 const curve=new THREE.CatmullRomCurve3([[0,0,0],[.5,.3,-1],[1.8,1.1,-2],[2.6,2,-1.4],[2.2,2.4,-.8]].map(p=>new THREE.Vector3(...p)));
 add(new THREE.TubeGeometry(curve,36,.1,8,false),skin,tail);const tailTip=add(new THREE.SphereGeometry(.2,12,8),glow,tail);tailTip.position.copy(curve.getPoint(1));
 const pools=[];for(let i=0;i<9;i++){const a=i*Math.PI*2/9,m=add(new THREE.SphereGeometry(1,16,9),slime);m.position.set(Math.sin(a)*1.05,.15,Math.cos(a)*.9);m.scale.set(.58,.23,.65);pools.push(m);}
 return {body,update(t){wings.forEach((w,i)=>{w.rotation.y=(i?1:-1)*(.14+Math.sin(t*2)*.12);w.rotation.z=(i?1:-1)*Math.sin(t*1.6)*.035;});tail.rotation.y=Math.sin(t*1.3)*.11;pools.forEach((p,i)=>{p.scale.y=.23+Math.sin(t*2+i)*.035;});},dispose(){for(const g of owned)g.dispose();for(const m of materials)m.dispose();}};
}

export class FinaleScene{
 constructor(allies,boss,{aspect=1}={}){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x2d253e);this.scene.fog=new THREE.Fog(0x2d253e,35,100);
  this.camera=new THREE.PerspectiveCamera(48,aspect,.1,160);this.time=0;this.owned=[];this.allies=allies;this.boss=boss;this.nechto=makeNechto(boss);this.models=[...allies,boss];this.attackState=null;this.ending=null;
  this.scene.add(new THREE.HemisphereLight(0xcbbfeb,0x81533d,2.7));const sun=new THREE.DirectionalLight(0xffdfc1,3.3);sun.position.set(8,16,12);this.scene.add(sun);
  const rim=new THREE.DirectionalLight(0xf28ab6,2);rim.position.set(-8,6,-12);this.scene.add(rim);
  const mesh=(geo,color,pos,scale,glow=0)=>{const material=new THREE.MeshStandardMaterial({color,roughness:.7,emissive:color,emissiveIntensity:glow});const m=new THREE.Mesh(geo,material);m.position.set(...pos);if(scale)m.scale.set(...scale);this.scene.add(m);this.owned.push(m);return m;};
  mesh(new THREE.CylinderGeometry(11,12,1,64),0x58465d,[0,-.6,0]);
  const lava=mesh(new THREE.PlaneGeometry(150,150),0xe7784d,[0,-1.4,0],null,.5);lava.rotation.x=-Math.PI/2;
  const ring=mesh(new THREE.TorusGeometry(10.5,.09,6,80),0xd58cb0,[0,0,0],null,.45);ring.rotation.x=Math.PI/2;
  for(let i=0;i<20;i++){const a=i*Math.PI/10;mesh(new THREE.CylinderGeometry(.5,.8,3+(i%3),7),0x726077,[Math.sin(a)*13,.1,Math.cos(a)*13]);}
  allies.forEach((m,i)=>{const fit=Math.min(1,3.7/m.userData.span);m.scale.setScalar(fit);m.position.set(i?3:-3,.05,3);m.rotation.y=i?Math.PI+.4:Math.PI-.4;this.scene.add(m);});
  boss.position.set(0,.05,-3.8);this.scene.add(boss);
  this.flash=mesh(new THREE.SphereGeometry(1,24,16),0xf3d0ff,[0,2,-3.8],null,1);this.flash.material.transparent=true;this.flash.material.opacity=0;this.flash.visible=false;
  this.drops=[];for(let i=0;i<32;i++){const a=i*2.399,m=mesh(new THREE.SphereGeometry(.28+(i%4)*.07,10,7),i%3?0x81558f:0xba8ac7,[0,.3,-3.8],null,.14);m.visible=false;this.drops.push({mesh:m,angle:a,radius:3+(i%8)*.8});}
  this.update(0,aspect);
 }
 attack(slot,special=false,onImpact=()=>{},effect=null){
  this.cancelAttack();const model=slot===2?this.boss:this.allies[slot],target=slot===2?this.allies[this.targetSlot??0]:this.boss;
  const animator=model.userData.animator,origin=model.position.clone(),direction=target.position.clone().sub(origin);direction.y=0;const reach=Math.max(0,direction.length()-2.8);direction.normalize();model.rotation.y=Math.atan2(direction.x,direction.z);
  return new Promise(resolve=>{const spec=animator.play(special?'special':'normal',{onImpact:()=>{target.userData.animator.recoil();onImpact();},onComplete:ok=>{this.attackState?.effect.dispose();this.attackState=null;model.position.copy(origin);resolve(ok);}});if(effect)spec.effect=effect;this.attackState={model,origin,direction,reach,spec,time:0,effect:new AttackEffect(this.scene,model,target,spec)};});
 }
 cancelAttack(){this.attackState?.model.userData.animator.cancel();}
 defeat(){this.cancelAttack();this.ending={time:0};return new Promise(resolve=>this.ending.resolve=resolve);}
 update(dt,aspect=this.camera.aspect,viewportHeight=800){
  this.time+=dt;this.nechto.update(this.time);
  const action=this.attackState;for(const m of this.models)if(m.visible)m.userData.animator.update(dt);
  if(action&&this.attackState===action){action.time+=dt;action.model.position.copy(action.origin).addScaledVector(action.direction,action.model.userData.animator.travel*action.reach);action.effect.update(Math.min(1,action.time/action.spec.duration));}
  if(this.ending){
   const end=this.ending;end.time+=dt;const t=end.time;
   if(t<1.1){this.boss.scale.setScalar(1+Math.sin(t*35)*.025+t*.055);}
   else{this.boss.visible=false;this.flash.visible=t<2.15;this.flash.scale.setScalar(1+(t-1.1)*9);this.flash.material.opacity=Math.max(0,.9-(t-1.1)*.86);this.drops.forEach((d,i)=>{const p=Math.min(1,(t-1.1)/1.8),r=d.radius*p+Math.max(0,t-3)*(.4+i%3*.1);d.mesh.visible=true;d.mesh.position.set(Math.sin(d.angle)*r,Math.max(.2,Math.sin(p*Math.PI)*(2+i%4)),Math.cos(d.angle)*r-3.8);d.mesh.scale.set(1+(p*.7),1-p*.6,1+p*.4);if(t>3)d.mesh.position.x+=Math.sin(t*2+i)*.1;});}
   if(t>=4.6&&end.resolve){end.resolve();end.resolve=null;}
  }
  this.camera.aspect=aspect;this.camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(48)/2)/Math.min(1,Math.max(.42,aspect))));this.camera.updateProjectionMatrix();
  const fit=Math.max(1,(aspect<1?720:520)/viewportHeight);this.camera.position.set(8*fit,8.7*fit,18.5*fit);this.camera.lookAt(0,aspect<1?-1.2:.9,-.3);
 }
 dispose(){this.cancelAttack();this.ending?.resolve?.();this.nechto.dispose();for(const model of this.models)disposePokemon(model);for(const m of this.owned){m.geometry.dispose();m.material.dispose();}this.scene.clear();}
}
