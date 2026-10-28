import fs from 'node:fs/promises';
import path from 'node:path';
export async function applyBlackMath({p,ROOT,img,box,text,white31}){
 const dir=path.join(ROOT,'units/3-02_헤스법칙/assets/calculation-v31');
 const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
 const frames={8:[1110,515,690,420],9:[250,905,1420,85],16:[490,893,950,105],17:[280,810,1360,180],19:[280,875,1360,105],22:[260,895,1400,90],23:[1100,580,700,260],34:[390,440,1140,180],35:[250,510,1400,185],36:[245,750,1430,230],39:[1020,675,760,155],43:[250,390,1420,130],44:[400,420,1120,95],46:[290,485,1350,420],48:[360,485,1260,380]};
 const records=[];
 for(const [key,item] of Object.entries(manifest)){
  const n=Number(key),s=p.slides.items[n-1],frame=frames[n];if(!frame)continue;const deleted=new Set();const del=id=>{if(!deleted.has(id)){p.delete(id);deleted.add(id);}};
  const layout=JSON.parse(await(await s.export({format:'layout'})).text());
  for(const e of layout.elements){
   if(e.kind!=='textbox'||e.position.top<380||e.name==='copyright')continue;
   const t=e.text??'';
   const calc=(n===8&&t==='ΔH₂ + ΔH₃')||/[=×]/.test(t)||((n===34||n===35)&&t.startsWith('− '))||([8,23].includes(n)&&/^(전체 경로|알고 싶은 한 단계|직접 경로|두 단계 경로)/.test(t))|| (n===48&&(/^[−=]|두 결과의 차이|두 단계의 합|직접 반응/.test(t)));
   if(calc)del(e.id);
  }
  if([8,36,48].includes(n)){for(const e of layout.elements)if(e.kind==='shape'&&e.position.top>740)del(e.id);}
  if(n===46){for(const e of layout.elements)if(e.position.top>=400&&e.position.top<1000&&e.kind==='shape')del(e.id);for(const e of layout.elements)if(e.kind==='textbox'&&e.position.top>400&&e.position.top<1000)del(e.id);box(s,195,425,1530,540,'#222222','세 계산의 공통 영역',24);text(s,'용액의 열 → 반응한 양 → 반응 엔탈피',290,438,1350,60,34,'#BBBBBB');}
  if(n===48){text(s,'두 단계의 합과 직접 반응을 비교한다.',360,405,1260,60,36,'#BBBBBB');}
  if(n===43){for(const e of layout.elements.filter(e=>e.kind==='image'&&e.position.top===500)){const im=p.resolve(e.id);im.position={...im.position,top:535,height:285};}}
  if(n===23){text(s,'전체 경로와 구하려는 단계',1100,475,700,65,36,'#9FFF68',true);}
  if(n===8){text(s,'직접 경로와 두 단계의 합',1110,445,690,65,34,'#9FFF68',true);}
  let scale=Math.min(frame[2]/item.size[0],frame[3]/item.size[1],44/item.glyph);
  // Match all standalone equation images on this slide to the same measured cap height.
  const eqs=layout.elements.filter(e=>e.kind==='image'&&white31[e.alt]);
  let glyph=scale*item.glyph;
  for(const e of eqs){const m=white31[e.alt];const max=Math.min(e.position.width/m.size[0],e.position.height/m.size[1])*m.glyph;glyph=Math.min(glyph,max);}
  scale=glyph/item.glyph;
  const width=item.size[0]*scale,height=item.size[1]*scale;
  const im=await img(s,item.file,frame[0]+(frame[2]-width)/2,frame[1]+(frame[3]-height)/2,width,height,'교과서 수식체 생성 계산 패널 '+n);
  records.push({slide:n,id:im.id,file:item.file,glyph_px:glyph,source_glyph_px:item.glyph,expression:item.expression});
  for(const e of eqs){const m=white31[e.alt],ob=p.resolve(e.id),old=ob.position;const sc=glyph/m.glyph,w=m.size[0]*sc,h=m.size[1]*sc;ob.position={left:old.left+(old.width-w)/2,top:old.top+(old.height-h)/2,width:w,height:h};}
 }
 // Normalize remaining equation sets, preserving original image aspect ratios.
 for(let n=1;n<=p.slides.items.length;n++){
  const s=p.slides.items[n-1],ly=JSON.parse(await(await s.export({format:'layout'})).text());
  const es=ly.elements.filter(e=>e.kind==='image'&&white31[e.alt]);
  if(es.length<2)continue;
  const glyph=Math.min(44,...es.map(e=>{const m=white31[e.alt];return Math.min(e.position.width/m.size[0],e.position.height/m.size[1])*m.glyph;}));
  for(const e of es){const m=white31[e.alt],im=p.resolve(e.id),old=im.position,sc=glyph/m.glyph;im.position={left:old.left+(old.width-m.size[0]*sc)/2,top:old.top+(old.height-m.size[1]*sc)/2,width:m.size[0]*sc,height:m.size[1]*sc};}
 }
 await fs.writeFile(path.join(dir,'placements.json'),JSON.stringify(records,null,2));
}
