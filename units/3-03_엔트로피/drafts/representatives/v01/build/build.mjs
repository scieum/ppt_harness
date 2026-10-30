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
const C={green:'#57962F',gray:'#898989',light:'#F5F5F5',dark:'#484847',black:'#000000'};
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
 await img(s,path.join(A,dark?'scieum-white.png':'scieum.png'),1778.667,40,108,77.333,'사이음 공식 로고');
 if(cover)await img(s,path.join(A,'tsherpa.png'),1601.333,42.667,154.667,66.667,'T셀파 공식 로고 — 첫 장만');
 text(s,'© 2026. @sci_eum. All rights reserved.',1440,1034,440,30,21,dark?'#FFFFFF':C.black,false,'right','copyright');
}
async function header(s,part,num,topic){await branding(s);text(s,part,72,76,1530,54,38,C.gray,true);text(s,num,72,134,70,64,48.8,C.green,true);text(s,topic,146,134,1550,64,48.8,C.black,true);}
function title(s,str,y=270,col=C.black){return text(s,str,100,y,1720,112,76.4,col,true,'center','핵심 문장')}
function note(s,str){s.speakerNotes.text=str;}
function line(s,x1,y1,x2,y2,col,width=5,name='line'){
 let x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(1,Math.abs(x2-x1)),h=Math.max(1,Math.abs(y2-y1));
 const a=s.shapes.add({geometry:'custom',name,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:col,width,style:'solid'},customPaths:[{width:w,height:h,commands:[{moveTo:{x:x1-x,y:y1-y}},{lineTo:{x:x2-x,y:y2-y}}]}]});return a;
}
function dot(s,x,y,col,size=20){return s.shapes.add({geometry:'ellipse',position:{left:x-size/2,top:y-size/2,width:size,height:size},fill:col,line:{fill:'none',width:0}})}

function finish(s,n,details,src){pageMap.push(n);note(s,`3-03 엔트로피 · 대표 시안. 전체 계획 실제 ${n}/40장.
${details}
출처: ${src}
디자인 근거: brief.md 사용자 직접 수정본40장과 장별 source-adoption. 등록 원본 캐릭터는 재생성하지 않음. 과학 원본식은 교과서 크롭. 전체 PPT가 아니며 디자인 확인 전 검토본.`);}
async function crop(s,id,x,y,w,h,alt=id){return img(s,path.join(AS,'crops',id+'.png'),x,y,w,h,alt)}
function roundedTable(s,values,x=199,y=485,w=1523,h=425){
 const widths=[285,330,330,578];const nr=values.length,nc=values[0].length;
 const t=s.tables.add({rows:nr,columns:nc,left:x,top:y,width:w,height:h,values:values.map(row=>row.map(v=>[chem(v)])),columnWidths:widths});
 t.borders.assign({fill:'#777777',style:'solid',width:1});
 for(let a=0;a<nr;a++)for(let b=0;b<nc;b++){const c=t.getCell(a,b);c.fill=a===0||b===0?'#3D3D3D':'#252525';c.text.style={typeface:'Pretendard',fontSize:a===0?37:39,bold:a===0,color:'#FFFFFF',alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 const rad=24;for(const [xx,yy,rot] of [[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]])s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#FFFFFF',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:10,y1:0,x2:0,y2:10,x:0,y:rad}},{close:{}}]}]});return t;
}
// Plan1 cover: byte-identical registered original 4-person classroom illustration.
{
 const s=p.slides.add();s.background.fill='#0C7D08';await img(s,path.join(AS,'originals/cover-original.png'),0,0,1920,1080,'등록 원본 네 학생 — 재생성 없음');
 box(s,0,0,1920,1080,'linear(0deg, #0C7D08 0%, #0C7D08/98 25%, #0C7D08/82 37%, #0C7D08/25 58%, #0C7D08/0 72%)','왼쪽 녹색 그라데이션');
 text(s,'Ⅲ. 화학 변화의 자발성',139,206,1470,145,110,'#FFFFFF',true,'left','대단원명');text(s,'03. 엔트로피',139,347,1400,145,110,'#FFFFFF',true,'left','소단원명');text(s,'사이음 저',143,554,400,60,40,'#FFFFFF',false,'left','저자');
 text(s,'본 수업 자료에 사용된 일부 이미지는 생성형 AI 기술을 활용하여 제작되었습니다.',45,1035,1300,30,21,'#FFFFFF',false,'left','AI 안내');await branding(s,true);
 finish(s,1,'원본1-01 표지의 네 학생과 교복·얼굴·머리·비율·기체 실험 장면을 그대로 보존했다. 새 방향제 장면으로 가장하지 않는다. 표지의 교실 배경은 분위기용이며 단원 과학 실험 자료가 아니다. 새 얼굴 생성 대신 원본 유지.','등록 assets/characters/uniform/reference-1-01-cover.png 원본. 교과서90~95 단원 제목.');
}
// Plan2 motivation: original guide and original textbook fragrance picture.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 0 동기 유발','01','방향제와 확산');title(s,'향기는 왜 방 안에 퍼질까?');
 text(s,'옷장에 넣어 둔 고체 방향제는 시간이 지나면 어떻게 될까?',150,390,1620,70,36.4,C.gray,true,'center','관찰 질문');
 await img(s,path.join(AS,'originals/guide-original.png'),220,493,228,484,'등록 원본 안내 인물');
 box(s,515,515,1130,435,C.light,'말풍선',30);
 s.shapes.add({geometry:'custom',name:'말풍선 꼬리',position:{left:447,top:652,width:80,height:70},fill:C.light,line:{fill:'none',width:0},customPaths:[{width:80,height:70,commands:[{moveTo:{x:80,y:0}},{lineTo:{x:0,y:35}},{lineTo:{x:80,y:70}},{close:{}}]}]});
 await crop(s,'fragrance-original',566,557,338,338,'교과서90 방향제 사진 원본');
 text(s,'퍼져 나간 방향제 입자가',965,623,620,64,44,C.black,true);text(s,'저절로 다시 한곳에',965,690,620,64,44,C.black,true);text(s,'모일 수 있을까?',965,757,620,64,44,C.green,true);
 finish(s,2,'사진의 방향제 변화와 냄새의 확산을 먼저 관찰한다. 답은 학생의 예상으로 받아두고 엔트로피 학습 후 회수한다. 등록 안내 인물 원본을 재생성하지 않고 말풍선 꼬리로 질문과 연결한다.','천재 물질과 에너지 PDF/인쇄90 도입 사진·질문. 등록 body_guide_reading 원본.');
}
// Plan3 original deep-notched four-block silhouette.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await branding(s);text(s,'이번 단원의 목차',326.67,264,1268,126.67,100,C.black,true,'center','목차 제목');
 const labels=['엔트로피','계와 주위','전체 엔트로피와\n자발성','네 가지 변화\n해석'];
 for(let i=0;i<4;i++){
  const x=181+i*384,y=470;s.shapes.add({geometry:'custom',name:'원본 윤곽 목차 블록',position:{left:x,top:y,width:410,height:350},fill:'#202020',line:{fill:'none',width:0},customPaths:[{width:410,height:350,commands:[{moveTo:{x:20,y:0}},{lineTo:{x:328,y:0}},{cubicBezTo:{x1:339,y1:0,x2:345,y2:5,x:349,y:15}},{lineTo:{x:408,y:168}},{cubicBezTo:{x1:411,y1:173,x2:411,y2:177,x:408,y:183}},{lineTo:{x:349,y:335}},{cubicBezTo:{x1:345,y1:345,x2:339,y2:350,x:328,y:350}},{lineTo:{x:20,y:350}},{cubicBezTo:{x1:6,y1:350,x2:0,y2:340,x:4,y:328}},{lineTo:{x:49,y:182}},{cubicBezTo:{x1:51,y1:177,x2:51,y2:173,x:49,y:168}},{lineTo:{x:4,y:22}},{cubicBezTo:{x1:0,y1:10,x2:6,y2:0,x:20,y:0}},{close:{}}]}]});
  text(s,`Part ${i+1}`,x+80,y+66,250,60,38,'#9FFF68',true);text(s,labels[i],x+80,y+140,285,148,42,'#FFFFFF',false);
 }
 finish(s,3,'원본 검정 화살표 윤곽·깊은 왼쪽 꺾임·좁은 여백과 네 블록 정렬 유지. Part0 블록을 추가하지 않는다.','승인 계획 Part 구분. 레이아웃: 사용자 수정본2쪽.');
}
// Plan4 objectives, original reading guide at original scale.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await branding(s);text(s,'이번 단원의 학습 목표',326.67,177.33,1268,126.67,100,C.black,true,'center','목표 제목');box(s,154.67,424,1610.67,450.67,'#F5F5F5','목표 상자',42);
 const lines=['엔트로피의 의미와 변화 방향을 설명할 수 있다.','계와 주위를 정하고 계의 종류를 구분할 수 있다.','엔탈피와 엔트로피 변화로 자발성을 설명할 수 있다.'];
 for(let i=0;i<3;i++){const yy=501.33+i*120;dot(s,286.67,yy+28,C.black,56);text(s,String(i+1),258.67,yy-2,56,60,42,'#FFFFFF',true,'center','목표 번호');text(s,lines[i],337.33,yy-6,1297.33,66.67,44.5,'#484847',true,'left','목표 문장');}
 await img(s,path.join(AS,'originals/guide-original.png'),1670.67,564,217.33,460,'목표 안내 원본');
 finish(s,4,'목표 목록 왼쪽 위치와 한 상자 구조·원본 안내 인물 크기를 유지한다. 문장 전체를 같은 왼쪽 기준으로 정렬한다. 세 목표의 수행 대상은 승인 계획과 같으며 화면 문구를 짧게 다듬었다.','지도서 PDF/인쇄18~19 [12물에03-03]. 사용자 수정본3쪽.');
}
// Plan5 black transition.
{
 const s=p.slides.add();s.background.fill='#000000';await branding(s,false,true);text(s,'Part 1',118.67,304,800,98.67,70,'#9FFF68',true,'left','Part 표기');text(s,'엔트로피',118.67,400,1262.67,157.33,110,'#FFFFFF',true,'left','Part 제목');text(s,'퍼진 입자가 저절로 한곳에 모이지 않는 까닭은 무엇일까?',118.67,565.33,1680,70,44,'#FFFFFF',false,'left','Part 질문');
 finish(s,5,'brief.md 검정형 Part 전환을 채택한다. Part 대소문자와 T셀파 첫 장만 규칙을 유지한다.','천재 물질과 에너지90~91. 사용자 수정본5쪽.');
}
// Plan6 continuous definition and separate meaning, not a sentence split into three slots.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 엔트로피','01','엔트로피');title(s,'엔트로피',270,C.green);
 box(s,192,455,1537,168,C.light,'정의 영역',18);rich(s,[r('엔트로피는 '),r('무질서도',{color:C.green,bold:true}),r('를 나타내는 척도이며, 기호는 '),r('S',{italic:true}),r('이다.')],260,487,1400,104,48);
 box(s,192,658,1537,135,C.light,'의미 영역',18);text(s,'무질서도가 클수록 엔트로피가 크다.',260,683,1400,80,48,C.black,false);
 box(s,192,854,1537,98,C.dark,'정의 핵심',16);text(s,'입자의 배열과 운동 상태를 살펴본다.',220,865,1480,76,44.5,'#FFFFFF',false,'center');
 finish(s,6,'한 문장 정의는 하나의 자연스러운 의미 영역으로 유지한다. 두 번째 영역은 별도 설명이다. 무질서도를 일상의 지저분함과 동일시하지 않고 이후 상태 그림에서 입자의 배열·운동을 읽는다.','천재 물질과 에너지90; W22 138. 사용자 수정본8·15쪽.');
}
// Plan8 editable entropy relation and directly aligned annotations.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 엔트로피','02','엔트로피 변화');title(s,'엔트로피 변화');
 rich(s,[r('ΔS',{italic:true}),r(' = '),r('S',{italic:true}),r('최종'),r(' − '),r('S',{italic:true}),r('초기')],340,454,1240,146,100,C.black,false,'center','관계식');
 box(s,806,611,240,7,C.green,'최종 항 밑줄');box(s,1200,611,235,7,C.gray,'초기 항 밑줄');text(s,'변화 후',806,635,240,65,42,C.green,true,'center');text(s,'변화 전',1200,635,235,65,42,C.gray,true,'center');
 box(s,192,776,745,151,C.light,'증가 해석',18);box(s,984,776,745,151,C.light,'감소 해석',18);text(s,'엔트로피 증가: ΔS > 0',224,803,680,90,45,C.black,false,'center');text(s,'엔트로피 감소: ΔS < 0',1016,803,680,90,45,C.black,false,'center');
 finish(s,8,'최종에서 초기값을 빼는 차이의 뜻을 먼저 설명한다. 식의 각 항 바로 아래 변화 전·후 라벨을 연결한다. 이는 편집 가능한 설명식이며 교과서 원본 화학 반응식을 다시 쓴 것이 아니다.','천재 물질과 에너지91 ΔS 관계식. 사용자 수정본10·12쪽.');
}
// Plan10 original textbook ammonia equation and particle model, never regenerated.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 엔트로피','02','엔트로피 변화');title(s,'기체 분자 수가 줄어들면');text(s,'암모니아 합성에서 기체 분자 수는 4에서 2로 감소한다.',150,387,1620,65,36.4,C.gray,true,'center');
 await crop(s,'ammonia-model',280,466,1361,368,'교과서91 그림Ⅲ-12 원본');await crop(s,'ammonia-equation',515,838,890,77,'교과서91 암모니아 합성 반응식 원본');
 box(s,244,930,1432,84,C.dark,'분자 수와 ΔS 해석',16);text(s,'기체 분자 수 감소 → 무질서도 감소 → ΔS < 0',280,938,1360,67,43,'#FFFFFF',false,'center');
 finish(s,10,'원본의 왼쪽 N2 1개와 H2 3개, 오른쪽 NH3 2개를 가리킨다. 총 원자 수와 기체 분자 수는 다르다. 질소2·수소6 원자 보존을 말로 확인한다. 이 간단한 반응의 기체수 변화로 엔트로피 감소를 정성적으로 예측한다.','천재 물질과 에너지 PDF/인쇄91 그림Ⅲ-12 및 원본 반응식. 사용자 수정본36쪽.');
}
// Plan33 native editable table with complete cell fills and centered text.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 3 전체 엔트로피와 자발성','03','자발성 판단');title(s,'자발성 판단 소정리');text(s,'계와 주위의 엔트로피 변화를 더해 판단한다.',150,387,1620,65,36.4,C.gray,true,'center');
 roundedTable(s,[['ΔH','ΔS계','ΔS주위','자발성'],['< 0','> 0','> 0','자발적'],['> 0','< 0','< 0','비자발적'],['< 0','< 0','> 0','두 변화량의 크기에 따라 다름'],['> 0','> 0','< 0','두 변화량의 크기에 따라 다름']]);
 box(s,199,941,1523,78,C.dark,'판단 기준',16);text(s,'ΔS계와 ΔS주위의 부호가 반대이면 크기를 비교한다.',225,950,1470,60,39,'#FFFFFF',false,'center');
 finish(s,33,'ΔH가 주위 엔트로피 부호를 결정하는 연결을 확인한 뒤 두 ΔS를 더한다. ΔH와 ΔS 자체의 절댓값을 직접 비교하지 않는다. 앞의 두 유형과 경쟁하는 두 유형을 구분한다.','천재 물질과 에너지95 그림Ⅲ-17; 지도서119. 사용자 수정본18쪽.');
}
// Plan36 two original photographs, captions, original equation crops and editable interpretation.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 4 네 가지 변화 해석','01','네 가지 변화');title(s,'발열인 두 사례');text(s,'둘 다 주위로 열을 방출하지만, 계의 엔트로피 변화는 다르다.',130,387,1660,65,36.4,C.gray,true,'center');
 const xs=[192,986];
 for(let i=0;i<2;i++){const x=xs[i];box(s,x,478,742,350,C.dark,'사진·설명 묶음 '+i,20);box(s,x+22,500,698,240,'#FFFFFF','원본 사진 영역');await crop(s,i?'flame-photo':'snow-photo',x+22,500,698,240);text(s,i?'프로페인의 연소':'수증기가 얼음으로 변할 때',x+30,758,682,52,i?40:36,'#FFFFFF',true,'center');box(s,x+80,816,582,2,'#FFFFFF','사진 제목 밑줄');}
 await crop(s,'snow-equation',338,842,450,73,'고체화 원본 반응식');await crop(s,'flame-equation',1006,842,702,73,'프로페인 연소 원본 반응식');
 rich(s,chem('ΔH < 0,  ΔS계 < 0'),235,931,656,66,44,C.black,true,'center');rich(s,chem('ΔH < 0,  ΔS계 > 0'),1029,931,656,66,44,C.black,true,'center');
 finish(s,36,'이 두 과정은 교과서94에 자발적 변화의 사례로 주어져 있다. 왼쪽은 기체→고체이므로 ΔS계<0, 오른쪽은 기체6분자→7분자이므로 ΔS계>0로 예측한다. 물 생성물은 수증기(g)임을 반드시 확인한다. 고체화의 자발성을 계 엔트로피 감소만으로 부정하지 않는다. 표제는 원문의 승화 대신 방향을 명료하게 쓴다.','천재 물질과 에너지94 해 보기 가·나 사진과 반응식 원본. W22 141 비교. 사용자 수정본11·26쪽.');
}
await fs.mkdir(OUT,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const stem=`slide-${String(i+1).padStart(2,'0')}-plan${String(pageMap[i]).padStart(2,'0')}`;const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(OUT,stem+'.png'),new Uint8Array(await png.arrayBuffer()));const layout=await s.export({format:'layout'});await fs.writeFile(path.join(HERE,stem+'.layout.json'),await layout.text());console.log('Rendered',i+1,'plan',pageMap[i]);}
await fs.writeFile(path.join(HERE,'page-map.json'),JSON.stringify(pageMap));await fs.writeFile(path.join(HERE,'content-inspection.ndjson'),(await p.inspect({kind:'slide,textbox,image,notes',maxChars:100000})).ndjson);
await fs.mkdir(path.resolve(HERE,'../output'),{recursive:true});
const candidate=path.join(HERE,'candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);console.log('CANDIDATE',candidate);
const SKILL='/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.22136/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
console.log(await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:path.resolve(HERE,'../output/3-03_엔트로피_대표10장_v01.pptx'),pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','9'],explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[9],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'user_request',families:['Pretendard']},verifyArtifactToolImport:true,receiptPath:path.join(HERE,'validation.json')}));
