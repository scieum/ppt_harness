import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {FontLibrary,Canvas} from '/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/node_modules/skia-canvas/lib/index.js';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const U='/Users/keemhayeon/Downloads/Codex/scieum_ppt/units/3-01_엔탈피와열화학반응식';
const OUT=U+'/build/sample-v9';await fs.mkdir(OUT,{recursive:true});
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
for(let i=0;i<P.slides.items.length;i++){
 const s=P.slides.items[i];const info=specs[i];s.speakerNotes.text=info.notes+'\n출처: '+info.source+'\n전체 계획의 원래 장표: '+info.original+' / 31';
 const l=await s.export({format:'layout'});await fs.writeFile(OUT+`/${String(i+1).padStart(2,'0')}.layout.json`,await l.text());
}
await(await PresentationFile.exportPptx(P)).save(OUT+'/candidate.pptx');
await fs.writeFile(OUT+'/slides.json',JSON.stringify(specs,null,2));
console.log('exported 8 review slides; preserving original lesson numbers',specs.map(x=>x.original));
for(let i=0;i<P.slides.items.length;i++){
 const b=await P.export({slide:P.slides.items[i],format:'png',scale:1});await fs.writeFile(OUT+`/${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await b.arrayBuffer()));console.log('rendered',i+1);
}
await fs.writeFile(OUT+'/inspect.ndjson',(await P.inspect({kind:'slide,textbox,image,shape,notes',maxChars:1000000})).ndjson);
