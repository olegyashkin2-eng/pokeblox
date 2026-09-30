import * as THREE from 'three';
import {ISLAND3_SPAWNS,ISLAND4_SPAWNS,EXTRA_LANDMARKS,walkable,islandRadius} from './data.mjs';

export function buildExtraBiome(world){
 const forest=world.island===4,spawns=forest?ISLAND4_SPAWNS:ISLAND3_SPAWNS;
 let seed=forest?84931:19281;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.9});
 const mesh=(geometry,color,x,y,z,scale=[1,1,1])=>{const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;world.environment.add(m);return m;};
 const clear=(x,z)=>walkable(x,z,world.island)&&Math.hypot(x,z)<islandRadius(world.island)-6&&Math.hypot(x,z-23)>11&&Math.hypot(x,z+52)>7&&Math.abs(x)>3.8&&spawns.every(p=>Math.hypot(x-p.x,z-p.z)>4.5)&&world.pickupLocations().every(p=>Math.hypot(x-p.x,z-p.z)>3.8);
 const points=[];
 for(let i=0;i<(forest?690:125);i++){const x=(rand()-.5)*(forest?170:119),z=(rand()-.5)*(forest?170:119);if(clear(x,z))points.push({x,z,s:(forest?1.1:.75)+rand()*(forest?1.5:.85),r:rand()*Math.PI*2});}
 const obj=new THREE.Object3D();
 if(forest){
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.36,4,8),material(0x8d7180),points.length);
  const crowns=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),material(0xffffff),points.length*3);
  trunk.castShadow=crowns.castShadow=true;trunk.receiveShadow=crowns.receiveShadow=true;
  points.forEach((p,i)=>{
   const y=world.ground(p.x,p.z);obj.position.set(p.x,y+1.9*p.s,p.z);obj.scale.setScalar(p.s);obj.rotation.set(0,p.r,0);obj.updateMatrix();trunk.setMatrixAt(i,obj.matrix);
   for(let j=0;j<3;j++){obj.position.set(p.x+(j-1)*1.05*p.s,y+(4.5+(j===1?.6:0))*p.s,p.z+(j===1?.3:-.15)*p.s);obj.scale.set(1.7*p.s,1.6*p.s,1.65*p.s);obj.updateMatrix();crowns.setMatrixAt(i*3+j,obj.matrix);crowns.setColorAt(i*3+j,new THREE.Color(p.x<0?[0xf6bbd1,0xe6a1c8,0xf5c9de][i%3]:[0xf3d78a,0xffe5a5,0xecc56d][i%3]));}
   world.obstacles.push({x:p.x,z:p.z,r:.42*p.s});
  });world.environment.add(trunk,crowns);
  const stemGeo=new THREE.CylinderGeometry(.1,.14,.6,7),capGeo=new THREE.SphereGeometry(.65,10,6,0,Math.PI*2,0,Math.PI/2);
  for(let i=0;i<64;i++){const x=-60+rand()*110,z=-67+rand()*128;if(!walkable(x,z,4)||Math.hypot(x,z-23)<10)continue;const y=world.ground(x,z),s=.35+rand()*.85;mesh(stemGeo,0xeae1cf,x,y+s*.3,z,[s,s,s]);mesh(capGeo,i%2?0xd993c3:0xf5ca81,x,y+s*.6,z,[s,s*.7,s]);}
  for(const [x,z] of [[-8,-62],[-44,36]]){const ring=mesh(new THREE.TorusGeometry(2.5,.1,6,48),0xc7b2e8,x,world.ground(x,z)+.08,z);ring.rotation.x=Math.PI/2;}
  world.addPath([[0,8],[-19,9],[-41,23],[-47,42],[-59,30]]);world.addPath([[0,-20],[-16,-34],[-5,-60],[25,-60],[53,-41]]);world.addPath([[0,35],[20,43],[48,46]]);
 }else{
  const cactus=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3,2.2,4,8),material(0x74a97f),points.length*3);
  const flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.2,8,6),material(0xf4b38c),points.length);
  cactus.castShadow=true;
  points.forEach((p,i)=>{const y=world.ground(p.x,p.z);for(let j=0;j<3;j++){obj.position.set(p.x+(j===0?0:j===1?-.62:.62)*p.s,y+(j===0?1.5:j===1?1.1:1.5)*p.s,p.z);obj.rotation.set(0,p.r,j===0?0:j===1?-.32:.32);obj.scale.set(p.s*(j?.67:1),p.s*(j?.55:1),p.s*(j?.67:1));obj.updateMatrix();cactus.setMatrixAt(i*3+j,obj.matrix);}obj.position.set(p.x,y+2.88*p.s,p.z);obj.rotation.set(0,0,0);obj.scale.setScalar(p.s);obj.updateMatrix();flowers.setMatrixAt(i,obj.matrix);world.obstacles.push({x:p.x,z:p.z,r:.95*p.s});});world.environment.add(cactus,flowers);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*70,z=Math.sin(a)*70;for(let j=0;j<3;j++)mesh(new THREE.CylinderGeometry(5-j,6-j,3.5,7),[0xc18764,0xdba075,0xe7b585][j],x,j*3.2-1,z,[1.2,1,1]);}
  const arena=mesh(new THREE.CylinderGeometry(9,9,.18,48),0xd2a26f,0,world.ground(0,-42)+.1,-42);arena.castShadow=false;
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a)*10,z=-42+Math.cos(a)*10;mesh(new THREE.CylinderGeometry(.55,.7,1,8),0xba8969,x,world.ground(x,z)+.5,z);}
  const sign=mesh(new THREE.BoxGeometry(6,1.55,.18),0xf0d3a3,-8,world.ground(-8,8)+1.8,8);
  mesh(new THREE.CylinderGeometry(.12,.14,2.1,7),0x946e4f,-8,world.ground(-8,8)+.8,8);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle='#66523d';c.font='bold 35px sans-serif';c.textAlign='center';c.fillText('Это сделал не я,',384,76);c.fillText('это был кактус!',384,130);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(5.8,1.45),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true}));label.position.z=.1;sign.add(label);
 }
 for(const l of EXTRA_LANDMARKS[world.island].filter(l=>!l.label.includes('лагерь'))){const marker=mesh(new THREE.CylinderGeometry(.09,.12,1.6,6),0x987c65,l.x-3,world.ground(l.x-3,l.z)+.8,l.z);marker.castShadow=false;}
}
