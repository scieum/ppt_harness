import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const require=createRequire(import.meta.url);
const {FontLibrary,Canvas}=require('/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/node_modules/skia-canvas');
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT='/Users/keemhayeon/Downloads/Codex/scieum_ppt';
const OUT=path.resolve(HERE,'../output');
const A=path.join(ROOT,'units/3-01_엔탈피와열화학반응식/assets');
const fonts=['Regular','Medium','Bold'].map(w=>path.join(ROOT,`output/fonts/Pretendard-${w}.otf`));
const registered=FontLibrary.use('Pretendard',[...fonts,path.join(HERE,'Pretendard-H-regular-Oblique.ttf'),path.join(HERE,'Pretendard-H-bold-Oblique.ttf')]);await fs.writeFile(path.join(HERE,'font-registration.json'),JSON.stringify(registered,null,2));
const ctx=new Canvas(10,10).getContext('2d');
const p=Presentation.create({slideSize:{width:1920,height:1080}});
const C={green:'#57962F',gray:'#898989',light:'#F5F5F5',dark:'#484847',black:'#000000'};
let assets={};try{assets=JSON.parse(await fs.readFile(path.join(HERE,'original-character-assets.json'),'utf8'))}catch{}
const intentional=[];
const EQ=path.join(ROOT,'units/3-02_헤스법칙/assets/equations-v05');
async function eqimg(s,id,x,y,w,h){return img(s,path.join(id==='t84-cao-neutral'?path.join(ROOT,'units/3-02_헤스법칙/assets/equations-v17'):id==='t87-ch4-decomposition'?path.join(ROOT,'units/3-02_헤스법칙/assets/equations-v13'):id.startsWith('t76-water-')?path.join(ROOT,'units/3-02_헤스법칙/assets/equations-v12'):id.startsWith('w122-sulfur-')?path.join(ROOT,'units/3-02_헤스법칙/assets/equations-v11'):EQ,id+'.png'),x,y,w,h,'반응식 이미지 '+id+' — assets/equations-v05/provenance.json');}
function box(s,x,y,w,h,fill,name='box',radius=0){return s.shapes.add({geometry:radius?'roundRect':'rect',name,position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0},...(radius?{borderRadius:radius}:{})})}
function text(s,str,x,y,w,h,size=48,color=C.black,bold=false,align='left',name='text'){
 const q=s.shapes.add({geometry:'textbox',name,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 q.text=str;q.text.style={fontSize:size,typeface:'Pretendard',color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',wrap:'none',insets:0};if(typeof str==='string'&&/Δ[fr]?H/.test(str))q.text=[chem(str)];return q;
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
 if(dark)box(s,1768,30,128,96,"#FFFFFF","로고 대비 바탕",12);
 await img(s,path.join(A,'v10-cover-sci_eum_logo.png'),1778.667,40,108,77.333,'사이음 공식 로고');
 if(cover)await img(s,path.join(A,'v10-cover-tsherpa_logo.png'),1601.333,42.667,154.667,66.667,'T셀파 공식 로고 — 첫 장만');
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
// 1. Cover; the rejected generated character asset is never consumed.
{
 const s=p.slides.add();s.background.fill='#0C7D08';
 await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/diamond-v14/cover-four-original-students.png'),0,0,1920,1080,'원래 제작한 네 학생과 산 모형 표지');
 box(s,0,0,1920,1080,'linear(0deg, #158C18 0%, #158C18/98 18%, #158C18/80 28%, #158C18/35 36%, #158C18/0 43%)','왼쪽 진한 녹색 그라데이션');

 text(s,'Ⅲ. 화학 변화의 자발성',139,206,1470,145,110,'#FFFFFF',true,'left','대단원명');
 text(s,'02. 헤스 법칙',139,347,1400,145,110,'#FFFFFF',true,'left','소단원명');
 text(s,'사이음 저',143,554,400,60,40,'#FFFFFF',false,'left','저자');
 text(s,'본 수업 자료에 사용된 일부 이미지는 생성형 AI 기술을 활용하여 제작되었습니다.',45,1035,1300,30,21,'#FFFFFF',false,'left','기존 AI 안내');
 await branding(s,true);
 note(s,'2026-10-27 사용자 정정: 참고 첨부 이미지는 녹색 그라데이션의 진하기만 참고하는 자료다. 표지 장면은 직전에 만든 cover-four-original-students.png의 네 학생과 산 모형을 유지한다. 원본 이미지 위에 편집 가능한 진한 녹색 그라데이션만 추가했으며 인물·산 모형을 재생성하지 않았다. 제목·저자·로고 배치를 유지한다.');
}
// 2. User-specified two reference characters in hiking clothes studying a route map.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 0 동기 유발','01','등산 경로와 높이');
 title(s,'다른 길로 가도, 높이 차는 같을까?');
 text(s,'같은 지점에서 출발해 정상에 도착하는 두 등산로를 비교해 보자.',150,393,1620,66,36.4,C.gray,true,'center','관찰 설명');
 const scene=await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/generated/hiking-two-characters-latest-reference-v09.png'),415,474,1090,545,'사용자가 첨부한 두 캐릭터의 등산 장면 — 원본 비율');scene.crop={left:0.12,top:0,right:0.12,bottom:0.24};
 note(s,'2026-10-27 최신 사용자 요청: 첨부한 두 캐릭터를 등산복 차림으로 바꾸어 함께 등산 루트를 보게 한다. 이전 안내 인물·말풍선·교과서 등산 삽화를 이 장에서 제거하고 새 장면으로 교체했다. 여자 원본은 body_student_two_flasks.png, 남자 원본은 사용자 첨부 codex-clipboard-558eee23-1618-43c5-b316-92d2d2d9deeb.png. 이미지 생성 시 두 원본을 모두 참조하여 얼굴·머리·인형 비율을 유지하도록 지시했다. 실험복·플라스크를 제거하고 등산 재킷·배낭을 적용했다. 최신 사용자 첨부 캐릭터에 따라 남학생은 둥근 검정 안경과 머리 위 검정 고글을 착용한다. 이 첨부는 앞선 은색 무테 안경 요청을 대체한다. 그림의 두 등산로는 같은 출발점과 정상으로 연결된다. 경로에 따른 높이 차를 예상하는 동기 유발용 장면이며 과학적 실험 결과의 근거를 대체하지 않는다. 장면 출처 assets/generated/hiking-v09-provenance.json. 원본 PNG의 투명도는 유지하며 장표에서는 하체 일부와 좌우 투명 여백만 크롭했다. 원본 1774×887과 가로·세로 잔존율 0.76이 같으므로 표시 상자는 원본 비율 2:1인 1090×545로 맞췄다. 가로·세로 균일 배율을 적용하고 가운데 배치했다.');
}
// 3. Definition, matching the broad rows of the user's revision p8.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 헤스 법칙','01','헤스 법칙');title(s,'헤스 법칙 (Hess’s law)',271,C.green);
 const ys=[455,609,763];
 const points=[
  [r('· 반응 전후 물질의 종류와 상태가 같으면, '),...chem('ΔH'),r('는 '),r('경로',{color:C.green,bold:true}),r('와 무관하다.')],
  [r('· '),r('총 열량 불변의 법칙',{color:C.green,bold:true}),r('이라고 부르기도 한다.')],
  [r('· 직접 측정하기 어려운 반응의 '),...chem('ΔH'),r('도 '),r('간접적으로',{color:C.green,bold:true}),r(' 구할 수 있다.')]
 ];
 for(let i=0;i<3;i++){
  box(s,192,ys[i],1537,135,C.light,'헤스 법칙 요점 '+(i+1),18);
  rich(s,points[i],260,ys[i]+26,1400,80,48,C.black,false,'left','한 줄 요점 '+(i+1));
 }
 note(s,'대표 검토본3/5. 전체 계획6장. 최신 사용자 정정에 따라 정의·다른 이름·유용성의 서로 완결된 요점 세 개를 각각 한 행 한 줄로 제시한다. 한 문장의 연결어와 결론을 별도 단계로 쪼개지 않는다. 같은 온도·압력과 같은 반응 물질의 양을 맞춘 비교라는 조건을 말로 보완한다. 반응 속도·시간·최고 온도가 같다는 의미가 아니다.\n출처: 통합_(22개정)완자 고등물질과에너지_본문_260415(교사용).pdf PDF/인쇄118, 헤스 법칙 정의. 디자인: 사용자 수정본 실제8·15쪽, brief.md.');
}
// 4. Original reaction diagram and directly attached reading notes.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 헤스 법칙','01','헤스 법칙');
 rich(s,[r('경로가 달라도, '),...chem('ΔH'),r('는 같다')],130,270,1660,112,76.4,C.black,true,'center','핵심 관계');
 text(s,'같은 처음 상태에서 같은 나중 상태로 변할 때',150,386,1620,65,36.4,C.gray,true,'center');
 await eqimg(s,'t84-cao-graph',130,465,1010,574);
 text(s,'직접 경로',1210,475,540,55,40,C.green,true);
 rich(s,chem('ΔH₁ = −189.3 kJ'),1210,538,560,70,50);
 text(s,'두 단계 경로',1210,640,540,55,40,C.green,true);
 rich(s,chem('ΔH₂ + ΔH₃'),1210,705,540,68,50);
 text(s,'= −76.9 + (−112.4)',1210,773,610,66,46);
 text(s,'= −189.3 kJ',1210,840,610,68,50,C.green,true);
 box(s,1170,933,650,77,C.dark,'경로 비교 결론',16);
 rich(s,chem('ΔH₁ = ΔH₂ + ΔH₃'),1200,941,590,62,48,'#FFFFFF',false,'center');
 note(s,'대표 검토본4/5. 전체 계획8장. 왼쪽은 완자 원본 그래프·실험 도식이다. 직접 경로와 두 단계 경로의 시작·끝 물질을 먼저 비교한다. 그 뒤 원본의 ΔH 화살표를 가리키고 오른쪽 수치와 대응한다. 중간에 물질의 상태와 희석 조건을 임의로 바꾸지 않는다. 식의 합은 다음 본문에서 분리해 설명한다. 장식 캐릭터는 쓰지 않는다.\n출처: W22 PDF/인쇄118, CaO(s)·H2O(l)·HCl(aq)의 두 경로 도식 및 ΔH1=-193.5,ΔH2=-81.9,ΔH3=-111.6kJ. 교과서 원본은 아직 미열람으로 이번 검토본은 확인된 완자 원본 사용. 디자인: 사용자 수정본22·33~34쪽 왼쪽 원본/오른쪽 설명 차용.');
}
// 5. CO calculation: equations are original crops, explanation/result editable.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 2 반응 엔탈피 구하기','01','간접 측정');
 title(s,'CO 생성 반응의 반응 엔탈피');
 rich(s,chem('ΔH₃ = ΔH₁ − ΔH₂'),230,389,1460,105,76.4,C.green,true,'center','관계식');
 await eqimg(s,'t85-co-total',263,534,1385,84.3);
 await eqimg(s,'t85-co-oxidize',263,687,1385,123.7);
 // The original numbered equations sit on white, without white patches on gray.
 box(s,192,868,1537,115,C.dark,'엔탈피 계산 결과',16);
 rich(s,[...chem('ΔH₃'),r(' = −393.5 − (−283.0) = '),r('−110.5 kJ',{color:'#9FFF68',bold:true})],228,885,1465,80,53,'#FFFFFF',false,'center','대입과 결과');
 note(s,'대표 검토본5/5. 전체 계획17장. 목표식은 C(s,흑연)+1/2O2(g)→CO(g). ΔH2=ΔH1−ΔH3을 먼저 읽는다. 위 두 원본 반응식에서 CO 산화 반응을 역으로 한 뒤 합하면 CO2가 소거됨을 앞 장에서 다루고, 이 장에서는 수치 계산에 집중한다. 두 음수를 빼므로 -393.5+283.0=-110.5kJ. 적힌 목표 반응 1회(탄소1mol)에 해당한다.\n출처: W22 PDF/인쇄119, 탄소·CO 연소 반응식과 ΔH 계산. 원본 수식은 별도 크롭, 다른 문장은 편집 가능한 텍스트. 디자인: 사용자 수정본28·38쪽의 관계식→대입·결과 위계.');
}
const planned=JSON.parse(await fs.readFile(path.join(ROOT,'units/3-02_헤스법칙/research/qa-v17/base-plan-before-sync.json'),'utf8'));
const pageMap=new Map([[1,p.slides.items[0]],[2,p.slides.items[1]],[6,p.slides.items[2]],[8,p.slides.items[3]],[17,p.slides.items[4]]]);
const overflowChecks=[];
function measured(str,size=48,bold=false){ctx.font=`${bold?'bold ':''}${size}px Pretendard`;return ctx.measureText(str).width;}
function plainRuns(runs){return runs.map(v=>typeof v==='string'?v:v.run).join('')}
function eq(s,str,x,y,w=1537,size=48,col=C.black,bold=false,align='left'){return rich(s,chem(str),x,y,w,78,size,col,bold,align,'반응식·수식');}
function strip(s,str,y=885){box(s,192,y,1537,94,C.dark,'해석·결론',16);eq(s,str,225,y+8,1470,44.5,'#FFFFFF',false,'center');}
function rows(s,lines,ys=[455,609,763],size=48){for(let i=0;i<lines.length;i++){box(s,192,ys[i],1537,135,C.light,'설명·계산 행 '+(i+1),18);const arr=typeof lines[i]==='string'?chem('· '+lines[i]):[r('· '),...lines[i]];let sz=size;const width=measured(plainRuns(arr),sz);if(width>1400)sz=Math.max(40,Math.min(size,size*1390/width));rich(s,arr,260,ys[i]+26,1400,80,sz,C.black,false,'left','설명·계산 문장 '+(i+1));}}
function roundTable(s,values,x=192,y=455,w=1537,h=440,widths=null,size=43){
 const nr=values.length,nc=values[0].length;const t=s.tables.add({rows:nr,columns:nc,left:x,top:y,width:w,height:h,values:values.map(row=>row.map(v=>[chem(v)])),columnWidths:widths??Array(nc).fill(w/nc)});
 t.borders.assign({fill:'#777777',style:'solid',width:1});
 for(let a=0;a<nr;a++)for(let b=0;b<nc;b++){const c=t.getCell(a,b);c.fill=a===0||b===0?'#3D3D3D':'#252525';c.text.style={typeface:'Pretendard',fontSize:size,bold:a===0||b===0,color:'#FFFFFF',alignment:'center',verticalAlignment:'middle',wrap:'none',insets:12};}
 // White corner masks preserve a rounded outer silhouette without rasterizing the table.
 const rad=20;const coords=[[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]];
 for(const [xx,yy,rot] of coords)s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#FFFFFF',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:9,y1:0,x2:0,y2:9,x:0,y:rad}},{close:{}}]}]});
 return t;
}
async function newpage(n,tt=null){const s=p.slides.add();s.background.fill='#FFFFFF';pageMap.set(n,s);const pl=planned.slides[n-1];const part=pl.part;const name=['','헤스 법칙','반응 엔탈피 구하기','표준 생성 엔탈피','실험으로 확인하는 헤스 법칙'][part];const m=pl.topic.match(/^(\d+) (.*)$/);await header(s,`Part ${part} ${name}`,m?.[1]??'01',m?.[2]??name);if(tt)title(s,tt);return s;}
function finish(n,s,details='',src='W22 PDF/인쇄118~124'){
 const pl=planned.slides[n-1];note(s,`전체 검토 시안 ${n}/40. ${pl.title}\n핵심: ${pl.message}\n교사용: ${details}\n출처: ${src}. 천재교육 물질과 에너지 교과서 PDF76~87과 완자 관련 원본을 대조했다. 반응식은 최신 원본 채택 기록을 우선한다. 기존 계획의 미판정을 통과로 바꾸지 않음.\n레이아웃 참조: 사용자 수정본 실제${pl.revision_reference}쪽; brief.md. 캐릭터 신규 생성 없음.`);}
async function transition(n,num,tt,question){const s=p.slides.add();pageMap.set(n,s);s.background.fill='#000000';await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/diamond-v14/cover-four-original-students.png'),0,0,1920,1080,'표지와 같은 네 학생과 산 모형 배경');box(s,0,0,1920,1080,'linear(0deg, #158C18 0%, #158C18/98 18%, #158C18/80 28%, #158C18/35 36%, #158C18/0 43%)','표지와 같은 녹색 그라데이션');box(s,0,0,1920,1080,'#000000/51','Part 배경 51% 검정 덮개');await branding(s,false,true);text(s,`Part ${num}`,139,259,1000,112,76.4,'#9FFF68',true);text(s,tt,139,387,1660,145,100,'#FFFFFF',true);text(s,question,143,606,1640,114,Math.min(44.5,44.5*1640/measured(question,44.5)),'#FFFFFF',false);finish(n,s,'한 줄 질문으로 이론의 필요성을 연결한다. Part 표기는 첫 글자만 대문자, T셀파 로고 없음.');return s;}
// Introduction order: cover → motivation → contents → objectives.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';pageMap.set(3,s);await branding(s);text(s,'수업 목차',326,264,1268,126,100,C.black,true,'center');
 const titles=['헤스 법칙','반응 엔탈피\n구하기','표준 생성\n엔탈피','실험으로\n헤스 법칙 확인'];
 for(let i=0;i<4;i++){
  const x=181+i*384,y=470;const q=s.shapes.add({geometry:'custom',name:'원본 윤곽 목차 블록',position:{left:x,top:y,width:410,height:350},fill:'#202020',line:{fill:'none',width:0},customPaths:[{width:410,height:350,commands:[{moveTo:{x:20,y:0}},{lineTo:{x:328,y:0}},{cubicBezTo:{x1:339,y1:0,x2:345,y2:5,x:349,y:15}},{lineTo:{x:408,y:168}},{cubicBezTo:{x1:411,y1:173,x2:411,y2:177,x:408,y:183}},{lineTo:{x:349,y:335}},{cubicBezTo:{x1:345,y1:345,x2:339,y2:350,x:328,y:350}},{lineTo:{x:20,y:350}},{cubicBezTo:{x1:6,y1:350,x2:0,y2:340,x:4,y:328}},{lineTo:{x:49,y:182}},{cubicBezTo:{x1:51,y1:177,x2:51,y2:173,x:49,y:168}},{lineTo:{x:4,y:22}},{cubicBezTo:{x1:0,y1:10,x2:6,y2:0,x:20,y:0}},{close:{}}]}]});
  text(s,`Part ${i+1}`,x+80,y+66,250,60,38,'#9FFF68',true);text(s,titles[i],x+80,y+146,285,142,46,'#FFFFFF',true);
 }
 finish(3,s,'사용자 수정본2쪽의 실제 블록 윤곽을 추적해 편집 가능한 도형으로 재현. 블록을 맞붙이지 않고 꺾임 사이 좁은 여백 유지. 네 문구만 넣고 Part0 블록을 추가하지 않음.');
}
{
 const s=p.slides.add();s.background.fill='#FFFFFF';pageMap.set(4,s);await branding(s);text(s,'학습 목표',326,177,1268,126,100,C.black,true,'center');box(s,154,424,1611,451,C.light,'학습 목표 한 상자',30);
 const goals=['반응 경로와 반응 엔탈피의 관계를 설명한다.','헤스 법칙으로 측정하기 어려운 반응의 ΔH를 구한다.','중화 실험 자료를 해석하여 헤스 법칙을 확인한다.'];
 for(let i=0;i<3;i++){const y=497+i*120;dot(s,286,y+40,C.black,55);text(s,String(i+1),260,y+8,52,62,38,'#FFFFFF',true,'center');rich(s,chem(goals[i]),337,y,1290,80,48,C.gray,true);}
 await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/characters-v17/wavy-hair-girl-classroom.png'),1590,620,290,340,'등록 웨이브 머리 여학생의 목표 확인 포즈');finish(4,s,'목표 목록의 가로 위치와 왼쪽 정렬 유지, 세로만 상자 중앙에 정렬. 원본 안내 캐릭터 파일 확보 전 신규 생성 인물을 넣지 않음.','STD22; W22 118~124');
}
await transition(5,1,'헤스 법칙','같은 반응이 다른 경로로 일어나면 출입하는 열도 달라질까?');
{
 const s=await newpage(7,'같은 반응을 비교하려면');text(s,'반응 경로만 달리하고, 비교 조건은 맞춘다.',150,385,1620,66,36.4,C.gray,true,'center');rows(s,['반응 전후 물질의 종류와 상태를 같게 한다.','반응하는 물질의 양을 같게 한다.','온도와 압력 조건을 같게 한다.']);finish(7,s,'조건 안내 후 반응식의 합·배수·역반응 세 조작을 소개한다. 8~11장에서 예시로 설명한다.','W22 118~119; 3-01 선수 개념');
}
{
 const s=await newpage(9,'두 반응식을 더하면');await eqimg(s,'t84-cao-dissolve',200,462,1453.5,85.5);await eqimg(s,'t84-cao-neutral',200,618,1581.75,85.5);line(s,233,754,1690,754,C.gray,3);await eqimg(s,'t84-cao-direct',200,794,1453.5,85.5);strip(s,'ΔH₁ = ΔH₂ + ΔH₃ = −189.3 kJ',906);finish(9,s,'앞 장의 두 단계 반응을 합한다. Ca(OH)2(aq)와 양변의 물1mol이 소거되어 직접 반응식이 남는다. 상태가 다른 물질은 소거하지 않는다.','W22 118~119 CaO 반응식①~③');
}
{
 const s=await newpage(10,'계수와 ΔH는 같은 비율로');await eqimg(s,'t76-water-one',236,462,1450,137.9);await eqimg(s,'t76-water-two',162.5,640,1595,151.7);strip(s,'모든 계수에 2를 곱하면, ΔH에도 2를 곱한다.');finish(10,s,'반응식 전체 계수에 같은 비율을 적용한다. ΔH의 부호와 계수 변화량을 구분한다.','W22 122 Q2 (가), 2배 비교는 교사 조작');
}
{
 const s=await newpage(11,'반응을 뒤집으면 부호도 반대');await eqimg(s,'t86-ch4-formation',236,458,1450,93.548);await eqimg(s,'t87-ch4-decomposition',139.91298811544982,631,1640.1740237691004,100.93378607809848);strip(s,'역반응의 ΔH는 절댓값이 같고 부호는 반대다.');finish(11,s,'반응 방향·물질 위치·ΔH 부호를 한 번에 바꾼다.','W22 119 반응③, 역반응은 교사 조작');
}
{
 const s=await newpage(12,'열화학 반응식의 세 가지 조작');roundTable(s,[['반응식의 조작','반응 엔탈피의 조작'],['모든 계수에 k를 곱한다','ΔH에도 k를 곱한다'],['역반응으로 바꾼다','ΔH의 부호를 바꾼다'],['여러 반응식을 더한다','각 ΔH를 더한다']],192,450,1190,400,[570,620],42);finish(12,s,'개념을 배운 Part1 안에서 바로 소정리한다. 설명한 세 조작을 이후 계산의 점검 기준으로 사용한다.','W22 118~119·122');
}
await transition(13,2,'반응 엔탈피 구하기','직접 측정하기 어려운 반응의 열은 어떻게 구할 수 있을까?');
{
 const s=await newpage(14,'CO 생성열을 직접 재기 어려운 까닭');rows(s,['탄소가 불완전 연소할 때 CO₂도 함께 생성될 수 있다.','CO만 생성되는 반응의 열을 따로 측정하기 어렵다.','이미 알고 있는 다른 반응의 ΔH를 이용한다.']);finish(14,s,'혼합 생성물이 생길 수 있다는 측정의 어려움과 간접 방법의 필요성을 설명한다. 직접 측정이 원리적으로 영원히 불가능하다는 주장으로 확대하지 않는다.','W22 119 헤스 법칙 이용 본문');
}
{
 const s=await newpage(15,'구하려는 반응부터 확인');text(s,'목표 반응',210,415,1500,60,40,C.green,true);await eqimg(s,'t85-co-target',235,480,1450,110);await eqimg(s,'t85-co-total',263,643,1385,84.3);await eqimg(s,'t85-co-oxidize',263,785,1385,123.7);finish(15,s,'원하는 CO가 생성물에 계수1로 있어야 함을 먼저 표시한다. 주어진 식과 목표식을 구분한다.','W22 119 반응①~③');
}
{
 const s=await newpage(16,'CO₂를 소거해 목표 반응을 만든다');await eqimg(s,'t85-co-combine',236,430,1450,365);text(s,'두 연소 반응식을 빼면, 양변의 CO₂가 소거된다.',240,812,1450,63,38,C.green,true);strip(s,'ΔH₃ = ΔH₁ − ΔH₂',906);finish(16,s,'처음부터 식을 단순 빼는 요령만 주지 않고 역반응의 부호와 물질 소거를 함께 보인다. 산소1/2mol이 남는지 검산한다.','W22 119 CO 생성식 조합');
}
{
 const s=await newpage(18,'헤스 법칙 계산의 순서');const steps=[['1','목표식 확인','구하려는 반응의 물질·위치·계수를 확인한다.'],['2','방향·계수 조절','주어진 식과 ΔH를 함께 바꾼다.'],['3','중간 물질 소거','종류·상태·양이 같은 항을 소거한다.'],['4','ΔH 계산·검산','남은 반응식과 부호·단위를 확인한다.']];for(let i=0;i<4;i++){const y=447+i*127;box(s,192,y,1537,112,C.light,'풀이 단계',18);dot(s,270,y+56,'#87939F',52);text(s,steps[i][0],244,y+20,52,70,34,'#FFFFFF',true,'center');text(s,steps[i][1],330,y+20,330,70,42,C.green,true);text(s,steps[i][2],675,y+20,990,70,40,C.black,false);}finish(18,s,'앞 CO 풀이와 네 단계를 연결한다. 3단계에서 상태가 다르면 소거하면 안 된다고 강조한다.','W22 122 비법 특강');
}
{
 const s=await newpage(19,'SO₂가 SO₃로 바뀔 때');text(s,'다음 두 반응을 이용하여 목표 반응의 ΔH를 구하시오.',180,393,1560,65,36.4,C.gray,true,'center');await eqimg(s,'w122-sulfur-given',251.52,478,1416.96,240.48);text(s,'목표 반응',236,785,330,70,42,C.green,true);await eqimg(s,'w122-sulfur-target',590,745,1236.96,162.72);finish(19,s,'먼저 독립 풀이. 정답은 다음 장에 두고, 목표 SO2 계수2와 SO3 생성물 위치를 확인하게 한다.','W22 122 Q2');
}
{
 const s=await newpage(20,'반응식과 ΔH를 함께 검산');text(s,'첫 번째 반응식을 2배하여 두 번째 반응식에서 뺀다.',180,393,1560,65,36.4,C.gray,true,'center');await eqimg(s,'w122-sulfur-given',251.52,478,1416.96,240.48);await eqimg(s,'w122-sulfur-target',341.52,720,1236.96,162.72);strip(s,'ΔH = −791 − 2 × (−297) = −197 kJ');finish(20,s,'(가)를2배하고 뒤집어 (나)와 더한다. 황원자·산소분자와 ΔH 부호·단위를 검산한다.','W22 122 Q2 해설');
}
{
 const s=await newpage(21,'그림과 반응식은 같은 관계');await eqimg(s,'t85-co-graph',240,460,770,460);text(s,'전체 경로',1120,477,600,65,42,C.green,true);eq(s,'ΔH₁ = ΔH₃ + ΔH₂',1120,557,660,52);text(s,'알고 싶은 한 단계',1120,691,640,65,42,C.green,true);eq(s,'ΔH₃ = ΔH₁ − ΔH₂',1120,772,660,52);finish(21,s,'그림의 화살표 방향과 반응식의 방향이 대응함을 확인한다. 중간 수준에는 남은 산소1/2mol을 함께 표시한 원본을 쓴다.','W22 119 엔탈피 그래프');
}
await transition(22,3,'표준 생성 엔탈피','물질마다 같은 기준의 생성 엔탈피를 알면 무엇을 구할 수 있을까?');
{
 const s=await newpage(23,'표준 생성 엔탈피');text(s,'표준 상태의 성분 원소로부터 물질 1 mol이 생성될 때의 반응 엔탈피',180,389,1560,70,38,C.gray,true,'center');await eqimg(s,'t85-water-liquid',192,480,1190,126.7);rows(s,['생성되는 물질 1 mol을 기준으로 나타낸다.','H₂O(l)의 표준 생성 엔탈피는 −285.8 kJ/mol이다.'],[609,763]);finish(23,s,'f는formation, 위첨자°는표준상태라는 기호를 말로 보완한다. 이 자료의 수치는25°C 조건이며 온도를 표준상태 정의 자체와 동일시하지 않는다. 주 교과서 직접 대조 전 잠정 Part이다.','W22 121 정의·물 생성식');
}
{
 const s=await newpage(24,'기준 원소 물질의 값은 0');roundTable(s,[['기준 원소 물질','표준 생성 엔탈피 (kJ/mol)'],['C(s, 흑연)','0'],['H₂(g)','0'],['O₂(g)','0']],192,445,1190,400,[500,690],40);strip(s,'모든 원소의 모든 상태가 0이라는 뜻은 아니다.',904);finish(24,s,'기준 원소 물질의 생성 엔탈피를0으로 정한 것이며, 물질의 엔탈피H가0이라는 의미가 아니다. 고립 원자·다른 동소체로 자동 확대하지 않는다.','W22 121 표·원소 기준 설명');
}
{
 const s=await newpage(25,'물과 수증기는 서로 다른 자료');await eqimg(s,'t85-water-liquid',236,468,1450,150);await eqimg(s,'t85-water-gas',236,656,1450,150);strip(s,'물질의 상태가 다르면 생성 엔탈피도 다르다.');finish(25,s,'비교하는 물질의 양과 온도조건은같고 생성물상태만다르다. 상태문자만기울이고괄호정자유지. 상태가다른H2O를서로소거하지않는다.','W22 121 상태별 표;123 Q4');
}
{
 const s=await newpage(26,'생성물에서 반응물을 빼는 까닭');await eqimg(s,'t87-three-processes',236,422,1450,445);strip(s,'세 과정을 합하면 CH₄의 연소 반응이 된다.');finish(26,s,'원소에서생성물로가는경로와메테인을거치는경로를비교한다. CH4생성식①을뒤집고③을2배하여원소를소거한다. 다음장일반식으로연결한다.','W22 121 CH4 생성식①②③·조합');
}
{
 const s=await newpage(27,'계수를 곱해 더한다');rich(s,chem('ΔH = 생성물의 표준 생성 엔탈피 합'),180,407,1560,98,64,C.green,true,'center');text(s,'− 반응물의 표준 생성 엔탈피 합',180,501,1560,98,64,C.green,true,'center');rows(s,['표의 값에 각 물질의 반응 계수를 곱한다.','생성물의 합에서 반응물의 합을 뺀다.'],[654,815],48);finish(27,s,'일반식의합은그냥각물질값을한번씩더한다는뜻이아니라계수곱을포함한다. 엄밀한표준반응엔탈피기호와단위는주교과서대조후통일한다.','W22 121 관계식');
}
{
 const s=await newpage(28,'메테인 연소열 구하기');await eqimg(s,'t86-ch4-combustion',236,395,1450,95);roundTable(s,[['물질','CH₄(g)','O₂(g)','CO₂(g)','H₂O(l)'],['ΔfH° (kJ/mol)','−74.8','0','−393.5','−285.8']],192,522,1537,190,[409,282,282,282,282],40);box(s,192,756,1537,100,C.light,'대입 계산',16);eq(s,'ΔH = [−393.5 + 2 × (−285.8)] − [−74.8 + 2 × 0]',236,766,1450,44);strip(s,'ΔH = −890.3 kJ',898);finish(28,s,'이장수치세트는완자121의-74.8/-393.5/-285.8을그대로이용한다. 3-01자료의-890.5값과혼용하지않는다. CH4연소1mol기준식이다.','W22 121 표·메테인 예제');
}
{
 const s=await newpage(29,'물의 상태 변화 엔탈피');await img(s,path.join(HERE,'water-levels.png'),255,457,640,410,'W22 123 Q4 원본 상태별 엔탈피 그래프');text(s,'기화 반응',1030,470,700,65,42,C.green,true);await eqimg(s,'t85-water-vaporize',1030,548,700,80);eq(s,'ΔH = −241.8 − (−285.8)',1030,673,740,46);eq(s,'= +44.0 kJ',1030,758,700,56,C.green,true);strip(s,'기화는 열을 흡수하므로 ΔH > 0');finish(29,s,'25°C에서상태차이를나타낸값이다. 끓는점100°C의기화엔탈피와혼용하지않는다. 두반응의물질상태를구분한다.','W22 123 Q4;121 상태별 표');
}
{
 const s=await newpage(30,'생성 엔탈피 계산의 확인점');roundTable(s,[['확인 대상','확인할 내용'],['기준','생성되는 물질 1 mol인가?'],['원소·상태','기준 원소와 물질의 상태가 맞는가?'],['계수·단위','계수를 곱하고 단위를 구분했는가?']],192,450,1190,400,[300,890],40);finish(30,s,'표의kJ/mol과적힌열화학반응식의kJ를구분한다. 단원뒤로밀지않고Part3안에서정리한다.','W22 121·124 핵심체크');
}
await transition(31,4,'실험으로 확인하는 헤스 법칙','용해한 뒤 중화할 때와 고체를 직접 반응시킬 때의 열은 같을까?');
{
 const s=await newpage(32,'같은 처음과 끝을 만드는 두 경로');await img(s,path.join(HERE,'experiment-paths.png'),250,450,420,480,'W22 120 처음·중간·나중 경로 그림');text(s,'경로 Ⅰ: 용해 → 중화',790,452,970,65,44,C.green,true);await eqimg(s,'w120-naoh-dissolve',790,535,970,70);await eqimg(s,'w120-naoh-neutral',790,634,970,70);text(s,'경로 Ⅱ: 고체와 직접 반응',790,752,970,65,44,C.green,true);await eqimg(s,'w120-naoh-direct',790,840,970,70);finish(32,s,'처음·나중에있는물질전체를같게한다. 반응식에생략된용매물도경로조건에서비교한다. NaOH(aq)는중간물질로소거된다.','W22 120 실험; G22 보존104~105');
}
{
 const s=await newpage(33,'실험 조건을 맞추자');text(s,'NaOH 8.0 g = 0.200 mol, HCl 1.0 M × 0.200 L = 0.200 mol',175,386,1570,70,38,C.gray,true,'center');
 await img(s,path.join(HERE,'experiment-photo-a.png'),192,500,975,320,'W22 120 실험Ⅰ 용해와 중화 사진');await img(s,path.join(HERE,'experiment-photo-b.png'),1210,500,485,320,'W22 120 HCl 혼합 사진');
 box(s,192,839,975,100,C.dark,'용해·냉각·중화 캡션',16);text(s,'용해 후 처음 온도로 식힌 뒤 중화',223,854,913,70,40,'#FFFFFF',true,'center');box(s,1210,839,485,100,C.dark,'조건 확인 캡션',16);text(s,'처음 온도·전체 양 확인',1230,854,445,70,36,'#FFFFFF',true,'center');finish(33,s,'완자예시실험Ⅰ용해뒤25°C로식히고중화한다. 실험Ⅱ에서는물과염산혼합뒤25°C로식힌후고체를넣는다. 원본사진의두패널이모두실험Ⅰ임을구분하고직접반응실험사진으로잘못이름붙이지않는다.','W22 120 과정·실험Ⅰ 사진');
}
{
 const s=await newpage(34,'용액이 얻은 열에서 반응열로');rich(s,chem('Q용액 = c × m × Δt'),200,408,1520,108,76.4,C.green,true,'center');rows(s,['c: 용액의 비열, m: 용액 전체의 질량','Δt = 나중 온도 − 처음 온도'],[575,735],48);strip(s,'온도 상승: Q용액 > 0, 반응의 ΔH < 0',904);finish(34,s,'외부열출입·열량계열용량을무시하는근사에서용액이얻은열과반응에서방출한열의크기를연결한다. 반응mol기준으로환산하기전Q는J또는kJ이다. 용질질량도더한다.','W22 120 Q=cmΔt·열량 계산; G22 보존104~105');
}
{
 const s=await newpage(35,'실험 온도와 용액의 질량');roundTable(s,[['반응 단계','질량 (g)','처음 (°C)','나중 (°C)','Δt (°C)'],['용해','208','25.0','34.5','9.5'],['중화','408','25.0','31.1','6.1'],['직접 반응','408','25.0','36.0','11.0']],192,452,1537,420,[337,300,300,300,300],42);text(s,'모든 용액의 비열 4.2 J/(g·°C), 밀도 1.0 g/mL로 가정',192,913,1537,65,36.4,C.gray,true,'center');finish(35,s,'교재예시데이터이며이번수업에서실측한값으로표현하지않는다. W22와G22예시온도를섞지않는다. 각반응의처음온도를별도로기록한다.','W22 120 결과·열량 표');
}
{
 const s=await newpage(36,'용해 단계의 반응 엔탈피');rows(s,['Q용액 = 4.2 × 208 × 9.5 = 8299.2 J ≈ 8.30 kJ','NaOH의 양 = 8.0 ÷ 40.0 = 0.200 mol','ΔH용해 = −8.30 ÷ 0.200 ≈ −41.50 kJ/mol'],[455,609,763],47);finish(36,s,'계산전의정확한값-41.496kJ/mol을최종반올림하면-41.50이다. 온도상승으로용액이열을얻었고반응ΔH는음수임을구분한다.','W22 120 실험Ⅰ❶');
}
{
 const s=await newpage(37,'나머지 두 단계와 비교');roundTable(s,[['반응 단계','방출한 열 (kJ)','NaOH 기준 (mol)','ΔH (kJ/mol)'],['용해','8.30','0.200','−41.50'],['중화','10.45','0.200','−52.25'],['직접 반응','18.85','0.200','−94.25']],192,452,1537,420,[337,400,400,400],42);text(s,'교재에 제시된 반올림 값을 같은 기준으로 비교한다.',192,909,1537,65,36.4,C.gray,true,'center');finish(37,s,'중화10.45와직접18.85kJ는교재의중간반올림값이다. 연속계산의반올림전결과와혼합하지않고여기서는교재의반올림표를한세트로쓴다.','W22 120 해석2');
}
{
 const s=await newpage(38,'실험값은 얼마나 가까울까?');rows(s,['−41.50 + (−52.25) = −93.75 kJ/mol','직접 반응: −94.25 kJ/mol','두 결과의 차이: 0.50 kJ/mol'],[455,609,763],47);finish(38,s,'열손실·측정·증발및희석·농도조건의영향을교사발문으로연결한다. 데이터를고쳐정확히일치시키지않는다. 관찰은근사일치이며법칙실패로단정하지않는다.','W22 120 해석3·오차 설명');
}
{
 const s=await newpage(39,'직접 재지 못한 ΔH를 알게 되는 까닭');rows(s,['이미 알고 있는 반응들을 조합한다.','같은 처음 상태와 나중 상태를 만든다.','알려진 ΔH를 더해 미지의 ΔH를 구한다.']);finish(39,s,'도입의높이차비유와연결해경로와변화량을말로구분한다. 걷는거리나신체에너지와반응열을동일시하지않는다. 원래등록캐릭터를확보하지못해캐릭터는배치하지않았다.','W22 118~123; STD22');
}
{
 const s=await newpage(40,'경로와 식으로 설명하기');rows(s,['CO 생성 반응의 ΔH₃ = ΔH₁ − ΔH₂를 설명하시오.','물의 기화 반응에서 ΔH 부호를 근거와 함께 말하시오.','실험값이 정확히 같지 않을 수 있는 이유를 말하시오.'],[455,609,763],44);finish(40,s,'출구과제예상답:①두연소식을조합하면목표식이남음②양의값,생성엔탈피차이+44.0kJ③열손실·기기/온도측정·희석/농도조건등. 화면에정답을동시에적지않고교사노트에보존한다. 형식적정리문구보다실제개념활동이름으로끝낸다.','W22 119·123·120 근거 교사 제작 확인 과제');
}

// Source-first correction: supersede earlier equation provenance and inconsistent Wanja indices.
const sourceMap={8:'T84 그림III-8; ΔH1=-189.3, ΔH2=-76.9, ΔH3=-112.4 kJ',9:'T84 원본 반응식 세 개. ΔH2+ΔH3=ΔH1',10:'T76 물 생성 반응 1mol·2mol 원본. -285.8/-571.6kJ',11:'T86 메테인 생성식과 T87 분해식 원본. -74.8/+74.8kJ/mol',15:'T85 예제 세 반응식 원본. CO 생성 ΔH3, CO 산화 ΔH2',16:'T85 예제 원본 식 조합. ③=①−②',17:'T85 원본 식 두 개. ΔH3=ΔH1−ΔH2=-110.5kJ',19:'W22 122 Q2 주어진식·목표식 원본',20:'W22 122 Q2 주어진식·목표식 원본. 반응식 이미지 재생성 없음',21:'T85 원본 그래프. ΔH1=ΔH3+ΔH2',23:'T85 유제 물 생성식 원본. T86 표준 생성 엔탈피 정의·표',25:'T85 유제 물·수증기 생성 반응식 원본 두 개',26:'T87 원본 과정1~3. CH4 분해식은 역반응이므로 모든 과정을 더함',28:'T86 메테인 연소 반응식 원본, T86~87 수치로 -890.3kJ',29:'T85 유제 물 기화식 원본. ΔH3=+44.0kJ',32:'W22 120 원본 NaOH 반응식 세 개',40:'T85 CO 생성 ΔH3=ΔH1−ΔH2'};
for(const [key,source] of Object.entries(sourceMap)){
 const n=Number(key),s=pageMap.get(n);
 s.speakerNotes.text='2026-10-27 원본 반응식 교체. 최신 출처: '+source+'\nT=천재교육 물질과 에너지 교과서(PDF쪽=인쇄쪽), W22=완자 물질과 에너지. 원본 PDF를 렌더링해 크롭한 이미지이며 직접 입력/생성한 반응식이 아니다. assets/equations-v05/provenance.json 참조. 이 기록이 이전 출처·수치·식 번호 메모를 대체한다.\n'+s.speakerNotes.text;
}


// Latest user-authorized Part 2 additional example. Original source equations only.
const DA=path.join(ROOT,'units/3-02_헤스법칙/assets/diamond-v14');
{
 const s=p.slides.add();pageMap.set('diamond-intro',s);s.background.fill='#FFFFFF';await header(s,'Part 2 반응 엔탈피 구하기','01','간접 측정');
 title(s,'흑연으로 다이아몬드를 만들 수 있을까?');
 text(s,'보통 조건에서는 변화가 매우 느려 반응 엔탈피를 직접 측정하기 어렵다.',150,393,1620,65,36.4,C.gray,true,'center');
 text(s,'구하려는 반응',192,496,1000,70,42,C.green,true);
 await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/diamond-v16/w15-137-target-no-label.png'),239,586,760.8,106,'2015 완자137쪽 목표 반응식 원본');
 box(s,192,769,1100,176,C.light,'간접 측정 방법',18);
 text(s,'흑연과 다이아몬드의 연소열을 각각 측정하고,',230,789,1020,65,42,C.black,false);
 rich(s,chem('헤스 법칙으로 두 물질 사이의 ΔH를 구한다.'),230,861,1020,65,42,C.black,false);
 await img(s,path.join(DA,'girl-graphite-attempt.png'),1396,470,356,534,'등록 여학생이 흑연을 눌러 보며 애쓰는 개념 삽화');
 note(s,'사용자 요청 추가 예시. 오른쪽 여학생은 등록 body_student_two_flasks의 얼굴·머리·비율을 참조한 생성 삽화이다. 흑연을 손으로 눌러 다이아몬드를 만들려 애쓰는 개념적 상상 장면이며 실제 합성 방법이나 성공을 뜻하지 않는다. 보통 조건에서 직접 전환의 열량 측정은 어렵기 때문에 두 연소 반응을 이용한다. 고온·고압 등의 특수 합성 조건에서 제조 가능함과 구별한다. 원본 목표 반응식: 2015 완자 PDF/인쇄137쪽 풀이2. 2022 완자127쪽Q7·131쪽Q6 대조; 천재교과서86쪽 동소체/표 대조. 원본 식을 생성하거나 재입력하지 않았다.');
}
{
 const s=p.slides.add();pageMap.set('diamond-calc',s);s.background.fill='#FFFFFF';await header(s,'Part 2 반응 엔탈피 구하기','01','간접 측정');
 title(s,'두 연소열의 차이로 구한다');
 text(s,'25 °C, 1기압에서 같은 생성물 CO₂가 생기는 두 연소 반응을 비교한다.',150,393,1620,65,36.4,C.gray,true,'center');
 await img(s,path.join(DA,'w22-127-graphite.png'),200,510,1245,95,'2022 완자127쪽 흑연 연소 반응식 원본');
 await img(s,path.join(DA,'w22-127-diamond.png'),200,647,1517,95,'2022 완자127쪽 다이아몬드 연소 반응식 원본 — 원본문자 한 줄 재배치');
 text(s,'위 식에서 아래 식을 빼면 흑연 → 다이아몬드 반응이 된다.',210,790,1500,65,42,C.green,true);
 strip(s,'ΔH = −393.5 − (−395.4) = +1.9 kJ',895);
 note(s,'출처: 2022 완자 PDF/인쇄127쪽 Q7의 두 원본 연소 반응식과 모범답안. 2015 완자 PDF/인쇄137쪽 그래프·풀이 대조. 흑연 연소식에서 다이아몬드 연소식을 빼면 O2와CO2가 소거되어 C(s,흑연)→C(s,다이아몬드)만 남는다. 흑연1mol 기준 ΔH=+1.9kJ, 흡열반응. 25°C1기압 자료. 천재86쪽 표의1.88kJ/mol과는 표시 정밀도가 다르므로 이 장은 완자Q7의 반올림 수치만 사용한다. 표준 생성 엔탈피 정의는 뒤 Part3에서 다루고 여기서는 연소열과 헤스법칙만 이용한다.');
}

const charRoles=[
 [7,'brown-boy','경로만 다르게!\n물질·상태·양·조건은 같게.'],
 [12,'wavy-hair-girl','계수·방향을 바꾸면\nΔH도 함께 바꿔!'],
 [14,'glasses-boy','CO만 생성되는 반응의 열을\n따로 재기 어려워.'],
 [23,'long-hair-girl','생성되는 물질이\n1 mol인지 확인해!'],
 [24,'wavy-hair-girl','O₂의 값은 0이지만,\n모든 동소체가 0은 아니야.'],
 [27,'glasses-boy','표의 값에 반응 계수를\n곱하는 것을 잊지 마!'],
 [30,'brown-boy','기준·상태·계수·단위,\n네 가지를 확인해!'],
 [34,'long-hair-girl','온도가 올랐다면\n반응은 열을 방출했어.'],
 [38,'wavy-hair-girl','두 경로의 실험값은\n얼마나 가까울까?'],
 [39,'glasses-boy','처음과 끝이 같으면\n다른 경로로도 구할 수 있어.'],
 [40,'brown-boy','식과 그래프를 근거로\n이유를 설명해 보자.']
];
function speech(s,str,x=1410,y=445,w=370,h=148){
 box(s,x,y,w,h,'#FFFFFF','참조 R03-22 캐릭터 말풍선',24);
 const border=s.shapes.items.at(-1);border.line={fill:'#BDD0AE',width:2};
 const tail=s.shapes.add({geometry:'custom',name:'캐릭터로 연결되는 말풍선 꼬리',position:{left:x+245,top:y+h-1,width:49,height:32},fill:'#FFFFFF',line:{fill:'#BDD0AE',width:2},customPaths:[{width:49,height:32,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:49,y:32}},{lineTo:{x:31,y:0}}]}]});
 const lines=str.split('\n');for(let i=0;i<lines.length;i++)rich(s,chem(lines[i]),x+16,y+21+i*52,w-32,49,Math.min(33,33*(w-32)/measured(lines[i],33)),C.black,false,'center','캐릭터 발화 '+(i+1));
}
const roleEvidence=[];
for(const [n,id,words] of charRoles){
 const s=pageMap.get(n);
 for(const sh of s.shapes.items){
  if(sh.name?.startsWith('설명·계산 행'))sh.position={...sh.position,width:1190};
  if(sh.name==='설명·계산 문장 '+1||sh.name?.startsWith('설명·계산 문장')){
   sh.position={...sh.position,left:230,width:1110};
   const txt=sh.text.toString();
  }
 }
 if(n===27){for(const sh of s.shapes.items){if([407,501].includes(sh.position.top)&&sh.position.left===180)sh.position={...sh.position,width:1190};}}
 // Keep the source table separate from the checker's silhouette.
 const file=path.join(ROOT,'units/3-02_헤스법칙/assets/characters-v17',id+'-placed.png');
 const isWide=id==='brown-boy'||id==='long-hair-girl';
 await img(s,file,isWide?1400:1430,610,isWide?390:330,[24,34].includes(n)?280:350,'등록 '+id+' 수업 역할 포즈');
 let sy=445;if(n===23)sy=455;
 speech(s,words,1410,sy,370,148);
 roleEvidence.push({planned_page:n,character:id,speech:words,source:'registered original -> identity-preserving derived PNG',reference:'R03 p22; R02 p18,59'});
}
await fs.writeFile(path.join(HERE,'character-roles-v17.json'),JSON.stringify(roleEvidence,null,2));

// R02 page67 original annotation arrow reused only to identify physical state.
{
 const s=pageMap.get(25);const f=path.join(ROOT,'assets/reference-library/20261027/components/R02-p67-curved-arrow.png');
 text(s,'액체 물',1110,445,260,55,38,C.green,true);await img(s,f,996,485,114,60,'R02 67쪽 원본 곡선 주석 화살표');
 text(s,'수증기',1110,633,260,55,38,C.green,true);await img(s,f,996,673,114,60,'R02 67쪽 원본 곡선 주석 화살표');
}
text(pageMap.get(10),'계수 2배',240,807,700,55,38,C.green,true);
text(pageMap.get(10),'ΔH도 2배',1205,807,500,55,38,C.green,true);
text(pageMap.get(11),'발열 반응',1200,405,500,48,36.4,C.green,true);
text(pageMap.get(11),'흡열 반응',1200,759,500,48,36.4,C.green,true);
const outputOrder=[...Array.from({length:17},(_,i)=>i+1),'diamond-intro','diamond-calc',...Array.from({length:23},(_,i)=>i+18)];
const actualTitles={"7": "같은 반응을 비교하려면", "9": "두 반응식을 더하면", "10": "계수와 ΔH는 같은 비율로", "11": "반응을 뒤집으면 부호도 반대", "12": "열화학 반응식의 세 가지 조작", "14": "CO 생성열을 직접 재기 어려운 까닭", "15": "구하려는 반응부터 확인", "16": "CO₂를 소거해 목표 반응을 만든다", "18": "헤스 법칙 계산의 순서", "19": "SO₂가 SO₃로 바뀔 때", "20": "반응식과 ΔH를 함께 검산", "21": "그림과 반응식은 같은 관계", "23": "표준 생성 엔탈피", "24": "기준 원소 물질의 값은 0", "25": "물과 수증기는 서로 다른 자료", "26": "생성물에서 반응물을 빼는 까닭", "27": "계수를 곱해 더한다", "28": "메테인 연소열 구하기", "29": "물의 상태 변화 엔탈피", "30": "생성 엔탈피 계산의 확인점", "32": "같은 처음과 끝을 만드는 두 경로", "33": "실험 조건을 맞추자", "34": "용액이 얻은 열에서 반응열로", "35": "실험 온도와 용액의 질량", "36": "용해 단계의 반응 엔탈피", "37": "나머지 두 단계와 비교", "38": "실험값은 얼마나 가까울까?", "39": "직접 재지 못한 ΔH를 알게 되는 까닭", "40": "경로와 식으로 설명하기", "1": "표지", "2": "다른 길로 가도, 높이 차는 같을까?", "3": "수업 목차", "4": "학습 목표", "5": "Part 1 헤스 법칙", "6": "헤스 법칙", "8": "경로가 달라도, ΔH는 같다", "13": "Part 2 반응 엔탈피 구하기", "17": "CO 생성 반응의 반응 엔탈피", "22": "Part 3 표준 생성 엔탈피", "31": "Part 4 실험으로 확인하는 헤스 법칙"};
const outputTitles=outputOrder.map(k=>k==='diamond-intro'?'흑연으로 다이아몬드를 만들 수 있을까?':k==='diamond-calc'?'두 연소열의 차이로 구한다':actualTitles[k]??planned.slides[k-1].title);
p.slides.reorder(outputOrder.map(k=>'sl/'+pageMap.get(k).id));
for(let i=0;i<42;i++){if(p.slides.items[i].id!==pageMap.get(outputOrder[i]).id)throw new Error('Slide order mismatch '+(i+1));p.slides.items[i].speakerNotes.text='최신42장 검토 시안 실제 '+(i+1)+'장.\n'+p.slides.items[i].speakerNotes.text.replace(/전체 검토 시안 \d+\/40[.]?/g,'');}

const teachingNotes={
1:['표지','산 모형의 두 길을 보고 같은 출발점과 정상 사이에서 변하지 않는 것은 무엇인지 생각하게 한다.','사용자 지정 등록 원본 인물 참조 표지; assets/diamond-v14/provenance.json'],
2:['동기 유발','걸어간 거리와 높이 차를 구별한다. 경로가 달라도 출발점과 도착점이 같으면 높이 차는 같다. 걷는 거리나 신체가 소비하는 에너지를 반응 엔탈피와 동일시하지 않는다.','천재 물질과 에너지82쪽; 사용자 지정 두 인물 등산 장면'],
6:['헤스 법칙','반응물과 생성물의 종류·상태·양 및 온도·압력 조건을 맞추면 반응 경로와 관계없이 반응 엔탈피가 같다. 총 열량 불변의 법칙이라는 이름과 간접 측정의 유용성을 연결한다.','천재83~84쪽; 2022 완자118쪽'],
8:['경로별 반응 엔탈피','교과서 그래프의 직접 경로는-189.3kJ, 두 단계는-76.9kJ와-112.4kJ이다. 같은 처음과 끝을 연결하는 화살표를 읽고 합이 같음을 확인한다.','천재84쪽 그림III-8 원본'],
9:['반응식의 합','CaO와 물의 반응에서 생긴 Ca(OH)2를 다음 반응에서 소비한다. 중간 물질과 양변의 물1mol을 소거하면 CaO와HCl의 직접 반응이 남는다. -76.9+(-112.4)=-189.3kJ.','천재84쪽 원본 세 반응식'],
10:['계수와 반응 엔탈피','수소와 산소로 액체 물1mol을 만드는 반응을2배하면 물2mol이 생성되고 출입하는 열도2배가 된다. -285.8kJ와-571.6kJ를 대응한다.','천재76쪽 원본 계수 비교 식'],
11:['역반응의 엔탈피','메테인 생성 반응과 분해 반응은 방향이 반대다. -74.8kJ/mol과+74.8kJ/mol은 절댓값이 같고 부호가 반대임을 확인한다.','천재86쪽 생성식·87쪽 과정1 원본'],
15:['목표 반응과 자료','목표는 흑연으로CO1mol을 만드는 반응이다. CO2가 생기는 두 연소 반응의 측정값을 이용한다.','천재85쪽 예제 원본 세 식'],
16:['CO2 소거','흑연 연소식에서 CO 연소식을 뺀다. 이는 두 번째 반응을 역으로 하여 더하는 것과 같다. CO2가 소거되고 산소1/2mol이 남는다.','천재85쪽 예제 식 조합 원본'],
17:['CO 생성 엔탈피','목표식에 대응하는 ΔH3=ΔH1−ΔH2이다. -393.5−(-283.0)=-110.5kJ. 두 음수를 빼는 부호 계산과 생성되는CO1mol 기준을 확인한다.','천재85쪽 원본 반응식·수치'],
18:['흑연과 다이아몬드','보통 조건에서 흑연이 다이아몬드로 변하는 반응은 직접 열량을 측정하기 어렵다. 두 동소체의 연소열로 전환 반응의 엔탈피를 간접 계산한다. 캐릭터의 손으로 누르는 모습은 상상 장면이며 실제 합성 절차가 아니다.','2015 완자137쪽 원본 목표식; 2022 완자127쪽Q7; 천재86쪽'],
19:['연소열의 차','흑연 연소 반응에서 다이아몬드 연소 반응을 빼면 산소와CO2가 소거된다. -393.5−(-395.4)=+1.9kJ로 흡열이다. 25°C1기압의 완자 반올림 자료이며 천재86쪽1.88과 표시 정밀도를 섞지 않는다.','2022 완자127쪽Q7; 2015 완자137쪽'],
21:['황 산화 반응 문제','주어진 두 반응에서 목표SO2의 계수2와SO3의 생성물 위치를 먼저 확인한다. 정답은 다음 장에서 공개한다.','2022 완자122쪽Q2 원본'],
22:['황 산화 반응 검산','첫 반응을2배해 둘째 반응에서 빼면 목표식이 된다. -791−2×(-297)=-197kJ. 원소 수와 반응 엔탈피 부호를 함께 확인한다.','2022 완자122쪽Q2 원본·해설'],
23:['그래프와 관계식','전체 반응 ΔH1은 중간CO를 거치는 ΔH3와 ΔH2의 합이다. 알고 싶은 ΔH3를 구하도록 식을 이항한다.','천재85쪽 엔탈피 그림 원본'],
25:['표준 생성 엔탈피','표준 상태의 가장 안정한 성분 원소로부터 물질1mol이 생성될 때의 반응 엔탈피다. 원본 물 생성 반응식의 계수와 생성물 상태를 확인한다. 이 자료는25°C 값이다.','천재86쪽 정의 및85쪽 물 생성식; 2022 완자121쪽'],
26:['기준 원소 물질','표준 생성 엔탈피의 기준값을0으로 정하는 것이며 물질 자체의 엔탈피H가0이라는 뜻이 아니다. O2와O3, 흑연과다이아몬드를 구별한다.','천재86쪽 표III-3·동소체 설명; 2022 완자121쪽'],
27:['물과 수증기','같은 양과 온도에서 생성물의 상태만 다른 두 반응을 비교한다. H2O(l)은-285.8, H2O(g)는-241.8kJ/mol이며 상태가 다른 물질끼리는 소거하지 않는다.','천재85쪽 유제 원본 두 식'],
28:['생성 엔탈피 계산의 근거','메테인을 원소로 분해하고 그 원소로CO2와물을 생성하는 교과서 세 과정을 합한다. 메테인의 생성식을 역으로 했으므로 그 항에 음수가 붙는다.','천재87쪽 과정1~3 원본'],
30:['메테인 연소 계산','자료는CH4 -74.8, CO2 -393.5, H2O(l) -285.8kJ/mol이다. 계수를 곱한 생성물 합에서 반응물 합을 빼면 -890.3kJ다.','천재86~87쪽·2022 완자121쪽'],
31:['기화 엔탈피','25°C에서 물과수증기의 생성 엔탈피 차이로 기화 엔탈피를 구한다. -241.8−(-285.8)=+44.0kJ. 100°C 끓는점의 자료와 혼용하지 않는다.','2022 완자123쪽Q4 원본 그래프; 천재85쪽 기화식 원본'],
34:['두 실험 경로','경로I은고체NaOH의용해후중화, 경로II는고체NaOH와HCl수용액의직접반응이다. 처음과끝의전체물질·양·상태를맞춘다.','2022 완자120쪽 원본 경로·반응식'],
35:['실험 조건','NaOH8.0g은0.200mol이다. 용해 후 처음 온도로 식힌 다음 중화한다. 직접반응에서는 물과 염산을 먼저 혼합해처음온도로맞춘다. 사진두패널은모두실험I이며직접반응사진으로오해하지않게한다.','2022 완자120쪽 과정·실험I 사진'],
36:['용액 열량과 반응열','용액전체질량과온도변화를사용한다. 외부열출입과열량계열용량을무시하면용액이얻은열과반응에서방출한열의크기는같다. 온도상승일때용액Q는양수, 반응ΔH는음수다.','2022 완자120쪽; 물질과 에너지 지도서 보존104~105쪽'],
37:['온도 자료','세반응의처음온도를각각25°C로맞춘자료다. 용액의질량208·408·408g과온도상승9.5·6.1·11.0°C를각행에서읽는다.','2022 완자120쪽 원본 실험 결과'],
38:['용해 엔탈피 계산','4.2×208×9.5=8299.2J이다. 반응물0.200mol로나누고부호를음수로하면약-41.50kJ/mol이다.','2022 완자120쪽 실험I-1'],
39:['반응별 자료 비교','완자가제시한중간반올림값으로8.30·10.45·18.85kJ를같은0.200mol기준으로환산한다. 반올림전값과섞어계산하지않는다.','2022 완자120쪽 해석2'],
40:['실험값의 근사 일치','두단계합-93.75와직접반응-94.25kJ/mol의차이는0.50이다. 열손실과측정·희석조건등을검토한다. 실험값차이를없애려고자료를고치지않는다.','2022 완자120쪽 해석3'],
41:['유용성','알려진반응들을조합해목표반응과같은처음과끝을만들면직접측정하지않은반응의엔탈피를구할수있다.','천재83~87쪽; 성취기준12물에03-02'],
42:['설명 과제','예상답: CO생성은두연소식을조합하면목표식이남음. 기화의ΔH는양수. 실험차이는열손실·온도측정·희석조건등으로설명한다.','천재85쪽·2022 완자120쪽 자료를 바탕으로 한 교사 제작 확인문항']
};
for(let i=0;i<42;i++){
 const actual=i+1,s=p.slides.items[i],key=outputOrder[i],base=Number.isInteger(key)?planned.slides[key-1]:null;
 const nt=teachingNotes[actual]??[outputTitles[i],base?.message??outputTitles[i],base?.source_locator??'천재 물질과 에너지83~87쪽;2022 완자118~124쪽'];
 s.speakerNotes.text='수업 '+actual+'/42. '+nt[0]+'\n발화·지도: '+nt[1]+'\n출처: '+nt[2]+'.\n수업 자료: 반응식·그래프는 교과서·완자 원본 이미지, 개념 질문의 인물은 등록 원본을 참조한 파생 삽화.';
}
await fs.writeFile(path.join(HERE,'page-map.json'),JSON.stringify(outputOrder.map((k,i)=>({number:i+1,title:outputTitles[i],id:pageMap.get(k).id})),null,2));
await fs.mkdir(OUT,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
 if(process.env.HESS_ONLY_SLIDE && !process.env.HESS_ONLY_SLIDE.split(',').map(Number).includes(i+1))continue;
 const s=p.slides.items[i];const stem=`slide-${String(i+1).padStart(2,'0')}`;
 const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(OUT,stem+'.png'),new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:'layout'});await fs.writeFile(path.join(HERE,stem+'.layout.json'),await layout.text());
 console.log('Rendered',i+1);
}
const candidate=path.join(HERE,'candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
await fs.writeFile(path.join(HERE,'content-inspection.ndjson'),(await p.inspect({kind:'slide,textbox,image,notes',maxChars:100000})).ndjson);
console.log('CANDIDATE',candidate,'CHARACTER_ASSETS',assets);
if(process.env.HESS_FINALIZE==='1'){
 const SKILL='/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.22136/skills/presentations';
 const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
 console.log(await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:path.join(OUT,'3-02_헤스법칙_전체42장_캐릭터와전체QA_v17.pptx'),pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:42,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Pretendard']},verifyArtifactToolImport:true,receiptPath:path.join(HERE,'validation-v17.json')}));
}
