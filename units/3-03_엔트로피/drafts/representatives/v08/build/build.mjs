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

function finish(s,n,details,src){pageMap.push(n);note(s,`3-03 엔트로피 · 대표 시안. 전체 계획 실제 ${n}/18장.
${details}
출처: ${src}
디자인 근거: brief.md 사용자 직접 수정본40장과 장별 source-adoption. 등록 원본 캐릭터는 재생성하지 않음. 과학 원본식은 교과서 크롭. 전체 PPT가 아니며 디자인 확인 전 검토본.`);}
async function crop(s,id,x,y,w,h,alt=id){return img(s,path.join(AS,'crops',id+'.png'),x,y,w,h,alt)}
function roundedTable(s,values,x=199,y=485,w=1523,h=425){
 const widths=[285,330,330,578];const nr=values.length,nc=values[0].length;
 const t=s.tables.add({rows:nr,columns:nc,left:x,top:y,width:w,height:h,values:values.map(row=>row.map(v=>[chem(v)])),columnWidths:widths});
 t.borders.assign({fill:'#777777',style:'solid',width:1});
 for(let a=0;a<nr;a++)for(let b=0;b<nc;b++){const c=t.getCell(a,b);c.fill=a===0||b===0?'#3D3D3D':'#252525';c.text.style={typeface:'Pretendard',fontSize:a===0?37:39,bold:a===0,color:'#FFFFFF',alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 const rad=24;for(const [xx,yy,rot] of [[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]])s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#000000',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:10,y1:0,x2:0,y2:10,x:0,y:rad}},{close:{}}]}]});return t;
}

{
 const s=p.slides.add();s.background.fill='#0B3B14';await img(s,path.join(AS,'generated/cover-entropy-green-v04.png'),0,0,1920,1080,'기존 엔트로피 네 학생 장면');
 box(s,0,0,1920,1080,'linear(0deg, #0B3B14 0%, #0B3B14/98 24%, #0B3B14/88 38%, #0B3B14/28 61%, #0B3B14/0 78%)','장면으로 사라지는 깊은 초록');
 text(s,'Ⅲ. 화학 변화의 자발성',139,210,1190,105,76,'#FFFFFF',true);text(s,'03. 엔트로피',139,331,1200,160,122,'#FFFFFF',true);text(s,'사이음 저',143,545,400,60,40,'#FFFFFF');
 text(s,'본 수업 자료에 사용된 일부 이미지는 생성형 AI 기술을 활용하여 제작되었습니다.',45,1035,1300,30,21,'#FFFFFF');await branding(s,true,true);
 finish(s,1,'방향제·얼음·혼합 입자가 있는 기존 장면을 보며 엔트로피 단원을 시작한다.','기존 생성 편집 cover-entropy-green-v04.png. R04 PDF1 표지 위계.');
}
{
 const s=p.slides.add();s.background.fill='#000000';
 const cv=new Canvas(1920,1080),cx=cv.getContext('2d');const gr=cx.createRadialGradient(960,1120,10,960,1120,1040);gr.addColorStop(0,'#164426');gr.addColorStop(.55,'#061C0C');gr.addColorStop(1,'#000000');cx.fillStyle=gr;cx.fillRect(0,0,1920,1080);await fs.writeFile(path.join(HERE,'hook-background.png'),await cv.toBuffer('png'));await img(s,path.join(HERE,'hook-background.png'),0,0,1920,1080,'분리된 초록 분위기 배경');
 await header(s,'Part 0 동기 유발','01','방향제와 확산');title(s,'작은 방향제의 향기가 방 안을 채운다',266,'#FFFFFF');text(s,'방향제에서 나온 입자는 어디로 갔을까?',200,390,1520,65,40,'#A6A6A6',false,'center');
 await img(s,path.join(AS,'generated/hook-student-original-ratio.png'),310,495,750,565,'등록 비율을 보존한 방향제 관찰 학생');
 box(s,1015,574,660,218,'#FFFFFF','학생 말풍선',28);s.shapes.add({geometry:'custom',name:'학생으로 향하는 말풍선 꼬리',position:{left:952,top:698,width:70,height:65},fill:'#FFFFFF',line:{fill:'none',width:0},customPaths:[{width:70,height:65,commands:[{moveTo:{x:70,y:0}},{lineTo:{x:0,y:65}},{lineTo:{x:70,y:45}},{close:{}}]}]});
 text(s,'퍼진 입자들이 다시',1053,603,580,68,47,'#202020',true,'center');text(s,'한곳에 모일 수 있을까?',1053,680,580,68,47,'#245419',true,'center');
 finish(s,2,'고체 방향제가 줄어들고 향기가 퍼지는 현상을 입자의 분포 변화와 연결해 예상한다.','천재90 도입; 기존 학생 생성본; R04 PDF12 하단 장면과 중심 질문.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await branding(s,false,true);text(s,'수업 목차',326,240,1268,126,100,'#FFFFFF',true,'center');
 const titles=[['엔트로피의','의미'],['엔트로피','변화'],['엔트로피 변화의','적용']];
 for(let i=0;i<3;i++){const x=370+i*393,y=480;s.shapes.add({geometry:'custom',name:'깊은 꺾임 목차 원본 윤곽',position:{left:x,top:y,width:410,height:350},fill:'#252525',line:{fill:'none',width:0},customPaths:[{width:410,height:350,commands:[{moveTo:{x:20,y:0}},{lineTo:{x:328,y:0}},{cubicBezTo:{x1:339,y1:0,x2:345,y2:5,x:349,y:15}},{lineTo:{x:408,y:168}},{cubicBezTo:{x1:411,y1:173,x2:411,y2:177,x:408,y:183}},{lineTo:{x:349,y:335}},{cubicBezTo:{x1:345,y1:345,x2:339,y2:350,x:328,y:350}},{lineTo:{x:20,y:350}},{cubicBezTo:{x1:6,y1:350,x2:0,y2:340,x:4,y:328}},{lineTo:{x:49,y:182}},{cubicBezTo:{x1:51,y1:177,x2:51,y2:173,x:49,y:168}},{lineTo:{x:4,y:22}},{cubicBezTo:{x1:0,y1:10,x2:6,y2:0,x:20,y:0}},{close:{}}]}]});text(s,`Part ${i+1}`,x+78,y+65,280,60,38,C.green,true);text(s,titles[i][0],x+78,y+146,295,62,40,'#FFFFFF',true);text(s,titles[i][1],x+78,y+211,295,62,40,'#FFFFFF',true);}
 finish(s,3,'뜻을 이해하고 변화의 기준을 배운 다음 교과서 확인문제에 적용한다.','천재90~91; R04 PDF3 세 블록 목차.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await branding(s,false,true);text(s,'학습 목표',326,210,1268,126,100,'#FFFFFF',true,'center');box(s,154,424,1611,451,'#484847','학습 목표 한 상자',30);
 const goals=['엔트로피의 의미를 물질의 상태와 연결해 설명한다.','상태 변화와 기체 혼합에 따른 엔트로피 변화를 비교한다.','기체 분자 수를 근거로 반응의 엔트로피 변화를 판단한다.'];
 for(let i=0;i<3;i++){const y=480+i*120;text(s,String(i+1).padStart(2,'0'),245,y,100,82,46,C.green,true);text(s,goals[i],380,y,1280,82,44,'#FFFFFF');}
 finish(s,4,'엔트로피의 증가와 감소를 정성적으로 설명한다. 자발성의 전체 엔트로피 판정은 다음 단원에서 다룬다.','천재90~91; 지도서116; 완자2022 138~139. 사용자 수정본3 목표 그룹.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 1 엔트로피의 의미','01','엔트로피');
 rich(s,[r('무질서도'),r('를 나타내는 척도',{color:'#FFFFFF'})],190,279,1540,105,76.4,C.green,true,'center');
 text(s,'엔트로피',590,432,500,105,78,'#FFFFFF',true,'center');text(s,'기호 S',1095,449,290,80,56,C.green,true);
 line(s,620,548,1298,548,'#9FFF68',4,'정의 핵심 밑줄');text(s,'무질서도가 클수록 엔트로피가 크다.',320,587,1280,70,44,'#FFFFFF',false,'center');
 await img(s,path.join(AS,'scientists/clausius-v02.png'),280,717,220,264,'클라우지우스 기존 캐릭터');text(s,'클라우지우스',530,752,430,62,39,C.green,true);text(s,'엔트로피 개념 도입',530,826,460,58,34,'#FFFFFF');
 await img(s,path.join(AS,'scientists/boltzmann-v02.png'),1040,717,218,264,'볼츠만 기존 캐릭터');text(s,'볼츠만',1288,752,440,62,39,C.green,true);text(s,'엔트로피의 통계적 해석',1288,826,480,58,34,'#FFFFFF');
 finish(s,6,'엔트로피가 무질서도를 나타내는 척도라는 한 가지 정의를 먼저 읽고, 기호와 과학자의 역할을 짧게 연결한다.','천재90 정의; 완자2022 138; 기존 과학자 manifest; R05 PDF13 핵심어와 의미 직접 대응.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 1 엔트로피의 의미','01','물질의 상태');title(s,'같은 물질도 상태에 따라 다르다',245,'#FFFFFF');
 await img(s,path.join(HERE,'water-states-figure.png'),250,417,1420,445,'물의 세 상태 원본 전체 그림');
 const labels=[['고체','일정한 위치에 배열'],['액체','입자들이 이동'],['기체','넓은 공간에 분포']];for(let i=0;i<3;i++){const x=250+i*473;line(s,x+22,883,x+425,883,'#777777',2);text(s,labels[i][0],x+10,896,430,56,39,C.green,true,'center');text(s,labels[i][1],x+10,959,430,52,32,'#FFFFFF',false,'center');}
 finish(s,7,'물의 상태에 따라 배열과 분포가 달라진다. 동일 물질은 일반적으로 고체보다 액체, 액체보다 기체의 엔트로피가 크다.','천재90 그림Ⅲ-10 원본. 하단 사진 캡션만 제외한 보존 크롭. 사용자 수정36 과학 모형과 직접 해석.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','상태 변화');title(s,'상태 변화의 방향을 읽어 보자',245,'#FFFFFF');
 await img(s,path.join(ROOT,'assets/reference-library/20261027/components/R03-p22-whiteboard-original.png'),460,370,1000,680,'레퍼런스 원본 칠판 에셋');
 text(s,'고체에서 액체로, 액체에서 기체로',540,443,840,60,39,'#245419',true,'center');await crop(s,'state-change',530,554,860,181,'상태와 엔트로피 부호 원본 도식');
 text(s,'융해 · 기화',560,804,360,58,37,'#245419',true,'center');text(s,'응고 · 액화',1000,804,360,58,37,'#245419',true,'center');text(s,'엔트로피 증가',560,872,360,58,33,'#202020',false,'center');text(s,'엔트로피 감소',1000,872,360,58,33,'#202020',false,'center');
 finish(s,10,'주황 방향에서는 융해·기화, 파랑 방향에서는 응고·액화가 일어난다. 두 방향에서 엔트로피의 변화를 비교한다.','천재91 그림Ⅲ-11 도식 내부 식 보존. R03 PDF22 칠판 원본 추출 자산.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','기체의 혼합');title(s,'입자 수는 그대로, 분포는 달라진다',245,'#FFFFFF');
 box(s,262,435,630,575,'#FFFFFF','혼합 원본 그림 배경',22);await crop(s,'gas-mixing',300,457,554,530,'혼합 전후 원본 입자 그림');
 text(s,'꼭지를 열기 전',1020,473,670,67,47,'#FFFFFF',true);text(s,'두 기체가 각각의 용기에 있다.',1020,557,710,58,36,'#A6A6A6');line(s,1020,650,1700,650,'#494949',2);
 text(s,'꼭지를 연 뒤',1020,693,670,67,47,'#FFFFFF',true);text(s,'두 기체가 전체 공간에 섞인다.',1020,777,710,58,36,'#A6A6A6');
 box(s,1020,895,680,88,'#253723','그림에서 얻은 결론',14);text(s,'엔트로피가 증가한다.',1045,906,630,66,41,C.green,true,'center');
 finish(s,12,'혼합 전후 색깔별 입자 수를 세면 전체 분자 수가 보존됨을 알 수 있다. 분자 수 변화 없이도 두 종류의 기체가 섞일 때 엔트로피가 증가한다.','천재91 그림Ⅲ-13; R04 PDF25 조건·해석 대응, 사용자 수정11 그림과 결론 묶음.');
}

{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','01','엔트로피 변화');title(s,'엔트로피 변화 소정리',245,'#FFFFFF');
 text(s,'상태, 기체 분자 수, 혼합 여부를 근거로 변화 방향을 판단한다.',150,370,1620,72,36.4,'#A6A6A6',true,'center');
 const vals=[['판단 근거','주어진 변화','엔트로피 변화'],['상태 변화','고체에서 액체, 액체에서 기체로','증가'],['기체 분자 수','암모니아 합성에서 감소','감소'],['기체의 혼합','두 종류의 기체가 섞임','증가']];
 const t=s.tables.add({rows:4,columns:3,left:192,top:500,width:1537,height:420,values:vals,columnWidths:[350,827,360]});t.borders.assign({fill:'#777777',style:'solid',width:1});for(let i=0;i<4;i++)for(let j=0;j<3;j++){let c=t.getCell(i,j);c.fill=i===0?'#253723':j===0?'#3D3D3D':'#252525';c.text.style={typeface:'Pretendard',fontSize:i===0?39:37,color:i>0&&j===2?C.green:'#FFFFFF',bold:i===0,alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 const x=192,y=500,w=1537,h=420,rad=24;for(const [xx,yy,rot] of [[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]])s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#000000',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:10,y1:0,x2:0,y2:10,x:0,y:rad}},{close:{}}]}]});
 text(s,'비교하는 물질과 변화의 조건을 먼저 확인한다.',225,952,1470,66,36,'#FFFFFF',false,'center');
 finish(s,13,'세 판단 근거를 배운 뒤 바로 회수한다. 기체 분자 수의 변화가 없는 혼합에서도 엔트로피가 증가하는 점을 구분한다. 이 표는 다음 단원의 자발성 판단 소정리와 별개다.','천재90~91 그림Ⅲ-10~13; R05 PDF32 비교표 구조.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 2 엔트로피 변화','02','설명으로 확인');title(s,'향기가 퍼지는 까닭을 설명하자',245,'#FFFFFF');
 text(s,'방향제에서 나온 입자가 공기 중에 퍼져 섞이는 과정을 생각해 보자.',150,370,1620,72,36.4,'#A6A6A6',true,'center');
 const labels=['입자의 분포','엔트로피 변화','판단 근거'];const qs=['처음과 나중에 입자가 차지하는 공간은 어떻게 달라질까?','입자가 공기 중에 섞일 때 엔트로피는 어떻게 변할까?','입자 모형의 어떤 차이를 근거로 설명할 수 있을까?'];
 for(let i=0;i<3;i++){const y=508+i*151;box(s,192,y,310,116,'#253723','설명 과제 표제',16);text(s,labels[i],212,y+15,270,86,39,C.green,true,'center');box(s,523,y,1206,116,'#202020','설명 과제 질문',16);text(s,qs[i],557,y+15,1130,86,36,'#FFFFFF');}
 finish(s,14,'처음에는 가까운 곳에 있던 입자가 공기 중의 넓은 공간에 퍼져 섞인다. 이 혼합 과정에서 엔트로피가 증가함을 설명하게 한다. 전체 엔트로피나 열 출입으로 자발성을 판정하는 내용은 다음 단원에 둔다.','천재90 도입·91 혼합; R04 PDF25 표제·설명 짝, 사용자 수정본40 설명 과제.');
}
await fs.mkdir(OUT,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const stem=`slide-${String(i+1).padStart(2,'0')}-plan${String(pageMap[i]).padStart(2,'0')}`;const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(OUT,stem+'.png'),new Uint8Array(await png.arrayBuffer()));const layout=await s.export({format:'layout'});await fs.writeFile(path.join(HERE,stem+'.layout.json'),await layout.text());console.log('Rendered',i+1,'plan',pageMap[i]);}
await fs.writeFile(path.join(HERE,'page-map.json'),JSON.stringify(pageMap));await fs.writeFile(path.join(HERE,'content-inspection.ndjson'),(await p.inspect({kind:'slide,textbox,image,notes',maxChars:100000})).ndjson);
await fs.mkdir(path.resolve(HERE,'../output'),{recursive:true});
const candidate=path.join(HERE,'candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);console.log('CANDIDATE',candidate);
const SKILL='/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.22136/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
console.log(await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:path.resolve(HERE,'../output/3-03_엔트로피_대표10장_3Part_v08.pptx'),pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','9'],explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[9],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'user_request',families:['Pretendard']},verifyArtifactToolImport:true,receiptPath:path.join(HERE,'validation-v08.json')}));
