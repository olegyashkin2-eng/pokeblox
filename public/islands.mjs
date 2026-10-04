// The handwritten island roster. Encounter percentages are game rules,
// independent of the official base statistics in stats.mjs.
import {NEW_ISLAND_NAMES,NEW_ZONES,NEW_LANDMARKS,volcanoCollectionCount,VOLCANO_REQUIRED_COUNT,VOLCANO_ISLAND} from './expansion.mjs';
export * from './expansion.mjs';
export const ISLAND_NAMES={1:'Канто',2:'Приливный остров',3:'Долина кактусов',4:'Волшебный лес',...NEW_ISLAND_NAMES};
export const ISLAND3_IDS=[27,28,56,57,66,67,68,106,107];
export const ISLAND4_IDS=[39,40,35,36,43,44,45,46,47,48,49,63,64,65,69,70,71,96,97,108,122,124,132,137,10,11,12,13,14,15,151];
export const TIDAL_ADDITIONS=[147,148,149,120,121,144,131];
const rows=[
 [150,'Мьюту','psychic',2.7,6,'Психический разряд'],
 [151,'Мью','psychic',1.25,4,'Сфера ауры'],
 [147,'Дратини','dragon',1.65,2,'Драконий пульс',{stones:{dragon:148}}],
 [148,'Драгонэйр','dragon',2.5,2,'Драконий пульс',{stones:{dragon:149}}],
 [149,'Драгонайт','dragon',2.8,2,'Драконий метеор'],
 [120,'Старью','water',1.2,2,'Звёздная волна',{stones:{water:121}}],
 [121,'Старми','water',1.7,2,'Звёздный поток'],
 [144,'Артикуно','ice',2.8,2,'Ледяной луч'],
 [131,'Лапрас','water',2.8,2,'Морская переправа',{transport:true}],
 [27,'Сэндшрю','ground',1.2,3,'Песчаный вихрь',{next:28,level:22}],
 [28,'Сэндслэш','ground',1.8,3,'Песчаная буря'],
 [56,'Манки','fighting',1.35,3,'Удар карате',{next:57,level:28}],
 [57,'Праймейп','fighting',1.8,3,'Серия ударов'],
 [66,'Мачоп','fighting',1.4,3,'Силовой удар',{next:67,level:28}],
 [67,'Мачок','fighting',2.1,3,'Сейсмический бросок',{next:68,level:36}],
 [68,'Мачамп','fighting',2.55,3,'Четыре кулака'],
 [106,'Хитмонли','fighting',2.05,3,'Удар с разворота'],
 [107,'Хитмончан','fighting',1.9,3,'Комета кулаков'],
 [39,'Джигглипафф','fairy',1.15,4,'Звёздная песня',{stones:{moon:40}}],
 [40,'Вигглитафф','fairy',1.8,4,'Лунная песня'],
 [35,'Клефейри','fairy',1.3,4,'Лунный свет',{stones:{moon:36}}],
 [36,'Клефейбл','fairy',1.95,4,'Лунный поток'],
 [43,'Оддиш','grass',1.05,4,'Листовой вихрь',{next:44,level:21}],
 [44,'Глум','grass',1.45,4,'Цветочный порошок',{stones:{leaf:45}}],
 [45,'Вайлплум','grass',1.9,4,'Танец лепестков'],
 [46,'Парас','bug',.95,4,'Грибные споры',{next:47,level:24}],
 [47,'Парасект','bug',1.65,4,'Облако спор'],
 [48,'Венонат','bug',1.35,4,'Пыльца',{next:49,level:31}],
 [49,'Веномот','bug',1.95,4,'Вихрь пыльцы'],
 [63,'Абра','psychic',1.2,4,'Психоволна',{next:64,level:16}],
 [64,'Кадабра','psychic',1.9,4,'Психолуч',{next:65,level:36}],
 [65,'Алаказам','psychic',2.05,4,'Психокинез'],
 [69,'Беллспраут','grass',1.4,4,'Хлыст лозы',{next:70,level:21}],
 [70,'Випинбелл','grass',1.6,4,'Листорез',{stones:{leaf:71}}],
 [71,'Виктрибелл','grass',2.3,4,'Солнечная лоза'],
 [96,'Дроузи','psychic',1.5,4,'Сонная волна',{next:97,level:26}],
 [97,'Гипно','psychic',2.15,4,'Маятник'],
 [108,'Ликитунг','normal',1.9,4,'Удар языком'],
 [122,'Мистер Майм','psychic',1.95,4,'Психобарьер'],
 [124,'Джинкс','ice',2,4,'Ледяной танец'],
 [132,'Дитто','normal',1,4,'Эластичный удар'],
 [137,'Поригон','normal',1.5,4,'Тройной луч'],
 [10,'Катерпи','bug',.95,4,'Шёлковая нить',{next:11,level:7}],
 [11,'Метапод','bug',1.1,4,'Укреплённый удар',{next:12,level:10}],
 [12,'Баттерфри','bug',1.7,4,'Пыльца крыльев'],
 [13,'Видл','bug',1,4,'Ядовитая игла',{next:14,level:7}],
 [14,'Какуна','bug',1.2,4,'Панцирный удар',{next:15,level:10}],
 [15,'Бидрилл','bug',1.85,4,'Двойное жало']
];
export const EXTRA_SPECIES=Object.fromEntries(rows.map(([id,name,type,height,island,move,extra={}])=>[id,{name,type,height,island,zone:ISLAND_NAMES[island],move,...extra}]));
export const EXTRA_STONES={dragon:{name:'Драконий камень',color:0x8772ff},moon:{name:'Лунный камень',color:0xf3b9ef},leaf:{name:'Лиственный камень',color:0x7ae695}};
export const EXTRA_TYPES={ground:{name:'Земляной',color:'#d9b769',icon:'gem'},fighting:{name:'Боевой',color:'#d68e69',icon:'star'},fairy:{name:'Волшебный',color:'#eba8d0',icon:'star'},psychic:{name:'Психический',color:'#c789e8',icon:'star'},bug:{name:'Насекомый',color:'#b4cc6c',icon:'leaf'},ice:{name:'Ледяной',color:'#a0e6f2',icon:'drop'},dragon:{name:'Драконий',color:'#a193f3',icon:'bolt'}};
export const TIDAL_ENCOUNTERS=Object.freeze([[144,.005],[147,5],[131,20],[120,44.995],[121,30]].map(Object.freeze));
export function rollTidal(rng=Math.random){let r=rng()*100;for(const [id,p] of TIDAL_ENCOUNTERS){r-=p;if(r<0)return id;}return 121;}
export const TIDAL_SPAWNS=[{id:120,x:17,z:-12,table:'tidal'},{id:120,x:36,z:28,table:'tidal'},{id:120,x:14,z:15,table:'tidal'}];
export const ISLAND3_SPAWNS=ISLAND3_IDS.map((id,i)=>({id,x:[-18,-37,-30,-15,4,17,9,36,27][i],z:[7,-5,-27,-39,-15,-34,-48,29,23][i]}));
export const ISLAND4_SPAWNS=ISLAND4_IDS.filter(id=>id!==151).map((id,i)=>{
 const positions=[[-17,10],[-35,18],[-22,-13],[-43,-8],[-8,2],[-48,26],[-60,0],[-36,-29],[-48,-43],[-16,-34],[-30,-57],[4,-10],[15,-31],[4,-60],[16,12],[15,-4],[38,-28],[56,-24],[58,-42],[45,34],[-9,-57],[24,-60],[-14,40],[20,43],[-32,41],[-47,42],[-59,30],[1,45],[35,48],[51,49]];
 return {id,x:positions[i][0],z:positions[i][1]};
}).concat([[-17,-49],[9,-50],[-33,-43]].map(([x,z])=>({id:63,x,z,table:'mythic'})));
export const EXTRA_ZONES={3:['Лагерь долины','Кактусовая роща','Песчаные террасы','Арена кулаков','Тихий оазис'],4:['Лесной лагерь','Розовая чаща','Золотая роща','Лунная поляна','Грибная тропа','Озеро снов']};
export function extraZone(x,z,island){if(island>=5){const places=NEW_LANDMARKS[island];return places.reduce((best,p)=>Math.hypot(x-p.x,z-p.z)<Math.hypot(x-best.x,z-best.z)?p:best).label;}if(Math.hypot(x,z-23)<13)return EXTRA_ZONES[island][0];if(island===3)return z<-28?'Арена кулаков':x<-18?'Кактусовая роща':x>20?'Тихий оазис':'Песчаные террасы';return z<-40?'Лунная поляна':x<-30&&z>15?'Грибная тропа':x<-10?'Розовая чаща':x>22&&z<24?'Озеро снов':'Золотая роща';}
export const EXTRA_LANDMARKS={3:[{x:0,z:22,label:'Лагерь долины',color:'#fff5cd'},{x:-30,z:0,label:'Кактусовая роща',color:'#69aa73'},{x:2,z:-15,label:'Песчаные террасы',color:'#e5b77e'},{x:0,z:-42,label:'Арена кулаков',color:'#d9855e'},{x:35,z:4,label:'Тихий оазис',color:'#73d7d6'}],4:[{x:0,z:22,label:'Лесной лагерь',color:'#fff5df'},{x:-34,z:-9,label:'Розовая чаща',color:'#eea5c6'},{x:14,z:45,label:'Золотая роща',color:'#f0d278'},{x:-5,z:-58,label:'Лунная поляна',color:'#c2b5f3'},{x:-45,z:33,label:'Грибная тропа',color:'#ecb992'},{x:35,z:4,label:'Озеро снов',color:'#b0dde8'}]};
Object.assign(EXTRA_ZONES,NEW_ZONES);Object.assign(EXTRA_LANDMARKS,NEW_LANDMARKS);
export const islandRadius=id=>id===8?108:[4,7].includes(id)?88:65;
export function travelReason(state,id){if(id===state.island)return 'Ты здесь';if(!ISLAND_NAMES[id])return 'Неизвестный остров';if(id===2&&state.wins<3)return `Нужно 3 победы · ${state.wins}/3`;if(id>2&&!state.laprasUnlocked)return 'Подружись с Лапрасом на Приливном острове';if(id===VOLCANO_ISLAND&&volcanoCollectionCount(state)<VOLCANO_REQUIRED_COUNT)return `Собери ${VOLCANO_REQUIRED_COUNT} видов · ${volcanoCollectionCount(state)}/${VOLCANO_REQUIRED_COUNT} (пять редких не нужны)`;return '';}
export function befriendLapras(state){if(state.laprasUnlocked)return false;state.laprasUnlocked=true;state.seen.add(131);state.caught.add(131);return true;}
const originalPickups=[{type:'thunder',x:-28,z:-35},{type:'fire',x:23,z:-40},{type:'water',x:35,z:27}].map(p=>({...p,kind:'stone'})).concat([[-9,18],[8,5],[-25,9],[-33,-17],[2,-23],[15,-38],[20,24],[42,29],[3,34],[-15,-34]].map(([x,z],i)=>({x,z,kind:['potion','xp','balls'][i%3]})));
export const PICKUP_LAYOUTS=Object.fromEntries([1,2,3,4].map(id=>[id,[...originalPickups,...(id===2?[{kind:'stone',type:'dragon',x:11,z:-25}]:id===4?[{kind:'stone',type:'moon',x:-8,z:-62},{kind:'stone',type:'leaf',x:-44,z:36}]:[])]]));

for(const id of [5,6,7,8,9,10])PICKUP_LAYOUTS[id]=[...originalPickups,...([{kind:'stone',type:id===5?'thunder':id===6?'moon':id===7?'leaf':id===9?'fire':'dragon',x:-12,z:-24}])];
