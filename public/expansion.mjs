export const CAMP_PORTAL=Object.freeze({x:8,z:22});
export const VOLCANO_ISLAND=10;
export const VOLCANO_ARENA=Object.freeze({x:0,z:-30});
export const COLLECTION_IDS=Object.freeze(Array.from({length:151},(_,i)=>i+1));
export const collectionCount=state=>COLLECTION_IDS.filter(id=>state.caught.has(id)).length;
export const OPTIONAL_RARE_IDS=Object.freeze([144,145,146,150,151]);
export const VOLCANO_REQUIRED_IDS=Object.freeze(COLLECTION_IDS.filter(id=>!OPTIONAL_RARE_IDS.includes(id)));
export const VOLCANO_REQUIRED_COUNT=VOLCANO_REQUIRED_IDS.length;
export const volcanoCollectionCount=state=>VOLCANO_REQUIRED_IDS.filter(id=>state.caught.has(id)).length;
export const NEW_ISLAND_NAMES={5:'Электростанция',6:'Заброшенный остров',7:'Остров-заповедник',8:'Просторный остров',9:'Огненная долина',10:'Арена на вулкане'};
// First lists reproduce the photos; supplements complete the attainable 151.
export const PHOTO_ROSTERS={
 5:[81,82,25,26,135,145,100,101],
 6:[92,93,94,142,138,139,140,141],
 7:[69,70,71,1,2,48,49,123,127,46,47,10,11,12,13,14,15,43,44,45],
 8:[19,20,16,17,18,133,128,52,53,83,84,85,50,51,112,111,115],
 9:[4,5,6,126,146,136,58,59,77,78,37,38]
};
export const SUPPLEMENTAL_IDS={2:[72,73,79,80,91,98,99,130],5:[125],6:[41,42,88,89,109,110,150],7:[102,103,114],8:[21,22,23,24,29,30,31,32,33,34,95,104,105,113,143],9:[]};
export const EXPANSION_IDS=Object.fromEntries(Object.entries(PHOTO_ROSTERS).map(([id,ids])=>[id,[...ids,...SUPPLEMENTAL_IDS[id]]]));
export const ENCOUNTER_TABLES={power:[[145,.005],[81,34.995],[100,35],[125,30]],fire:[[146,.005],[4,34.995],[37,35],[58,30]],field:[[133,5],[19,47.5],[16,47.5]],mythic:[[151,.001],[63,49.999],[39,50]],ruins:[[150,.005],[92,49.995],[41,50]]};
export function rollTable(name,rng=Math.random){let r=rng()*100;for(const [id,weight] of ENCOUNTER_TABLES[name]){r-=weight;if(r<0)return id;}return ENCOUNTER_TABLES[name].at(-1)[0];}
function positions(count,radius){
 const result=[];for(let n=0;result.length<count;n++){
  const a=n*2.399963,r=23+Math.sqrt(((n*37)%101)/101)*(radius-38),x=Math.round(Math.cos(a)*r),z=Math.round(Math.sin(a)*r);
  if(Math.abs(x)<5||Math.hypot(x,z-23)<17||((x-35)/22)**2+((z-4)/26)**2<1||result.some(p=>Math.hypot(x-p.x,z-p.z)<7))continue;
  result.push({x,z});
 }return result;
}
export const EXPANSION_SPAWNS=Object.fromEntries(Object.entries(EXPANSION_IDS).map(([key,ids])=>{
 const island=Number(key),ordinary=ids.filter(id=>![145,146,150,133].includes(id)),points=positions(ordinary.length,island===8?108:island===7?88:65);
 const rows=ordinary.map((id,i)=>({id,...points[i]}));
 if(island===5||island===9)for(const [x,z] of [[-18,-34],[9,-41],[29,-31]])rows.push({id:island===5?81:4,x,z,table:island===5?'power':'fire'});
 if(island===8)for(const [x,z] of [[-15,12],[12,40],[51,40]])rows.push({id:19,x,z,table:'field'});
 if(island===6)for(const [x,z] of [[-18,-34],[9,-41],[29,-31]])rows.push({id:92,x,z,table:'ruins'});
 return [island,rows];
}));
EXPANSION_SPAWNS[10]=[];
export const TIDAL_SUPPLEMENTS=SUPPLEMENTAL_IDS[2].map((id,i)=>({id,x:[-45,-46,-18,-31,20,5,-8,-43][i],z:[15,-10,31,36,-36,-20,-37,-38][i]}));
export const NEW_LANDMARKS={
 5:[['Лагерь энергетиков',0,22,'#fff1b5'],['Турбинный зал',-26,0,'#82bcc5'],['Катушки молний',7,-32,'#ffe475'],['Заброшенная подстанция',-28,-34,'#b2a8cc'],['Охладительный пруд',35,4,'#8bcfe1']],
 6:[['Лагерь археологов',0,22,'#e8d5b4'],['Призрачные руины',-27,-8,'#a79dd8'],['Древние останки',-26,-34,'#d8c69f'],['Разрушенная башня',12,-36,'#a8a1bb'],['Туманный берег',35,4,'#91b4bf']],
 7:[['Лагерь заповедника',0,22,'#fff1bb'],['Тропа бабочек',-34,15,'#bfce6a'],['Бамбуковая чаща',-31,-38,'#6ba97a'],['Сад хищных растений',22,-37,'#d4a871'],['Лесное озеро',35,4,'#87c6c5']],
 8:[['Полевой лагерь',0,22,'#fff1bf'],['Цветущие луга',-40,30,'#eed092'],['Птичьи скалы',-43,-43,'#adb8bd'],['Саванна Тауросов',37,-47,'#dbbd7b'],['Дальнее поле',10,75,'#b6cc7d'],['Пруд в долине',35,4,'#84cfd6']],
 9:[['Лагерь у вулкана',0,22,'#ffcc8f'],['Обсидиановые скалы',-30,-6,'#8a7796'],['Огненное ущелье',-25,-35,'#faad66'],['Гнездо Молтреса',16,-39,'#ffd874'],['Лавовый пруд',35,4,'#ff7c49']],
 10:[['Последний лагерь',0,22,'#ffd59c'],['Мост к кратеру',0,0,'#caa994'],['Арена Нечто-Р',0,-30,'#ef8a90']]
};
for(const [id,rows] of Object.entries(NEW_LANDMARKS))NEW_LANDMARKS[id]=rows.map(([label,x,z,color])=>({label,x,z,color}));
export const NEW_ZONES=Object.fromEntries(Object.entries(NEW_LANDMARKS).map(([id,rows])=>[id,rows.map(row=>row.label)]));
export const ISLAND_THEME={
 1:{sky:'#addcdf',ground:'#91bd74'},2:{sky:'#a9dce9',ground:'#d8d8b8'},3:{sky:'#ead5b9',ground:'#e4c48f'},4:{sky:'#dfcee8',ground:'#b9c899'},
 5:{sky:'#b6c9d3',ground:'#869e96'},6:{sky:'#aaa9c0',ground:'#98968c'},7:{sky:'#c2e0cb',ground:'#80ae77'},8:{sky:'#b7dfe9',ground:'#b5ca80'},9:{sky:'#d7aaa2',ground:'#b0806a'},10:{sky:'#6e526c',ground:'#6b5969'}
};
