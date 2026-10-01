import * as THREE from 'three';
import {EXPANSION_SPAWNS,NEW_LANDMARKS,VOLCANO_ARENA} from './expansion.mjs';
import {walkable,islandRadius} from './data.mjs';

export function buildExpansionBiome(world){
 const id=world.island,radius=islandRadius(id),spawns=EXPANSION_SPAWNS[id];
 let seed=id*9137;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const mats=new Map(),mat=(color,glow=0)=>{const key=`${color}:${glow}`;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.85,emissive:color,emissiveIntensity:glow}));return mats.get(key);};
 const mesh=(geo,color,x,y,z,scale=[1,1,1],glow=0)=>{const m=new THREE.Mesh(geo,mat(color,glow));m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;world.environment.add(m);return m;};
 const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),rock=new THREE.DodecahedronGeometry(1,0);
 const free=(x,z,r=2)=>walkable(x,z,id)&&Math.hypot(x,z)<radius-6&&Math.hypot(x,z-23)>15+r&&Math.abs(x)>5+r&&spawns.every(p=>Math.hypot(x-p.x,z-p.z)>4+r)&&world.pickupLocations().every(p=>Math.hypot(x-p.x,z-p.z)>3+r);
 const stone=(x,z,size=2,color=0x8e8c99)=>{if(!free(x,z,size))return;mesh(rock,color,x,world.ground(x,z)+size*.4,z,[size,size*.85,size*.8]).rotation.y=rand()*6;world.obstacles.push({x,z,r:size*.65});};
 const sign=(text,x,z)=>{const y=world.ground(x,z);mesh(box,0x806b62,x,y+.8,z,[.14,1.6,.14]);const board=mesh(box,0xe5d3ae,x,y+1.7,z,[3.3,.8,.16]);world.label(board,text);};
 if(id===5){
  // Turbine hall is a backdrop beyond the shore; the switchyard stays open.
  const hall=mesh(box,0x667d88,-24,7,-74,[29,16,11]);hall.rotation.y=.12;
  for(let i=0;i<7;i++){mesh(box,0x304b61,-36+i*4,8,-67.8,[2.3,9,.15]);mesh(box,0xeac76c,-36+i*4,8,-67.6,[.15,8,.12],.22);}
  for(const x of [-39,-8]){mesh(new THREE.CylinderGeometry(1.8,2,20,12),0x85939b,x,12,-77);mesh(new THREE.TorusGeometry(2.1,.2,7,24),0xd4ba73,x,21,-77).rotation.x=Math.PI/2;}
  for(let i=0;i<15;i++){const a=i*2.4,x=Math.cos(a)*(22+i*1.8),z=Math.sin(a)*(22+i*1.8);if(!free(x,z,2))continue;const y=world.ground(x,z);mesh(box,0x87949c,x,y+.5,z,[3,1,3]);mesh(new THREE.CylinderGeometry(.5,.6,5,10),0x5b6a7d,x,y+3,z);for(let j=0;j<5;j++)mesh(new THREE.TorusGeometry(1,.12,6,20),0xddc576,x,y+1.7+j*.65,z).rotation.x=Math.PI/2;mesh(sphere,0xbff7ff,x,y+5.8,z,[.75,.75,.75],.65);world.obstacles.push({x,z,r:1.6});}
  sign('ÉNERGIE · ЛАПРАС →',4,17);
 }else if(id===6){
  for(let i=0;i<27;i++){const a=i*2.4,r=20+rand()*36,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!free(x,z,2))continue;const y=world.ground(x,z);mesh(new THREE.CylinderGeometry(.7,.9,3+rand()*4,7),0x9a929e,x,y+1.7,z);mesh(box,0xb5a9aa,x,y+3.6,z,[2.4,.45,1.8]).rotation.z=(rand()-.5)*.35;world.obstacles.push({x,z,r:1});}
  for(let i=0;i<35;i++)stone((rand()-.5)*110,(rand()-.5)*110,.5+rand(),0x9e9aa6);
  for(let i=0;i<18;i++){const x=-44+i*4.3,z=-55+Math.sin(i)*2;mesh(new THREE.CylinderGeometry(.2,.3,4+Math.sin(i)*1.4,7),0xd5cab1,x,2,z).rotation.z=.25*Math.sin(i);}
  for(let i=0;i<25;i++){const a=i*2.4,x=Math.sin(a)*45,z=Math.cos(a)*40;if(!free(x,z,.4))continue;mesh(sphere,0xaaa1fb,x,world.ground(x,z)+1.7,z,[.15,.22,.15],1);}
  sign('ДРЕВНИЕ РУИНЫ',-5,14);
 }else if(id===7||id===8){
  const points=[];for(let i=0;i<(id===7?590:65);i++){const x=(rand()-.5)*radius*1.9,z=(rand()-.5)*radius*1.9;if(free(x,z,1.3))points.push({x,z,s:1+rand()*1.4});}
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.4,4.6,7),mat(id===7?0x71825b:0x997951),points.length),crown=new THREE.InstancedMesh(sphere,mat(0x71a572),points.length*2),o=new THREE.Object3D();
  trunk.castShadow=crown.castShadow=true;crown.receiveShadow=true;
  points.forEach((p,i)=>{const y=world.ground(p.x,p.z);o.position.set(p.x,y+2*p.s,p.z);o.scale.set(p.s,p.s,p.s);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);for(let j=0;j<2;j++){o.position.set(p.x+(j-.5)*p.s,y+(4.7+j*.5)*p.s,p.z);o.scale.set(2*p.s,1.55*p.s,1.8*p.s);o.updateMatrix();crown.setMatrixAt(i*2+j,o.matrix);crown.setColorAt(i*2+j,new THREE.Color([0x75a974,0x94bc73,0xc8cc83][i%3]));}world.obstacles.push({x:p.x,z:p.z,r:.42*p.s});});world.environment.add(trunk,crown);
  const flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,6,4),mat(0xffffff),id===8?2500:900);let count=0;
  for(let i=0;i<flowers.count;i++){const x=(rand()-.5)*radius*1.85,z=(rand()-.5)*radius*1.85;if(!walkable(x,z,id)||Math.abs(x)<3||Math.hypot(x,z-23)<12)continue;o.position.set(x,world.ground(x,z)+.18,z);o.scale.setScalar(.6+rand());o.updateMatrix();flowers.setMatrixAt(count,o.matrix);flowers.setColorAt(count,new THREE.Color([0xffdf98,0xf0b4bb,0xd5c2ec,0xf6f4d3][i%4]));count++;}flowers.count=count;world.environment.add(flowers);
  if(id===8){for(let i=0;i<14;i++){const x=-65+i*10,z=-91+Math.sin(i)*5;mesh(rock,0xa4ada5,x,2,z,[4,5+rand()*5,4]);}world.addPath([[0,35],[7,54],[10,80]]);sign('ПРОСТОРНЫЕ ЛУГА',-5,15);}
  else{world.addPath([[0,5],[-24,2],[-35,-40]]);world.addPath([[0,8],[12,-19],[24,-38]]);sign('ЗАПОВЕДНИК',-5,15);}
 }else{
  // The valley and final island share a visible volcano on their northern edge.
  const z=id===10?-70:-77;
  mesh(new THREE.CylinderGeometry(9,32,34,32,1,true),0x675b6c,0,14,z);
  mesh(new THREE.TorusGeometry(9,1.6,8,40),0x3c344c,0,31,z).rotation.x=Math.PI/2;
  mesh(new THREE.CircleGeometry(8.4,40),0xff8250,0,31,z,[1,1,1],.9).rotation.x=-Math.PI/2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;mesh(new THREE.CylinderGeometry(.11,.5,27,6),0xf59b59,Math.cos(a)*17,12,z+Math.sin(a)*17,[1,1,1],.5).rotation.z=Math.cos(a)*.55;}
  for(let i=0;i<70;i++)stone((rand()-.5)*118,(rand()-.5)*116,1+rand()*2,0x716577);
  if(id===10){
   const {x,z}=VOLCANO_ARENA,y=world.ground(x,z);mesh(new THREE.CylinderGeometry(13,14,.6,48),0x463b54,x,y+.1,z);
   const seal=mesh(new THREE.TorusGeometry(11.5,.12,6,64),0xea85ac,x,y+.45,z,[1,1,1],.8);seal.rotation.x=Math.PI/2;
   mesh(new THREE.OctahedronGeometry(1.5),0xc287ff,x,y+3,z,[1,1.4,1],.65);
   for(const side of [-1,1])mesh(box,0x827583,side*4,world.ground(side*4,-2)+.5,-2,[.7,1,28]);
   world.addPath([[0,21],[0,0],[0,-30]]);sign('НЕЧТО-Р · ФИНАЛ',-5,12);
  }else sign('ДОРОГА К ВУЛКАНУ',-5,13);
 }
 for(const l of NEW_LANDMARKS[id].slice(1)){const x=l.x-3,z=l.z;mesh(new THREE.CylinderGeometry(.08,.12,1.4,6),0xa8987d,x,world.ground(x,z)+.7,z);}
}
