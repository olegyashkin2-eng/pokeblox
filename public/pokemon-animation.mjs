import * as THREE from 'three';
import {EXTRA_SPECIES,SPECIES} from './data.mjs';

// Each species has its own cadence, weight, posture and attack choreography.
// Shared gait mechanics keep planted feet and attached rigid blocks consistent.
// [gait, cadence, stride, bounce, sway, ordinary move, special move]
const rows={
 1:['quad',7.5,.43,.045,.035,'seed-bump','vine-whip'],
 2:['quad',6.7,.40,.035,.03,'bud-bash','double-vine'],
 3:['quad',4.8,.32,.025,.045,'heavy-stomp','solar-bloom'],
 4:['biped',9.2,.68,.075,.045,'little-claw','ember-spit'],
 5:['biped',8.4,.74,.05,.055,'cross-claw','flame-fang'],
 6:['dragon',5.9,.53,.045,.035,'wing-slash','dragon-flame'],
 7:['biped',8.6,.61,.055,.065,'shell-bump','water-spit'],
 8:['biped',7.8,.63,.065,.047,'shell-spin','water-spiral'],
 9:['biped',5.4,.42,.032,.072,'cannon-bash','hydro-cannons'],
 25:['quad',11.4,.74,.085,.043,'pika-pounce','cheek-spark'],
 26:['biped',8.9,.7,.09,.06,'tail-sweep','thunder-rise'],
 54:['waddle',7.1,.52,.048,.13,'duck-peck','headache-wave'],
 55:['biped',8.1,.71,.039,.047,'duck-claw','surfer-wave'],
 60:['hop',10.2,.52,.14,.055,'tadpole-bump','bubble-hop'],
 61:['biped',7.9,.57,.08,.075,'glove-jab','belly-wave'],
 62:['biped',6.5,.68,.05,.07,'boxing-hook','wave-uppercut'],
 74:['hover',4.8,.3,.07,.08,'rock-punch','rock-lift'],
 75:['biped',6.1,.44,.055,.09,'four-arm-hit','four-arm-quake'],
 76:['biped',4.3,.37,.03,.065,'boulder-roll','boulder-slam'],
 86:['seal',5.8,.55,.06,.09,'seal-nudge','flipper-wave'],
 87:['seal',4.1,.47,.038,.07,'tail-lash','ice-dance'],
 90:['shell',6.2,.4,.15,.08,'shell-clap','shell-spray'],
 116:['seahorse',8.8,.3,.07,.045,'snout-poke','bubble-shot'],
 117:['seahorse',7.2,.36,.05,.065,'spine-twist','spiral-jet'],
 118:['fish',6.8,.5,.055,.065,'horn-dart','fin-wave'],
 119:['fish',5.7,.57,.04,.09,'horn-drill','royal-surge'],
 129:['flop',9.7,.86,.21,.36,'fish-flop','big-splash'],
 133:['quad',9.4,.67,.075,.06,'fox-pounce','quick-dash'],
 134:['quad',7.0,.57,.045,.05,'fin-tail','tide-call'],
 135:['quad',12.1,.78,.061,.03,'needle-dash','quill-charge'],
 136:['quad',8.3,.63,.065,.048,'fluffy-bash','fox-flame']
};
const extraGaits={10:'crawl',11:'shell',12:'flutter',13:'crawl',14:'shell',15:'flutter',27:'biped',28:'biped',35:'waddle',36:'waddle',39:'hop',40:'hop',43:'waddle',44:'waddle',45:'waddle',46:'crawl',47:'crawl',48:'hop',49:'flutter',56:'biped',57:'biped',63:'biped',64:'biped',65:'biped',66:'biped',67:'biped',68:'biped',69:'plant',70:'hover',71:'hover',96:'waddle',97:'biped',106:'kicker',107:'boxer',108:'waddle',120:'star',121:'star',122:'mime',124:'dance',131:'seal',132:'blob',137:'hover',144:'flutter',147:'serpent',148:'serpent',149:'dragon'};
for(const [key,d] of Object.entries(EXTRA_SPECIES)){const id=Number(key),gait=extraGaits[id];rows[id]=[gait,4.3+(id%11)*.47,.35+(id%7)*.045,['hop','flutter'].includes(gait)?.11:.025+(id%5)*.008,.028+(id%6)*.011,`${gait}-${id}-strike`,`${d.type}-${id}-special`];}
const newGaits={};
for(const [gait,ids] of Object.entries({flutter:[16,17,18,21,22,41,42,83,123,142,145,146],quad:[19,20,29,30,32,33,37,38,52,53,58,59,77,78,111,128],serpent:[23,24,95,130],blob:[88,89],hover:[81,82,92,93,109,110],hop:[100,101,102],plant:[103,114],crawl:[98,99,140],shell:[91,138,139],waddle:[79,80,113,143]}))for(const id of ids)newGaits[id]=gait;
for(const [key,d] of Object.entries(SPECIES)){const id=Number(key);if(rows[id])continue;const gait=newGaits[id]??'biped';rows[id]=[gait,4.5+(id%13)*.41,.34+(id%7)*.055,gait==='flutter'?.1:.035+(id%5)*.007,.03+(id%6)*.01,`${gait}-${id}-strike`,`${d.type}-${id}-special`];}
export const ANIMATION_PROFILES=Object.freeze(Object.fromEntries(Object.entries(rows).map(([id,r])=>[id,Object.freeze({gait:r[0],cadence:r[1],stride:r[2],bounce:r[3],sway:r[4],normal:r[5],special:r[6]})])));
const TAU=Math.PI*2,clamp=THREE.MathUtils.clamp;
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const pulse=(t,a,b,c)=>t<b?ease((t-a)/(b-a)):1-ease((t-b)/(c-b));

export function attackSpec(id,kind='normal'){
 const p=ANIMATION_PROFILES[id];if(!p)throw Error('No animation for '+id);
 const special=kind==='special',name=special?p.special:p.normal;
 const contact=!special||(['flame-fang','quick-dash'].includes(name)||SPECIES[id].type==='fighting');
 const effect=!special?'hit':id===133?'dash':[1,2].includes(id)?'vine':id===3?'solar':[4,5,6,136].includes(id)?'fire':[25,26,135].includes(id)?'electric':[74,75,76].includes(id)?'rock':id===129?'splash':id===9?'hydro':({fire:'fire',electric:'electric',rock:'rock',poison:'psychic',ghost:'psychic',flying:'force',steel:'rock',grass:'vine',bug:'pollen',psychic:'psychic',fairy:'fairy',ground:'sand',fighting:'force',ice:'ice',dragon:'dragon',normal:'dash'}[SPECIES[id].type]??'water');
 const duration=special?(id===3?1.85:id===129?1.55:1.38+(id%5)*.065):.85+(id%6)*.035;
 return {id,kind:special?'special':'normal',name,effect,contact,duration,cast:special&&!contact?.33:.46,impact:special&&!contact?.61:.49};
}

export class PokemonAnimator{
 constructor(model,{phase=0}={}){
  this.model=model;this.id=model.userData.species;this.parts=model.userData.parts;this.profile=ANIMATION_PROFILES[this.id];
  if(!this.profile||!this.parts)throw Error('Missing articulated model');
  this.time=phase;this.phase=phase;this.weight=0;this.action=null;this.recoilTime=1;this.travel=0;this.sequence=0;
 }
 rotate(name,x=0,y=0,z=0){const b=this.parts[name];if(b){b.rotation.x+=x;b.rotation.y+=y;b.rotation.z+=z;}}
 move(name,x=0,y=0,z=0){const b=this.parts[name];if(b){b.position.x+=x;b.position.y+=y;b.position.z+=z;}}
 resetPose(){for(const b of Object.values(this.parts)){b.position.copy(b.userData.rest);b.rotation.set(0,0,0);b.scale.set(1,1,1);}this.travel=0;}
 play(kind='normal',callbacks={}){
  this.cancel();const spec=attackSpec(this.id,kind);
  this.action={...spec,time:0,fired:false,hit:false,hand:++this.sequence%2?1:-1,...callbacks};
  return spec;
 }
 cancel(){const a=this.action;this.action=null;this.travel=0;this.resetPose();a?.onComplete?.(false);}
 recoil(){this.recoilTime=0;}
 update(dt,speed=0){
  dt=Math.max(0,Number.isFinite(dt)?dt:0);speed=Math.max(0,Number.isFinite(speed)?speed:0);
  this.time+=dt;this.recoilTime+=dt;
  const desired=speed>.045?clamp(speed/1.1,.45,1):0;
  this.weight+=(desired-this.weight)*(1-Math.exp(-dt*12));
  this.phase+=dt*this.profile.cadence*clamp(.52+speed*.15,.52,1.9);
  this.resetPose();this.idle();this.locomotion(this.weight);
  const a=this.action;
  if(a){a.time=Math.min(a.duration,a.time+dt);this.strike(a,a.time/a.duration);}
  if(this.recoilTime<.42){const r=this.recoilTime/.42,k=Math.sin(r*Math.PI)*(1-r);this.rotate('body',-.2*k,0,.07*Math.sin(r*TAU)*k);this.move('body',0,.06*k,-.12*k);this.rotate('head',-.2*k);}
  // CPU attachment positions and GPU skinning see the same pose this frame.
  this.model.updateWorldMatrix(true,true);
  if(a){
   if(!a.fired&&a.time>=a.cast*a.duration){a.fired=true;a.onCast?.(a);}
   if(!a.hit&&a.time>=a.impact*a.duration){a.hit=true;a.onImpact?.(a);}
   if(a.time>=a.duration&&this.action===a){this.action=null;this.travel=0;a.onComplete?.(true);}
  }
 }
 idle(){
  const t=this.time,p=this.profile,s=Math.sin(t*(1.7+this.id%7*.09)),b=1-this.weight*.75;
  this.move('body',0,s*.012*b);this.rotate('head',s*.016*b,Math.sin(t*.67+this.id)*.025*b);
  this.rotate('tail',s*.025,Math.sin(t*(2+this.id%5*.12))*.09,0);
  this.rotate('tailTip',0,Math.sin(t*2.2-.8)*.12);
  this.rotate('earL',Math.sin(t*2.1)*.025,0,-.025*s);this.rotate('earR',Math.sin(t*1.9+.7)*.028,0,.02*s);
  this.rotate('plant',Math.sin(t*1.4)*.016,0,s*.018);this.rotate('flame',s*.07,0,Math.sin(t*6)*.08);
  if(this.parts.flame)this.parts.flame.scale.y=1+Math.sin(t*8)*.06;
  if(p.gait==='dragon'){this.rotate('wingL',0,.13+Math.sin(t*1.8)*.1);this.rotate('wingR',0,-.13-Math.sin(t*1.8)*.1);}
  if(['fish','seahorse','flop'].includes(p.gait))for(const side of [-1,1])this.rotate('fin'+(side<0?'L':'R'),0,side*Math.sin(t*8)*.13,side*Math.sin(t*5)*.1);
  if(p.gait==='hover'){this.move('body',0,.07+Math.sin(t*2.4)*.05);this.rotate('armL',0,0,.07+s*.06);this.rotate('armR',0,0,-.07-s*.06);}
  this.rotate('shell',-.035-.025*s);this.rotate('tongue',.025*s);this.rotate('whiskerL',0,0,s*.07);this.rotate('whiskerR',0,0,-s*.07);
 }
 locomotion(w){
  if(w<.0001)return;
  const p=this.profile,q=this.phase,s=Math.sin(q),c=Math.cos(q),stride=p.stride*w;
  const step=(name,phase,amount=stride)=>{const v=Math.sin(phase);this.rotate(name,v*amount);this.move(name,0,Math.max(0,v)*.055*w,-v*.035*w);};
  this.rotate('body',0,0,s*p.sway*w);this.rotate('head',-Math.sin(q*2)*.035*w,-s*.025*w);this.rotate('plant',-s*.06*w,0,-s*.035*w);
  if(p.gait==='quad'){
   step('frontL',q);step('frontR',q+Math.PI);step('backL',q+Math.PI*.85);step('backR',q+Math.PI*1.85);
   this.move('body',0,Math.abs(c)*p.bounce*w);this.rotate('body',Math.sin(q*2)*.045*w);
   this.rotate('tail',Math.sin(q-.7)*.09*w,-s*.2*w);this.rotate('tailTip',0,Math.sin(q-1.2)*.23*w);
   this.rotate('earL',-Math.sin(q*.5)*.12*w);this.rotate('earR',-Math.sin(q*.5+.7)*.12*w);
  }else if(['biped','waddle','dragon','hop'].includes(p.gait)){
   const hop=p.gait==='hop';step('legL',q);step('legR',q+(hop?.28:Math.PI));
   this.rotate('armL',-s*stride*.7,0,-.04*w);this.rotate('armR',s*stride*.7,0,.04*w);
   this.rotate('lowerArmL',s*stride*.65);this.rotate('lowerArmR',-s*stride*.65);
   this.move('body',0,(hop?Math.max(0,s):Math.abs(c))*p.bounce*w);
   this.rotate('tail',0,-s*.18*w);this.rotate('earL',-c*.12*w);this.rotate('earR',-c*.1*w);
   if(p.gait==='waddle'){this.move('body',s*.05*w);this.rotate('head',0,0,-s*.08*w);}
   if(p.gait==='dragon'){this.rotate('wingL',0,.3*s*w,Math.sin(q+.3)*.12*w);this.rotate('wingR',0,-.3*s*w,-Math.sin(q+.3)*.12*w);}
  }else if(p.gait==='hover'){
   this.move('body',0,s*p.bounce*w);this.rotate('body',.1*w,s*.07*w);this.rotate('armL',-.23*w,0,s*.2*w);this.rotate('armR',-.23*w,0,-s*.2*w);
  }else if(p.gait==='seal'){
   this.rotate('body',s*.09*w);this.move('body',0,(c+1)*p.bounce*.5*w);
   this.rotate('finL',c*.26*w,-s*.22*w,-s*stride);this.rotate('finR',c*.26*w,s*.22*w,-s*stride);
   this.rotate('tail',-Math.sin(q-.8)*.34*w);this.rotate('tailL',0,0,s*.17*w);this.rotate('tailR',0,0,-s*.17*w);
  }else if(p.gait==='shell'){
   this.move('body',0,Math.max(0,s)*p.bounce*w);this.rotate('body',s*.13*w);this.rotate('shell',-Math.max(0,c)*.22*w);this.rotate('tongue',-s*.18*w);
  }else if(p.gait==='seahorse'){
   this.rotate('body',.14*w,0,s*.055*w);this.move('body',0,s*p.bounce*w);
   this.rotate('finL',0,Math.sin(q*2.4)*.52*w);this.rotate('finR',0,-Math.sin(q*2.4)*.52*w);
   this.rotate('tail',s*.21*w,c*.08*w);this.rotate('head',-.1*w,0,-s*.025*w);
  }else{
   const flop=p.gait==='flop';this.rotate('body',flop?s*.24*w:0,s*.16*w,flop?s*p.sway*w:0);
   this.move('body',0,(flop?Math.max(0,s):1+c)*p.bounce*w);
   this.rotate('tail',0,-Math.sin(q-.6)*stride,flop?c*.19*w:0);
   this.rotate('finL',0,c*.3*w,-s*.43*w);this.rotate('finR',0,-c*.3*w,s*.43*w);this.rotate('dorsal',0,0,-s*.13*w);
  }
 }
 strike(a,t){
  const id=this.id,wind=pulse(t,0,.22,.47),hit=pulse(t,.24,.49,.79),release=pulse(t,.35,.61,.9),hold=pulse(t,0,.32,.9),hand=a.hand;
  const r=(...args)=>this.rotate(...args),m=(...args)=>this.move(...args);
  // Every action has anticipation, contact/release, follow-through and recovery.
  r('body',-.1*wind+.11*hit);m('body',0,-.035*wind);r('head',-.05*wind);
  if(a.contact)this.travel=pulse(t,.2,.49,.93);
  if(a.kind==='normal'){
   switch(id){
    case 1:r('body',-.12*wind+.24*hit);r('plant',-.22*hit);r('frontL',-.5*hit);r('frontR',-.5*hit);break;
    case 2:r('body',0,-.2*wind+.3*hit);r('plant',.23*hit,0,-.12*hit);r('frontR',-.7*hit);break;
    case 3:m('body',0,.18*wind-.025*hit);r('frontL',-.55*wind);r('frontR',-.55*wind);r('plant',-.12*hit);break;
    case 4:r('armR',-1.2*hit,0,-.3*wind);r('body',0,-.24*wind+.3*hit);r('tail',0,-.3*hit);break;
    case 5:r('armL',-1.1*hit,0,.2*hit);r('armR',-.8*hit,0,-.2*hit);r('body',0,.45*wind-.55*hit);break;
    case 6:r('wingL',0,-.75*hit,-.25*wind);r('wingR',0,.75*hit,.25*wind);r('armR',-.85*hit);m('body',0,.18*hit);break;
    case 7:r('body',.32*hit,.4*wind);r('head',.24*hit);r('armL',.5*wind);r('armR',.5*wind);break;
    case 8:r('body',0,TAU*ease((t-.2)/.65));r('armL',0,0,-.3*hold);r('armR',0,0,.3*hold);r('tail',0,.4*hit);break;
    case 9:r('body',0,-.3*wind+.4*hit);r('armR',-1.05*hit);r('cannonL',-.16*wind);r('cannonR',-.16*wind);break;
    case 25:m('body',0,.28*hit);r('frontL',-.9*hit);r('frontR',-.85*hit);r('backL',.45*hit);r('backR',.45*hit);r('tail',-.35*hit,0,-.2*hit);break;
    case 26:r('body',0,TAU*ease((t-.18)/.62));r('tail',-.1*hit,1.0*hit);r('armL',0,0,-.4*hit);r('armR',0,0,.4*hit);break;
    case 54:r('head',-.25*wind+.42*hit);r('armL',0,0,-.45*hit);r('armR',0,0,.45*hit);break;
    case 55:r('body',0,hand*(-.3*wind+.42*hit));r(hand>0?'armR':'armL',-1.25*hit,hand*.3*hit);r('head',.12*hit);break;
    case 60:m('body',0,.2*hit);r('body',.3*hit);r('tail',0,.65*hit);r('legL',-.4*hit);r('legR',-.4*hit);break;
    case 61:r('armR',0,-1.1*hit,.2*wind);r('armL',0,.4*hold);r('body',0,-.27*hit);break;
    case 62:r(hand>0?'armR':'armL',0,-hand*1.35*hit,hand*.4*hit);r('body',0,hand*(.35*wind-.5*hit));r('legL',.3*wind);break;
    case 74:r('armR',.5*wind,-1.1*hit,.2*hit);r('armL',0,.35*wind);r('body',0,-.4*hit);break;
    case 75:r('armL',0,1.1*hit);r('armR',0,-1.1*hit);r('lowerArmL',0,.8*release);r('lowerArmR',0,-.8*release);break;
    case 76:r('body',TAU*ease((t-.18)/.65));r('armL',0,.6*hold);r('armR',0,-.6*hold);m('body',0,.23*hit);break;
    case 86:r('head',-.15*wind+.35*hit);r('finL',0,-.4*hit,-.3*hit);r('finR',0,.4*hit,.3*hit);r('tail',-.3*hit);break;
    case 87:r('body',0,TAU*ease((t-.18)/.63));r('tail',-.45*hit,.65*hit);r('finL',0,0,-.4*hit);r('finR',0,0,.4*hit);break;
    case 90:r('shell',-.55*wind+.04*hit);r('tongue',-.4*hit);m('body',0,.23*hit);break;
    case 116:r('head',-.23*wind+.32*hit);r('tail',.4*wind);r('finL',0,.7*hit);r('finR',0,-.7*hit);break;
    case 117:r('body',0,.8*wind-1.0*hit);r('head',0,-.22*hit);r('finL',0,.8*hit);r('finR',0,-.8*hit);break;
    case 118:r('body',-.2*wind+.3*hit);r('tail',0,.7*hit);r('finL',0,.45*hit);r('finR',0,-.45*hit);break;
    case 119:r('body',0,0,TAU*ease((t-.21)/.59));r('tail',0,-.55*hit);r('finL',0,.5*hold);r('finR',0,-.5*hold);break;
    case 129:m('body',0,.48*hit);r('body',-.35*hit,0,-.8*wind+.95*hit);r('tail',0,.9*hit);r('finL',0,0,-.9*hit);r('finR',0,0,.9*hit);break;
    case 133:m('body',0,.33*hit);r('head',.12*hit);r('frontL',-.8*hit);r('frontR',-.6*hit);r('backL',.6*hit);r('backR',.6*hit);r('tail',-.35*hit,.5*hit);break;
    case 134:r('body',0,TAU*ease((t-.18)/.64));r('tail',.2*hit,1.0*hit);r('tailTip',0,-.7*hit);r('earL',0,-.3*hit);r('earR',0,.3*hit);break;
    case 135:r('body',.2*hit);r('frontL',-.9*hit);r('frontR',-.9*hit);r('backL',.7*hit);r('backR',.7*hit);r('earL',-.45*hit);r('earR',-.45*hit);break;
    case 136:r('body',0,-.25*wind+.4*hit);r('frontR',-.9*hit);r('head',.19*hit);r('tail',-.3*hit,-.65*hit);break;
   }
  }else{
   // Signature poses are authored per species, independently of the effect colour.
   switch(id){
    case 1:r('plant',-.2*wind,.2*release);r('frontL',-.3*wind);r('frontR',-.3*wind);r('body',.19*release);break;
    case 2:r('plant',-.16*wind,Math.sin(t*TAU)*.35*hold);r('body',0,-.2*wind+.3*release);r('frontL',-.48*release);break;
    case 3:r('plant',-.24*wind);m('plant',0,.08*hold);r('body',-.12*wind+.18*release);r('frontL',-.2*wind);r('frontR',-.2*wind);break;
    case 4:r('head',-.32*wind+.23*release);r('armL',0,0,-.3*hold);r('armR',0,0,.3*hold);r('tail',-.3*hold);break;
    case 5:r('head',-.24*wind+.4*hit);r('armL',-1.0*hit);r('armR',-1.0*hit);r('tail',0,-.7*hit);m('body',0,.17*hit);break;
    case 6:r('wingL',0,-.65*hold,-.23*hold);r('wingR',0,.65*hold,.23*hold);r('head',-.28*wind+.25*release);m('body',0,.23*hold);r('legL',-.2*hold);r('legR',-.2*hold);break;
    case 7:r('head',-.28*wind+.3*release);r('armL',-.7*hold);r('armR',-.7*hold);r('tail',0,.22*release);break;
    case 8:r('body',0,.3*wind-.25*release);r('head',-.25*wind+.2*release);r('earL',-.32*hold);r('earR',-.32*hold);r('tail',0,.5*hold);break;
    case 9:r('cannonL',.12*hold);r('cannonR',.12*hold);m('cannonL',0,0,-.1*release);m('cannonR',0,0,-.1*release);r('body',-.17*release);r('armL',.35*hold);r('armR',.35*hold);break;
    case 25:r('earL',-.2*wind,0,-.28*hold);r('earR',-.2*wind,0,.28*hold);r('tail',-.5*hold,.22*Math.sin(t*19)*release);r('frontL',-.4*wind);r('frontR',-.4*wind);r('body',.22*release);break;
    case 26:r('armL',-1.65*hold,0,-.3*hold);r('armR',-1.65*hold,0,.3*hold);r('tail',-.3*hold,.55*hold);r('head',-.25*hold);m('body',0,.16*release);break;
    case 54:r('armL',0,0,-2.25*hold);r('armR',0,0,2.25*hold);r('head',-.18*wind,Math.sin(t*18)*.065*hold);r('body',.2*release);break;
    case 55:r('armL',-1.3*wind+.4*release,0,-.35*hold);r('armR',-1.1*wind-.5*release,0,.35*hold);r('body',0,-.28*wind+.3*release);r('head',.2*release);break;
    case 60:m('body',0,.3*hold);r('body',-.2*wind+.3*release);r('tail',Math.sin(t*14)*.3*hold);r('legL',-.5*hold);r('legR',-.5*hold);break;
    case 61:r('armL',0,.9*wind+.35*release,-.3*hold);r('armR',0,-.9*wind-.35*release,.3*hold);r('body',-.2*wind+.23*release);break;
    case 62:r('armR',0,-.8*hold,-1.25*release);r('armL',0,.6*hold);r('body',0,.3*wind-.4*release);m('body',0,.18*release);break;
    case 74:r('armL',0,0,-1.15*wind+.22*release);r('armR',0,0,1.15*wind-.22*release);m('body',0,.18*hold);break;
    case 75:for(const name of ['armL','lowerArmL'])r(name,0,.6*hold,-.95*wind+.2*release);for(const name of ['armR','lowerArmR'])r(name,0,-.6*hold,.95*wind-.2*release);r('body',.2*release);break;
    case 76:m('body',0,.45*wind);r('body',-.25*wind+.3*release);r('armL',0,.5*hold,-.7*wind);r('armR',0,-.5*hold,.7*wind);r('legL',-.3*wind);r('legR',-.3*wind);break;
    case 86:r('finL',-.3*hold,0,-.85*release);r('finR',-.3*hold,0,.85*release);r('head',-.24*wind+.3*release);r('tail',-.5*hold);break;
    case 87:r('body',-.15*wind,Math.sin(t*TAU)*.3*hold);r('head',-.26*wind+.23*release);r('finL',0,0,-.65*hold);r('finR',0,0,.65*hold);r('tail',-.55*hold);r('tailL',0,0,-.35*release);r('tailR',0,0,.35*release);break;
    case 90:r('shell',.04*wind-.6*release);r('tongue',-.35*release);m('body',0,.12*release);break;
    case 116:r('head',-.3*wind+.22*release);r('tail',.5*hold);r('finL',0,Math.sin(t*32)*.7*hold);r('finR',0,-Math.sin(t*32)*.7*hold);break;
    case 117:r('body',0,.4*wind-.3*release);r('head',-.18*wind+.2*release);r('finL',0,.7*hold);r('finR',0,-.7*hold);r('tail',-.4*hold);break;
    case 118:r('finL',0,-.35*wind,.8*release);r('finR',0,.35*wind,-.8*release);r('tail',0,Math.sin(t*17)*.5*hold);r('body',-.18*wind);break;
    case 119:r('body',-.28*wind+.14*release);r('tail',0,-.8*wind+.6*release);r('finL',0,.5*hold,-.4*release);r('finR',0,-.5*hold,.4*release);m('body',0,.19*hold);break;
    case 129:m('body',0,.85*hold);r('body',0,0,TAU*ease((t-.08)/.72));r('tail',0,Math.sin(t*24)*.85*hold);r('finL',0,0,Math.sin(t*29)*.8*hold);r('finR',0,0,-Math.sin(t*29)*.8*hold);break;
    case 133:m('body',0,.16*hit);r('frontL',-.9*hit);r('frontR',-.9*hit);r('backL',.8*hit);r('backR',.8*hit);r('head',.15*hit);r('earL',-.6*hit);r('earR',-.6*hit);r('tail',-.35*hit);this.travel=Math.pow(this.travel,.6);break;
    case 134:r('tail',-.22*hold,.7*wind-.7*release);r('tailTip',0,-.8*wind+.6*release);r('earL',0,-.4*hold);r('earR',0,.4*hold);r('head',-.22*wind+.2*release);break;
    case 135:r('earL',.15*wind,0,-.3*hold);r('earR',.15*wind,0,.3*hold);r('tail',-.3*hold);r('body',-.12*wind+.27*release);r('frontL',-.45*wind);r('frontR',-.45*wind);break;
    case 136:r('head',-.35*wind+.28*release);r('tail',-.4*hold,Math.sin(t*12)*.28*hold);r('earL',-.35*hold);r('earR',-.35*hold);r('frontL',.2*release);r('frontR',.2*release);break;
   }
  }
 }
}
