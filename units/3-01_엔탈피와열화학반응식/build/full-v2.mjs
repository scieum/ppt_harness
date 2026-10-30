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
 if(/→/.test(text)&&/\((?:s|l|g|aq)\)/.test(text)&&!text.includes('\n')){size=48;bold=false;text=text.replace(/\s*\+\s*/g,' + ').replace(/\s*→\s*/g,' → ').replace(/\s+ΔH/g,'    ΔH');}
 const t=shape(s,role,b);t.text=text;t.text.style={typeface:face,fontSize:size,color,bold,alignment:align,verticalAlignment:'top',insets:0,wrap:'none',autoFit:'none'};for(const m of text.matchAll(/\((?:s|l|g|aq)\)/g))t.text.getRange(m.index+1,m[0].length-2).italic=true;for(const m of text.matchAll(/ΔH/g))t.text.getRange(m.index+1,1).italic=true;return t;
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
const topicGroups=[[5.01, 5.02, "01", "발열 반응과 흡열 반응"], [5.1, 6.1, "02", "엔탈피와 열 출입"], [6.6, 13, "01", "열화학 반응식"], [15, 15, "01", "연소 반응의 이용"], [16, 21, "02", "연료의 효율성 비교"], [23, 25, "01", "결합 에너지"], [26, 29, "02", "결합 에너지와 반응 엔탈피"], [30, 31, "", "정리와 확인"]];
async function common(s,n,title,part,topic,message,sub){
 const group=topicGroups.find(g=>n>=g[0]&&n<=g[1]);if(group){topic=group[2];title=group[3];}
 s.background.fill='#ffffff';await layer(s,sc.slides[4].nodes.find(x=>x.role==='sci_eum_logo'));
 txt(s,'part_heading',part,[72,78,1500,52],38,'#909090',true);
 if(topic)txt(s,'topic_number',topic,[72,137,73,67],48.8,'#57962F',true);
 txt(s,'topic_heading',title,[topic?157:72,137,1500,67],48.8,'#111111',true);
 if(![12,20].includes(n))txt(s,'title',message,[72,285,1776,100],76.4,'#111111',true,'center');
 if(sub && ![12,20].includes(n)){const st=txt(s,'explanation',sub,[72,398,1776,70],36.4,'#888888',true,'center');if(n===5.1 && sub.includes('H'))st.text.getRange(sub.indexOf('H'),1).italic=true;}
 
 txt(s,'copyright','© 2026. @sci_eum. All rights reserved.',[1535,1037,342,30],17,'#111111',false,'right');
}
async function template(kind,n){const source=sc.slides.find(x=>x.kind===kind);const s=P.slides.add();if(kind==='contents'){
  for(const node of source.nodes.filter(n=>['sci_eum_logo','copyright','title'].includes(n.role)))await layer(s,node);
  const labels=['엔탈피','열화학 반응식','연료의 효율성','결합 에너지와\n반응 엔탈피'];
  for(let i=0;i<4;i++){const x=231+i*356;s.shapes.add({name:'part-chevron-'+i,geometry:'custom',position:{left:x,top:480,width:390,height:340},fill:'#202020',line:noLine,customPaths:[{width:410,height:354,commands:[
   {moveTo:{x:22,y:0}},{lineTo:{x:326,y:0}},
   {cubicBezTo:{x1:335,y1:0,x2:343,y2:6,x:347,y:15}},
   {lineTo:{x:408,y:166}},{cubicBezTo:{x1:411,y1:173,x2:411,y2:179,x:408,y:186}},
   {lineTo:{x:347,y:339}},{cubicBezTo:{x1:343,y1:349,x2:335,y2:354,x:325,y:354}},
   {lineTo:{x:22,y:354}},{cubicBezTo:{x1:8,y1:354,x2:-2,y2:342,x:2,y:328}},
   {lineTo:{x:50,y:185}},{cubicBezTo:{x1:52,y1:179,x2:52,y2:174,x:50,y:168}},
   {lineTo:{x:2,y:26}},{cubicBezTo:{x1:-3,y1:12,x2:7,y2:0,x:22,y:0}},{close:{}}
  ]}]});txt(s,'part-label-'+i,'Part '+(i+1),[x+65,550,270,55],36,'#9FFF68',true);for(const [j,t]of labels[i].split('\n').entries())txt(s,'part-title-'+i+'-'+j,t,[x+65,630+j*52,290,58],36,'#FFFFFF');}
 }else{for(const node of source.nodes){let q={...node};if(kind==='part'&&n===5){if(q.role==='title')q.text='엔탈피';if(q.role==='theory_curiosity')q.text='반응할 때 열은 어디로 이동할까?';}await layer(s,q);}}specs.push({original:n,type:kind,title:source.title,source:'V10 '+kind,notes:source.notes});return s;}
await template('cover',1);await template('contents',2);await template('objectives',3);await template('hook',4);await template('part',5);
{
 const s=P.slides.add();await common(s,15,'연소 반응의 이용','Part 3 연료의 효율성','01','연소 반응의 이용','연료가 연소하며 방출하는 에너지를 난방과 자동차의 운동에 이용한다');
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
 const s=P.slides.add();await common(s,26,'물 생성 반응의 결합 모형','Part 4 결합 에너지와 반응 엔탈피','03','원자 수는 보존되고, 결합은 달라진다','수소와 산소의 결합이 끊어지고, 산소와 수소 사이에 새로운 결합이 형성된다');
 await source(s,'eq-water-gas',[590,440,740,75]);await source(s,'reaction-model',[250,540,1420,335]);
 shape(s,'conclusion-box',[245,885,1430,100],'#595959',16);
 txt(s,'conclusion','반응 전후 수소 원자는 4개, 산소 원자는 2개로 같다',[275,909,1370,58],44.5,'#FFFFFF',false,'center','Pretendard Medium');
 specs.push({original:26,type:'figure',title:'물 생성 반응의 결합 모형',source:'천재교육 물질과 에너지 PDF/인쇄 p.81 그림Ⅲ-7; 지도서 p.110',notes:'왼쪽에는 수소 분자 두 개와 산소 분자 한 개가 있습니다. 수소 원자는 네 개, 산소 원자는 두 개입니다. 가운데는 결합을 끊는 데 필요한 에너지를 계산하기 위한 원자 상태의 모형입니다. 이 과정에는 에너지가 필요하므로 ΔH가 양수입니다. 오른쪽에서는 물 분자 두 개가 형성되며 O–H 결합 네 개가 만들어집니다. 결합 형성에서는 에너지를 방출합니다. 전후의 원자 수는 같고 결합의 종류와 수가 달라집니다. 이 그림은 에너지 계산을 위한 모형이며 실제 반응이 반드시 모든 원자가 분리되는 경로로 진행된다는 뜻은 아닙니다. 다음 장에서 결합 수를 따로 세어 봅니다.'});
}
{
 const s=P.slides.add();await common(s,28,'결합 에너지로 반응 엔탈피 계산','Part 4 결합 에너지와 반응 엔탈피','03','흡수하는 에너지에서 방출하는 에너지를 뺀다','2H₂(g) + O₂(g) → 2H₂O(g) · 반응식 전체 기준');
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
const parts=['','Part 1 엔탈피','Part 2 열화학 반응식','Part 3 연료의 효율성','Part 4 결합 에너지와 반응 엔탈피'];
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
 shape(s,'table-rounded-background',[x,y,w,h],'#252525',0);
 const pad=0,inner=w,rh=h/values.length;
 const ratios=widths||Array(values[0].length).fill(1),total=ratios.reduce((a,b)=>a+b,0);
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x+pad,top:y,width:inner,height:h,columnWidths:ratios.map(v=>v/total*inner),values});
 t.borders.assign({style:'solid',fill:'#3D3D3D',width:0});
 for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){
  const cell=t.getCell(r,c);cell.fill=(r===0||c===0)?'#3D3D3D':'#252525';cell.text.style={typeface:'Pretendard',fontSize:size,color:'#FFFFFF',bold:r===0||c>0,alignment:'center',verticalAlignment:'middle',insets:12};
  for(const m of String(values[r][c]).matchAll(/ΔH/g))cell.text.getRange(m.index+1,1).italic=true;
  for(const m of String(values[r][c]).matchAll(/\((?:s|l|g|aq)\)/g))cell.text.getRange(m.index+1,m[0].length-2).italic=true;
 }
 for(let r=1;r<values.length;r++)line(s,'table-row-rule-'+r,x+pad,y+rh*r,inner,1.5,'#777777');
 const radius=24;
 for(const [i,cx,cy,rotation] of [[0,x,y,0],[1,x+w-radius,y,90],[2,x+w-radius,y+h-radius,180],[3,x,y+h-radius,270]]){
  s.shapes.add({name:'table-rounded-corner-'+i,geometry:'custom',position:{left:cx,top:cy,width:radius,height:radius,rotation},fill:'#FFFFFF',line:noLine,customPaths:[{width:radius,height:radius,commands:[{moveTo:{x:0,y:0}},{lineTo:{x:radius,y:0}},{cubicBezTo:{x1:radius*0.4477,y1:0,x2:0,y2:radius*0.4477,x:0,y:radius}},{close:{}}]}]});
 }
 return t;
}


for(const d of info){
 if(byNumber.has(d.number))continue;
 let s;
 if([6.5,14,22].includes(d.number)){
  s=P.slides.add();const src=sc.slides.find(x=>x.kind==='part');for(const node of src.nodes){let n={...node};if(n.role==='part_label')n.text='Part '+d.part;if(n.role==='title')n.text=d.title;if(n.role==='theory_curiosity')n.text=d.message;await layer(s,n);}
 }else{
 s=P.slides.add();await common(s,d.number,d.title,parts[d.part]||'정리 · 형성평가',d.topic,d.message,d.sub);
 switch(d.number){
 case 5.01:
 case 5.02: {
  const exo=d.number===5.01;
  const cards=exo?[['example-methane','메테인의 연소','도시가스가 연소하며 열을 방출한다'],['example-iron','철의 산화','손난로는 철 가루의 산화열을 이용한다']]:[['PHOTO_COOL','냉각 팩','질산 암모늄이 용해되며 열을 흡수한다'],['example-bread','탄산수소 나트륨의 분해','제빵 소다가 분해될 때 열을 흡수한다']];
  for(let i=0;i<2;i++){
   const x=250+i*770;shape(s,'example-card-'+i,[x,490,650,500],'#1F2429',26);
   const photo=await fs.readFile(SOURCE+cards[i][0]+'.png');s.images.add({name:'example-photo-'+i,blob:photo.buffer.slice(photo.byteOffset,photo.byteOffset+photo.byteLength),contentType:'image/png',alt:cards[i][1],fit:'cover',geometry:'roundRect',borderRadius:16,position:{left:x+24,top:514,width:602,height:340}});
   const t=txt(s,'example-title-'+i,cards[i][1],[x+20,871,610,50],36,'#FFFFFF',true,'center');t.text.underline='sng';
   txt(s,'example-caption-'+i,cards[i][2],[x+20,936,610,43],29,'#FFFFFF',false,'center');
  }break;
 }
 case 5.1: {
  // Definition, two explanatory points and a separate etymology note follow the reference's hierarchy.
  for(const [i,y,lines] of [[1,535,['물질은 분자의 운동 에너지뿐 아니라','여러 종류의 에너지를 갖는다.']],[2,715,['물질의 양과 상태, 온도와 압력에 따라','엔탈피가 달라진다.']]]){
   shape(s,'enthalpy-point-circle-'+i,[235,y+7,48,48],'#8B949C',24);
   txt(s,'enthalpy-point-number-'+i,String(i),[235,y+9,48,48],32,'#FFFFFF',true,'center');
   for(const [j,t]of lines.entries())txt(s,'enthalpy-point-'+i+'-line-'+j,t,[315,y+j*61,1060,61],43,'#111111',true);
  }
  const h=txt(s,'enthalpy-symbol','H',[1400,545,280,205],160,'#57962F',true,'center');h.text.getRange(0,1).italic=true;
  txt(s,'enthalpy-symbol-caption','엔탈피의 기호',[1380,768,320,60],36.4,'#888888',true,'center');
  callout(s,'‘덥다’를 뜻하는 그리스어 enthalpo에서 유래한 엔탈피',905);
  break;
 }
 case 5.2: {
  await source(s,'eq-enthalpy',[130,520,1660,100]);
  txt(s,'after-label','반응 후',[605,690,450,65],46,'#57962F',true,'center');
  txt(s,'before-label','반응 전',[1200,690,450,65],46,'#777777',true,'center');
  txt(s,'change-meaning','Δ는 변화량을 뜻한다',[200,785,1520,65],38,'#888888',true,'center');

  break;
 }
 case 6:
  await source(s,'graph-exo',[320,490,520,450]);await source(s,'graph-endo',[1080,490,520,450]);
  txt(s,'exothermic-caption','발열 반응',[310,956,285,65],48.8,'#111111',true,'center');
  txt(s,'exothermic-sign','ΔH < 0',[610,956,235,65],48.8,'#57962F',true,'center');
  txt(s,'endothermic-caption','흡열 반응',[1070,956,285,65],48.8,'#111111',true,'center');
  txt(s,'endothermic-sign','ΔH > 0',[1370,956,235,65],48.8,'#57962F',true,'center');break;
 case 6.1:
  await source(s,'eq-exo-endo-summary',[180,520,1560,310]);
  break;
 case 6.6:
  shape(s,'definition-box',[230,500,1460,230],'#F2F2F2',24);
  txt(s,'definition-line-1','화학 반응식에 반응 엔탈피를',[270,545,1380,75],54,'#111111',true,'center');
  txt(s,'definition-line-2','함께 나타낸 것을 열화학 반응식이라고 한다',[270,635,1380,75],54,'#111111',true,'center');
  await source(s,'eq-cao',[190,810,1540,85]);
  break;
 case 7.5:
  table(s,[['특징','반응 엔탈피의 변화'],['계수','반응식 전체의 계수 × n  →  ΔH × n'],['상태','물질의 상태가 다르면 ΔH도 달라진다'],['역반응','반응 엔탈피의 크기는 같고 부호는 반대']],200,510,1520,370,[360,1160],false,38);
  txt(s,'reverse-condition','온도·압력이 같고 물질의 상태와 양이 대응하는 정반응과 역반응의 비교',[170,925,1580,65],34,'#888888',true,'center');break;
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
  table(s,[['연료','메테인','뷰테인','에탄올','수소'],['분자식','CH₄','C₄H₁₀','C₂H₆O','H₂'],['분자량','16','58','46','2'],['1 mol당 방출열(kJ/mol)','890.5','2877','1367','285.8'],['1 g당 방출열(kJ/g)','55.7','49.6','29.7','142.9']],160,480,1600,400,[460,285,285,285,285],false,32);callout(s,'1 g당 방출열: 수소 > 메테인 > 뷰테인 > 에탄올',925);break;
 case 20:
  txt(s,'left-title','연료를 비교할 때\n고려할 조건',[145,320,1000,200],76.4,'#111111',true);
  for(const [i,y,label,body] of [[1,570,'방출하는 열','같은 질량의 완전 연소에서\n방출하는 열'],[2,790,'실제 이용 조건','생산 과정 · 저장과 운송\n장치의 효율']]){
   shape(s,'criterion-card-'+i,[145,y,1080,190],'#F2F2F2',22);shape(s,'criterion-tag-'+i,[180,y+28,240,54],'#595959',10);txt(s,'criterion-label-'+i,label,[190,y+36,220,45],32,'#FFFFFF',true,'center');txt(s,'criterion-body-'+i,body,[460,y+40,730,120],39,'#111111',true);
  }
  shape(s,'student-question',[1310,490,470,125],'#F2F2F2',26);txt(s,'student-question-text','방출열만 크면\n좋은 연료일까?',[1330,511,430,92],35,'#333333',true,'center');await ai(s,'I03',[1350,620,410,370]);break;
 case 21:
  table(s,[['연료','메테인','뷰테인','에탄올','수소'],['분자식','CH₄','C₄H₁₀','C₂H₆O','H₂'],['분자량','16','','',''],['1 mol당 방출열(kJ/mol)','890.5','','',''],['1 g당 방출열(kJ/g)','55.7','','','']],160,475,1600,400,[460,285,285,285,285],false,32);
  s.shapes.add({name:'question-arrow',geometry:'rightArrow',position:{left:300,top:895,width:1320,height:34},fill:{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#9FFF68'},{offset:100000,color:'#0C7D08'}]},line:noLine});
  txt(s,'question','같은 질량일 때 방출열이 큰 순서는?',[325,939,1230,52],40,'#111111',true,'center');
  txt(s,'answer-1','뷰테인 49.6 · 수소 142.9 kJ/g',[160,996,700,40],30,'#57962F',true,'center');
  txt(s,'answer-2','수소 > 메테인 > 뷰테인 > 에탄올',[870,996,890,40],30,'#555555',true,'center');break;
 case 23:
 case 24: {
  const breaking=d.number===23;
  await source(s,breaking?'graph-break':'graph-form',[150,490,830,405]);
  shape(s,'bond-explanation-panel',[1050,490,720,390],'#F2F2F2',24);
  for(const [j,y,label,body] of [[1,515,'결합의 변화',breaking?'H–H 결합 1 mol을 끊는다':'H–H 결합 1 mol이 만들어진다'],[2,695,'열 출입과 엔탈피',breaking?'436 kJ 흡수 · ΔH > 0':'436 kJ 방출 · ΔH < 0']]){
   shape(s,'bond-explanation-tag-'+j,[1080,y,660,52],'#595959',10);txt(s,'bond-explanation-label-'+j,label,[1100,y+8,620,43],32,'#FFFFFF',true,'center');txt(s,'bond-explanation-body-'+j,body,[1080,y+78,660,70],39,'#111111',true,'center');
  }
  shape(s,'reaction-text-bar',[245,920,1430,100],'#595959',16);
  txt(s,'reaction-bar-text',breaking?'H₂(g) → 2H(g)    ΔH = 436 kJ':'2H(g) → H₂(g)    ΔH = −436 kJ',[275,940,1370,65],48,'#FFFFFF',false,'center');
  break;
 }
 case 25:
  await source(s,'bond-table',[150,470,1080,560]);
  for(const [i,y,label,body] of [[1,505,'H–H 결합','1 mol 해리: 436 kJ 흡수'],[2,670,'물 1 mol','O–H 결합은 2 mol'],[3,835,'다원자 분자','평균 결합 에너지 사용']]){
   shape(s,'reading-card-'+i,[1290,y,500,145],'#F2F2F2',18);shape(s,'reading-number-'+i,[1320,y+25,38,38],'#595959',19);txt(s,'reading-index-'+i,String(i),[1320,y+26,38,38],26,'#FFFFFF',true,'center');txt(s,'reading-label-'+i,label,[1380,y+22,370,44],31,'#666666',true);txt(s,'reading-body-'+i,body,[1320,y+78,440,51],34,'#111111',true);
  }break;
 case 27:
  table(s,[['과정','결합의 종류','반응식 기준 결합의 양'],['끊기','H–H','2 mol'],['끊기','O=O','1 mol'],['만들기','O–H','4 mol']],240,510,1440,350,[350,450,640],false,42);callout(s,'물 2 mol에는 O–H 결합이 4 mol 있다');break;
 case 29:
  for(const [i,y,label,body] of [[1,495,'수증기 생성','평균 결합 에너지로 계산한 근삿값'],[2,750,'액체 물 생성','']]){
   shape(s,'state-label-'+i,[200,y,310,60],'#595959',12);txt(s,'state-label-text-'+i,label,[215,y+10,280,45],34,'#FFFFFF',true,'center');if(body)txt(s,'method-'+i,body,[545,y+10,1100,50],36.4,'#888888',true);line(s,'state-divider-'+i,200,y+200,1520,1.5,'#DDDDDD');
  }
  await equation(s,'2H₂(g) + O₂(g) → 2H₂O(g)     ΔH ≈ −470 kJ',595,48);await equation(s,'2H₂(g) + O₂(g) → 2H₂O(l)     ΔH = −571.6 kJ',850,48);break;
 case 30:
  table(s,[['비교 기준','발열 반응','흡열 반응'],['열의 이동','반응하는 물질 → 주위','주위 → 반응하는 물질'],['반응 전후 엔탈피','감소한다','증가한다'],['엔탈피 합의 비교','생성물 < 반응물','생성물 > 반응물'],['반응 엔탈피의 부호','ΔH < 0','ΔH > 0']],200,475,1520,400,[400,560,560],false,36);
  txt(s,'recap-other-relations','계수를 n배 하면 ΔH도 n배 · 물질의 상태가 달라지면 ΔH도 달라진다',[170,902,1580,55],33,'#555555',true,'center');
  shape(s,'summary-bond-bar',[200,965,1520,65],'#595959',16);txt(s,'summary-bond-equation','ΔH ≈ 결합을 끊는 데 흡수한 에너지 − 결합 형성 시 방출한 에너지',[220,979,1480,45],32,'#FFFFFF',false,'center');break;
 case 31:
  shape(s,'warm-question',[170,510,440,110],'#F2F2F2',24);txt(s,'warm-question-text','손이 따뜻해진 까닭은?',[190,541,400,52],33,'#333333',true,'center');await ai(s,'I04',[190,610,430,380]);
  for(const [i,x,label,body] of [[1,710,'반응','철의 산화'],[2,1080,'열 이동','주위로 방출'],[3,1450,'부호','ΔH < 0']]){
   shape(s,'recap-card-'+i,[x,505,320,170],'#F2F2F2',20);txt(s,'recap-label-'+i,label,[x+20,530,280,45],31,'#777777',true,'center');txt(s,'recap-body-'+i,body,[x+15,597,290,55],37,'#111111',true,'center');if(i<3)txt(s,'recap-arrow-'+i,'→',[x+329,565,40,50],34,'#777777');
  }
  txt(s,'exit-reaction','H₂(g) + F₂(g) → 2HF(g)',[770,745,1000,70],48,'#111111');txt(s,'exit-instruction','결합 에너지로 ΔH를 구해 보자',[770,825,1000,55],39,'#555555',true);txt(s,'answer-1','ΔH ≈ 436 + 159 − 2 × 570 = −545 kJ',[700,925,1110,65],39,'#0C7D08',true);break;
 }
 }
 byNumber.set(d.number,s);
}
const ordered=info.map(d=>byNumber.get(d.number));for(let i=0;i<ordered.length;i++)ordered[i].moveTo(i);
for(let i=0;i<info.length;i++){
 const s=P.slides.items[i],d=info[i];s.speakerNotes.text=d.script+'\n화면에서 가리킬 순서: '+d.point+'\n오개념 점검: '+d.caution+'\n다음 연결: '+d.next+'\n출처: '+d.source;
 const l=await s.export({format:'layout'});await fs.writeFile(OUT+`/${String(i+1).padStart(2,'0')}.layout.json`,await l.text());
}
await(await PresentationFile.exportPptx(P)).save(OUT+'/candidate.pptx');
await fs.writeFile(OUT+'/slides.json',JSON.stringify(info.map((d,i)=>({...d,sourceNumber:d.number,number:i+1})),null,2));
for(let i=0;i<info.length;i++){const b=await P.export({slide:P.slides.items[i],format:'png',scale:1});await fs.writeFile(OUT+`/${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await b.arrayBuffer()));console.log('rendered',i+1);}
await fs.writeFile(OUT+'/inspect.ndjson',(await P.inspect({kind:'slide,textbox,image,shape,table,notes',maxChars:2000000})).ndjson);
