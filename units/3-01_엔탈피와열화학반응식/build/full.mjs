import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {FontLibrary,Canvas} from '/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/node_modules/skia-canvas/lib/index.js';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const U='/Users/keemhayeon/Downloads/Codex/scieum_ppt/units/3-01_엔탈피와열화학반응식';
const OUT=U+'/build/full-v1';await fs.mkdir(OUT,{recursive:true});
const sc=JSON.parse(await fs.readFile(U+'/build/v10-scenes.json','utf8'));
const assets=JSON.parse(await fs.readFile(U+'/assets/manifest.json','utf8'));
const P=Presentation.create({slideSize:{width:1920,height:1080}});
const fontDir='/Users/keemhayeon/Downloads/Codex/scieum_ppt/output/fonts';
const fontNames=['Thin','ExtraLight','Light','Regular','Medium','SemiBold','Bold','ExtraBold','Black'];
const registered=FontLibrary.use('Pretendard',fontNames.map(n=>fontDir+'/Pretendard-'+n+'.otf'));
FontLibrary.use('Pretendard',['Regular','Bold'].map(w=>U+'/build/preview-fonts/PretendardPreview-'+w+'Italic.otf'));
if(!FontLibrary.has('Pretendard'))throw new Error('Pretendard font not loaded');
await fs.writeFile(OUT+'/font-proof.json',JSON.stringify({registered,family:FontLibrary.family('Pretendard')},null,2));
FontLibrary.use('Pretendard Medium',[fontDir+'/Pretendard-Medium.otf']);
const noLine={fill:'none',width:0};
const layouts=[];
function shape(s,role,b,fill='none',radius=0){return s.shapes.add({name:role,geometry:radius?'roundRect':'rect',position:{left:b[0],top:b[1],width:b[2],height:b[3]},fill,line:noLine,...(radius?{borderRadius:radius}:{})});}
function txt(s,role,text,b,size=44,color='#111111',bold=false,align='left',face='Pretendard'){
 const t=shape(s,role,b);t.text=text;t.text.style={typeface:face,fontSize:size,color,bold,alignment:align,verticalAlignment:'top',insets:0,wrap:'none',autoFit:'none'};for(const m of text.matchAll(/\((?:s|l|g|aq)\)/g))t.text.getRange(m.index+1,m[0].length-2).italic=true;return t;
}
async function img(s,role,file,b){const d=await fs.readFile(file);return s.images.add({name:role,blob:d.buffer.slice(d.byteOffset,d.byteOffset+d.byteLength),contentType:'image/png',alt:role,fit:'contain',position:{left:b[0],top:b[1],width:b[2],height:b[3]}});}
async function ai(s,id,b){return img(s,id,U+'/'+assets.find(a=>a.id===id).file.path,b);}
async function layer(s,n){
 n={...n,bbox:[...n.bbox]};
 if(n.role==='part_heading'){n.fontSize=38;n.bbox=[72,78,1500,52];}
 if(n.role==='topic_number'){n.fontSize=48.8;n.bbox=[72,137,73,67];}
 if(n.role==='topic_heading'){n.fontSize=48.8;n.bbox=[157,137,1500,67];}
 if(n.role==='observation_explanation'){n.fontSize=36.4;n.weight='Bold';n.bbox=[72,n.bbox[1],1776,65];}
 if(n.type==='image')await img(s,n.role,n.file,n.bbox);
 if(n.type==='text'){const lines=n.text.split('\n');for(let i=0;i<lines.length;i++){const b=[...n.bbox];b[1]+=i*n.lineHeight-n.fontSize*0.075;b[3]=Math.max(n.fontSize*1.2,b[3]/lines.length);txt(s,n.role+(lines.length>1?'-line'+i:''),lines[i],b,n.fontSize,n.color,n.weight==='Bold'||n.weight==='ExtraBold',n.align);}}
 if(n.type==='rect')shape(s,n.role,n.bbox,n.fill,n.radius);
 if(n.type==='gradient')shape(s,n.role,n.bbox,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:n.color},{offset:22000,color:n.color},{offset:58000,color:n.color+'/0'},{offset:100000,color:n.color+'/0'}]});
}
const specs=[];
async function common(s,n,title,part,topic,message,sub){
 s.background.fill='#ffffff';await layer(s,sc.slides[4].nodes.find(x=>x.role==='sci_eum_logo'));
 txt(s,'part_heading',part,[72,78,1500,52],38,'#909090',true);
 txt(s,'topic_number',topic,[72,137,73,67],48.8,'#57962F',true);
 txt(s,'topic_heading',title,[157,137,1500,67],48.8,'#111111',true);
 txt(s,'title',message,[72,285,1776,100],76.4,'#111111',true,'center');
 if(sub)txt(s,'explanation',sub,[72,398,1776,70],36.4,'#888888',true,'center');
 txt(s,'page',String(n).padStart(2,'0')+' / 31',[72,1037,200,30],20,'#999999');
 txt(s,'copyright','© 2026. @sci_eum. All rights reserved.',[1535,1037,342,30],17,'#111111',false,'right');
}
async function template(kind,n){const source=sc.slides.find(x=>x.kind===kind);const s=P.slides.add();for(const node of source.nodes)await layer(s,node);specs.push({original:n,type:kind,title:source.title,source:'V10 '+kind,notes:source.notes});return s;}
await template('cover',1);await template('contents',2);await template('objectives',3);await template('hook',4);await template('part',5);
{
 const s=P.slides.add();await common(s,15,'연소 반응의 이용','Part 2 연료의 효율성','01','연소에서 방출된 열을 난방과 동력에 이용한다','보일러와 자동차는 어떤 에너지 변화를 이용할까?');
 // Latest user reference: image, underlined title and explanation inside one dark rounded frame.
 const cards=[['PHOTO_BOILER',250,'가정용 난방 보일러','연료가 연소하며 방출한 열로 난방'],['PHOTO_CAR',1020,'가솔린 자동차','연료의 연소 에너지를 운동에 이용']];
 for(const [id,x,title,description]of cards){
  shape(s,id+'-frame',[x,495,650,485],'#1F2429',32);
  const d=await fs.readFile(U+'/assets/'+id+'-no-caption.png');
  s.images.add({name:id,blob:d.buffer.slice(d.byteOffset,d.byteOffset+d.byteLength),contentType:'image/png',alt:title,fit:'cover',geometry:'roundRect',borderRadius:18,position:{left:x+26,top:519,width:598,height:292}});
  const t=txt(s,id+'-title',title,[x+20,837,610,56],36,'#FFFFFF',true,'center');t.text.underline='sng';
  txt(s,id+'-description',description,[x+20,905,610,56],36,'#FFFFFF',false,'center');
 }
 specs.push({original:15,type:'comparison',title:'연소 반응의 이용',source:'천재교육 물질과 에너지 PDF/인쇄 p.78 그림Ⅲ-4; 지도서 p.109',notes:'보일러는 연료의 연소에서 나오는 열을 난방에 이용합니다. 자동차의 내연 기관은 연소로 얻은 에너지를 운동에 이용합니다. 두 사진의 공통점은 연료가 산소와 반응하며 열을 방출한다는 점입니다. 다음에는 같은 몰수, 같은 질량이라는 비교 기준을 정해 연료별 방출열을 계산하겠습니다. 화면의 보일러를 먼저, 주유 장면을 다음으로 가리킵니다. 연소열의 크기만으로 실제 장치 효율을 판단하지 않습니다.'});
}
{
 const s=P.slides.add();await common(s,26,'물 생성 반응의 결합 모형','Part 3 결합 에너지와 반응 엔탈피','04','원자 수는 보존되고, 결합은 달라진다','2H₂(g) + O₂(g) → 2H₂O(g)');
 await ai(s,'FIG_REACTION',[310,487,1300,368]);
 shape(s,'conclusion-box',[245,885,1430,100],'#595959',16);
 txt(s,'conclusion','H 원자 4개와 O 원자 2개를 끝까지 확인한다',[275,909,1370,58],44.5,'#FFFFFF',false,'center','Pretendard Medium');
 specs.push({original:26,type:'figure',title:'물 생성 반응의 결합 모형',source:'천재교육 물질과 에너지 PDF/인쇄 p.81 그림Ⅲ-7; 지도서 p.110',notes:'왼쪽에는 수소 분자 두 개와 산소 분자 한 개가 있습니다. 수소 원자는 네 개, 산소 원자는 두 개입니다. 가운데는 결합을 끊는 데 필요한 에너지를 계산하기 위한 원자 상태의 모형입니다. 이 과정에는 에너지가 필요하므로 ΔH가 양수입니다. 오른쪽에서는 물 분자 두 개가 형성되며 O–H 결합 네 개가 만들어집니다. 결합 형성에서는 에너지를 방출합니다. 전후의 원자 수는 같고 결합의 종류와 수가 달라집니다. 이 그림은 에너지 계산을 위한 모형이며 실제 반응이 반드시 모든 원자가 분리되는 경로로 진행된다는 뜻은 아닙니다. 다음 장에서 결합 수를 따로 세어 봅니다.'});
}
{
 const s=P.slides.add();await common(s,28,'결합 에너지로 반응 엔탈피 계산','Part 3 결합 에너지와 반응 엔탈피','06','흡수하는 에너지에서 방출하는 에너지를 뺀다','2H₂(g) + O₂(g) → 2H₂O(g) · 반응식 전체 기준');
 const bond=txt(s,'EQ_BOND-native','반응 엔탈피(ΔH) ≈ 반응물의 결합 에너지 합 − 생성물의 결합 에너지 합',[130,491,1660,75],44.5,'#111111',false,'center');bond.text.get('ΔH').italic=true;
 const steps=[['1','끊는 결합','2 × 436 + 498 = 1370 kJ'],['2','만드는 결합','4 × 460 = 1840 kJ'],['3','반응 엔탈피','ΔH ≈ 1370 − 1840 = −470 kJ']];
 for(let i=0;i<steps.length;i++){
  const y=606+i*120;shape(s,'step-strip-'+i,[245,y,1430,100],'#F0F0F0',16);shape(s,'step-circle-'+i,[280,y+28,44,44],'#252525',22);
  txt(s,'step-number-'+i,steps[i][0],[280,y+29,44,44],30,'#FFFFFF',true,'center');txt(s,'step-label-'+i,steps[i][1],[370,y+26,340,62],39,'#555555',true);txt(s,'step-equation-'+i,steps[i][2],[725,y+20,900,70],46,i===2?'#245D12':'#111111',i===2);
 }
 specs.push({original:28,type:'table_formula',title:'결합 에너지로 반응 엔탈피 계산',source:'천재교육 물질과 에너지 PDF/인쇄 p.80 표Ⅲ-2, p.81 관계식',notes:'먼저 반응물의 결합을 끊는 데 필요한 에너지를 계산합니다. H–H 결합 두 몰과 O=O 결합 한 몰이므로 2 곱하기 436 더하기 498, 1370 킬로줄입니다. 다음으로 생성물의 O–H 결합 네 몰이 만들어질 때 방출되는 에너지의 크기를 계산합니다. 4 곱하기 460은 1840 킬로줄입니다. 반응 엔탈피는 흡수량에서 방출량의 크기를 뺀 값이므로 약 마이너스 470 킬로줄입니다. 음수이므로 발열 반응입니다. 수증기 두 몰이 생성되는 반응식 전체 기준의 값이며 평균 결합 에너지를 사용한 근삿값입니다. 액체 물 두 몰 생성 반응의 마이너스 571.6 킬로줄과 혼용하면 안 됩니다. 다음에는 평균값과 상태 조건을 점검합니다.'});
}

// The eight approved representatives are retained as actual slides; new lesson pages are inserted below.
const byNumber=new Map(specs.map((r,i)=>[r.original,P.slides.items[i]]));
const parts=['','Part 1 엔탈피와 열화학 반응식','Part 2 연료의 효율성','Part 3 결합 에너지와 반응 엔탈피'];
const info=JSON.parse(await fs.readFile(U+'/build/lesson-content.json','utf8'));
function callout(s,text,y=885){shape(s,'takeaway-box',[245,y,1430,100],'#595959',16);txt(s,'takeaway',text,[275,y+24,1370,58],44.5,'#FFFFFF',false,'center','Pretendard Medium');}
function line(s,name,x,y,w,h=3,color='#999999'){shape(s,name,[x,y,w,h],color);}
function equation(s,text,y,size=49,name='equation'){return txt(s,name,text,[135,y,1650,76],size,'#111111',false,'center');}
function step(s,i,label,value,y){shape(s,'strip-'+i,[245,y,1430,100],'#F0F0F0',16);shape(s,'circle-'+i,[280,y+28,44,44],'#252525',22);txt(s,'number-'+i,String(i),[280,y+29,44,44],30,'#fff',true,'center');txt(s,'label-'+i,label,[370,y+26,340,62],39,'#555555',true);txt(s,'value-'+i,value,[725,y+20,900,70],46,'#111111');}
function table(s,values,x=200,y=500,w=1520,h=430,widths=null,dark=false,size=36){const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,...(widths?{columnWidths:widths}:{}),values});t.borders.assign({style:'solid',fill:'#FFFFFF',width:2});for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){const cell=t.getCell(r,c);cell.fill=r===0?'#595959':dark?'#747474':r%2?'#F0F0F0':'#FAFAFA';cell.text.style={typeface:'Pretendard',fontSize:size,color:r===0||dark?'#FFFFFF':'#111111',bold:r===0,alignment:c===0?'left':'center',verticalAlignment:'middle',insets:14};for(const m of String(values[r][c]).matchAll(/\((?:s|l|g|aq)\)/g))cell.text.getRange(m.index+1,m[0].length-2).italic=true;}return t;}
function levels(s,x,y,exo=true){const high=y+55,low=y+205;line(s,'axis-y-'+x,x,y,3,290,'#555555');line(s,'axis-x-'+x,x,y+290,600,3,'#555555');txt(s,'axisH-'+x,'엔탈피',[x-48,y-50,170,45],30,'#777');txt(s,'axisR-'+x,'반응의 진행',[x+380,y+310,230,45],30,'#777');line(s,'reactants-'+x,x+45,exo?high:low,205,4,'#555555');line(s,'products-'+x,x+350,exo?low:high,205,4,'#555555');txt(s,'reactants-label-'+x,'반응물',[x+60,(exo?high:low)-48,180,50],35,'#111',true);txt(s,'products-label-'+x,'생성물',[x+365,(exo?low:high)-48,180,50],35,'#111',true);txt(s,'deltaH-'+x,exo?'↓  ΔH < 0':'↑  ΔH > 0',[x+242,y+105,270,65],43,exo?'#0C7D08':'#555555',true);}
for(const d of info){
 if(byNumber.has(d.number))continue;
 let s;
 if([14,22].includes(d.number)){
  s=P.slides.add();const src=sc.slides.find(x=>x.kind==='part');for(const node of src.nodes){let n={...node};if(n.role==='part_label')n.text='Part '+d.part;if(n.role==='title')n.text=d.title;if(n.role==='theory_curiosity')n.text=d.message;await layer(s,n);}
 }else{
 s=P.slides.add();await common(s,d.number,d.title,parts[d.part]||'정리 · 형성평가',d.topic,d.message,d.sub);
 switch(d.number){
 case 6:
  txt(s,'exo','발열 반응',[260,485,600,65],44,'#0C7D08',true,'center');txt(s,'endo','흡열 반응',[1060,485,600,65],44,'#555',true,'center');levels(s,240,560,true);levels(s,1050,560,false);break;
 case 7:
  equation(s,'CaO(s) + H₂O(l) → Ca(OH)₂(aq)     ΔH = −76.9 kJ',500,47);equation(s,'NH₄NO₃(s) → NH₄NO₃(aq)     ΔH = +26.2 kJ',610,47);
  for(const [x,id,title,desc] of [[350,'PHOTO_CAO','산화 칼슘의 반응','주위로 열 방출'],[1050,'PHOTO_COOL','질산 암모늄의 용해','주위에서 열 흡수']]){shape(s,id+'-card',[x,715,520,285],'#1F2429',24);await img(s,id,id==='PHOTO_COOL'?OUT+'/cool-photo-no-caption.png':U+'/assets/PHOTO_CAO.png',[x+18,730,484,155]);const t=txt(s,id+'-caption',title,[x+16,893,488,45],32,'#FFFFFF',true,'center');t.text.underline='sng';txt(s,id+'-desc',desc,[x+16,945,488,44],30,'#FFFFFF',false,'center');}break;
 case 8:
  equation(s,'H₂(g) + ½O₂(g) → H₂O(l)     ΔH = −285.8 kJ',500);equation(s,'2H₂(g) + O₂(g) → 2H₂O(l)     ΔH = −571.6 kJ',650);callout(s,'반응식의 계수 × 2   →   반응 엔탈피도 × 2');break;
 case 9:
  equation(s,'2H₂(g) + O₂(g) → 2H₂O(g)     ΔH₁',520,55);equation(s,'2H₂(g) + O₂(g) → 2H₂O(l)     ΔH₂',680,55);callout(s,'액체 물이 생성될 때 더 많은 열 방출   |ΔH₂| > |ΔH₁|');break;
 case 10:
  equation(s,'ΔH = 생성물의 엔탈피 합 − 반응물의 엔탈피 합',490,52);levels(s,630,615,true);break;
 case 11:
  table(s,[['반응','열화학 반응식','ΔH (kJ)'],['생성','N₂(g) + 2O₂(g) → 2NO₂(g)','+67.7'],['연소','C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l)','−2220'],['중화','HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)','−55.8'],['용해','CaCl₂(s) → CaCl₂(aq)','−81.7']],130,500,1660,450,[190,1200,270],true,32);break;
 case 12:
  await ai(s,'FIG_CAL',[260,495,530,470]);txt(s,'q','Q용액 = c × m × Δt',[930,525,780,90],55,'#111',true);txt(s,'symbols','c  용액의 비열\nm  용액의 질량\nΔt  나중 온도 − 처음 온도',[950,640,750,185],37,'#555');txt(s,'sign','q반응 = −Q용액',[930,870,760,75],50,'#0C7D08',true);break;
 case 13:
  equation(s,'CaCO₃(s) → CaO(s) + CO₂(g)     ΔH = +179.2 kJ',490,46);txt(s,'q1','생성물과 반응물 중 어느 쪽의 엔탈피 합이 클까?',[230,580,1480,60],40,'#555',true,'center');txt(s,'answer-1','생성물의 엔탈피 합이 더 크다',[230,655,1480,60],42,'#0C7D08',true,'center');txt(s,'q2','NH₃(g) 1 mol 생성 시 45.9 kJ 방출 → 반응식을 완성해 보자',[170,775,1580,65],37,'#555',true,'center');equation(s,'N₂(g) + 3H₂(g) → 2NH₃(g)     ΔH = −91.8 kJ',875,47,'answer-2');break;
 case 16:
  equation(s,'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)     ΔH = −890.5 kJ',490,42);equation(s,'2C₄H₁₀(g) + 13O₂(g) → 8CO₂(g) + 10H₂O(l)     ΔH = −5754 kJ',590,40);step(s,1,'메테인 1 mol','890.5 kJ 방출',730);step(s,2,'뷰테인 1 mol','5754 ÷ 2 = 2877 kJ 방출',850);break;
 case 17:
  equation(s,'1 g당 방출열 = 1 mol당 방출열 ÷ 몰질량',495,53);step(s,1,'메테인','890.5 ÷ 16 ≈ 55.7 kJ/g',635);step(s,2,'뷰테인','2877 ÷ 58 ≈ 49.6 kJ/g',765);txt(s,'unit','(kJ/mol) ÷ (g/mol) = kJ/g',[380,920,1160,65],42,'#777',false,'center');break;
 case 18:
  equation(s,'C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l)     ΔH = −1367 kJ',485,42);equation(s,'2H₂(g) + O₂(g) → 2H₂O(l)     ΔH = −571.6 kJ',575,44);await ai(s,'FIG_MOLECULES',[270,680,1380,130]);txt(s,'ethanol','에탄올   1367 ÷ 46 ≈ 29.7 kJ/g',[170,866,1580,60],43,'#111',false,'center');txt(s,'hydrogen','수소   (571.6 ÷ 2) ÷ 2 = 142.9 kJ/g',[170,936,1580,60],43,'#111',false,'center');break;
 case 19:
  table(s,[['연료','몰질량 (g/mol)','방출열 (kJ/mol)','방출열 (kJ/g)'],['메테인','16','890.5','55.7'],['뷰테인','58','2877','49.6'],['에탄올','46','1367','29.7'],['수소','2','285.8','142.9']],210,500,1500,430,[330,390,390,390],false,36);break;
 case 20:
  txt(s,'known-title','이 표로 비교할 수 있는 것',[225,530,1100,65],43,'#111',true);txt(s,'known','같은 질량을 완전 연소할 때의 방출열 크기',[225,615,1100,65],38,'#555');txt(s,'unknown-title','추가 자료가 필요한 것',[225,745,1100,65],43,'#111',true);txt(s,'unknown','생산 과정 · 저장과 운송 · 실제 장치의 효율',[225,830,1100,65],38,'#555');await ai(s,'I01',[1350,555,410,450]);break;
 case 21:
  table(s,[['연료','1 g당 방출열 (kJ/g)'],['메테인','55.7'],['뷰테인','?'],['에탄올','29.7'],['수소','?']],230,500,690,430,[340,350],false,34);txt(s,'question','같은 질량의 연료를 쓸 때,\n방출열이 큰 순서와 근거는?',[1040,535,720,150],46,'#111',true);txt(s,'answer-1','뷰테인 49.6 · 수소 142.9 kJ/g',[1000,770,800,65],36,'#0C7D08',true);txt(s,'answer-2','수소 > 메테인 > 뷰테인 > 에탄올',[1000,855,800,65],36,'#555');break;
 case 23:
  equation(s,'H₂(g) → 2H(g)     ΔH = +436 kJ',495,55);levels(s,620,625,false);txt(s,'bond-count','H–H 결합 1 mol 해리',[170,980,1580,55],35,'#555',true,'center');break;
 case 24:
  equation(s,'2H(g) → H₂(g)     ΔH = −436 kJ',495,55);levels(s,620,625,true);txt(s,'bond-count','해리와 크기는 같고, 부호는 반대',[170,980,1580,55],35,'#555',true,'center');break;
 case 25:
  table(s,[['결합','H–H','O=O','O–H','H–F','F–F'],['결합 에너지\n(kJ/mol)','436','498','460','570','159']],180,535,1560,230,[360,240,240,240,240,240],false,38);callout(s,'결합 1 mol 기준 · 해리에 필요한 에너지 · 양수');break;
 case 27:
  table(s,[['과정','결합의 종류','반응식 기준 결합의 양'],['끊기','H–H','2 mol'],['끊기','O=O','1 mol'],['만들기','O–H','4 mol']],240,510,1440,350,[350,450,640],false,42);callout(s,'물 분자 2개 × 분자당 O–H 결합 2개 = 결합 4개');break;
 case 29:
  txt(s,'gas-title','평균 결합 에너지로 계산',[220,520,1480,60],42,'#555',true,'center');equation(s,'2H₂(g) + O₂(g) → 2H₂O(g)     ΔH ≈ −470 kJ',600,48);txt(s,'liquid-title','교과서의 액체 물 생성 반응',[220,740,1480,60],42,'#555',true,'center');equation(s,'2H₂(g) + O₂(g) → 2H₂O(l)     ΔH = −571.6 kJ',820,48);break;
 case 30:
  table(s,[['연결할 개념','확인할 관계'],['열 출입과 부호','발열 ΔH < 0  /  흡열 ΔH > 0'],['계수와 반응 엔탈피','계수 × n  →  ΔH × n'],['물질의 상태','상태가 다르면 반응 엔탈피도 달라진다'],['결합 에너지','끊는 데 흡수한 에너지 − 형성 시 방출한 에너지']],200,500,1520,450,[450,1070],false,36);break;
 case 31:
  await ai(s,'I02',[190,560,430,430]);txt(s,'return','손난로 속 철의 산화\n→ 주위로 열 방출\n→ 반응계의 ΔH < 0',[770,490,980,190],45,'#111',true);txt(s,'exit','H₂(g) + F₂(g) → 2HF(g)\n결합 에너지로 ΔH를 구해 보자',[770,725,1000,125],39,'#555',true);txt(s,'answer-1','ΔH ≈ 436 + 159 − 2 × 570 = −545 kJ',[700,900,1110,65],39,'#0C7D08',true);break;
 }
 }
 byNumber.set(d.number,s);
}
const ordered=info.map(d=>byNumber.get(d.number));for(let i=0;i<ordered.length;i++)ordered[i].moveTo(i);
for(let i=0;i<31;i++){
 const s=P.slides.items[i],d=info[i];s.speakerNotes.text=d.script+'\n화면에서 가리킬 순서: '+d.point+'\n오개념 점검: '+d.caution+'\n다음 연결: '+d.next+'\n출처: '+d.source;
 const l=await s.export({format:'layout'});await fs.writeFile(OUT+`/${String(i+1).padStart(2,'0')}.layout.json`,await l.text());
}
await(await PresentationFile.exportPptx(P)).save(OUT+'/candidate.pptx');
await fs.writeFile(OUT+'/slides.json',JSON.stringify(info,null,2));
for(let i=0;i<31;i++){const b=await P.export({slide:P.slides.items[i],format:'png',scale:1});await fs.writeFile(OUT+`/${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await b.arrayBuffer()));console.log('rendered',i+1);}
await fs.writeFile(OUT+'/inspect.ndjson',(await P.inspect({kind:'slide,textbox,image,shape,table,notes',maxChars:2000000})).ndjson);
