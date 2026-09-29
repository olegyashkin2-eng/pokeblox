// Cubic sculptures rebuilt from the Pokémon Quest image references listed in MODEL-REFERENCES.md.
// Faces, chamfers and silhouettes are all geometry: one material / draw call per Pokémon.
import * as THREE from 'three';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {QUEST_FACES} from './quest-faces.mjs';
const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0});
const cache=new Map(),V=THREE.Vector3;

// Six flat faces, twelve narrow edge chamfers and eight corner triangles.
// The broad planes stay perfectly flat; the small chamfers catch the light.
function chamferBox(w,h,d,r){
 const a=[w/2,h/2,d/2],q=a.map(v=>v-r),p=[];
 function polygon(v){const normal=new V().subVectors(new V(...v[1]),new V(...v[0])).cross(new V().subVectors(new V(...v[2]),new V(...v[0])));const center=v.reduce((o,x)=>o.add(new V(...x)),new V());if(normal.dot(center)<0)v.reverse();for(let j=1;j<v.length-1;j++)p.push(...v[0],...v[j],...v[j+1]);}
 for(let axis=0;axis<3;axis++)for(const s of [-1,1]){const u=(axis+1)%3,v=(axis+2)%3;polygon([[-1,-1],[1,-1],[1,1],[-1,1]].map(([su,sv])=>{const t=[0,0,0];t[axis]=s*a[axis];t[u]=su*q[u];t[v]=sv*q[v];return t;}));}
 for(let axis=0;axis<3;axis++){const u=(axis+1)%3,v=(axis+2)%3;for(const su of [-1,1])for(const sv of [-1,1])polygon([[-1,0],[1,0],[1,1],[-1,1]].map(([s,k])=>{const t=[0,0,0];t[axis]=s*q[axis];t[u]=su*(k?q[u]:a[u]);t[v]=sv*(k?a[v]:q[v]);return t;}));}
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1])polygon([[sx*a[0],sy*q[1],sz*q[2]],[sx*q[0],sy*a[1],sz*q[2]],[sx*q[0],sy*q[1],sz*a[2]]]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
export function questModel(id){
 if(cache.has(id))return cache.get(id).clone();
 if(!QUEST_FACES[id])throw Error('Missing Quest reference '+id);
 const pieces=[],cream='#f7e89f',white='#f2f0ed',ink='#292528';
 const c=({54:'#f9df7b',76:'#605e55',136:'#f0804c'})[id]??QUEST_FACES[id].color;
 function add(g,color,x=0,y=0,z=0,rx=0,ry=0,rz=0){
  if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}g.deleteAttribute('uv');g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);
  const col=new THREE.Color(color),data=new Float32Array(g.attributes.position.count*3);for(let j=0;j<data.length;j+=3){data[j]=col.r;data[j+1]=col.g;data[j+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(data,3));pieces.push(g);
 }
 function b(color,x,y,z,w,h,d,rx=0,ry=0,rz=0,r=.018){r=Math.min(r,w*.12,h*.12,d*.12);add(r>0?chamferBox(w,h,d,r):new THREE.BoxGeometry(w,h,d),color,x,y,z,rx,ry,rz);}
 // Thin, flat colour patches instead of protruding eyeballs.
 function patch(color,x,y,z,w,h){add(new THREE.PlaneGeometry(w,h),color,x,y,z);}
 function face(which,x,y,z,w,h,ry=0){for(const [px,py,pw,ph,col] of QUEST_FACES[which].rects){const dx=((px+pw/2)/48-.5)*w;add(new THREE.PlaneGeometry(pw*w/48+.00003,ph*h/48+.00003),col,x+dx*Math.cos(ry),y+(.5-(py+ph/2)/48)*h,z-dx*Math.sin(ry),0,ry);}}
 function feet(color,x,z1,z2=null,w=.25,h=.22,d=.3){for(const side of [-1,1])for(const z of z2===null?[z1]:[z1,z2])b(color,side*x,h/2,z,w,h,d);}
 function line(color,points,width=.05,depth=width){for(let i=1;i<points.length;i++){const a=new V(...points[i-1]),v=new V(...points[i]).sub(a),center=a.addScaledVector(v,.5);const g=chamferBox(width,v.length()+width*.15,depth,Math.min(.007,width*.15));g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),v.normalize()));add(g,color,...center.toArray());}}
 function slab(color,points,z,depth=.1){const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p)));add(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1}),color,0,0,z-depth/2);}
 function collar(color,y=.79,z=.42,w=.9){b(color,0,y-.12,z+.16,w,.39,.44);for(const s of [-1,1]){b(color,s*(w/2-.04),y+.08,z,.23,.45,.5);b(color,s*(w/2+.045),y+.19,z-.08,.17,.22,.3);}}
 function ear(color,x,y,z,angle,height=.66,width=.2){b(color,x,y,z,width,height,.17,0,0,angle);b(ink,x,y+.025,z+.088,width*.53,height*.73,.009,0,0,angle,0);}
 if(id===25){
  // Quest Pikachu is a low, long cube on four tiny feet.
  b(c,0,.58,-.08,1.04,.78,1.42);face(id,0,.58,.633,1.005,.755);feet(c,.36,.4,-.57,.25,.21,.29);
  for(const s of [-1,1]){b(c,s*.32,1.13,.32,.19,.53,.2);b(ink,s*.32,1.48,.32,.192,.17,.202);}
  for(const z of [-.3,-.57])b('#966331',0,.975,z,1.01,.012,.14,0,0,0,0);
  slab('#99703a',[[.05,.35],[.2,.35],[.2,.75],[.43,.75],[.43,.92],[.06,.92]],-.79,.12);
  slab(c,[[.18,.7],[.49,.7],[.49,.95],[.8,.95],[.8,1.38],[.5,1.38],[.5,1.1],[.18,1.1]],-.82,.14);
 }else if(id===26){
  b(c,0,.67,-.03,.87,.91,.69);b(cream,0,.66,.325,.6,.82,.035);b(c,0,1.28,.06,1.04,.83,.76);face(id,0,1.28,.443,1.005,.8);
  feet('#8c652d',.33,.21,null,.3,.15,.41);for(const s of [-1,1]){b(c,s*.43,.63,.37,.23,.53,.21);b('#876127',s*.43,.41,.37,.234,.12,.214);b(c,s*.47,1.94,.035,.25,.57,.18,0,0,-s*.65);b('#977034',s*.57,2.04,.025,.25,.64,.17,0,0,-s*.65);b(cream,s*.52,1.97,.12,.13,.36,.025,0,0,-s*.65);b('#997239',s*.67,1.87,.04,.12,.19,.18);}
  line('#694b29',[[0,.39,-.35],[0,.39,-.76],[0,1.26,-.76],[0,1.26,-.99]],.065);
  slab('#ffdb6d',[[-.11,1.1],[.19,1.1],[.19,1.5],[.08,1.5],[.08,1.82],[-.17,1.82],[-.17,1.35]],-1,.13);
 }else if([133,134,135,136].includes(id)){
  b(c,0,.62,-.15,.79,.75,1.1);feet(c,.26,.32,-.54,.245,.31,.3);b(c,0,1.12,.39,.84,.74,.71);face(id,0,1.12,.748,.81,.71);
  if(id!==134){for(const s of [-1,1])ear(c,s*.46,1.73,.31,-s*.58,id===135?.81:.69,.22);collar(id===135?white:cream,.72,.35,id===136?1.0:.92);}
  if(id===133){b(c,0,1,-.85,.48,.62,.43,-.47);b(cream,0,1.28,-.99,.48,.26,.43,-.47);}
  if(id===136){b(cream,0,1.45,.4,.38,.19,.62);b(cream,0,1.56,.17,.25,.16,.28);b(cream,0,1.06,-.88,.63,.86,.58,-.32);b(cream,0,1.47,-1.02,.39,.23,.43,-.32);}
  if(id===135){for(const s of [-1,1])for(let j=0;j<3;j++)b(c,s*(.35+j*.11),.97-j*.13,-.57-j*.09,.2,.15,.72,0,s*.3,0);for(const s of [-1,1]){b(white,s*.2,.45,.58,.16,.28,.22);b(c,s*.44,.92,.38,.2,.16,.22);}b(c,0,.97,-.73,.23,.19,.58);}
  if(id===134){
   // White rectangular neck ruff, horizontal ear fins, a tall forked tail.
   b('#ebebf4',0,.62,.35,1.14,.2,.5);for(const s of [-1,1]){b('#ebebf4',s*.47,.95,.24,.22,.83,.3);b('#ebebf4',s*.33,1.39,.2,.47,.18,.26);b(cream,s*.63,1.16,.35,.52,.37,.07);b('#247b99',s*.63,1.38,.35,.58,.09,.09);for(let j=0;j<3;j++)b('#ffefb6',s*.64,1.05+j*.09,.392,.48,.026,.007,0,0,0,0);}
   b('#237d9b',0,1.65,.26,.115,.48,.12);b(c,0,.64,-.84,.28,.24,.55);b(c,0,1.12,-1.02,.26,.99,.29);b(c,0,1.74,-1.02,.62,.35,.25);for(const s of [-1,1])b(c,s*.2,1.96,-1.02,.23,.26,.25);for(let j=0;j<3;j++)b('#246984',0,1.11,-.1-j*.22,.12,.21,.14);
  }
 }else if([1,2,3].includes(id)){
  const wide=id===3?1.39:1.13,deep=id===3?1.61:1.32;
  b(c,0,.65,-.08,wide,.84,deep);face(id,0,.65,deep/2-.077,wide-.045,.8);feet(c,wide*.34,.34,-.52,wide*.24,.3,.34);
  for(const s of [-1,1]){b(c,s*wide*.34,1.105,.32,.26,.21,.3);b('#358b60',s*wide*.43,.38,.25,.12,.15,.2);b('#32855c',s*wide*.36,.16,.518,.13,.13,.018,0,0,0,0);}
  const leaf=id===1?'#489f59':'#468c59';
  if(id===1){b(leaf,0,1.13,-.27,.91,.4,.86);b('#62b570',0,1.4,-.27,.5,.2,.48);b('#62b570',0,1.55,-.27,.22,.18,.22);for(const s of [-1,1])b('#438d51',s*.26,1.33,-.28,.13,.23,.6);}
  else{
   b(leaf,0,1.11,-.26,wide+ .18,.18,.65);b(leaf,0,1.14,-.26,.58,.18,deep+.2);for(const s of [-1,1]){b('#66a96d',s*.45,1.15,-.67,.33,.13,.52,0,s*.45);b('#66a96d',s*.42,1.15,.13,.34,.13,.5,0,-s*.45);}
   if(id===2){b('#db7897',0,1.48,-.25,.53,.55,.53);b('#e69bae',0,1.82,-.25,.28,.2,.29);}
   else{b('#95816a',0,1.55,-.28,.38,.91,.4);b('#df8296',0,1.94,-.28,1.83,.23,.64);b('#df8296',0,1.94,-.28,.62,.23,1.83);for(const s of [-1,1])for(const t of [-1,1])b('#df8296',s*.57,1.9,-.28+t*.54,.47,.2,.47);b('#f2d480',0,2.08,-.28,.49,.19,.5);for(const x of [-.69,-.4,.4,.69])for(const z of [-.28])b('#f7d9b4',x,2.066,z,.12,.008,.13,0,0,0,0);}
  }
 }else if([4,5,6].includes(id)){
  const w=id===6?.94:.72;
  b(c,0,.75,0,w,1.13,.68);b('#fff0b9',0,.72,.351,w*.64,.89,.026);b(c,0,1.55,.12,w+.12,.73,.75);face(id,0,1.55,.498,w+.085,.696);feet(c,w*.32,.19,null,.28,.22,.43);
  for(const s of [-1,1]){b(c,s*(w/2+.11),.91,.055,.24,.39,.3);if(id!==4)b(c,s*(w*.31),2.07,-.06,.2,.35,.22,0,0,-s*.12);}
  b(c,0,.39,-.56,.31,.26,.64);b(c,0,.55,-.94,.25,.49,.29);b('#f89743',0,.89,-.97,.4,.4,.29);b('#ffdb69',0,.94,-.807,.26,.27,.04);b('#ffdb69',-.07,1.13,-.94,.16,.18,.25);b('#ed7138',.13,1.14,-.98,.13,.2,.24);
  if(id===6){
   for(const s of [-1,1]){b(c,s*.76,1.49,-.31,.18,.92,.18,0,0,-s*.2);b(c,s*1.09,1.86,-.31,.72,.18,.18,0,0,-s*.22);b('#2e8c9e',s*1.04,1.38,-.36,.66,.74,.09);b('#2e8c9e',s*1.35,1.25,-.36,.16,.52,.09);b(c,s*1.43,1.49,-.31,.13,.67,.16);b(c,s*1.16,1.17,-.3,.12,.55,.15);b(c,s*.84,1.07,-.3,.12,.36,.15);}
  }
 }else if([7,8,9].includes(id)){
  const w=id===9?1.24:.91;
  b('#f4eee2',0,.73,-.13,w+.05,1.07,.7);b(id===9?'#958b65':'#946b52',0,.76,-.27,w,1.03,.75);
  b('#e7d5a3',0,.76,.275,w*.88,.94,.26);for(let j=0;j<3;j++)b('#bda976',0,.43+j*.29,.413,w*.85,.031,.007,0,0,0,0);b('#bda976',0,.72,.414,.033,.84,.008,0,0,0,0);
  b(c,0,1.44,.2,id===9?.98:.85,.69,.79);face(id,0,1.44,.598,id===9?.945:.815,.657);feet(c,w*.32,.16,null,.32,.23,.43);
  for(const s of [-1,1]){b(c,s*(w/2+.12),.88,.12,.3,.32,.38);if(id===8){b('#cddcee',s*.4,1.98,.07,.25,.56,.18,0,0,-s*.3);b('#b1c7e1',s*.45,2.03,.17,.1,.29,.015,0,0,-s*.3);}}
  if(id===8){b('#d7e2f4',0,.46,-.91,.55,.2,.63);b('#d7e2f4',0,.79,-1.12,.55,.66,.2);b('#d7e2f4',0,1.06,-.92,.55,.16,.53);b('#d7e2f4',0,.88,-.69,.55,.29,.16);}
  else b(c,0,.42,-.82,.29,.31,.49);
  if(id===9)for(const s of [-1,1]){b('#65666a',s*.53,1.44,-.3,.45,.55,.48);b('#d3d8df',s*.54,1.74,.08,.25,.25,1.1,-.14);b('#45484e',s*.54,1.82,.625,.16,.15,.022,-.14);}
 }else if([54,55].includes(id)){
  b(c,0,.71,-.04,.83,1.04,.76);b(c,0,1.43,.09,.99,.8,.81);feet(id===54?'#d9cda7':c,.31,.24,null,.37,.16,.49);
  if(id===54){
   // The icon includes a blue backdrop behind the hair; only its head crop is used.
   face(id,0,1.42,.498,.955,.765);
   b('#e2cea0',0,1.14,.65,.57,.22,.42);for(const s of [-1,1])b('#b5a382',s*.1,1.25,.74,.037,.01,.074,0,0,0,0);
   for(const s of [-1,1])b(c,s*.51,.79,.05,.25,.53,.3);for(const j of [-1,0,1])b('#514d48',j*.14,1.97,.02,.074,.42,.085,0,0,-j*.42);
  }else{
   face(id,0,1.43,.498,.955,.765);b('#ecdeb3',0,1.15,.63,.65,.2,.31);patch('#8c7472',0,1.15,.789,.49,.09);
   for(const j of [-1,0,1])b(c,j*.28,1.99,-.02,.19,.47,.24,0,0,-j*.13);
   for(const s of [-1,1]){b(c,s*.55,.88,.02,.34,.43,.28,0,0,s*.22);b(c,s*.65,.63,.12,.38,.19,.38);for(const j of [-1,0,1])b(white,s*.65+j*.105,.61,.34,.07,.09,.11);}
  }
  b(c,0,.41,-.68,.27,.25,.62);b(c,0,.51,-.96,.19,.19,.22);
 }else if([60,61,62].includes(id)){
  b(c,0,.83,0,1.1,1.1,.82);face(id,0,.83,.413,1.065,1.065);feet(c,.32,.08,null,.29,.29,.36);
  if(id===60){b('#b9e1f0',0,.65,-.9,.07,.58,.9);b('#74b5d5',0,.65,-.68,.075,.31,.49);}
  else{for(const s of [-1,1]){b(c,s*.34,1.44,.07,.32,.22,.46);b(c,s*.7,.8,.04,.37,.25,.29);b(white,s*.96,.82,.14,id===62?.45:.36,id===62?.43:.36,.39);for(let j=0;j<3;j++)b('#d1d0d4',s*.96-.095+j*.095,.94,.338,.022,.1,.007,0,0,0,0);}}
 }else if([74,75,76].includes(id)){
  const w=id===74?1.03:id===75?1.23:1.43,h=id===74?.89:id===75?1.14:1.32;
  b(c,0,.3+h/2,0,w,h,id===76?1.3:.92);face(id,0,.3+h/2,(id===76?.65:.46)+.003,w-.033,h-.033);
  if(id===74)b('#aeaea5',0,1.23,-.03,.57,.16,.56);
  if(id===75){b('#989987',-.24,1.51,.04,.34,.17,.49);b('#afb09d',.28,1.48,-.09,.32,.14,.55);}
  if(id===76){
   for(const x of [-.45,0,.45])for(const z of [-.44,0,.44])b('#8e8f82',x,1.635,z,.38,.015,.37,0,0,0,0);
   for(const s of [-1,1])for(let j=0;j<3;j++)for(let k=0;k<3;k++)b('#8e8f82',s*.721,.55+j*.39,-.45+k*.44,.015,.31,.36,0,0,0,0);
   feet('#98948a',.49,.15,null,.38,.31,.49);
  }else if(id===75)feet(c,.42,.15,null,.33,.32,.38);
  for(const s of [-1,1])for(let j=0;j<(id===75?2:1);j++){
   const y=id===76?.75:1.03-j*.41;
   b(id===76?'#8b8980':c,s*(w/2+.27),y,0,.55,.24,.29);
   b(id===76?'#8b8980':c,s*(w/2+.49),y+(id===76?.02:.2),.03,.34,id===76?.32:.54,.37);
   for(let k=0;k<3;k++)b('#c4c0b5',s*(w/2+.49)+(k-1)*.095,y+(id===76?.02:.38),.224,.063,.13,.019,0,0,0,0);
  }
 }else if([86,87].includes(id)){
  const length=id===87?1.83:1.46;
  b(c,0,.53,-.26,.89,.65,length);b(c,0,.99,.41,.87,.75,.72);face(id,0,.99,.773,.838,.717);
  b(c,0,1.51,.34,.16,.31,.19);for(const s of [-1,1]){b(c,s*.62,.29,.02,.44,.13,.49,0,s*.2);b(c,s*.23,.66,-.3-length/2,.5,.15,.58,0,-s*.55);}
  if(id===86){b('#f5eccb',0,.7,.86,.51,.24,.13);b('#dca9be',0,.58,.94,.3,.19,.1);for(const s of [-1,1])b(white,s*.19,.58,.94,.075,.15,.08);}
 }else if(id===90){
  b('#867cad',0,.35,-.04,1.24,.27,1.05);b('#343237',0,.67,.02,1.08,.43,.83);b(c,0,1,-.07,1.25,.37,1.09);face(id,0,.7,.481,1.21,.95);
  for(const x of [-.4,0,.4])b('#8176a8',x,1.19,-.1,.066,.012,1.03,0,0,0,0);
  b('#deb1bd',0,.32,.81,.25,.13,.73);b('#bf919f',0,.391,.84,.033,.007,.61,0,0,0,0);
 }else if([116,117].includes(id)){
  b(c,0,.79,-.06,.57,.86,.59);b('#e6dcae',0,.71,.24,.37,.63,.032);for(let j=0;j<3;j++)b('#cabf96',0,.53+j*.19,.26,.35,.021,.008,0,0,0,0);
  b(c,0,1.43,.03,.89,.75,.7);face(id,0,1.43,.383,.855,.715);
  b(c,0,1.19,.56,.3,.29,.43);b('#16364b',0,1.19,.782,.205,.195,.009,0,0,0,0);
  for(const s of [-1,1]){b('#b9dcdf',s*.41,.79,-.22,.35,.44,.08);for(let j=0;j<3;j++)b('#85bdce',s*.44,.66+j*.12,-.173,.3,.02,.01,0,0,0,0);}
  if(id===116){for(const j of [-1,0,1])b(c,j*.23,1.95,-.02,.16,.3,.19,0,0,-j*.12);}
  else{for(const s of [-1,1])for(let j=0;j<3;j++){b(c,s*(.45+j*.06),1.78-j*.22,-.07,.29,.14,.3,0,0,s*.21);b(c,s*.34,1.88,-.14,.18,.4,.2,0,0,-s*.3);}}
  // A rectangular spiral tail is readable from either side.
  b(c,0,.26,-.23,.22,.27,.51);b(c,0,.39,-.57,.22,.48,.19);b(c,0,.66,-.43,.22,.16,.42);b(c,0,.54,-.2,.22,.24,.14);
 }else if([118,119,129].includes(id)){
  const d=id===129?1.55:1.18,w=id===129?.8:.79;
  b(c,0,.79,-.1,w,.83,d);
  if(id===129||id===119){
   // Magikarp's big eye and whisker are on the sides, as in the reference.
   for(const s of [-1,1])face(id,s*(w/2+.003),.79,-.1,d-.04,.79,s*Math.PI/2);
   b('#f0bd9e',0,.75,.72,.55,.53,.12);b('#a67368',0,.75,.787,.38,.36,.008,0,0,0,0);
   if(id===129)for(const s of [-1,1])line('#f5d789',[[s*.2,.71,.8],[s*.4,.71,.8],[s*.4,.36,.8],[s*.64,.36,.8]],.064);
  if(id===119)b('#e5debe',0,1.36,.28,.14,.44,.15);
  }else{
   face(id,0,.79,d/2-.097,w-.025,.8);b('#e5debe',0,1.36,.28,.14,.44,.15);
   for(const s of [-1,1])for(let j=0;j<3;j++)b(id===119?'#444441':'#dc967e',s*(w/2+.003),.7+j*.17,-.18+(j%2)*.32,.008,.12,.23,0,0,0,0);
  }
  for(const s of [-1,1]){b(id===129?'#f2d68e':white,s*.61,.7,-.14,.56,.09,.6,0,s*.17);b(id===129?'#f3cda2':white,s*.23,.79,-.91,.48,.64,.1,0,0,-s*.34);}
  b(id===129?'#eccc73':c,0,1.3,-.14,.08,.25,.6);for(let j=0;j<3;j++)b(id===129?'#eccc73':c,0,1.49,-.35+j*.2,.08,.19,.11);
 }else throw Error('Missing Quest sculpture '+id);
 const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const model=new THREE.Mesh(geometry,material);model.name='Quest-reference-'+id;model.castShadow=true;model.receiveShadow=true;cache.set(id,model);return model.clone();
}
