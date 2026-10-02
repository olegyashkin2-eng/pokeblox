import {KANTO_ADDITIONS} from './kanto-catalog.mjs';
import {TIDAL_SUPPLEMENTS,EXPANSION_IDS} from './expansion.mjs';
import {EXTRA_SPECIES,EXTRA_TYPES,EXTRA_STONES,ISLAND_NAMES,ISLAND3_IDS,ISLAND4_IDS,TIDAL_ADDITIONS,TIDAL_SPAWNS,EXTRA_ZONES,extraZone,islandRadius} from './islands.mjs';
export * from './islands.mjs';
import {BASE_STATS} from './stats.mjs';
export const SPECIES = {
  ...KANTO_ADDITIONS,
  ...EXTRA_SPECIES,
  54: {"name":"Псайдак","type":"water","height":1.5,"zone":"Приливный остров","move":"Водяная волна","next":55,"level":33},
  55: {"name":"Голдак","type":"water","height":2.4,"zone":"Приливный остров","move":"Водяная волна"},
  60: {"name":"Поливаг","type":"water","height":1.1,"zone":"Приливный остров","move":"Водяная волна","next":61,"level":25},
  61: {"name":"Поливирл","type":"water","height":1.7,"zone":"Приливный остров","move":"Водяная волна","stones":{"water":62}},
  62: {"name":"Поливрат","type":"water","height":2.3,"zone":"Приливный остров","move":"Водяная волна"},
  74: {"name":"Геодуд","type":"rock","height":1.2,"zone":"Приливный остров","move":"Каменный обвал","next":75,"level":25},
  75: {"name":"Гравелер","type":"rock","height":1.8,"zone":"Приливный остров","move":"Каменный обвал","next":76,"level":36},
  76: {"name":"Голем","type":"rock","height":2.4,"zone":"Приливный остров","move":"Каменный обвал"},
  86: {"name":"Сил","type":"water","height":1.45,"zone":"Приливный остров","move":"Водяная волна","next":87,"level":34},
  87: {"name":"Дьюгонг","type":"water","height":2.1,"zone":"Приливный остров","move":"Водяная волна"},
  90: {"name":"Шелдер","type":"water","height":1.1,"zone":"Приливный остров","move":"Водяная волна"},
  116: {"name":"Хорси","type":"water","height":1.1,"zone":"Приливный остров","move":"Водяная волна","next":117,"level":32},
  117: {"name":"Сидра","type":"water","height":1.7,"zone":"Приливный остров","move":"Водяная волна"},
  118: {"name":"Голдин","type":"water","height":1.25,"zone":"Приливный остров","move":"Водяная волна","next":119,"level":33},
  119: {"name":"Сикинг","type":"water","height":1.9,"zone":"Приливный остров","move":"Водяная волна"},
  129: {"name":"Мэджикарп","type":"water","height":1.25,"zone":"Приливный остров","move":"Всплеск"},
  1: {name:'Бульбазавр',type:'grass',height:1.12,next:2,level:16,zone:'Лиственный лес',move:'Лоза'},
  2: {name:'Ивизавр',type:'grass',height:1.6,next:3,level:32,zone:'Лиственный лес',move:'Лоза'},
  3: {name:'Венузавр',type:'grass',height:2.45,zone:'Лиственный лес',move:'Солнечный луч'},
  4: {name:'Чармандер',type:'fire',height:1.35,next:5,level:16,zone:'Янтарные скалы',move:'Искра'},
  5: {name:'Чармелеон',type:'fire',height:1.8,next:6,level:36,zone:'Янтарные скалы',move:'Огненный клык'},
  6: {name:'Чаризард',type:'fire',height:3.2,zone:'Янтарные скалы',move:'Огнемёт'},
  7: {name:'Сквиртл',type:'water',height:1.25,next:8,level:16,zone:'Лазурное озеро',move:'Водяная пушка'},
  8: {name:'Вартортл',type:'water',height:1.65,next:9,level:36,zone:'Лазурное озеро',move:'Водяная пушка'},
  9: {name:'Бластойз',type:'water',height:2.4,zone:'Лазурное озеро',move:'Гидропомпа'},
  25: {name:'Пикачу',type:'electric',height:1.3,stones:{thunder:26},zone:'Грозовая роща',move:'Удар молнии'},
  26: {name:'Райчу',type:'electric',height:1.85,zone:'Грозовая роща',move:'Гром'},
  133: {name:'Иви',type:'normal',height:1.2,stones:{water:134,thunder:135,fire:136},zone:'Солнечная поляна',move:'Быстрая атака'},
  134: {name:'Вапореон',type:'water',height:1.7,zone:'Лазурное озеро',move:'Водяная волна'},
  135: {name:'Джолтеон',type:'electric',height:1.6,zone:'Грозовая роща',move:'Гром'},
  136: {name:'Флареон',type:'fire',height:1.6,zone:'Янтарные скалы',move:'Огнемёт'}
};
export const BASES=[4,1,7,25,133];
export const ALL_IDS=Object.keys(SPECIES).map(Number).sort((a,b)=>a-b);
export const ISLAND2_IDS=[76,75,74,54,116,117,134,7,9,8,129,118,119,60,61,62,86,87,90];

export const ISLAND2_ZONES=['Приливный лагерь','Базальтовые скалы','Жемчужный берег','Коралловая бухта','Ледяной мыс','Арена Голдака'];
export const ISLAND2_LANDMARKS=[{x:0,z:22,color:'#fff',label:'Приливный лагерь'},{x:-28,z:0,color:'#adacbc',label:'Базальтовые скалы'},{x:25,z:23,color:'#ffcdb2',label:'Жемчужный берег'},{x:21,z:-15,color:'#69d2e5',label:'Коралловая бухта'},{x:-27,z:-35,color:'#dcecff',label:'Ледяной мыс'},{x:0,z:-43,color:'#ffcc69',label:'Арена Голдака'}];
export const ISLAND2_SPAWNS=ISLAND2_IDS.map((id,i)=>({id,...Object.fromEntries(['x','z'].map((k,j)=>[k,[[-25,5],[-34,-8],[-20,13],[6,13],[22,22],[18,1],[30,-20],[10,31],[42,29],[18,30],[-7,4],[12,6],[12,-12],[-9,13],[-17,-13],[-17,-25],[-35,-30],[-28,-43],[53,13]][i][j]]))})).concat([{id:55,x:0,z:-43,boss:true}],TIDAL_SPAWNS,TIDAL_SUPPLEMENTS);
export function islandZone(x,z,island=1){return island>2?extraZone(x,z,island):island===1?zoneAt(x,z):z<-32&&Math.abs(x)<14?'Арена Голдака':z>16&&Math.abs(x)<15?'Приливный лагерь':x<-15&&z<-19?'Ледяной мыс':x<-15?'Базальтовые скалы':z<-8?'Коралловая бухта':'Жемчужный берег';}
export const TYPES={...EXTRA_TYPES,poison:{name:'Ядовитый',color:'#b38dcb',icon:'drop'},ghost:{name:'Призрачный',color:'#968ce0',icon:'star'},flying:{name:'Летающий',color:'#9fcde2',icon:'star'},steel:{name:'Стальной',color:'#9ab5c5',icon:'gem'},rock:{name:'Каменный',color:'#b9ad93',icon:'gem'},grass:{name:'Травяной',color:'#55b985',icon:'leaf'},fire:{name:'Огненный',color:'#f79458',icon:'flame'},water:{name:'Водный',color:'#69bced',icon:'drop'},electric:{name:'Электрический',color:'#efca49',icon:'bolt'},normal:{name:'Обычный',color:'#bfa68b',icon:'star'}};
export const STONES={...EXTRA_STONES,water:{name:'Водный камень',color:0x46c7ff},thunder:{name:'Громовой камень',color:0xffd948},fire:{name:'Огненный камень',color:0xff8840}};
export const LANDMARKS=[
 {name:'Лагерь',x:0,z:22,color:'#ffffff',label:'Лагерь исследователей'},
 {name:'Лес',x:-30,z:0,color:'#83d991',label:'Лиственный лес'},
 {name:'Озеро',x:33,z:4,color:'#74d9ff',label:'Лазурное озеро'},
 {name:'Роща',x:-28,z:-35,color:'#ffdf6b',label:'Грозовая роща'},
 {name:'Скалы',x:22,z:-40,color:'#ffb875',label:'Янтарные скалы'}
];
export const STARTER_ID=25;
export const MAX_PARTY=180;
export const ENCOUNTERS={meadow:[[25,75],[1,20],[133,5]],forest:[[1,65],[25,30],[133,5]],lake:[[7,80],[25,20]],storm:[[25,85],[1,10],[133,5]],rocks:[[4,75],[25,24.5],[6,.5]]};
export function rollEncounter(zone,rng=Math.random){let r=rng()*100;for(const [id,weight] of ENCOUNTERS[zone]){r-=weight;if(r<0)return id;}return ENCOUNTERS[zone].at(-1)[0];}
export function rarity(id){return id===131?'Морской друг · 20%':[144,145,146].includes(id)?'Легендарный · 0,005%':id===147?'Редкий · 5%':[148,149].includes(id)?'Только драконий камень':ISLAND3_IDS.includes(id)?'Долина кактусов':ISLAND4_IDS.includes(id)?'Волшебный лес':TIDAL_ADDITIONS.includes(id)?'Приливный остров':id===55?'Босс / эволюция':ISLAND2_IDS.includes(id)&&![7,8,9,134].includes(id)?'Приливный остров':id===6?'Очень редкий':id===133?'Редкий':id===25?'Стартовый':BASES.includes(id)?'Необычный':SPECIES[id].zone??'Эволюция';}
export const canBattle=id=>!!SPECIES[id]&&!SPECIES[id].transport;
export function stoneDescription(stone){return Object.entries(SPECIES).filter(([,d])=>d.stones?.[stone]).map(([,d])=>`${d.name} → ${SPECIES[d.stones[stone]].name}`).join('; ')+'.';}

export function baseStats(id){return BASE_STATS[id];}
let nextUid=1;
export function reserveUids(party){nextUid=Math.max(nextUid,1,...party.map(p=>p.uid+1));}
export function hpMax(p){return Math.floor((2*BASE_STATS[p.species].stats.hp+15)*p.level/100)+p.level+25;}
export function battleStat(p,name){return Math.floor((2*BASE_STATS[p.species].stats[name]+15)*p.level/100)+5;}
export function damageFor(p,q,special=false,rng=Math.random){const a=battleStat(p,special?'spAttack':'attack'),d=battleStat(q,special?'spDefense':'defense');const eff=special?effectiveness(SPECIES[p.species].type,SPECIES[q.species].type):1;const critical=rng()<Math.min(.18,.04+Math.max(0,battleStat(p,'speed')-battleStat(q,'speed'))/800);const damage=Math.max(2,Math.round((((2*p.level/5+2)*(special?65:40)*a/d)/50+2)*1.45*eff*(critical?1.5:1)*(.9+rng()*.1)));return {damage,eff,critical};}
export function newPokemon(species,level=5){const p={uid:nextUid++,species,level,xp:0,hp:0};p.hp=hpMax(p);return p;}
export function createState(){return {island:1,laprasUnlocked:false,bossDefeated:false,island2Wins:0,island3Wins:0,island4Wins:0,...Object.fromEntries([5,6,7,8,9,10].map(id=>['island'+id+'Wins',0])),finalDefeated:false,finalCreditsSeen:false,codeRewards:{redeemed:[],xpUntil:0,catchUntil:0},started:false,party:[],active:0,balls:20,stones:Object.fromEntries(Object.keys(STONES).map(k=>[k,0])),potions:5,seen:new Set(),caught:new Set(),wins:0,evolutions:0,pickedStones:new Set(),completed:false,visited:new Set(),captured:0};}
export function xpNeeded(p){return 18+p.level*3;}
export function evolutionOptions(p,s){const d=SPECIES[p.species];if(d.next)return [{id:d.next,available:p.level>=d.level,label:`Уровень ${d.level}`,level:d.level}];return Object.entries(d.stones||{}).map(([stone,id])=>({id,stone,available:s.stones[stone]>0,label:STONES[stone].name}));}
export function evolve(p,s,target){const option=evolutionOptions(p,s).find(x=>x.id===target);if(!option?.available)return false;if(option.stone)s.stones[option.stone]--;p.species=target;p.hp=hpMax(p);s.caught.add(target);s.seen.add(target);s.evolutions++;return true;}
export function gainXP(p,value){let levels=0;p.xp+=value;while(p.level<50&&p.xp>=xpNeeded(p)){p.xp-=xpNeeded(p);p.level++;levels++;}if(p.level===50)p.xp=0;if(levels)p.hp=hpMax(p);return levels;}
export function effectiveness(attacker,defender){const strong={fire:['grass','bug','ice'],water:['fire','rock','ground'],grass:['water','rock','ground'],electric:['water'],rock:['fire','bug','ice'],ground:['fire','electric','rock'],fighting:['normal','rock','ice'],fairy:['dragon','fighting'],psychic:['fighting','poison'],poison:['grass','fairy'],ghost:['ghost','psychic'],flying:['grass','bug','fighting'],steel:['rock','ice','fairy'],bug:['grass','psychic'],ice:['grass','ground','dragon'],dragon:['dragon']};const weak={fire:['water','rock','fire','dragon'],water:['water','grass','dragon'],grass:['fire','grass','bug','dragon'],electric:['grass','electric','dragon'],rock:['ground','fighting'],ground:['grass','bug'],fighting:['bug','psychic','fairy'],fairy:['fire'],psychic:['psychic'],bug:['fire','fighting','fairy'],ice:['fire','water','ice'],normal:['rock']};if(attacker==='electric'&&defender==='ground'||attacker==='dragon'&&defender==='fairy')return .25;if(strong[attacker]?.includes(defender))return 1.65;if(weak[attacker]?.includes(defender))return .72;return 1;}

export function catchChance(wild,state=null,now=Date.now()){const coefficient=BASE_STATS[wild.species].captureRate;const penalty=wild.species===6?.58:1;const base=Math.min(.97,(.15+coefficient/255*.35+(1-wild.hp/hpMax(wild))*.57)*penalty);return Math.min(1,base*(state?.codeRewards?.catchUntil>now?2:1));}
export function chapterComplete(s){return BASES.every(id=>s.caught.has(id))&&['water','thunder','fire'].every(k=>s.pickedStones.has(k))&&s.evolutions>=1&&s.wins>=3;}
export function zoneAt(x,z){if(z<-22&&x>3)return 'Янтарные скалы';if(z<-19&&x<-9)return 'Грозовая роща';if(x>18&&z<22)return 'Лазурное озеро';if(x<-16&&z<16)return 'Лиственный лес';if(z>16&&Math.abs(x)<15)return 'Лагерь исследователей';return 'Солнечная поляна';}
export function walkable(x,z,island=1){const radius=islandRadius(island);if((x/radius)**2+(z/radius)**2>1)return false;if(((x-35)/16)**2+((z-4)/20)**2<1)return false;return true;}
