import * as THREE from 'three';

const V=THREE.Vector3,clamp=THREE.MathUtils.clamp;
const orb=new THREE.IcosahedronGeometry(1,1),cube=new THREE.BoxGeometry(1,1,1),rock=new THREE.DodecahedronGeometry(1,0);
const ring=new THREE.TorusGeometry(1,.045,4,32),rod=new THREE.CylinderGeometry(1,1,1,6);
const COLORS={hit:0xfff1d2,dash:0xffffff,fire:0xff9b38,water:0x63d7ff,hydro:0x85e6ff,splash:0x8ee9ff,electric:0xffdf4b,vine:0x68c96a,solar:0xffed91,rock:0xb6a087};
const MOUTH={4:[0,1.48,.53],5:[0,1.48,.53],6:[0,1.48,.53],7:[0,1.35,.63],8:[0,1.35,.63],54:[0,1.17,.86],55:[0,1.18,.81],86:[0,.91,.85],87:[0,.91,.85],116:[0,1.19,.8],117:[0,1.19,.8],134:[0,1.03,.77],136:[0,1.03,.77]};

// Read the exact animated attachment in bind coordinates, including world scale.
export function attachment(pokemon,name,point){
 if(pokemon.userData.socket)return pokemon.userData.socket(name,point);
 const model=pokemon.userData.model,bone=model.userData.parts[name]??model.userData.parts.body;
 model.updateWorldMatrix(true,true);
 const i=model.skeleton.bones.indexOf(bone);
 return new V(...point).applyMatrix4(model.skeleton.boneInverses[i]).applyMatrix4(bone.matrixWorld);
}

// A short-lived effect follows rendered attack time, never a wall-clock timeout.
export class AttackEffect{
 constructor(scene,attacker,target,spec){
  this.scene=scene;this.attacker=attacker;this.target=target;this.spec=spec;this.group=new THREE.Group();scene.add(this.group);this.materials=[];this.disposables=[];
  const material=(color,opacity=.85)=>{const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});this.materials.push(m);return m;};
  this.main=material(COLORS[spec.effect]);this.glow=material(spec.effect==='fire'?0xffe898:0xf1ffff,.75);this.stone=material(0x9b8d79,1);
  const add=(geo,mat=this.main)=>{const m=new THREE.Mesh(geo,mat);m.visible=false;this.group.add(m);return m;};
  this.charge=[add(ring),add(ring,this.glow)];
  this.impact=[add(ring,this.glow),...Array.from({length:8},()=>add(cube))];
  this.particles=Array.from({length:spec.effect==='hydro'?24:18},(_,i)=>add(spec.effect==='rock'?rock:orb,i%3===0?this.glow:spec.effect==='rock'?this.stone:this.main));
  this.rings=Array.from({length:4},()=>add(ring));
  this.vines=spec.effect==='vine'?Array.from({length:24},()=>add(rod)):[];
  this.beams=['solar','dash'].includes(spec.effect)?[add(rod),add(rod,this.glow)]:[];
  this.bolts=[];
  if(spec.effect==='electric')for(let i=0;i<3;i++){
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(36),3));
   const m=new THREE.Line(g,new THREE.LineBasicMaterial({color:i?0xfff2a2:0xffca39,transparent:true,opacity:1}));
   m.visible=false;this.group.add(m);this.bolts.push(m);this.disposables.push(g,m.material);
  }
  this.update(0);
 }
 source(side=0){
  const id=this.spec.id;
  if(id===9&&this.spec.kind==='special')return attachment(this.attacker,side<0?'cannonL':'cannonR',[side*.54,1.82,.65]);
  if([1,2,3].includes(id)&&this.spec.kind==='special')return attachment(this.attacker,'plant',[side*.36,id===3?2.11:1.16,-.2]);
  if(id===25)return attachment(this.attacker,'body',[side*.41,.59,.65]);
  if(id===26)return attachment(this.attacker,'head',[side*.42,1.28,.46]);
  if(MOUTH[id])return attachment(this.attacker,'head',MOUTH[id]);
  return attachment(this.attacker,'body',[0,id===90?.7:.82,id===129?.8:.5]);
 }
 segment(mesh,a,b,width){const d=b.clone().sub(a);mesh.position.copy(a).addScaledVector(d,.5);mesh.quaternion.setFromUnitVectors(new V(0,1,0),d.clone().normalize());mesh.scale.set(width,d.length(),width);mesh.visible=true;}
 update(t){
  if(this.disposed)return;
  for(const c of this.group.children)c.visible=false;
  const a=this.spec,id=a.id,effect=a.effect;
  const start=this.source(),end=this.target.getWorldPosition(new V()).add(new V(0,this.target.userData.height*.55,0));
  const direction=end.clone().sub(start).normalize(),side=new V().crossVectors(direction,new V(0,1,0)).normalize();
  const progress=clamp((t-a.cast)/(a.impact-a.cast||.01),0,1),fade=clamp((1-t)/.22,0,1),special=a.kind==='special';
  const charging=special&&t<a.cast,charge=clamp(t/a.cast,0,1);
  for(const [i,m] of this.charge.entries())if(charging){m.visible=true;m.position.copy(start);m.lookAt(end);m.rotateZ(t*(i?-6:6));m.scale.setScalar(.12+charge*(.22+i*.14));}
  const active=t>=a.cast&&t<a.impact+.16;
  this.main.opacity=.84*fade;this.glow.opacity=.8*fade;this.stone.opacity=fade;
  if(active&&special){
   for(const [i,m] of this.particles.entries()){
    const u=clamp(progress-i/this.particles.length*.34,0,1),angle=i*2.399+t*(id===117?20:7),radius=(effect==='fire'?.13+.24*u:effect==='splash'?.55:.075)*Math.sin(u*Math.PI);
    const origin=effect==='hydro'?this.source(i%2?-1:1):start;
    m.position.copy(origin).lerp(end,u).addScaledVector(side,Math.cos(angle)*radius);m.position.y+=Math.sin(angle)*radius;
    let scale=effect==='fire'?.09+u*.15:effect==='rock'?.18+(i%3)*.045:effect==='splash'?.08:.06;
    if(effect==='rock'){if(i>=6)continue;m.position.y+=Math.sin(u*Math.PI)*(1.8+i*.1);m.rotation.set(t*12+i,t*9+i,0);}
    if(effect==='splash')m.position.y+=Math.sin(u*Math.PI)*(.8+(i%4)*.16);
    if(['vine','electric','dash','solar'].includes(effect)){scale=.03;}
    m.scale.setScalar(scale);m.visible=u>0;
   }
   if(['water','hydro','splash'].includes(effect))for(const [i,m] of this.rings.entries()){
    const u=clamp(progress-i*.13,0,1);m.position.copy(start).lerp(end,u);m.lookAt(end.clone().add(direction));m.scale.setScalar(.16+u*(id===55||id===87||id===134?.7:.3));m.visible=u>0;
   }
   if(effect==='electric')for(const [j,line] of this.bolts.entries()){
    const origin=this.source(j===1?-1:1),positions=line.geometry.attributes.position,tip=origin.clone().lerp(end,progress);
    for(let k=0;k<12;k++){const u=k/11,p=origin.clone().lerp(tip,u),zig=k===0||k===11?0:Math.sin(k*23.4+Math.floor(t*34)*1.7+j)*.18;p.addScaledVector(side,zig);p.y+=Math.cos(k*12.4+j)*zig;positions.setXYZ(k,p.x,p.y,p.z);}
    positions.needsUpdate=true;line.geometry.computeBoundingSphere();line.visible=true;line.material.opacity=fade;
   }
   if(effect==='vine')for(let v=0;v<2;v++){
    const origin=this.source(v?-1:1),tip=origin.clone().lerp(end,progress),points=[];
    for(let k=0;k<=12;k++){const u=k/12,p=origin.clone().lerp(tip,u);p.addScaledVector(side,Math.sin(u*Math.PI)*(v?-.55:.55)*(id===2?1.5:1));p.y+=Math.sin(u*Math.PI)*(.4+Math.sin(t*10+v)*.14);points.push(p);}
    for(let k=0;k<12;k++)this.segment(this.vines[v*12+k],points[k],points[k+1],.045);
   }
   if(this.beams.length){const tip=start.clone().lerp(end,progress);this.segment(this.beams[0],start,tip,effect==='solar'?.16:.045);this.segment(this.beams[1],start,tip,effect==='solar'?.075:.018);}
  }
  // The burst and defender's recoil use the same impact marker.
  if(t>=a.impact){
   const age=clamp((t-a.impact)/.3,0,1),center=end.clone();
   for(const [i,m] of this.impact.entries()){
    m.visible=age<1;m.position.copy(center);m.lookAt(start);
    if(!i)m.scale.setScalar(.18+age*.72);
    else{const angle=(i-1)*Math.PI/4;m.position.addScaledVector(side,Math.cos(angle)*(.2+age*.7));m.position.y+=Math.sin(angle)*(.2+age*.7);m.rotateZ(-angle);m.scale.set(.035,.19*(1-age)+.01,.035);}
   }
   if(['rock','splash','water','hydro'].includes(effect))for(const [i,m] of this.rings.entries()){
    m.visible=age<1;m.position.copy(end);m.position.y=this.target.getWorldPosition(new V()).y+.04+i*.035;m.rotation.set(Math.PI/2,0,0);m.scale.setScalar(.2+age*(1.1+i*.22));
   }
  }
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.scene.remove(this.group);this.group.clear();for(const m of [...this.materials,...this.disposables])m.dispose();}
}
