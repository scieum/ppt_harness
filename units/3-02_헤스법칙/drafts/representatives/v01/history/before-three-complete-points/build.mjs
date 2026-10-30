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
const registered=[...FontLibrary.use('Pretendard',fonts),...FontLibrary.use('Times New Roman',['/System/Library/Fonts/Supplemental/Times New Roman.ttf','/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf','/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf','/System/Library/Fonts/Supplemental/Times New Roman Bold Italic.ttf'])];await fs.writeFile(path.join(HERE,'font-registration.json'),JSON.stringify(registered,null,2));
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
 const q=text(s,'',x,y,w,h,size,color,bold,align,name);q.text=[runs];return q;
}
const r=(run,style={})=>({run,style});
function chem(str){
 const out=[];const re=/\((s|l|g|aq)\)|ΔH|H[₁₂₃]/g;let last=0,m;
 while((m=re.exec(str))){if(m.index>last)out.push(r(str.slice(last,m.index)));if(m[1])out.push(r('('),r(m[1],{italic:true}),r(')'));else if(m[0]==='ΔH')out.push(r('Δ'),r('H',{italic:true,typeface:'Times New Roman'}));else out.push(r('H',{italic:true,typeface:'Times New Roman'}),r(m[0].slice(1)));last=re.lastIndex;}if(last<str.length)out.push(r(str.slice(last)));return out;
}
async function img(s,file,x,y,w,h,name='image',fit='contain'){
 const b=await fs.readFile(file);return s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:name,name,fit,position:{left:x,top:y,width:w,height:h}});
}
async function branding(s,cover=false){
 await img(s,path.join(A,'v10-cover-sci_eum_logo.png'),1778.667,40,108,77.333,'사이음 공식 로고');
 if(cover)await img(s,path.join(A,'v10-cover-tsherpa_logo.png'),1601.333,42.667,154.667,66.667,'T셀파 공식 로고 — 첫 장만');
 text(s,'© 2026. @sci_eum. All rights reserved.',1440,1034,440,30,21,C.black,false,'right','copyright');
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
 if(assets.cover)await img(s,assets.cover,0,0,1920,1080,'등록 캐릭터 원본 표지');
 box(s,0,0,1920,1080,'linear(0deg, #0C7D08 0%, #0C7D08/96 26%, #0C7D08/55 48%, #0C7D08/0 69%)','원본형 녹색 그라데이션');
 text(s,'Ⅲ. 화학 변화의 자발성',139,206,1470,145,110,'#FFFFFF',true,'left','대단원명');
 text(s,'02. 헤스 법칙',139,347,1400,145,110,'#FFFFFF',true,'left','소단원명');
 text(s,'사이음 저',143,554,400,60,40,'#FFFFFF',false,'left','저자');
 text(s,'본 수업 자료에 사용된 일부 이미지는 생성형 AI 기술을 활용하여 제작되었습니다.',45,1035,1300,30,21,'#FFFFFF',false,'left','기존 AI 안내');
 await branding(s,true);
 note(s,'대표 검토본 1/5. 전체 계획 1장. 표지의 원래 등록 캐릭터 에셋을 그대로 사용하며 재생성하지 않는다. 도입 순서는 표지→동기 유발→수업 목차→학습 목표.\n출처: 등록 캐릭터 에셋 파일은 build/original-character-assets.json 및 자산 기록 참조. 디자인: 사용자 수정본 실제1쪽, brief.md. 생성 후 거부된 hess-cover-scene.png는 이 PPT에 포함하지 않음.');
}
// 2. Motivation. Diagram is native; only the registered character bitmap is inserted.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 0 동기 유발','01','경로와 변화');
 title(s,'다른 길로 가도, 높이 차는 같을까?');
 text(s,'같은 출발점에서 같은 도착점으로 가는 두 경로를 비교해 보자.',150,393,1620,66,36.4,C.gray,true,'center','관찰 질문');
 // Whiteboard-like elevation analogy; two paths share both endpoints.
 const start=[260,885],end=[1135,600];
 line(s,190,923,1195,923,'#BDBDBD',3,'기준선');
 line(s,...start,...end,C.green,12,'경로 A');
 const pts=[start,[520,885],[520,790],[770,790],[770,695],[1135,695],end];
 for(let j=0;j<pts.length-1;j++)line(s,...pts[j],...pts[j+1],C.dark,9,'경로 B');
 dot(s,...start,C.black,26);dot(s,...end,C.black,26);
 text(s,'출발점',178,939,220,55,38,C.black,true,'center');
 text(s,'도착점',1030,527,230,55,38,C.black,true,'center');
 text(s,'경로 A',590,664,220,60,40,C.green,true,'center');
 text(s,'경로 B',600,834,220,60,40,C.dark,true,'center');
 line(s,1195,607,1195,879,C.gray,4,'높이 차');line(s,1177,607,1213,607,C.gray,4);line(s,1177,879,1213,879,C.gray,4);
 text(s,'높이 차',1210,718,180,58,34,C.gray,true,'left');
 box(s,1390,494,390,180,C.light,'질문 말풍선',24);
 const tail=s.shapes.add({geometry:'custom',position:{left:1525,top:667,width:80,height:55},fill:C.light,line:{fill:'none',width:0},customPaths:[{width:80,height:55,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:80,y:0}},{lineTo:{x:45,y:55}},{close:{}}]}]});
 text(s,'반응 경로가 달라도',1400,511,370,58,36.4,C.black,true,'center');text(s,'출입하는 열은 같을까?',1397,571,376,58,36.4,C.black,true,'center');
 if(assets.hook)await img(s,assets.hook,1380,711,410,285,'원래 등록된 본문 캐릭터');
 note(s,'대표 검토본 2/5. 전체 계획2장, Part0. 먼저 출발점과 도착점을 가리켜 두 경로의 높이 차를 예상하게 한다. 경로의 길이나 걷는 데 쓰는 신체 에너지를 반응열과 같다고 설명하지 않는다. 반응열의 답은 본문에서 확인한다. 말풍선은 등록 에셋의 원래 인물을 그대로 연결한다.\n출처: W22 완자 물질과 에너지 PDF/인쇄118의 처음·나중 상태 비교를 바탕으로 교사 제작 높이 비유. 캐릭터는 등록 원본; 자산 기록 참조. 디자인: 사용자 수정본4·31쪽.');
}
// 3. Definition, matching the broad rows of the user's revision p8.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 헤스 법칙','01','헤스 법칙');title(s,'헤스 법칙 (Hess’s law)',271,C.green);
 box(s,192,480,1537,355,C.light,'하나의 정의 설명 영역',18);
 rich(s,[r('반응 전후 물질의 '),r('종류와 상태',{color:C.green,bold:true}),r('가 같으면, '),r('반응 경로',{color:C.green,bold:true}),r('와 관계없이')],252,548,1417,90,48,C.black,false,'left','정의 조건과 경로');
 rich(s,[r('반응 엔탈피의 총합',{color:C.green,bold:true}),r('은 일정하다.')],252,652,1417,90,48,C.black,false,'left','정의 결론');
 note(s,'대표 검토본3/5. 전체 계획6장. 사용자 정정에 따라 한 문장의 정의를 단계별 목록으로 나누지 않고 하나의 영역에 두 줄로 조판했다. 조건과 결론은 문장으로 이어 읽는다. 같은 온도·압력과 같은 반응 물질의 양을 맞춘 비교라는 조건을 말로 보완한다. 반응 속도·시간·최고 온도가 같다는 의미가 아니다.\n출처: 통합_(22개정)완자 고등물질과에너지_본문_260415(교사용).pdf PDF/인쇄118, 헤스 법칙 정의. 디자인: 사용자 수정본 실제8·15쪽, brief.md.');
}
// 4. Original reaction diagram and directly attached reading notes.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 1 헤스 법칙','01','헤스 법칙');
 rich(s,[r('경로가 달라도, '),...chem('ΔH'),r('는 같다')],130,270,1660,112,76.4,C.black,true,'center','핵심 관계');
 text(s,'같은 처음 상태에서 같은 나중 상태로 변할 때',150,386,1620,65,36.4,C.gray,true,'center');
 await img(s,path.join(HERE,'W118-cao.png'),130,465,1010,574,'완자118 CaO 반응 두 경로 원본');
 text(s,'직접 경로',1210,475,540,55,40,C.green,true);
 rich(s,chem('ΔH₁ = −193.5 kJ'),1210,538,560,70,50);
 text(s,'두 단계 경로',1210,640,540,55,40,C.green,true);
 rich(s,chem('ΔH₂ + ΔH₃'),1210,705,540,68,50);
 text(s,'= −81.9 + (−111.6)',1210,773,610,66,46);
 text(s,'= −193.5 kJ',1210,840,610,68,50,C.green,true);
 box(s,1170,933,650,77,C.dark,'경로 비교 결론',16);
 rich(s,chem('ΔH₁ = ΔH₂ + ΔH₃'),1200,941,590,62,48,'#FFFFFF',false,'center');
 note(s,'대표 검토본4/5. 전체 계획8장. 왼쪽은 완자 원본 그래프·실험 도식이다. 직접 경로와 두 단계 경로의 시작·끝 물질을 먼저 비교한다. 그 뒤 원본의 ΔH 화살표를 가리키고 오른쪽 수치와 대응한다. 중간에 물질의 상태와 희석 조건을 임의로 바꾸지 않는다. 식의 합은 다음 본문에서 분리해 설명한다. 장식 캐릭터는 쓰지 않는다.\n출처: W22 PDF/인쇄118, CaO(s)·H2O(l)·HCl(aq)의 두 경로 도식 및 ΔH1=-193.5,ΔH2=-81.9,ΔH3=-111.6kJ. 교과서 원본은 아직 미열람으로 이번 검토본은 확인된 완자 원본 사용. 디자인: 사용자 수정본22·33~34쪽 왼쪽 원본/오른쪽 설명 차용.');
}
// 5. CO calculation: equations are original crops, explanation/result editable.
{
 const s=p.slides.add();s.background.fill='#FFFFFF';await header(s,'Part 2 반응 엔탈피 구하기','01','간접 측정');
 title(s,'CO 생성 반응의 반응 엔탈피');
 rich(s,chem('ΔH₂ = ΔH₁ − ΔH₃'),230,389,1460,105,76.4,C.green,true,'center','관계식');
 await img(s,path.join(HERE,'eq-carbon-total.png'),263,534,1385,116,'완자119 탄소 전체 연소식 원본');
 await img(s,path.join(HERE,'eq-co-oxidation.png'),263,687,1385,112,'완자119 CO 산화식 원본');
 // The original numbered equations sit on white, without white patches on gray.
 box(s,192,868,1537,115,C.dark,'엔탈피 계산 결과',16);
 rich(s,[...chem('ΔH₂'),r(' = −393.5 − (−283.0) = '),r('−110.5 kJ',{color:'#9FFF68',bold:true})],228,885,1465,80,53,'#FFFFFF',false,'center','대입과 결과');
 note(s,'대표 검토본5/5. 전체 계획17장. 목표식은 C(s,흑연)+1/2O2(g)→CO(g). ΔH2=ΔH1−ΔH3을 먼저 읽는다. 위 두 원본 반응식에서 CO 산화 반응을 역으로 한 뒤 합하면 CO2가 소거됨을 앞 장에서 다루고, 이 장에서는 수치 계산에 집중한다. 두 음수를 빼므로 -393.5+283.0=-110.5kJ. 적힌 목표 반응 1회(탄소1mol)에 해당한다.\n출처: W22 PDF/인쇄119, 탄소·CO 연소 반응식과 ΔH 계산. 원본 수식은 별도 크롭, 다른 문장은 편집 가능한 텍스트. 디자인: 사용자 수정본28·38쪽의 관계식→대입·결과 위계.');
}
await fs.mkdir(OUT,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
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
 console.log(await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:path.join(OUT,'3-02_헤스법칙_대표5장_v01.pptx'),pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:5,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Pretendard','Times New Roman']},verifyArtifactToolImport:true,receiptPath:path.join(HERE,'validation.json')}));
}
