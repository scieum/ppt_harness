import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {FontLibrary,Canvas} from '/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/node_modules/skia-canvas/lib/index.js';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const U='/Users/keemhayeon/Downloads/Codex/scieum_ppt/units/3-01_엔탈피와열화학반응식';
const OUT=U+'/build/full-v2';await fs.mkdir(OUT,{recursive:true});
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
const SOURCE=U+'/assets/source-v2/';
async function source(s,id,b){return img(s,'textbook-'+id,SOURCE+id+'.png',b);}

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
const topicGroups=[[6, 6, "01", "엔탈피와 열 출입"], [7, 13, "02", "열화학 반응식"], [15, 15, "01", "연소 반응의 이용"], [16, 21, "02", "연료의 효율성 비교"], [23, 25, "01", "결합 에너지"], [26, 29, "02", "결합 에너지와 반응 엔탈피"], [30, 31, "", "정리와 확인"]];
async function common(s,n,title,part,topic,message,sub){
 const group=topicGroups.find(g=>n>=g[0]&&n<=g[1]);if(group){topic=group[2];title=group[3];}
 s.background.fill='#ffffff';await layer(s,sc.slides[4].nodes.find(x=>x.role==='sci_eum_logo'));
 txt(s,'part_heading',part,[72,78,1500,52],38,'#909090',true);
 if(topic)txt(s,'topic_number',topic,[72,137,73,67],48.8,'#57962F',true);
 txt(s,'topic_heading',title,[topic?157:72,137,1500,67],48.8,'#111111',true);
 if(![12,20,23,24].includes(n))txt(s,'title',message,[72,285,1776,100],76.4,'#111111',true,'center');
 if(sub && ![12,20,23,24].includes(n))txt(s,'explanation',sub,[72,398,1776,70],36.4,'#888888',true,'center');
 
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
  const d=await fs.readFile(U+'/assets/source-v2/'+id+'.png');
  s.images.add({name:id,blob:d.buffer.slice(d.byteOffset,d.byteOffset+d.byteLength),contentType:'image/png',alt:title,fit:'cover',geometry:'roundRect',borderRadius:18,position:{left:x+26,top:519,width:598,height:292}});
  const t=txt(s,id+'-title',title,[x+20,837,610,56],36,'#FFFFFF',true,'center');t.text.underline='sng';
  txt(s,id+'-description',description,[x+20,905,610,56],36,'#FFFFFF',false,'center');
 }
 specs.push({original:15,type:'comparison',title:'연소 반응의 이용',source:'천재교육 물질과 에너지 PDF/인쇄 p.78 그림Ⅲ-4; 지도서 p.109',notes:'보일러는 연료의 연소에서 나오는 열을 난방에 이용합니다. 자동차의 내연 기관은 연소로 얻은 에너지를 운동에 이용합니다. 두 사진의 공통점은 연료가 산소와 반응하며 열을 방출한다는 점입니다. 다음에는 같은 몰수, 같은 질량이라는 비교 기준을 정해 연료별 방출열을 계산하겠습니다. 화면의 보일러를 먼저, 주유 장면을 다음으로 가리킵니다. 연소열의 크기만으로 실제 장치 효율을 판단하지 않습니다.'});
}
{
 const s=P.slides.add();await common(s,26,'물 생성 반응의 결합 모형','Part 3 결합 에너지와 반응 엔탈피','03','원자 수는 보존되고, 결합은 달라진다','결합을 끊는 과정과 새로운 결합이 형성되는 과정');
 await source(s,'eq-water-gas',[590,440,740,75]);await source(s,'reaction-model',[250,540,1420,335]);
 shape(s,'conclusion-box',[245,885,1430,100],'#595959',16);
 txt(s,'conclusion','H 원자 4개와 O 원자 2개를 끝까지 확인한다',[275,909,1370,58],44.5,'#FFFFFF',false,'center','Pretendard Medium');
 specs.push({original:26,type:'figure',title:'물 생성 반응의 결합 모형',source:'천재교육 물질과 에너지 PDF/인쇄 p.81 그림Ⅲ-7; 지도서 p.110',notes:'왼쪽에는 수소 분자 두 개와 산소 분자 한 개가 있습니다. 수소 원자는 네 개, 산소 원자는 두 개입니다. 가운데는 결합을 끊는 데 필요한 에너지를 계산하기 위한 원자 상태의 모형입니다. 이 과정에는 에너지가 필요하므로 ΔH가 양수입니다. 오른쪽에서는 물 분자 두 개가 형성되며 O–H 결합 네 개가 만들어집니다. 결합 형성에서는 에너지를 방출합니다. 전후의 원자 수는 같고 결합의 종류와 수가 달라집니다. 이 그림은 에너지 계산을 위한 모형이며 실제 반응이 반드시 모든 원자가 분리되는 경로로 진행된다는 뜻은 아닙니다. 다음 장에서 결합 수를 따로 세어 봅니다.'});
}
{
 const s=P.slides.add();await common(s,28,'결합 에너지로 반응 엔탈피 계산','Part 3 결합 에너지와 반응 엔탈피','03','흡수하는 에너지에서 방출하는 에너지를 뺀다','2H₂(g) + O₂(g) → 2H₂O(g) · 반응식 전체 기준');
 await source(s,'eq-bond',[130,491,1660,75]);
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
const info=JSON.parse(await fs.readFile(U+'/build/lesson-content-v2.json','utf8'));
function callout(s,text,y=885){shape(s,'takeaway-box',[245,y,1430,100],'#595959',16);txt(s,'takeaway',text,[275,y+24,1370,58],44.5,'#FFFFFF',false,'center','Pretendard Medium');}
function line(s,name,x,y,w,h=3,color='#999999'){shape(s,name,[x,y,w,h],color);}
async function equation(s,text,y,size=49,name='equation'){
 const match=[['CaO(s)','eq-cao'],['NH₄NO₃(s)','eq-nh4'],['CaCO₃(s)','eq-caco3'],['CH₄(g)','eq-methane'],['2C₄H₁₀(g)','eq-butane'],['C₂H₅OH(l)','eq-ethanol'],['2H₂(g) + O₂(g) → 2H₂O(l)     ΔH = −571.6','eq-water-liquid'],['H₂(g) → 2H(g)','eq-break'],['ΔH = 생성물','eq-enthalpy']].find(([prefix])=>text.startsWith(prefix));
 if(match)return source(s,match[1],[190,y,1540,76]);
 return txt(s,name,text,[135,y,1650,76],size,'#111111',false,'center');
}

function step(s,i,label,value,y){shape(s,'strip-'+i,[245,y,1430,100],'#F0F0F0',16);shape(s,'circle-'+i,[280,y+28,44,44],'#252525',22);txt(s,'number-'+i,String(i),[280,y+29,44,44],30,'#fff',true,'center');txt(s,'label-'+i,label,[370,y+26,340,62],39,'#555555',true);txt(s,'value-'+i,value,[725,y+20,900,70],46,'#111111');}
function table(s,values,x=200,y=500,w=1520,h=430,widths=null,dark=false,size=36){
 shape(s,'table-rounded-background',[x,y,w,h],'#252525',22);
 const pad=36,inner=w-2*pad,rh=(h-48)/values.length;
 const ratios=widths||Array(values[0].length).fill(1),total=ratios.reduce((a,b)=>a+b,0);
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x+pad,top:y+24,width:inner,height:h-48,columnWidths:ratios.map(v=>v/total*inner),values});
 t.borders.assign({style:'solid',fill:'#3D3D3D',width:0});
 for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){
  const cell=t.getCell(r,c);cell.fill=(r===0||c===0)?'#3D3D3D':'#252525';cell.text.style={typeface:'Pretendard',fontSize:size,color:'#FFFFFF',bold:r===0||c>0,alignment:c===0?'left':'center',verticalAlignment:'middle',insets:12};
  for(const m of String(values[r][c]).matchAll(/\((?:s|l|g|aq)\)/g))cell.text.getRange(m.index+1,m[0].length-2).italic=true;
 }
 for(let r=1;r<values.length;r++)line(s,'table-row-rule-'+r,x+pad,y+24+rh*r,inner,1.5,'#777777');
 return t;
}


for(const d of info){
 if(byNumber.has(d.number))continue;
 let s;
 if([14,22].includes(d.number)){
  s=P.slides.add();const src=sc.slides.find(x=>x.kind==='part');for(const node of src.nodes){let n={...node};if(n.role==='part_label')n.text='Part '+d.part;if(n.role==='title')n.text=d.title;if(n.role==='theory_curiosity')n.text=d.message;await layer(s,n);}
 }else{
 s=P.slides.add();await common(s,d.number,d.title,parts[d.part]||'정리 · 형성평가',d.topic,d.message,d.sub);
 switch(d.number){
 case 6:
  await source(s,'graph-exo',[285,500,590,510]);await source(s,'graph-endo',[1045,500,590,510]);break;
 case 7:
  await equation(s,'CaO(s) + H₂O(l) → Ca(OH)₂(aq)     ΔH = −76.9 kJ',500,47);await equation(s,'NH₄NO₃(s) → NH₄NO₃(aq)     ΔH = +26.2 kJ',610,47);
  shape(s,'interpretation-panel',[245,750,1430,220],'#F5F5F5',28);txt(s,'cao-meaning','산화 칼슘 1 mol이 반응하면 76.9 kJ을 방출한다',[290,790,1340,65],43,'#333333',true,'center');txt(s,'nh4-meaning','질산 암모늄 1 mol이 용해되면 26.2 kJ을 흡수한다',[290,880,1340,65],43,'#333333',true,'center');break;
 case 8:
  await source(s,'coefficient-state',[440,475,1040,500]);break;
 case 9:
  await source(s,'eq-states',[420,505,1080,260]);callout(s,'액체 물이 생성될 때 더 많은 열을 방출한다');break;
 case 10:
  await source(s,'eq-enthalpy',[210,490,1500,85]);await source(s,'graph-exo',[700,610,520,395]);break;
 case 11:
  await source(s,'reaction-table',[210,485,1500,492]);break;
 case 12:
  txt(s,'left-title','열량계로 측정하는\n반응열',[145,320,930,200],76.4,'#111111',true);await source(s,'calorimeter',[1170,430,590,555]);await source(s,'eq-q',[240,590,650,125]);txt(s,'symbols','c  용액의 비열\nm  용액의 질량\nΔt  나중 온도 − 처음 온도',[210,755,850,190],38,'#555555');break;
 case 13:
  await equation(s,'CaCO₃(s) → CaO(s) + CO₂(g)     ΔH = +179.2 kJ',490,46);txt(s,'q1','생성물과 반응물 중 어느 쪽의 엔탈피 합이 클까?',[230,580,1480,60],40,'#555',true,'center');txt(s,'answer-1','생성물의 엔탈피 합이 더 크다',[230,655,1480,60],42,'#0C7D08',true,'center');txt(s,'q2','NH₃(g) 1 mol 생성 시 45.9 kJ 방출 → 반응식을 완성해 보자',[170,775,1580,65],37,'#555',true,'center');await equation(s,'N₂(g) + 3H₂(g) → 2NH₃(g)     ΔH = −91.8 kJ',875,47,'answer-2');break;
 case 16:
  await equation(s,'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)     ΔH = −890.5 kJ',490,42);await equation(s,'2C₄H₁₀(g) + 13O₂(g) → 8CO₂(g) + 10H₂O(l)     ΔH = −5754 kJ',590,40);step(s,1,'메테인 1 mol','890.5 kJ 방출',730);step(s,2,'뷰테인 1 mol','5754 ÷ 2 = 2877 kJ 방출',850);break;
 case 17:
  await equation(s,'1 g당 방출열 = 1 mol당 방출열 ÷ 몰질량',495,53);step(s,1,'메테인','890.5 ÷ 16 ≈ 55.7 kJ/g',635);step(s,2,'뷰테인','2877 ÷ 58 ≈ 49.6 kJ/g',765);txt(s,'unit','(kJ/mol) ÷ (g/mol) = kJ/g',[380,920,1160,65],42,'#777',false,'center');break;
 case 18:
  for(const [id,y,label,mass,calc] of [['eq-ethanol',495,'에탄올','1 mol = 46 g','1367 ÷ 46 ≈ 29.7 kJ/g'],['eq-water-liquid',755,'수소','2 mol = 4 g','571.6 ÷ 4 = 142.9 kJ/g']]){
   s.shapes.add({name:id+'-panel',geometry:'roundRect',position:{left:145,top:y,width:1630,height:225},fill:'#FFFFFF',line:{fill:'#DDDDDD',width:2},borderRadius:24});
   txt(s,id+'-fuel',label,[185,y+32,210,60],43,'#111111',true);
   txt(s,id+'-mass',mass,[185,y+111,240,52],31,'#666666');
   await source(s,id,[470,y+24,1260,74]);
   txt(s,id+'-calculation',calc,[490,y+125,1210,65],48,'#111111',true,'center');
  }break;
 case 19:
  await source(s,'fuel-completed',[230,500,1460,390]);callout(s,'같은 질량을 기준으로 연료의 방출열을 비교한다');break;
 case 20:
  txt(s,'left-title','연료를 비교할 때\n고려할 조건',[145,320,1000,200],76.4,'#111111',true);
  for(const [i,y,label,body] of [[1,570,'자료로 비교','같은 질량의 완전 연소에서\n방출하는 열'],[2,790,'추가로 확인','생산 과정 · 저장과 운송\n장치의 효율']]){
   shape(s,'criterion-card-'+i,[145,y,1080,190],'#F2F2F2',22);shape(s,'criterion-tag-'+i,[180,y+28,240,54],'#595959',10);txt(s,'criterion-label-'+i,label,[190,y+36,220,45],32,'#FFFFFF',true,'center');txt(s,'criterion-body-'+i,body,[460,y+40,730,120],39,'#111111',true);
  }
  shape(s,'student-question',[1310,490,470,125],'#F2F2F2',26);txt(s,'student-question-text','방출열만 크면\n좋은 연료일까?',[1330,511,430,92],35,'#333333',true,'center');await ai(s,'I01',[1350,620,410,370]);break;
 case 21:
  await source(s,'fuel-blank',[160,500,1070,350]);txt(s,'question','같은 질량일 때\n방출열이 큰 순서는?',[1320,520,500,140],46,'#111111',true);txt(s,'answer-1','뷰테인 49.6 · 수소 142.9 kJ/g',[235,900,1450,62],40,'#57962F',true,'center');txt(s,'answer-2','수소 > 메테인 > 뷰테인 > 에탄올',[235,970,1450,60],40,'#555555',true,'center');break;
 case 23:
  txt(s,'left-title','결합을 끊을 때\n에너지를 흡수한다',[145,320,950,200],76.4,'#111111',true);await source(s,'graph-break',[1110,380,690,520]);await source(s,'eq-break',[150,610,870,90]);txt(s,'bond-count','① 기체 상태의 H–H 결합 1 mol 해리\n\n② 436 kJ 흡수, ΔH > 0',[170,770,900,185],39,'#111111');break;
 case 24:
  txt(s,'left-title','결합이 형성될 때\n에너지를 방출한다',[145,320,950,200],76.4,'#111111',true);await source(s,'graph-form',[1110,380,690,520]);txt(s,'formation-equation','2H(g) → H₂(g)     ΔH = −436 kJ',[150,620,930,80],43);txt(s,'bond-count','① H–H 결합 1 mol 형성\n\n② 해리와 크기는 같고 부호는 반대',[170,770,900,185],39,'#111111');break;
 case 25:
  await source(s,'bond-table',[150,470,1080,560]);
  for(const [i,y,label,body] of [[1,505,'기준','결합 1 mol'],[2,670,'의미','해리에 필요한 에너지'],[3,835,'부호','결합 에너지는 양수']]){
   shape(s,'reading-card-'+i,[1290,y,500,145],'#F2F2F2',18);shape(s,'reading-number-'+i,[1320,y+25,38,38],'#595959',19);txt(s,'reading-index-'+i,String(i),[1320,y+26,38,38],26,'#FFFFFF',true,'center');txt(s,'reading-label-'+i,label,[1380,y+22,370,44],31,'#666666',true);txt(s,'reading-body-'+i,body,[1320,y+78,440,51],34,'#111111',true);
  }break;
 case 27:
  table(s,[['과정','결합의 종류','반응식 기준 결합의 양'],['끊기','H–H','2 mol'],['끊기','O=O','1 mol'],['만들기','O–H','4 mol']],240,510,1440,350,[350,450,640],false,42);callout(s,'물 분자 2개 × 분자당 O–H 결합 2개 = 결합 4개');break;
 case 29:
  for(const [i,y,label,body] of [[1,495,'기체 물 생성','평균 결합 에너지로 계산'],[2,750,'액체 물 생성','교과서의 열화학 반응식']]){
   shape(s,'state-label-'+i,[200,y,310,60],'#595959',12);txt(s,'state-label-text-'+i,label,[215,y+10,280,45],34,'#FFFFFF',true,'center');txt(s,'method-'+i,body,[545,y+10,1100,50],36.4,'#888888',true);line(s,'state-divider-'+i,200,y+200,1520,1.5,'#DDDDDD');
  }
  await equation(s,'2H₂(g) + O₂(g) → 2H₂O(g)     ΔH ≈ −470 kJ',595,48);await equation(s,'2H₂(g) + O₂(g) → 2H₂O(l)     ΔH = −571.6 kJ',850,48);break;
 case 30:
  table(s,[['연결할 개념','확인할 관계'],['열 출입과 부호','발열 ΔH < 0  /  흡열 ΔH > 0'],['계수와 반응 엔탈피','계수 × n  →  ΔH × n'],['물질의 상태','상태가 다르면 반응 엔탈피도 달라진다'],['결합 에너지','끊는 데 흡수한 에너지 − 형성 시 방출한 에너지']],200,500,1520,450,[450,1070],false,36);break;
 case 31:
  shape(s,'warm-question',[170,510,440,110],'#F2F2F2',24);txt(s,'warm-question-text','손이 따뜻해진 까닭은?',[190,541,400,52],33,'#333333',true,'center');await ai(s,'I02',[190,610,430,380]);
  for(const [i,x,label,body] of [[1,710,'반응','철의 산화'],[2,1080,'열 이동','주위로 방출'],[3,1450,'부호','ΔH < 0']]){
   shape(s,'recap-card-'+i,[x,505,320,170],'#F2F2F2',20);txt(s,'recap-label-'+i,label,[x+20,530,280,45],31,'#777777',true,'center');txt(s,'recap-body-'+i,body,[x+15,597,290,55],37,'#111111',true,'center');if(i<3)txt(s,'recap-arrow-'+i,'→',[x+329,565,40,50],34,'#777777');
  }
  txt(s,'exit','H₂(g) + F₂(g) → 2HF(g)\n결합 에너지로 ΔH를 구해 보자',[770,755,1000,125],39,'#555555',true);txt(s,'answer-1','ΔH ≈ 436 + 159 − 2 × 570 = −545 kJ',[700,925,1110,65],39,'#0C7D08',true);break;
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
