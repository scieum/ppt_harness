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
 const rad=24;for(const [xx,yy,rot] of [[x,y,0],[x+w-rad,y,90],[x+w-rad,y+h-rad,180],[x,y+h-rad,270]])s.shapes.add({geometry:'custom',name:'표 둥근 외곽 마스크',position:{left:xx,top:yy,width:rad,height:rad,rotation:rot},fill:'#000000',line:{fill:'none',width:0},customPaths:[{width:rad,height:rad,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:rad,y:0}},{cubicBezTo:{x1:10,y1:0,x2:0,y2:10,x:0,y:rad}},{close:{}}]}]});return t;
}
// Plan1 cover: byte-identical registered original 4-person classroom illustration.
{
 const s=p.slides.add();s.background.fill='#0C7D08';await img(s,path.join(AS,'generated/cover-entropy-green-v04.png'),0,0,1920,1080,'등록 네 학생 기반 엔트로피 표지 수정본');
 box(s,0,0,1920,1080,'linear(0deg, #0C7D08 0%, #0C7D08/98 25%, #0C7D08/82 37%, #0C7D08/25 58%, #0C7D08/0 72%)','왼쪽 녹색 그라데이션');
 text(s,'Ⅲ. 화학 변화의 자발성',139,206,1470,145,110,'#FFFFFF',true,'left','대단원명');text(s,'03. 엔트로피',139,347,1400,145,110,'#FFFFFF',true,'left','소단원명');text(s,'사이음 저',143,554,400,60,40,'#FFFFFF',false,'left','저자');
 text(s,'본 수업 자료에 사용된 일부 이미지는 생성형 AI 기술을 활용하여 제작되었습니다.',45,1035,1300,30,21,'#FFFFFF',false,'left','AI 안내');await branding(s,true,true);
 finish(s,1,'사용자 요청으로 핑크 배경과 기체법칙 실험 소품을 엔트로피 요소로 수정했다. 등록 네 학생을 참조한 생성 편집본. 혼합 입자 모형·녹는 얼음·방향제는 개념적 도입용이다.','등록 원본 cover-original.png 기반 image_gen 편집. 생성 프롬프트와 검토 기록 assets/generated/cover-entropy-green-v04.md.');
}

{
 const s=p.slides.add();s.background.fill='#000000';
 const cv=new Canvas(1920,1080),cx=cv.getContext('2d'); const gr=cx.createRadialGradient(1390,1080,20,1390,1080,780);gr.addColorStop(0,'#164426');gr.addColorStop(0.5,'#092114');gr.addColorStop(1,'#000000');cx.fillStyle=gr;cx.fillRect(0,0,1920,1080);await fs.writeFile(path.join(HERE,'hook-background.png'),await cv.toBuffer('png'));await img(s,path.join(HERE,'hook-background.png'),0,0,1920,1080,'캐릭터와 분리한 하단 초록 그라데이션');
 await header(s,'Part 0 동기 유발','01','방향제와 확산');title(s,'향기는 왜 방 안에 퍼질까?',270,'#FFFFFF');
 text(s,'옷장에 넣어 둔 고체 방향제는 시간이 지나면 어떻게 될까?',150,390,1620,70,36.4,'#A6A6A6',true,'center');
 box(s,192,564,780,240,'#202420','학생 질문 말풍선',24);
 s.shapes.add({geometry:'custom',name:'말풍선 꼬리',position:{left:970,top:655,width:80,height:60},fill:'#202420',line:{fill:'none',width:0},customPaths:[{width:80,height:60,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:80,y:30}},{lineTo:{x:0,y:60}},{close:{}}]}]});
 text(s,'퍼져 나간 방향제 입자가',230,588,705,66,44,'#FFFFFF',true,'center');text(s,'저절로 다시 한곳에',230,654,705,66,44,'#FFFFFF',true,'center');text(s,'모일 수 있을까?',230,720,705,66,44,C.green,true,'center');
 await img(s,path.join(AS,'generated/hook-student-original-ratio.png'),1035,480,760,545,'등록 갈색 곱슬머리 학생 — 원본 비율 유지');
 finish(s,2,'검정·초록 대표 검토본. 교과서 사진 없음. 등록 학생 기반 기존 생성본을 종횡비 그대로 배치. 캐릭터와 배경 그라데이션 분리.','천재 물질과 에너지90; 생성 자산 hook-student-original-ratio.png; 배치 R04 PDF12.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 1 엔트로피','01','엔트로피');title(s,'엔트로피',245,C.green);
 box(s,192,402,1537,148,'#202420','이어지는 하나의 정의',20);
 rich(s,[r('엔트로피는 '),r('무질서도',{color:C.green,bold:true}),r('를 나타내는 척도이며, 기호는 S이다.')],255,420,1410,112,48,'#FFFFFF');
 text(s,'무질서도가 클수록 엔트로피가 크다.',255,573,1410,76,45,'#FFFFFF');
 await img(s,path.join(AS,'scientists/clausius-v02.png'),280,665,265,318,'기존 클라우지우스 캐릭터 — 회중시계');
 text(s,'클라우지우스',570,727,420,65,42,C.green,true);text(s,'엔트로피 개념 도입',570,800,450,62,34,'#FFFFFF');
 await img(s,path.join(AS,'scientists/boltzmann-v02.png'),1020,665,263,318,'기존 볼츠만 캐릭터 — 입자 모형');
 text(s,'볼츠만',1310,727,430,65,42,C.green,true);text(s,'엔트로피의 통계적 해석',1310,800,465,62,34,'#FFFFFF');
 finish(s,6,'단일 정의를 유지하고 기존 과학자 v02 자산 두 개를 재사용. 통계식이나 추가 계산은 도입하지 않음.','천재90; W22 138; assets/scientists/manifest.json; brief 수정8·15쪽.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 3 전체 엔트로피와 자발성','01','전체 엔트로피');title(s,'전체 엔트로피 변화',270,'#FFFFFF');
 const terms=[[315,'전체'],[810,'계'],[1295,'주위']];
 for(const [x,label] of terms){text(s,'ΔS',x,434,175,130,105,C.green);text(s,label,x+168,511,140,58,37,'#FFFFFF');}
 text(s,'=',640,439,95,120,90,'#FFFFFF',false,'center');text(s,'+',1130,439,95,120,90,'#FFFFFF',false,'center');
 box(s,192,673,565,285,'#FFFFFF','계와 주위 원본 그림 바탕',18);
 await crop(s,'system-boundary',212,691,525,246,'교과서 원본 — 계와 주위, 비커의 계 경계');
 for(const [y,label,desc] of [[673,'계','관심을 두고 정한 대상'],[820,'주위','계의 바깥에 있는 모든 것']]){box(s,795,y,190,118,'#253723','표제 '+label,16);text(s,label,810,y+15,160,86,44,C.green,true,'center');box(s,1003,y,726,118,'#202020','설명 '+label,16);text(s,desc,1030,y+18,675,82,40,'#FFFFFF');}

 finish(s,24,'설명 관계식은 편집 가능한 Pretendard. 전체·계·주위 첨자를 별도 작은 글자로 내려 표시. 계와 주위 설명을 표제·설명 행으로 대응. 기존 system-boundary 교과서 크롭을 그대로 재사용.','천재 물질과 에너지93; 지도서117; R04 PDF25, R05 PDF29.');
}
{
 const s=p.slides.add();s.background.fill='#000000';await header(s,'Part 3 전체 엔트로피와 자발성','03','자발성 판단');title(s,'자발성 판단 소정리',270,'#FFFFFF');text(s,'계와 주위의 엔트로피 변화를 더해 판단한다.',150,387,1620,65,36.4,'#A6A6A6',true,'center');
 const t=roundedTable(s,[['ΔH','ΔS계','ΔS주위','자발성'],['< 0','> 0','> 0','자발적'],['> 0','< 0','< 0','비자발적'],['< 0','< 0','> 0','두 변화량의 크기에 따라 다름'],['> 0','> 0','< 0','두 변화량의 크기에 따라 다름']]);
 for(let j=0;j<4;j++)t.getCell(0,j).fill='#253723';
 text(s,'ΔS계와 ΔS주위의 부호가 반대이면 크기를 비교한다.',225,941,1470,70,39,'#FFFFFF',false,'center');
 finish(s,33,'편집 가능한 표. 모든 셀 가운데 정렬. ΔH의 H는 Pretendard 기반 실제 기울임 글리프. 두 엔트로피 변화량을 비교하며 ΔH와 ΔS를 직접 비교하지 않는다.','천재95 그림Ⅲ-17; 지도서119; R05 PDF25·31·32.');
}
await fs.mkdir(OUT,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const stem=`slide-${String(i+1).padStart(2,'0')}-plan${String(pageMap[i]).padStart(2,'0')}`;const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(OUT,stem+'.png'),new Uint8Array(await png.arrayBuffer()));const layout=await s.export({format:'layout'});await fs.writeFile(path.join(HERE,stem+'.layout.json'),await layout.text());console.log('Rendered',i+1,'plan',pageMap[i]);}
await fs.writeFile(path.join(HERE,'page-map.json'),JSON.stringify(pageMap));await fs.writeFile(path.join(HERE,'content-inspection.ndjson'),(await p.inspect({kind:'slide,textbox,image,notes',maxChars:100000})).ndjson);
await fs.mkdir(path.resolve(HERE,'../output'),{recursive:true});
const candidate=path.join(HERE,'candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);console.log('CANDIDATE',candidate);
const SKILL='/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.22136/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
console.log(await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:path.resolve(HERE,'../output/3-03_엔트로피_대표5장_검정초록_v05.pptx'),pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','5'],explicitTotalSlideCount:5,requiredNativeTableOwnerSlides:[5],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'user_request',families:['Pretendard']},verifyArtifactToolImport:true,receiptPath:path.join(HERE,'validation-v05.json')}));
