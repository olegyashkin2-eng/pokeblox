// Original stylised sculptures. Geometry is merged and cached: one draw call per Pokémon.
import * as THREE from 'three';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.57,metalness:0});
const cache=new Map(),V=THREE.Vector3;
export function questModel(id){
 if(cache.has(id))return cache.get(id).clone();
 const pieces=[],cream='#fff0c6',white='#fffaf0',ink='#202937';
 function add(g,c,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
  if(g.index){const raw=g;g=g.toNonIndexed();raw.dispose();}
  g.deleteAttribute('uv');g.scale(...scale);g.rotateX(rot[0]);g.rotateY(rot[1]);g.rotateZ(rot[2]);g.translate(...pos);
  const color=new THREE.Color(c),a=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3){a[i]=color.r;a[i+1]=color.g;a[i+2]=color.b;}
  g.setAttribute('color',new THREE.BufferAttribute(a,3));pieces.push(g);
 }
 const oval=(c,x,y,z,w,h,d,rz=0)=>add(new THREE.SphereGeometry(1,16,10),c,[x,y,z],[w/2,h/2,d/2],[0,0,rz]);
 function cone(c,a,b,r,tip=0){const v=new V(...b).sub(new V(...a)),g=new THREE.CylinderGeometry(tip,r,v.length(),10,1);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),v.clone().normalize()));add(g,c,new V(...a).add(new V(...b)).multiplyScalar(.5).toArray());}
 function tube(c,points,r=.025){add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new V(...p))),Math.max(8,points.length*4),r,6,false),c);}
 function fin(c,points,depth=.06){const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))shape.lineTo(p[0],p[1]);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1});add(g,c,[0,0,points[0][2]-depth/2]);}
 function eyes(y,z,s=.23,r=.115,iris='#7d4939',angry=false){for(const side of [-1,1]){const x=side*s;oval(ink,x,y,z,r*1.55,r*2.05,.09,side*(angry?-.16:.04));oval(iris,x,y-.025,z+.042,r*1.13,r*1.3,.035);oval(ink,x,y+.012,z+.063,r*.7,r*1.18,.025);oval(white,x-.025,y+.06,z+.078,r*.48,r*.55,.019);oval(white,x+.021,y-.052,z+.076,r*.19,r*.2,.018);if(angry)tube(ink,[[x-side*.09,y+.09,z],[x+side*.07,y+.13,z+.012]],.024);}}
 function smile(y,z,w=.14){tube(ink,[[-w,y+.025,z],[0,y-.015,z+.015],[w,y+.025,z]],.017);}
 function nose(y,z){oval(ink,0,y,z,.105,.072,.07);smile(y-.115,z-.005,.12);}
 function paws(c,x=.28,front=.32,back=null){for(const side of [-1,1])for(const z of back===null?[front]:[front,back]){oval(c,side*x,.28,z,.27,.5,.3);oval(c,side*x,.12,z+.06,.34,.23,.45);for(let j=-1;j<=1;j++)oval(cream,side*x+j*.075,.115,z+.25,.054,.075,.09);}}
 function ear(c,x,y,z,lean=0,inside='#63483c',h=.76,w=.3){oval(c,x,y,z,w,h,.2,lean);oval(inside,x,y+.03,z+.087,w*.53,h*.72,.055,lean);}
 function fur(c,center,r,n=12){for(let i=0;i<n;i++){const a=i*Math.PI*2/n,x=center[0]+Math.cos(a)*r,y=center[1]+Math.sin(a)*r*.65;oval(c,x,y,center[2],.26,.3,.33,a);cone(c,[x,y,center[2]],[x+Math.cos(a)*.17,y+Math.sin(a)*.19,center[2]+.04],.12);}}
 function limb(c,a,b,r=.14){cone(c,a,b,r,r*.8);oval(c,...b,r*2.1,r*2.2,r*2.1);}
 function curl(c,points,r=.13){tube(c,points,r);oval(c,...points.at(-1),r*2,r*2,r*2);}
 if([25,26].includes(id)){
  const c=id===25?'#f8cf35':'#e49b3d';
  oval(c,0,.8,0,.88,1.19,.76);oval(c,0,1.52,.1,1.02,.8,.76);
  oval(c,-.39,1.36,.18,.34,.36,.4);oval(c,.39,1.36,.18,.34,.36,.4);
  eyes(1.56,.468,.25,.103,'#774633');nose(1.42,.507);
  for(const s of [-1,1]){oval('#ed5945',s*.39,1.365,.443,.215,.22,.075);ear(c,s*.35,2.1,.055,-s*.23,c,.89,.22);oval('#29333a',s*.43,2.43,.055,.205,.3,.19,-s*.23);limb(c,[s*.4,1.02,.07],[s*.52,.65,.3],.115);}
  paws(c,.29,.21);if(id===26)oval(cream,0,.76,.35,.65,.83,.18);
  for(const y of [.66,.97])oval('#a56e38',0,y,-.355,.61,.13,.08);
  if(id===25){fin(c,[[.12,.65,-.48],[.38,.9],[.25,1.12],[.69,1.36],[.48,1.66],[1.07,1.97],[1.3,1.58],[.91,1.36],[1.02,1.1],[.54,.85],[.39,.53]],.14);cone('#966539',[.02,.5,-.3],[.28,.68,-.49],.065);}else{curl('#755740',[[.05,.45,-.33],[.65,.42,-.8],[1.09,.85,-.6],[.93,1.3,-.5]],.045);fin('#ffd56a',[[.9,1.13,-.5],[1.3,1.6],[1.07,1.58],[1.15,1.95],[.73,1.5],[.96,1.5]],.08);for(const s of [-1,1])curl('#f5d16a',[[s*.4,2.08,.08],[s*.64,2.25,.08],[s*.71,2.02,.11],[s*.59,1.96,.11]],.07);}
 }else if([133,134,135,136].includes(id)){
  const c={133:'#ad7950',134:'#57bcd0',135:'#efc83e',136:'#e87939'}[id],furColor=id===134?'#edf7e5':cream;
  oval(c,0,.64,-.1,.76,.85,1.17);oval(c,0,1.18,.49,.91,.79,.75);paws(c,.27,.4,-.42);
  oval(id===134?'#abdfe4':c,-.18,1.04,.8,.35,.23,.22);oval(id===134?'#abdfe4':c,.18,1.04,.8,.35,.23,.22);
  eyes(1.27,.821,.247,.129,id===134?'#5b4186':'#9a5435',id===135);nose(1.08,.941);
  if(id!==134){for(const s of [-1,1])ear(c,s*.38,1.83,.4,-s*.31,id===136?'#563c3c':'#513e32',id===135?.97:.92,.34);}
  if(id===133){fur(furColor,[0,.85,.44],.34);curl(c,[[0,.63,-.57],[.18,.79,-.94],[.42,1.13,-1.1]],.23);oval(cream,.46,1.2,-1.11,.43,.46,.44,-.4);cone(cream,[.46,1.26,-1.1],[.57,1.5,-1.11],.16);for(const s of [-1,1])cone(c,[s*.38,1.07,.46],[s*.58,.97,.43],.12);}
  if(id===136){fur(cream,[0,.88,.44],.4,16);for(let i=0;i<6;i++)oval(cream,Math.sin(i*.7)*.18,1.49+i*.045,.44-i*.055,.3,.27,.3);cone(cream,[0,1.65,.22],[.1,1.91,.18],.17);curl(cream,[[0,.67,-.52],[.12,.88,-.93],[.37,1.23,-1.1],[.32,1.58,-1.14]],.29);for(let i=0;i<12;i++){const a=i*2.399,y=.88+i*.06;cone(cream,[.22,y,-1.06],[.22+Math.cos(a)*.36,y+.23,-1.06+Math.sin(a)*.34],.15);}}
  if(id===135){fur(white,[0,.85,.39],.32,14);for(let i=0;i<10;i++){const s=i%2?1:-1;cone(c,[s*.23,.85,-.35+i*.065],[s*.53,1.12,-.54+i*.06],.15);}cone(c,[0,.9,-.56],[0,1.26,-.97],.22);for(const s of [-1,1])for(let j=0;j<3;j++)cone(c,[s*.36,1.15,.44],[s*(.6+j*.035),1.15-j*.105,.35],.1);}
  if(id===134){fur(furColor,[0,.88,.38],.32,10);for(const s of [-1,1]){fin('#6d8fd0',[[s*.3,1.37,.4],[s*.92,1.7],[s*.76,1.15],[s*.39,1.01]],.07);for(let j=0;j<3;j++)tube('#b6deee',[[s*.34,1.22,.46],[s*(.65+j*.1),1.31+j*.15,.46]],.022);}fin('#6d8fd0',[[0,1.5,.1],[-.16,1.79],[0,1.96],[.16,1.79]],.09);curl(c,[[0,.6,-.53],[.16,.46,-.95],[.55,.66,-1.18],[.8,.95,-1.05]],.115);for(const s of [-1,1])oval('#a3dce5',.8+s*.2,1.02,-1.05,.53,.17,.43,s*.4);for(let i=0;i<5;i++)cone('#437b9e',[0,1.01,-.14-i*.15],[0,1.2-i*.035,-.23-i*.16],.075);}
 }else if([1,2,3].includes(id)){
  const c=id===3?'#449c91':'#71c5a6';oval(c,0,.54,-.08,1.04,.82,1.25);oval(c,0,.86,.6,1.12,.78,.86);paws(c,.4,.59,-.42);eyes(.98,.99,.31,.15,'#c65765',id===3);smile(.71,1.018,.29);
  for(const s of [-1,1]){cone(c,[s*.37,1.1,.54],[s*.47,1.47,.52],.17);oval('#288977',s*.34,1.18,.72,.18,.09,.15);oval('#288977',s*.48,.79,.81,.095,.19,.09);oval('#288977',s*.49,.66,-.02,.07,.22,.2);oval('#4b9383',s*.12,.81,1.018,.03,.042,.02);}
  if(id===1){oval('#398b4e',0,1.14,-.32,.95,.83,.99);for(let i=0;i<6;i++){const a=i*Math.PI/3;cone('#50a456',[Math.sin(a)*.34,1.16,-.32+Math.cos(a)*.34],[0,1.72,-.36],.17);}}
  else{cone('#826747',[0,.94,-.32],[0,1.87,-.32],.17,.12);for(let i=0;i<6;i++){const a=i*Math.PI/3;const g=new THREE.SphereGeometry(1,12,8);add(g,'#368c52',[Math.sin(a)*.42,1.28,-.32+Math.cos(a)*.42],[.25,.055,.69],[.14,a,0]);}if(id===2){oval('#d45c84',0,1.88,-.32,.69,.7,.67);cone('#ec85a1',[0,1.9,-.32],[0,2.36,-.32],.27);}else{for(let i=0;i<8;i++){const a=i*Math.PI/4;add(new THREE.SphereGeometry(1,14,8),'#ed8794',[Math.sin(a)*.49,1.94,-.32+Math.cos(a)*.49],[.31,.095,.64],[.12,a,0]);oval(cream,Math.sin(a)*.58,2.01,-.32+Math.cos(a)*.58,.11,.035,.11);}oval('#eed37b',0,2.05,-.32,.4,.26,.4);}}
 }else if([4,5,6].includes(id)){
  const c=id===5?'#df6249':'#f0a05a';oval(c,0,.87,0,.84,1.35,.77);oval(cream,0,.79,.337,.61,.93,.17);oval(c,0,1.69,.06,.75,.7,.69);oval(c,0,1.48,.43,.63,.27,.49);eyes(1.78,.38,.23,.12,'#397b8e',id!==4);smile(1.41,.667,.18);paws(c,.33,.21);
  for(const s of [-1,1]){limb(c,[s*.36,1.16,.01],[s*.54,.75,.21],.125);for(let j=0;j<3;j++)cone(cream,[s*.54+(j-1)*.07,.75,.26],[s*.54+(j-1)*.07,.69,.4],.029);if(id>4)cone(c,[s*.25,1.92,-.02],[s*.31,2.3,-.2],.13);}
  curl(c,[[0,.48,-.29],[0,.36,-.77],[.27,.51,-1.17],[.37,.9,-1.32]],.17);oval('#ff7739',.37,1.1,-1.32,.42,.65,.33);cone('#ff7739',[.37,1.27,-1.32],[.44,1.68,-1.32],.145);oval('#ffdb70',.37,1.06,-1.16,.21,.41,.1);
  if(id===6)for(const s of [-1,1]){fin('#388b9c',[[s*.37,1.4,-.29],[s*.92,2.21],[s*1.59,1.83],[s*1.85,1.05],[s*1.34,1.23],[s*.94,.95],[s*.6,1.14]],.07);tube(c,[[s*.34,1.2,-.24],[s*.87,2.2,-.24],[s*1.6,1.81,-.24],[s*1.85,1.05,-.24]],.065);for(const [x,y] of [[1.34,1.23],[.94,.95]])tube('#efb36d',[[s*.87,2.17,-.22],[s*x,y,-.22]],.033);cone(cream,[s*.87,2.18,-.24],[s*.9,2.38,-.24],.063);}
 }else if([7,8,9].includes(id)){
  const c=id===9?'#548ea9':'#75c5dc';oval('#644c3d',0,.83,-.18,1.12,1.24,.94);oval(cream,0,.83,.11,1.13,1.2,.58);oval('#dfc88f',0,.82,.36,.91,1.03,.29);for(let i=0;i<3;i++)tube('#b29561',[[-.38,.55+i*.25,.42],[0,.5+i*.25,.519],[.38,.55+i*.25,.42]],.018);tube('#b29561',[[0,.31,.4],[0,.8,.52],[0,1.25,.42]],.016);
  for(const s of [-1,1]){limb(c,[s*.44,1.07,.05],[s*.67,.86,.31],.18);if(id===8)ear('#cfdfef',s*.4,1.96,.03,-s*.6,'#8eb8d6',.6,.26);if(id===9){cone('#65717d',[s*.49,1.26,-.39],[s*.6,1.65,.49],.15,.13);add(new THREE.TorusGeometry(.13,.036,6,16),'#d9e0e0',[s*.6,1.65,.5],[1,1,1],[-.37,0,0]);oval(ink,s*.6,1.65,.51,.18,.18,.045);}}
  paws(c,.4,.18);oval(c,0,1.54,.16,.84,.69,.74);oval(c,0,1.36,.49,.65,.25,.39);eyes(1.65,.475,.25,.12,'#9c5249',id===9);smile(1.32,.68,.19);curl(id===8?'#d6e8f3':c,[[0,.43,-.5],[.18,.49,-.94],[.25,.84,-1.06],[0,.95,-1.05],[-.1,.74,-1.05],[.08,.7,-1.04]],id===8?.17:.12);
 }else if([74,75,76].includes(id)){
  const c=id===76?'#897c67':'#9c9b8b';add(new THREE.DodecahedronGeometry(1,1),c,[0,1.04,0],[.64,.69,.57]);
  for(let i=0;i<14;i++){const a=i*2.399;add(new THREE.DodecahedronGeometry(1,0),i%2?'#ada58e':'#74756b',[Math.sin(a)*.5,.68+(i%4)*.22,Math.cos(a)*.46],[.18,.17,.16]);}
  if(id===76){oval('#baa16d',0,1.21,.59,.66,.6,.53);eyes(1.33,.83,.19,.105,'#854b36',true);smile(1.08,.83,.18);paws('#bea272',.48,.24);}else{eyes(1.18,.558,.24,.13,'#51483c',true);smile(.89,.567,.22);if(id===75)paws(c,.43,.18);}
  for(const s of [-1,1])for(let j=0;j<(id===75?2:1);j++){limb(id===76?'#b39b70':c,[s*.47,1.08-j*.38,0],[s*.96,1.03-j*.38,.08],.2);limb(c,[s*.96,1.03-j*.38,.08],[s*1.1,1.31-j*.38,.19],.18);oval(c,s*1.1,1.38-j*.38,.19,.42,.35,.38);for(let k=0;k<3;k++)oval('#b9b4a0',s*1.1+(k-1)*.105,1.48-j*.38,.34,.093,.14,.12);}
 }else if([54,55].includes(id)){
  const c=id===54?'#efd061':'#519dc8';oval(c,0,.84,0,.94,1.25,.81);oval(c,0,1.64,.07,.85,.75,.75);oval('#ddc795',0,1.4,.53,.67,.22,.63);eyes(1.76,.436,.23,.105,id===54?'#765940':'#c15359',id===55);tube('#947e57',[[-.21,1.39,.79],[0,1.36,.84],[.21,1.39,.79]],.012);
  for(const s of [-1,1]){limb(c,[s*.38,1.12,0],[s*.65,.72,.15],.14);oval(c,s*.7,.64,.2,.3,.22,.34);for(let j=-1;j<=1;j++)cone(cream,[s*.7+j*.09,.63,.32],[s*.7+j*.12,.55,.49],.035);limb(c,[s*.28,.4,.02],[s*.32,.18,.17],.14);oval('#d9bd88',s*.32,.14,.28,.48,.18,.64);}
  curl(c,[[0,.45,-.25],[0,.38,-.74],[0,.62,-1.03]],.15);if(id===54)for(let j=-1;j<=1;j++)tube('#49463c',[[j*.06,1.97,.01],[j*.12,2.18,0],[j*.18,2.26,-.07]],.029);else{add(new THREE.OctahedronGeometry(.12),'#e96578',[0,1.94,.398],[.8,1.2,.5]);for(let j=-1;j<=1;j++)cone(c,[j*.21,1.95,-.04],[j*.29,2.39,-.12],.115);}
 }else if([60,61,62].includes(id)){
  const c=id===62?'#497caf':'#699fda';oval(c,0,.89,0,1.2,1.21,.85);oval(white,0,.86,.385,.94,.93,.18);const spiral=[];for(let i=0;i<75;i++){const a=i*.16,r=.325-i*.0038;spiral.push([Math.cos(a)*r,.86+Math.sin(a)*r,.479]);}tube(ink,spiral,.024);for(const s of [-1,1]){oval(c,s*.35,1.43,.05,.32,.36,.35);}eyes(1.47,.228,.35,.11,'#6b473a',id===62);paws(c,.33,.14);
  if(id===60){oval('#ecc0c5',0,1.21,.453,.2,.13,.12);oval('#b7e2ef',0,.7,-.77,.11,.79,1.07);tube('#588da7',[[0,.61,-.35],[0,.7,-1.28]],.025);}else for(const s of [-1,1]){limb(c,[s*.47,1.08,0],[s*.85,.94,.08],id===62?.22:.145);oval(white,s*.98,.95,.21,.4,.4,.4);for(let j=-1;j<=1;j++)oval('#e1e8e8',s*.99+j*.08,1.02,.4,.055,.16,.05);}
 }else if([86,87].includes(id)){
  const c=id===86?'#dee7ea':'#e7f0f1';oval(c,0,.56,id===87?-.4:-.27,id===87?.88:1,.75,id===87?1.95:1.63);oval(c,0,.99,.42,id===87?.74:.87,.84,.85);oval('#e4d2c4',-.17,.77,.82,.38,.3,.3);oval('#e4d2c4',.17,.77,.82,.38,.3,.3);eyes(1.12,.819,.23,.095,'#625172');oval(ink,0,.94,.91,.15,.09,.07);smile(.71,.96,.18);cone(c,[0,1.34,.37],[0,id===87?1.64:1.81,.26],id===87?.09:.125);for(const s of [-1,1]){oval(c,s*.62,.25,.05,.65,.16,.55,s*.13);oval(c,s*.25,.6,-1.11,.65,.17,.63,s*.45);cone(white,[s*.13,.68,.98],[s*.13,.45,.98],.05);for(let i=0;i<3;i++)oval('#a8b5bc',s*(.18+i*.04),.78+(i%2)*.06,.974,.022,.025,.015);}
 }else if(id===90){
  oval('#594878',0,.64,.03,.85,.46,.82);oval('#a597c9',0,.39,-.07,1.2,.46,1.04);oval('#a99acd',0,1.04,-.14,1.19,.31,1.08);for(let i=-2;i<=2;i++){tube('#8171b0',[[i*.13,1.1,-.63],[i*.2,1.2,-.18],[i*.23,1.06,.34]],.035);cone('#bcb0dc',[i*.2,.49,.4],[i*.23,.58,.59],.085);}eyes(.78,.454,.22,.13,'#d4dbdf');oval('#ef9eae',0,.44,.7,.34,.15,.74);tube('#d27d93',[[0,.51,.65],[0,.51,.98]],.016);
 }else if([116,117].includes(id)){
  const c=id===116?'#63bacb':'#438cae';oval(c,0,.82,-.01,.67,.95,.65);oval('#e8d1a0',0,.78,.295,.47,.64,.13);for(let i=0;i<3;i++)tube('#bdac82',[[-.18,.61+i*.16,.325],[0,.6+i*.16,.366],[.18,.61+i*.16,.325]],.015);oval(c,0,1.48,.04,.81,.7,.71);cone(c,[0,1.38,.25],[0,1.38,.81],.18,.115);add(new THREE.TorusGeometry(.115,.03,6,16),'#8ed4dc',[0,1.38,.83]);oval('#2f536a',0,1.38,.822,.16,.16,.02);eyes(1.59,.35,.24,.105,'#a95c50',id===117);curl(c,[[0,.45,-.1],[0,.16,-.38],[0,.26,-.68],[0,.54,-.69],[0,.58,-.48],[0,.4,-.45]],.11);
  for(const s of [-1,1]){oval('#b4dce8',s*.42,.86,-.11,.44,.6,.08,s*.4);for(let j=0;j<3;j++)tube('#76b3c6',[[s*.25,.75,-.045],[s*(.5+j*.05),.7+j*.15,-.045]],.016);if(id===117)for(let j=0;j<4;j++)cone(c,[s*.29,1.72-j*.15,-.07],[s*(.59+j*.035),1.88-j*.21,-.13],.095);}for(let j=-1;j<=1;j++)cone(c,[j*.19,1.76,0],[j*.27,2.08,-.07],.093);
 }else if([118,119,129].includes(id)){
  const c=id===129?'#ec9459':id===119?'#e78649':'#f4ead3';oval(c,0,.88,-.07,.77,1.02,1.53);oval(c,0,.93,.56,.74,.79,.61);eyes(1.08,.823,.225,.135,'#79614d');add(new THREE.TorusGeometry(.12,.042,8,18),'#efc39a',[0,.77,.894],[.87,1,1]);oval('#59463d',0,.77,.894,.13,.19,.03);
  for(const s of [-1,1]){oval('#f2dec0',s*.56,.82,-.09,.75,.13,.75,s*.19);fin('#f5dfbb',[[s*.04,.82,-.97],[s*.5,1.35],[s*.66,.56],[s*.12,.62]],.08);for(let j=0;j<3;j++)tube('#d6b989',[[s*.36,.82,-.11],[s*.84,.85,-.28+j*.17]],.012);if(id===129)curl('#f3d36e',[[s*.18,.79,.82],[s*.49,.69,.79],[s*.66,.92,.58]],.026);else for(let j=0;j<3;j++)oval(id===119?'#343b42':'#e99769',s*.363,.71+j*.15,-.1+(j%2)*.27,.045,.17,.23);}
  fin(id===129?'#e7c459':'#e79c6c',[[0,1.17,-.29],[-.045,1.68],[.045,1.57],[.08,1.17]],.52);if(id!==129)cone(cream,[0,1.24,.66],[0,1.93,.74],.095);else for(let i=0;i<3;i++)cone('#f1d477',[0,1.31,.32-i*.28],[0,1.65,.36-i*.28],.085);
 }else throw Error('Missing sculpture '+id);
 const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const model=new THREE.Mesh(geometry,material);model.name='Sculpture-'+id;model.castShadow=true;model.receiveShadow=true;cache.set(id,model);return model.clone();
}
