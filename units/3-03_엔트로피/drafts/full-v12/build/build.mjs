import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const require=createRequire(import.meta.url);
const {FontLibrary,Canvas}=require('/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/node_modules/skia-canvas');
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT='/Users/keemhayeon/Downloads/Codex/scieum_ppt';
const OUT=path.resolve(HERE,'../preview');
const U=path.join(ROOT,'units/3-03_엔트로피');
const AS=path.join(U,'assets');
const pageMap=[];
const A=path.join(AS,'originals');
const fonts=['Regular','Medium','Bold'].map(w=>path.join(ROOT,`output/fonts/Pretendard-${w}.otf`));
const registered=FontLibrary.use('Pretendard',[...fonts,path.join(HERE,'Pretendard-H-regular-Oblique.ttf'),path.join(HERE,'Pretendard-H-bold-Oblique.ttf')]);await fs.writeFile(path.join(HERE,'font-registration.json'),JSON.stringify(registered,null,2));
const ctx=new Canvas(10,10).getContext('2d');
const p=Presentation.create({slideSize:{width:1920,height:1080}});
const C={green:'#9FFF68',gray:'#898989',light:'#F5F5F5',dark:'#484847',black:'#000000'};
let assets={};try{assets=JSON.parse(await fs.readFile(path.join(HERE,'original-character-assets.json'),'utf8'))}catch{}
const intentional=[];
function box(s,x,y,w,h,fill,name='box',radius=0){return s.shapes.add({geometry:radius?'roundRect':'rect',name,position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0},...(radius?{borderRadius:radius}:{})})}
function text(s,str,x,y,w,h,size=48,color=C.black,bold=false,align='left',name='text'){
 const q=s.shapes.add({geometry:'textbox',name,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 q.text=str;q.text.style={fontSize:size,typeface:'Pretendard',color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',wrap:'none',insets:0};return q;
}
function rich(s,runs,x,y,w,h,size=48,color=C.black,bold=false,align='left',name='rich'){
 const q=text(s,'',x,y,w,h,size,color,bold,align,name);q.text=[runs.flatMap(v=>{const obj=typeof v==='string'?{run:v}:v;return chem(obj.run).map(c=>({run:c.run,style:{...obj.style,...c.style}}));})];return q;
}
const r=(run,style={})=>({run,style});
function chem(str){
 const out=[];const re=/\((aq|s|l|g)(?=[),])|Δ([fr])?H/g;let last=0,m;
 while((m=re.exec(str))){if(m.index>last)out.push(r(str.slice(last,m.index)));if(m[1])out.push(r('('),r(m[1],{italic:true,typeface:'Pretendard'}));else {out.push(r('Δ'));if(m[2])out.push(r(m[2]));out.push(r('H',{italic:true,typeface:'Pretendard'}));}last=re.lastIndex;}if(last<str.length)out.push(r(str.slice(last)));return out;
}

async function img(s,file,x,y,w,h,name='image',fit='contain'){
 const b=await fs.readFile(file);return s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:name,name,fit,position:{left:x,top:y,width:w,height:h}});
}
async function branding(s,cover=false,dark=false){
 await img(s,path.join(ROOT,'units/3-01_엔탈피와열화학반응식/assets/v10-part-sci_eum_logo.png'),1778.667,40,108,77.333,'사이음 공식 로고');
 if(cover)await img(s,path.join(A,'tsherpa.png'),1601.333,42.667,154.667,66.667,'T셀파 공식 로고 — 첫 장만');
 text(s,'© 2026. @sci_eum. All rights reserved.',1440,1034,440,30,21,dark?'#FFFFFF':C.black,false,'right','copyright');
}
async function header(s,part,num,topic){await branding(s,false,true);text(s,part,72,76,1530,54,38,C.gray,true);text(s,num,72,134,70,64,48.8,C.green,true);text(s,topic,146,134,1550,64,48.8,'#FFFFFF',true);}
function title(s,str,y=270,col=C.black){return text(s,str,100,y,1720,112,76.4,col,true,'center','핵심 문장')}
function note(s,str){s.speakerNotes.text=str;}
function line(s,x1,y1,x2,y2,col,width=5,name='line'){
 let x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(1,Math.abs(x2-x1)),h=Math.max(1,Math.abs(y2-y1));
 const a=s.shapes.add({geometry:'custom',name,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:col,width,style:'solid'},customPaths:[{width:w,height:h,commands:[{moveTo:{x:x1-x,y:y1-y}},{lineTo:{x:x2-x,y:y2-y}}]}]});return a;
}
function dot(s,x,y,col,size=20){return s.shapes.add({geometry:'ellipse',position:{left:x-size/2,top:y-size/2,width:size,height:size},fill:col,line:{fill:'none',width:0}})}

function finish(s,n,details,src){pageMap.push(n);note(s,`3-03 엔트로피 · 전체 수업 · ${n}/26장.
${details}
출처: ${src}
디자인 근거: brief.md 사용자 직접 수정본40장과 장별 source-adoption. 등록 원본 캐릭터는 재생성하지 않음. 과학 원본식은 교과서 크롭. 디자인 확인 전 전체 검토본.`);}
async function crop(s,id,x,y,w,h,alt=id){return img(s,path.join(AS,'crops',id+'.png'),x,y,w,h,alt)}
function roundedTable(s,values,x=199,y=485,w=1523,h=425){
 const widths=[285,330,330,578];const nr=values.length,nc=values[0].length;
 const t=s.tables.add({rows:nr,columns:nc,left:x,top:y,width:w,height:h,values:values.map(row=>row.map(v=>[chem(v)])),columnWidths:widths});
 t.borders.assign({fill:'#777777',style:'solid',width:1});
 for(let a=0;a<nr;a++)for(let b=0;b<nc;b++){const c=t.getCell(a,b);c.fill=a===0||b===0?'#3D3D3D':'#252525';c.text.style={typeface:'Pretendard',fontSize:a===0?37:39,bold:a===0,color:'#FFFFFF',alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 const rad=24;for(const [xx,yy,rot] of [[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]])s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#000000',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:10,y1:0,x2:0,y2:10,x:0,y:rad}},{close:{}}]}]});return t;
}

async function part(n,k,name,question){
 const s=p.slides.add();await img(s,path.join(AS,'generated/cover-entropy-green-v04.png'),0,0,1920,1080,'표지와 같은 엔트로피 장면');box(s,0,0,1920,1080,'#000000/51','Part 51% 어두운 덮개');
 text(s,'Part '+k,150,323,1500,90,60,C.green,true);text(s,name,150,434,1620,140,96,'#FFFFFF',true);text(s,question,154,621,1610,95,42,'#FFFFFF');await branding(s,false,true);finish(s,n,question,'천재90~91. 기존 표지 장면·Part 전환 레퍼런스.');
}

async function miniTable(s,values,x,y,w,h,widths){
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,values,columnWidths:widths});
 t.borders.assign({fill:'#666666',style:'solid',width:1});
 for(let i=0;i<values.length;i++)for(let j=0;j<values[0].length;j++){const c=t.getCell(i,j);c.fill=i===0?'#253723':j===0?'#333333':'#202020';c.text.style={typeface:'Pretendard',fontSize:34,bold:i===0,color:i>0&&j===values[0].length-1?C.green:'#FFFFFF',alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 return t;
}
function tagRow(s,label,body,y,x=192,w=1537){box(s,x,y,300,116,'#253723','표제',16);text(s,label,x+18,y+15,264,86,38,C.green,true,'center');box(s,x+321,y,w-321,116,'#202020','설명',16);text(s,body,x+355,y+15,w-390,86,36,'#FFFFFF');}
async function expansion(n,partnum,data){
 if(process.env.RENDER_PAGE && Number(process.env.RENDER_PAGE)!==n)return;
 const [topic,heading,rows,footer,source,notes]=data;
 const s=p.slides.add();s.background.fill='#000000';
 await header(s,['','Part 1 엔트로피의 의미','Part 2 엔트로피 변화','Part 3 엔트로피 변화의 적용'][partnum],'01',topic);
 title(s,heading,245,'#FFFFFF');
 if(n===8){
  await img(s,path.join(HERE,'water-states-figure.png'),310,410,1300,408,'같은 물질의 세 상태 원본');
  const labels=['고체','액체','기체'];const main=['제자리에서 진동','서로 가까이서 이동','넓은 공간을 자유롭게 이동'];
  for(let i=0;i<3;i++){const x=225+i*495;text(s,labels[i],x,843,480,56,38,C.green,true,'center');text(s,main[i],x,912,480,60,33,'#FFFFFF',false,'center');}
 }else if(n===9){
  box(s,200,425,730,190,'#202020','비교조건1',22);box(s,990,425,730,190,'#202020','비교조건2',22);
  text(s,'같은 물질',240,449,650,62,44,C.green,true,'center');text(s,'얼음·물·수증기는 모두 물 분자',240,526,650,56,34,'#FFFFFF',false,'center');
  text(s,'같은 양',1030,449,650,62,44,C.green,true,'center');text(s,'물질의 양을 같게 두고 비교',1030,526,650,56,34,'#FFFFFF',false,'center');
  text(s,'일반적인 엔트로피 크기',460,676,1000,64,40,'#FFFFFF',true,'center');
  for(let i=0;i<3;i++){const x=350+i*450;box(s,x,775,320,112,i===2?'#253723':'#202020','상태 비교',16);text(s,['고체','액체','기체'][i],x,797,320,68,48,i===2?C.green:'#FFFFFF',true,'center');if(i<2)text(s,'보다 작다',x+320,811,130,50,26,'#A6A6A6',false,'center');}
  text(s,'물질의 종류와 양이 다르면 상태만으로 단순 비교할 수 없다.',200,945,1520,64,35,'#A6A6A6',false,'center');
 }else if(n===12){
  await eq(s,'delta',620,412,680);
  const cards=[['엔트로피 증가','최종값이 초기값보다 크다.','변화량은 양수'],['엔트로피 감소','최종값이 초기값보다 작다.','변화량은 음수']];
  cards.forEach((v,i)=>{const x=210+i*790;box(s,x,620,710,295,'#202020','증가감소 비교',22);text(s,v[0],x+30,643,650,70,44,C.green,true,'center');text(s,v[1],x+30,733,650,65,36,'#FFFFFF',false,'center');text(s,v[2],x+30,827,650,60,39,'#FFFFFF',true,'center');});
  text(s,'음수인 것은 엔트로피 자체가 아니라 처음과 나중의 차이이다.',200,958,1520,57,34,'#A6A6A6',false,'center');
 }else if(n===14){
  text(s,'출발 상태와 도착 상태를 짝지어 비교한다.',200,366,1520,66,38,'#A6A6A6',false,'center');
  await miniTable(s,[['비교하는 상태','엔트로피 증가','엔트로피 감소'],['고체 · 액체','고체 → 액체  /  융해','액체 → 고체  /  응고'],['액체 · 기체','액체 → 기체  /  기화','기체 → 액체  /  액화'],['고체 · 기체','고체 → 기체','기체 → 고체']],192,495,1537,440,[357,590,590]);
 }else if(n===16){
  await eq(s,'ammonia',370,425,1180);
  line(s,420,565,1030,565,C.green,3);line(s,1230,565,1520,565,C.green,3);
  box(s,250,635,650,232,'#202020','반응 전 분자수',22);box(s,1020,635,650,232,'#202020','반응 후 분자수',22);
  text(s,'질소 1개 + 수소 3개',290,658,570,60,37,'#A6A6A6',false,'center');text(s,'기체 분자 4개',290,746,570,84,59,'#FFFFFF',true,'center');
  text(s,'암모니아 2개',1060,658,570,60,37,'#A6A6A6',false,'center');text(s,'기체 분자 2개',1060,746,570,84,59,C.green,true,'center');
  text(s,'기체 분자 수 감소 → 엔트로피 감소',270,942,1380,70,46,C.green,true,'center');
 }else if(n===17){
  await crop(s,'ammonia-model',120,455,860,410,'반응 전후 원자의 색과 수를 비교하는 원본 모형');
  await miniTable(s,[['비교 대상','반응 전','반응 후'],['질소 원자','2개','2개'],['수소 원자','6개','6개'],['기체 분자','4개','2개']],1030,450,770,430,[330,220,220]);
  text(s,'원자는 보존되고, 원자가 묶인 분자의 수가 달라진다.',170,938,1580,70,43,C.green,true,'center');
 }else if(n===19){
  await crop(s,'gas-mixing',160,441,600,555,'혼합 전후 분자수와 분포 비교 원본');
  const entries=[['유지','각 기체의 분자 수'],['변화','각 기체가 퍼지는 공간'],['결론','혼합으로 엔트로피 증가']];
  entries.forEach((v,i)=>{const y=478+i*164;box(s,885,y,220,116,'#253723','표제',16);text(s,v[0],900,y+16,190,82,38,C.green,true,'center');box(s,1125,y,645,116,'#202020','해설',16);text(s,v[1],1150,y+16,595,82,36,'#FFFFFF');});
 }else if(n===25){
  text(s,'틀린 부분을 찾고, 아래의 사례로 바르게 설명해 보자.',150,365,1620,65,38,'#A6A6A6',false,'center');
  const claims=[['분자 수가 줄면','원자 수도 줄어든다.','암모니아 합성'],['분자 수가 같으면','엔트로피도 같다.','서로 다른 두 기체의 혼합'],['얼음이 녹으면','분자 종류가 바뀐다.','얼음의 융해']];
  claims.forEach((v,i)=>{const x=170+i*535;box(s,x,480,510,452,'#202020','오개념 수정 과제',22);text(s,'0'+(i+1),x+35,505,440,65,44,C.green,true);text(s,v[0],x+35,609,440,62,37,'#FFFFFF',true);text(s,v[1],x+35,675,440,62,37,'#FFFFFF',true);line(s,x+35,778,x+475,778,'#555555',1);text(s,'설명에 사용할 사례',x+35,808,440,45,27,'#A6A6A6');text(s,v[2],x+35,860,440,52,31,C.green,true);});
 }
 finish(s,n,notes,source+'; 디자인: 21장 표제·해설, R04 PDF25 대응 패널, R05 PDF32 비교표, R06 PDF15 대조 패널을 역할별 재현.');
}

async function eq(s,id,x,y,w){const m=JSON.parse(await fs.readFile(path.join(AS,'generated/equations-v10/manifest.json'),'utf8')).find(a=>a.id===id);return img(s,path.join(AS,'generated/equations-v10',id+'.png'),x,y,w,w*m.size[1]/m.size[0],'신규 생성 교과서 세리프 수식 '+id);}

{
 const s=p.slides.add();s.background.fill='#0C7D08';await img(s,path.join(AS,'generated/cover-entropy-green-v04.png'),0,0,1920,1080,'기존 엔트로피 네 학생 장면');
 box(s,0,0,1920,1080,'linear(0deg, #0C7D08 0%, #0C7D08/98 24%, #0C7D08/88 38%, #0C7D08/28 61%, #0C7D08/0 78%)','장면으로 사라지는 깊은 초록');
 text(s,'Ⅲ. 화학 변화의 자발성',139,210,1600,140,122,'#FFFFFF',true);text(s,'03. 엔트로피',139,331,1600,160,122,'#FFFFFF',true);text(s,'사이음 저',143,545,400,60,40,'#FFFFFF');
 text(s,'본 수업 자료에 사용된 일부 이미지는 생성형 AI 기술을 활용하여 제작되었습니다.',45,1035,1300,30,21,'#FFFFFF');await branding(s,true,true);
 finish(s,1,'방향제·얼음·혼합 입자가 있는 기존 장면을 보며 엔트로피 단원을 시작한다.','기존 생성 편집 cover-entropy-green-v04.png. R04 PDF1 표지 위계.');
}
{
 const s=p.slides.add();s.background.fill='#000000';
 const cv=new Canvas(1920,1080),cx=cv.getContext('2d');const gr=cx.createRadialGradient(960,1120,10,960,1120,1040);gr.addColorStop(0,'#164426');gr.addColorStop(.55,'#061C0C');gr.addColorStop(1,'#000000');cx.fillStyle=gr;cx.fillRect(0,0,1920,1080);await fs.writeFile(path.join(HERE,'hook-background.png'),await cv.toBuffer('png'));await img(s,path.join(HERE,'hook-background.png'),0,0,1920,1080,'분리된 초록 분위기 배경');
 await header(s,'Part 0 동기 유발','01','방향제와 확산');
 title(s,'떨어져 있어도 향기를 맡을 수 있는 까닭은?',245,'#FFFFFF');
 text(s,'방향제 근처에 있던 향기 입자는 시간이 지나면 어떻게 분포할까?',160,365,1600,70,38,'#A6A6A6',false,'center');
 await img(s,path.join(AS,'generated/hook-two-students-diffusion-v12.png'),170,440,1580,610,'남녀 학생 전신과 향기 입자가 사방으로 퍼지는 모형');
 text(s,'작은 점은 눈에 보이지 않는 향기 입자를 나타낸 모형이다.',95,987,1320,42,26,'#A6A6A6');
 finish(s,2,'방향제 근처에서 나온 향기 입자가 공기 중으로 퍼져 멀리 떨어진 사람에게도 도달한다. 작은 점은 실제로 보이는 먼지나 연기가 아니라 향기 입자를 표현한 모형이다. 처음과 시간이 지난 뒤 입자의 분포를 비교하게 하고, 엔트로피와의 연결은 개념 학습 후 회수한다.','천재90 도입·91 혼합; 등록 두 학생을 참조한 전신 확장·향기 입자 모형 생성 hook-two-students-diffusion-v12.png.');
}
{
 const s=p.slides.add();s.background.fill='#000000';text(s,'수업 목차',326,240,1268,126,100,'#FFFFFF',true,'center');
 const titles=[['엔트로피의','의미'],['엔트로피','변화'],['엔트로피 변화의','적용']];
 for(let i=0;i<3;i++){const x=370+i*393,y=480;s.shapes.add({geometry:'custom',name:'깊은 꺾임 목차 원본 윤곽',position:{left:x,top:y,width:410,height:350},fill:'#252525',line:{fill:'none',width:0},customPaths:[{width:410,height:350,commands:[{moveTo:{x:20,y:0}},{lineTo:{x:328,y:0}},{cubicBezTo:{x1:339,y1:0,x2:345,y2:5,x:349,y:15}},{lineTo:{x:408,y:168}},{cubicBezTo:{x1:411,y1:173,x2:411,y2:177,x:408,y:183}},{lineTo:{x:349,y:335}},{cubicBezTo:{x1:345,y1:345,x2:339,y2:350,x:328,y:350}},{lineTo:{x:20,y:350}},{cubicBezTo:{x1:6,y1:350,x2:0,y2:340,x:4,y:328}},{lineTo:{x:49,y:182}},{cubicBezTo:{x1:51,y1:177,x2:51,y2:173,x:49,y:168}},{lineTo:{x:4,y:22}},{cubicBezTo:{x1:0,y1:10,x2:6,y2:0,x:20,y:0}},{close:{}}]}]});text(s,`Part ${i+1}`,x+78,y+65,280,60,38,C.green,true);text(s,titles[i][0],x+78,y+146,295,62,40,'#FFFFFF',true);text(s,titles[i][1],x+78,y+211,295,62,40,'#FFFFFF',true);}
 await branding(s,false,true);
 finish(s,3,'뜻을 이해하고 변화의 기준을 배운 다음 교과서 확인문제에 적용한다.','천재90~91; R04 PDF3 세 블록 목차.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await branding(s,false,true);text(s,'학습 목표',326,210,1268,126,100,'#FFFFFF',true,'center');box(s,154,424,1611,451,'#484847','학습 목표 한 상자',30);
 const goals=['엔트로피의 의미를 물질의 상태와 연결해 설명한다.','상태 변화와 기체 혼합에 따른 엔트로피 변화를 비교한다.','기체 분자 수를 근거로 반응의 엔트로피 변화를 판단한다.'];
 for(let i=0;i<3;i++){const y=480+i*120;text(s,String(i+1).padStart(2,'0'),245,y,100,82,46,C.green,true);text(s,goals[i],380,y,1280,82,44,'#FFFFFF');}
 finish(s,4,'엔트로피의 증가와 감소를 정성적으로 설명한다. 자발성의 전체 엔트로피 판정은 다음 단원에서 다룬다.','천재90~91; 지도서116; 완자2022 138~139. 사용자 수정본3 목표 그룹.');
}
await part(5,1,'엔트로피의 의미','같은 물질도 입자의 배열이 달라지면 무엇이 달라질까?');
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 1 엔트로피의 의미','01','엔트로피');
 text(s,'엔트로피는 물질의 무질서도를 나타내는 척도이다.',260,279,1400,90,48,'#FFFFFF',true,'center');
 text(s,'엔트로피(Entropy)',480,436,800,110,74,'#FFFFFF',true,'center');text(s,'S',1340,436,130,110,74,'#FFFFFF',true,'center');
 line(s,547,550,1213,550,'#7AB64D',3,'용어 밑줄');line(s,1355,550,1455,550,'#7AB64D',3,'기호 밑줄');
 line(s,880,552,880,598,'#9FFF68',2);line(s,874,590,880,598,'#9FFF68',2);line(s,886,590,880,598,'#9FFF68',2);
 line(s,1405,552,1405,598,'#9FFF68',2);line(s,1399,590,1405,598,'#9FFF68',2);line(s,1411,590,1405,598,'#9FFF68',2);
 text(s,'입자의 배열·운동과 관련된 무질서도',545,613,670,55,30,'#FFFFFF',false,'center');text(s,'엔트로피의 기호',1255,613,300,55,30,'#FFFFFF',false,'center');
 box(s,628,775,176,61,'#253723','무질서도 강조');box(s,982,775,176,61,'#253723','엔트로피 강조');
 rich(s,[r('무질서도',{bold:true}),r('가 클수록 '),r('엔트로피',{bold:true}),r('가 크다.')],400,764,1120,90,47,'#FFFFFF',false,'center');
 text(s,'고체·액체·기체에서 입자의 배열과 운동을 비교해 보자.',250,898,1420,65,36,'#A6A6A6',false,'center');
 finish(s,6,'엔트로피의 정의를 읽고 용어와 기호를 직접 연결한다. 무질서도의 크기와 엔트로피의 크기를 한 문장으로 설명한다.','천재90 정의; 완자2022 138. R05 PDF13 MCP 정의 장표의 상단 정의·중앙 용어·밑줄 주석·하단 강조 문장 구조. 과학자 캐릭터 자산은 보존하며 이 설명 장에서는 배치하지 않는다.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 1 엔트로피의 의미','01','물질의 상태');title(s,'같은 물질도 상태에 따라 다르다',245,'#FFFFFF');
 await img(s,path.join(HERE,'water-states-figure.png'),250,417,1420,445,'물의 세 상태 원본 전체 그림');
 const labels=[['고체','일정한 위치에 배열'],['액체','입자들이 이동'],['기체','넓은 공간에 분포']];for(let i=0;i<3;i++){const x=250+i*473;line(s,x+22,883,x+425,883,'#777777',2);text(s,labels[i][0],x+10,896,430,56,39,C.green,true,'center');text(s,labels[i][1],x+10,959,430,52,32,'#FFFFFF',false,'center');}
 finish(s,7,'물의 상태에 따라 배열과 분포가 달라진다. 동일 물질은 일반적으로 고체보다 액체, 액체보다 기체의 엔트로피가 크다.','천재90 그림Ⅲ-10 원본. 하단 사진 캡션만 제외한 보존 크롭. 사용자 수정36 과학 모형과 직접 해석.');
}
await expansion(8,1,["입자의 배열과 운동", "고체의 입자도 움직인다", [["고체", "입자는 일정한 위치에 배열되어 그 자리에서 진동한다."], ["액체", "입자들이 서로 가까이 있으면서 위치를 바꾸어 이동한다."], ["기체", "입자들이 멀리 떨어져 넓은 공간을 자유롭게 이동한다."]], "배열과 운동의 차이를 함께 보고 무질서도를 비교한다.", "천재90 그림Ⅲ-10; 완자2022 139 상태 변화", "입자 모형의 간격만 보지 말고 위치가 고정되어 있는지와 이동할 수 있는지를 비교한다. 고체도 입자 운동이 멈춘 상태가 아니다."]);

await expansion(9,1,["비교 조건", "같은 물질의 상태를 비교한다", [["같은 물질", "얼음·물·수증기는 모두 물 분자로 이루어져 있다."], ["같은 양", "물질의 양을 같게 두고 상태에 따른 차이를 비교한다."], ["비교 결과", "일반적으로 고체보다 액체, 액체보다 기체의 엔트로피가 크다."]], "서로 다른 물질을 상태만 보고 무조건 비교하지 않는다.", "천재90; 완자2022 139 비교 설명을 범위 내 재구성", "물질의 종류와 양이 다르면 단순히 고체인지 기체인지만 보고 엔트로피의 크기를 비교할 수 없다. 이 단원 그림은 동일한 물질의 상태 차이를 비교하는 모형이다."]);

await part(10,2,'엔트로피 변화','변화가 일어나기 전과 후의 엔트로피는 어떻게 비교할까?');
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','엔트로피 변화');title(s,'엔트로피 변화는 최종값과 초기값의 차이',260,'#FFFFFF');
 text(s,'엔트로피 변화는 처음과 나중의 엔트로피 차이이다.',180,385,1560,65,38,'#A6A6A6',false,'center');await eq(s,'delta',490,527,940);
 line(s,960,717,960,934,'#555555',2);text(s,'최종 엔트로피가 더 크면',240,748,650,60,43,'#FFFFFF',true,'center');text(s,'엔트로피 증가',240,842,650,65,46,C.green,true,'center');text(s,'최종 엔트로피가 더 작으면',1030,748,650,60,43,'#FFFFFF',true,'center');text(s,'엔트로피 감소',1030,842,650,65,46,C.green,true,'center');
 finish(s,11,'최종 엔트로피에서 초기 엔트로피를 뺀다. 증가이면 양수, 감소이면 음수다. 뺄셈 순서를 반대로 하지 않도록 짚는다.','천재91 엔트로피 변화 정의. 새 생성 식 equations-v10/delta.png.');
}
await expansion(12,2,["변화의 부호", "증가·감소를 부호로 읽는다", [["증가", "최종 상태의 엔트로피가 초기 상태보다 크면 양수이다."], ["감소", "최종 상태의 엔트로피가 초기 상태보다 작으면 음수이다."], ["읽는 순서", "처음과 나중의 상태를 확인한 뒤 최종값에서 초기값을 뺀다."]], "엔트로피 변화가 음수라는 말은 엔트로피가 음수라는 뜻이 아니다.", "천재91 정의; 완자2022 139 엔트로피 변화", "변화량의 부호와 상태 자체의 엔트로피를 구별한다. 같은 두 상태의 변화 방향을 뒤집으면 변화량의 부호도 반대가 된다."]);

{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','상태 변화');title(s,'상태 변화의 방향을 읽어 보자',245,'#FFFFFF');
 text(s,'고체에서 액체로, 액체에서 기체로 변하면 엔트로피가 증가한다.',200,378,1520,70,36.4,'#A6A6A6',false,'center');
 await crop(s,'state-change',240,515,1440,303,'상태와 엔트로피 부호 원본 도식');
 text(s,'융해 · 기화',340,885,540,62,42,C.green,true,'center');text(s,'응고 · 액화',1040,885,540,62,42,C.green,true,'center');text(s,'엔트로피 증가',340,953,540,55,35,'#FFFFFF',false,'center');text(s,'엔트로피 감소',1040,953,540,55,35,'#FFFFFF',false,'center');
 finish(s,13,'주황 방향에서는 융해·기화, 파랑 방향에서는 응고·액화가 일어난다. 두 방향에서 엔트로피의 변화를 비교한다.','천재91 그림Ⅲ-11 도식 내부 식 보존. 사용자 지시로 칠판 제거. 원본 비율로 큰 그림과 방향 해석 배치.');
}
await expansion(14,2,["상태 변화", "변화의 방향이 바뀌면 결론도 바뀐다", [["고체와 액체", "융해는 증가, 응고는 감소이다."], ["액체와 기체", "기화는 증가, 액화는 감소이다."], ["고체와 기체", "고체에서 기체로 변하면 증가, 기체에서 고체로 변하면 감소이다."]], "변화 이름만 외우기보다 출발 상태와 도착 상태를 확인한다.", "천재91 그림Ⅲ-11; 완자2022 139 상태 변화", "입자의 배열과 운동을 근거로 정방향과 역방향을 짝지어 설명하게 한다. 고체와 기체의 직접 변화는 방향을 말로 풀어 명확히 한다."]);

{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','기체 분자 수');title(s,'암모니아가 만들어지면 분자 수가 줄어든다',245,'#FFFFFF');
 text(s,'반응물과 생성물이 모두 기체일 때 기체 분자 수를 비교한다.',160,370,1600,65,36,'#A6A6A6',false,'center');await crop(s,'ammonia-model',310,465,1300,456);await eq(s,'ammonia',510,939,900);
 finish(s,15,'질소 분자1개와 수소 분자3개에서 암모니아 분자2개가 생긴다. 기체 분자 수는4개에서2개로 감소하므로 엔트로피가 감소한다. 원자 수와 분자 수를 구분한다.','천재91 그림Ⅲ-12 원본·생성 반응식 ammonia.png.');
}
await expansion(16,2,["기체 분자 수", "반응식의 계수로 분자 수를 센다", [["반응 전", "질소 분자 1개와 수소 분자 3개, 모두 4개이다."], ["반응 후", "암모니아 분자 2개가 생성된다."], ["판단", "기체 분자 수가 4개에서 2개로 줄어 엔트로피가 감소한다."]], "기체의 종류 수가 아니라 기체 분자의 전체 수를 비교한다.", "천재91 그림Ⅲ-12; 완자2022 139 암모니아 예시", "질소와 수소라는 두 종류를 세는 것이 아니라 계수를 이용해 분자의 수를 센다. 계수는 같은 비율의 몰수로도 해석할 수 있다."]);

await expansion(17,2,["기체 분자 수", "분자 수가 줄어도 원자는 사라지지 않는다", [["질소 원자", "반응 전 2개, 반응 후에도 2개이다."], ["수소 원자", "반응 전 6개, 반응 후에도 6개이다."], ["달라진 것", "원자의 결합 방식과 기체 분자의 수가 달라진다."]], "원자 수의 보존과 기체 분자 수의 감소는 동시에 성립한다.", "천재91 그림Ⅲ-12; 완자2022 139 예시의 입자 해석 보강", "암모니아 분자 하나에는 질소 원자 한 개와 수소 원자 세 개가 들어 있다. 두 분자에 들어 있는 원자를 세어 반응 전후의 원자 수 보존을 확인한다."]);

{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','기체의 혼합');title(s,'입자 수는 그대로, 분포는 달라진다',245,'#FFFFFF');
 box(s,262,435,630,575,'#FFFFFF','혼합 원본 그림 배경',22);await crop(s,'gas-mixing',300,457,554,530,'혼합 전후 원본 입자 그림');
 text(s,'꼭지를 열기 전',1020,473,670,67,47,'#FFFFFF',true);text(s,'두 기체가 각각의 용기에 있다.',1020,557,710,58,36,'#A6A6A6');line(s,1020,650,1700,650,'#494949',2);
 text(s,'꼭지를 연 뒤',1020,693,670,67,47,'#FFFFFF',true);text(s,'두 기체가 전체 공간에 섞인다.',1020,777,710,58,36,'#A6A6A6');
 box(s,1020,895,680,88,'#253723','그림에서 얻은 결론',14);text(s,'엔트로피가 증가한다.',1045,906,630,66,41,C.green,true,'center');
 finish(s,18,'혼합 전후 색깔별 입자 수를 세면 전체 분자 수가 보존됨을 알 수 있다. 분자 수 변화 없이도 두 종류의 기체가 섞일 때 엔트로피가 증가한다.','천재91 그림Ⅲ-13; R04 PDF25 조건·해석 대응, 사용자 수정11 그림과 결론 묶음.');
}
await expansion(19,2,["기체의 혼합", "혼합 전후에 달라진 것과 같은 것", [["같은 것", "각 종류의 기체 분자 수와 전체 분자 수는 그대로이다."], ["달라진 것", "각 기체가 퍼져 있을 수 있는 공간이 넓어진다."], ["판단", "서로 다른 두 기체가 섞이므로 엔트로피가 증가한다."]], "분자 수가 변하지 않아도 엔트로피는 변할 수 있다.", "천재91 그림Ⅲ-13; 완자2022 139 혼합", "꼭지를 열기 전후의 분자를 색깔별로 세게 한다. 화학 반응으로 새 분자가 생긴 것이 아니라 기존 분자의 분포가 달라진다."]);


{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','엔트로피 변화');title(s,'엔트로피 변화 소정리',245,'#FFFFFF');
 text(s,'상태, 기체 분자 수, 혼합 여부를 근거로 변화 방향을 판단한다.',150,370,1620,72,36.4,'#A6A6A6',true,'center');
 const vals=[['판단 근거','주어진 변화','엔트로피 변화'],['상태 변화','고체에서 액체, 액체에서 기체로','증가'],['기체 분자 수','암모니아 합성에서 감소','감소'],['기체의 혼합','두 종류의 기체가 섞임','증가']];
 const t=s.tables.add({rows:4,columns:3,left:192,top:500,width:1537,height:420,values:vals,columnWidths:[350,827,360]});t.borders.assign({fill:'#777777',style:'solid',width:1});for(let i=0;i<4;i++)for(let j=0;j<3;j++){let c=t.getCell(i,j);c.fill=i===0?'#253723':j===0?'#3D3D3D':'#252525';c.text.style={typeface:'Pretendard',fontSize:i===0?39:37,color:i>0&&j===2?C.green:'#FFFFFF',bold:i===0,alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 const x=192,y=500,w=1537,h=420,rad=24;for(const [xx,yy,rot] of [[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]])s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#000000',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:10,y1:0,x2:0,y2:10,x:0,y:rad}},{close:{}}]}]});
 text(s,'비교하는 물질과 변화의 조건을 먼저 확인한다.',225,952,1470,66,36,'#FFFFFF',false,'center');
 finish(s,20,'세 판단 근거를 배운 뒤 바로 회수한다. 기체 분자 수의 변화가 없는 혼합에서도 엔트로피가 증가하는 점을 구분한다. 이 표는 다음 단원의 자발성 판단 소정리와 별개다.','천재90~91 그림Ⅲ-10~13; R05 PDF32 비교표 구조.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','02','설명으로 확인');title(s,'향기가 퍼지는 까닭을 설명하자',245,'#FFFFFF');
 text(s,'방향제에서 나온 입자가 공기 중에 퍼져 섞이는 과정을 생각해 보자.',150,370,1620,72,36.4,'#A6A6A6',true,'center');
 const labels=['입자의 분포','엔트로피 변화','판단 근거'];const qs=['처음과 나중에 입자가 차지하는 공간은 어떻게 달라질까?','입자가 공기 중에 섞일 때 엔트로피는 어떻게 변할까?','입자 모형의 어떤 차이를 근거로 설명할 수 있을까?'];
 for(let i=0;i<3;i++){const y=508+i*151;box(s,192,y,310,116,'#253723','설명 과제 표제',16);text(s,labels[i],212,y+15,270,86,39,C.green,true,'center');box(s,523,y,1206,116,'#202020','설명 과제 질문',16);text(s,qs[i],557,y+15,1130,86,36,'#FFFFFF');}
 finish(s,21,'처음에는 가까운 곳에 있던 입자가 공기 중의 넓은 공간에 퍼져 섞인다. 이 혼합 과정에서 엔트로피가 증가함을 설명하게 한다. 전체 엔트로피나 열 출입으로 자발성을 판정하는 내용은 다음 단원에 둔다.','천재90 도입·91 혼합; R04 PDF25 표제·설명 짝, 사용자 수정본40 설명 과제.');
}
await part(22,3,'엔트로피 변화의 적용','주어진 변화에서 엔트로피가 커지는지 근거를 말할 수 있을까?');
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 3 엔트로피 변화의 적용','01','상태 변화에 적용');title(s,'수증기가 물이 되면?',250,'#FFFFFF');
 text(s,'엔트로피의 증가·감소를 판단하고 그 근거를 설명해 보자.',160,378,1600,65,38,'#A6A6A6',false,'center');await eq(s,'condense',575,520,770);
 text(s,'기체 상태',280,721,580,75,50,'#FFFFFF',true,'center');text(s,'액체 상태',1060,721,580,75,50,'#FFFFFF',true,'center');text(s,'분자들이 자유롭게 이동한다.',200,807,740,62,36,'#A6A6A6',false,'center');text(s,'분자들이 서로 가까이 모인다.',980,807,740,62,36,'#A6A6A6',false,'center');
 text(s,'액화가 일어나면 엔트로피가 감소한다.',240,929,1440,70,48,C.green,true,'center');finish(s,23,'잠시 답을 가린 뒤 학생이 상태기호를 읽고 액화임을 설명하게 한다. 물질의 종류나 분자 수는 변하지 않고 상태가 바뀐다.','천재91 확인(1), 지도서116 해설. 새 생성 condense.png.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 3 엔트로피 변화의 적용','01','기체 분자 수에 적용');title(s,'일산화 질소가 산화되면?',250,'#FFFFFF');
 text(s,'반응 전후의 기체 분자 수를 반응식의 계수로 비교해 보자.',160,378,1600,65,38,'#A6A6A6',false,'center');await eq(s,'no',370,520,1180);
 text(s,'반응 전',260,720,650,60,38,'#A6A6A6',false,'center');text(s,'반응 후',1010,720,650,60,38,'#A6A6A6',false,'center');text(s,'기체 분자 3개',260,800,650,78,53,'#FFFFFF',true,'center');text(s,'기체 분자 2개',1010,800,650,78,53,'#FFFFFF',true,'center');
 text(s,'기체 분자 수가 줄어들어 엔트로피가 감소한다.',200,933,1520,70,47,C.green,true,'center');finish(s,24,'일산화 질소 분자2개와 산소 분자1개에서 이산화 질소 분자2개가 된다. 분자 수3에서2로 감소한다. 원자 수가 감소했다는 설명은 바로잡는다.','천재91 확인(2), 지도서116 해설. 새 생성 no.png.');
}
await expansion(25,3,["오개념 확인", "판단 근거를 고쳐 설명해 보자", [["주장 1", "“기체 분자 수가 줄면 원자 수도 줄어든다.”"], ["주장 2", "“분자 수가 같으면 엔트로피는 변하지 않는다.”"], ["주장 3", "“얼음이 녹으면 물 분자가 다른 분자로 바뀐다.”"]], "각 주장에 반례를 들고, 무엇이 실제로 달라졌는지 설명한다.", "천재90~91; 완자2022 139·142 확인 방식 재구성", "세 주장 모두 옳지 않다. 첫째 원자 수는 보존된다. 둘째 두 기체의 혼합은 분자 수가 같아도 엔트로피가 증가한다. 셋째 융해에서 물 분자는 유지되고 배열과 운동이 달라진다."]);

{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 3 엔트로피 변화의 적용','01','근거를 들어 설명하기');title(s,'같은 감소라도 판단 근거는 다르다',250,'#FFFFFF');
 const labels=['상태 변화','기체 분자 수','기체의 혼합'];
 const cases=['수증기가 물로 액화','일산화 질소의 산화','서로 다른 두 기체의 혼합'];
 const causes=[['기체에서 액체로','상태가 바뀐다.'],['기체 분자가','3개에서 2개로 줄어든다.'],['분자 수는 같아도','서로 섞여 분포가 달라진다.']];
 for(let i=0;i<3;i++){const x=170+i*535;box(s,x,443,510,500,'#202020','판단 기준별 회수',22);box(s,x,443,510,98,'#253723','기준 표제',22);text(s,labels[i],x+20,459,470,65,42,C.green,true,'center');text(s,cases[i],x+25,583,460,65,34,'#FFFFFF',true,'center');text(s,causes[i][0],x+25,687,460,57,34,'#A6A6A6',false,'center');text(s,causes[i][1],x+25,749,460,57,34,'#A6A6A6',false,'center');text(s,i===2?'엔트로피 증가':'엔트로피 감소',x+25,853,460,65,41,C.green,true,'center');}
 finish(s,26,'상태 변화와 기체 분자 수 변화는 모두 감소이지만 근거가 다르다. 혼합에서는 분자 수가 같아도 증가한다. 각 사례에서 달라진 것을 지목하여 설명하게 한다.','천재90~91, 지도서116, 완자2022 138~139. R06 PDF15 대조 패널과21장 표제 구조를 세 판단 기준으로 재구성.');
}
const teachingNotes=JSON.parse(await fs.readFile(path.join(HERE,'teaching-notes.json'),'utf8'));
for(let i=0;i<p.slides.items.length;i++){let s=p.slides.items[i];const original=s.speakerNotes.text;const source=original.split('출처: ')[1]?.split('\n디자인 근거:')[0]||'천재90~91';s.speakerNotes.text=teachingNotes[i]+'\n\n출처: '+source;}
await fs.mkdir(OUT,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){if(process.env.EXPORT_ONLY)continue;if(process.env.RENDER_PAGE && Number(process.env.RENDER_PAGE)!==i+1)continue;const s=p.slides.items[i];const stem=`slide-${String(i+1).padStart(2,'0')}-plan${String(pageMap[i]).padStart(2,'0')}`;const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(OUT,stem+'.png'),new Uint8Array(await png.arrayBuffer()));const layout=await s.export({format:'layout'});await fs.writeFile(path.join(HERE,stem+'.layout.json'),await layout.text());console.log('Rendered',i+1,'plan',pageMap[i]);}
if(process.env.RENDER_PAGE)process.exit(0);
await fs.writeFile(path.join(HERE,'page-map.json'),JSON.stringify(pageMap));await fs.writeFile(path.join(HERE,'content-inspection.ndjson'),(await p.inspect({kind:'slide,textbox,image,notes',maxChars:100000})).ndjson);
await fs.mkdir(path.resolve(HERE,'../output'),{recursive:true});
const candidate=path.join(HERE,'candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);console.log('CANDIDATE',candidate);
const SKILL='/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.22136/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
console.log(await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:path.resolve(HERE,'../output/3-03_엔트로피_전체26장_v12.pptx'),pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','14','--require-native-table-slide','17','--require-native-table-slide','20'],explicitTotalSlideCount:26,requiredNativeTableOwnerSlides:[14,17,20],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'user_request',families:['Pretendard']},verifyArtifactToolImport:true,receiptPath:path.join(HERE,'validation-v12.json')}));
