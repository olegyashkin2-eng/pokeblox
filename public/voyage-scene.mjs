import * as THREE from 'three';
import {disposePokemon} from './classic-models.mjs';
import {ISLAND_THEME} from './expansion.mjs';

// Cosmetic journey only. The destination is saved before this scene starts,
// so closing the tab in the middle never loses progress or repeats rewards.
export class VoyageScene{
 constructor(lapras,trainer,{from=1,to=2,aspect=1}={}){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xb7deed);this.scene.fog=new THREE.Fog(0xb7deed,40,110);
  this.camera=new THREE.PerspectiveCamera(45,aspect,.1,160);this.time=0;this.duration=6.5;
  this.scene.add(new THREE.HemisphereLight(0xedfaff,0x659ca9,2.5));const sun=new THREE.DirectionalLight(0xfff1d4,3);sun.position.set(12,20,10);this.scene.add(sun);
  this.lapras=lapras;this.boat=new THREE.Group();this.boat.add(lapras);this.scene.add(this.boat);lapras.rotation.y=Math.PI/2;
  const rider=trainer.clone(true);rider.visible=true;rider.rotation.set(0,Math.PI/2,0);rider.position.set(-.8,1,0);rider.scale.setScalar(.72);
  rider.traverse(o=>{if(o.name==='trainer-leg')o.rotation.x=-1.25;if(o.name==='trainer-arm')o.rotation.x=-.5;if(o.isMesh&&!o.castShadow)o.visible=false;});this.boat.add(rider);
  this.owned=[];const mesh=(geo,color)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.65}));this.owned.push(m);return m;};
  const ocean=mesh(new THREE.PlaneGeometry(240,180,1,1),0x58bed4);ocean.rotation.x=-Math.PI/2;ocean.position.y=.28;this.scene.add(ocean);
  this.waves=[];for(let i=0;i<48;i++){const wave=mesh(new THREE.TorusGeometry(.8+(i%5)*.13,.025,3,14,Math.PI*.8),0xc0f2f0);wave.rotation.x=-Math.PI/2;wave.position.set((i%8)*7-24,.3,Math.floor(i/8)*8-22);this.scene.add(wave);this.waves.push(wave);}
  const miniature=(id,x)=>{const g=new THREE.Group();const base=mesh(new THREE.CylinderGeometry(12,15,2,28),0xe3d3a2);g.add(base);const grass=mesh(new THREE.CylinderGeometry(11.5,12,.3,28),id===3?0xdbb783:id===4?0xb6cf9b:0x91b887);grass.position.y=1.1;g.add(grass);for(let i=0;i<8;i++){const tree=mesh(id===3?new THREE.CapsuleGeometry(.4,2,3,7):new THREE.SphereGeometry(1.5,8,6),id===3?0x75a47e:id===4?(i%2?0xf4b5d7:0xf5d983):0x77a776);tree.position.set(Math.sin(i*2.4)*8,2.2,Math.cos(i*2.4)*7);g.add(tree);}g.position.set(x,-.2,-15);this.scene.add(g);return g;};
  this.departure=miniature(from,-28);this.arrival=miniature(to,45);
  for(const [id,g] of [[from,this.departure],[to,this.arrival]]){
   if(id<5)continue;g.children[1].material.color.set(ISLAND_THEME[id].ground);
   // Replace the little forest with the destination's silhouette.
   if([5,6,9,10].includes(id))for(const tree of g.children.slice(2))tree.visible=false;
   const add=(geo,color,x,y,z)=>{const m=mesh(geo,color);m.position.set(x,y,z);g.add(m);return m;};
   if(id===5){add(new THREE.BoxGeometry(12,5,6),0x7f949c,0,3.6,0);for(const x of [-4,4])add(new THREE.CylinderGeometry(.8,1,10,10),0x73858e,x,6,-2);}
   if(id===6)for(let i=0;i<8;i++){const a=i*Math.PI/4;add(new THREE.CylinderGeometry(.6,.8,3+i%3,6),0xb5a8b3,Math.sin(a)*7,3,Math.cos(a)*7);}
   if(id===8)for(const tree of g.children.slice(4))tree.visible=false;
   if(id>=9){add(new THREE.CylinderGeometry(1.8,7,9,24),0x6d596e,0,5,-1);const crater=add(new THREE.CircleGeometry(1.75,24),0xff965e,0,9.55,-1);crater.rotation.x=-Math.PI/2;crater.material.emissive.set(0xff7840);crater.material.emissiveIntensity=.7;}
  }
  this.update(0,aspect);
 }
 update(dt,aspect){this.time=Math.min(this.duration,this.time+Math.max(0,dt));const p=this.time/this.duration;this.camera.aspect=aspect;this.camera.fov=aspect<1?62:45;this.camera.updateProjectionMatrix();this.boat.position.set(Math.sin(p*Math.PI)*.6,Math.sin(this.time*2)*.1,0);this.boat.rotation.z=Math.sin(this.time*2)*.015;this.lapras.userData.animator.update(dt,1.1);this.departure.position.x=-28-p*22;this.arrival.position.x=45-p*28;for(const w of this.waves){w.position.x-=dt*4;if(w.position.x<-30)w.position.x+=60;}this.camera.position.set(6,4.8,aspect<1?11:9);this.camera.lookAt(0,1.3,0);return p>=1;}
 dispose(){disposePokemon(this.lapras);for(const m of this.owned){m.geometry.dispose();m.material.dispose();}this.scene.clear();}
}
