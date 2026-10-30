import path from 'node:path';
export async function applyWhite({p,ROOT,img,chem}) {
 const transitions=[1,5,14,25,42];
 const fillMap={'#202020':'#F2F3F1','#252525':'#F2F3F1','#191919':'#F2F3F1','#18230E':'#C5DDB5','#414141':'#E3E5E1','#3D3D3D':'#E3E5E1','#333333':'#E3E5E1','#555555':'#E3E5E1','#666666':'#E3E5E1','#242424':'#F2F3F1','#222222':'#F2F3F1','#303030':'#E8EBE5','#444444':'#E3E5E1','#172015':'#C5DDB5','#10200C':'#C5DDB5','#365C25':'#397D23','#294D20':'#397D23','#9FFF68':'#397D23','#000000':'#FFFFFF'};
 for(let n=1;n<=p.slides.items.length;n++){
  if(transitions.includes(n))continue;
  const s=p.slides.items[n-1];s.background.fill='#FFFFFF';const l=JSON.parse(await(await s.export({format:'layout'})).text());
  for(const e of l.elements){const o=p.resolve(e.id);
   if(e.alt==='사이음 화이트 원본 로고'){p.delete(e.id);await img(s,path.join(ROOT,'units/3-01_엔탈피와열화학반응식/assets/v10-cover-sci_eum_logo.png'),e.position.left,e.position.top,e.position.width,e.position.height,'사이음 흰 배경용 원본 로고');continue;}
   if(e.alt?.includes('초록빛 배경')){p.delete(e.id);continue;}
   if(n===3&&e.name==='원본 윤곽 목차 블록')continue;
   if(e.lineColor==='#9FFF68')o.line={fill:'#397D23',width:e.lineWidth??3};
   if(e.fillColor&&fillMap[e.fillColor.toUpperCase()])o.fill=fillMap[e.fillColor.toUpperCase()];
   if(e.kind==='textbox'){
    let c=e.style.color?.toUpperCase(),color=c;
    if(['#FFFFFF','#EEEEEE','#BBBBBB'].includes(c))color=c==='#BBBBBB'?'#686868':'#202020';
    if(c==='#9FFF68')color='#28691C';
    if(n===7&&e.position.left===600)color=e.style.bold?'#9FFF68':'#EEEEEE';
    if(n===3&&e.position.top>=470&&e.position.top<900)color=e.text.startsWith('Part ')?'#9FFF68':'#FFFFFF';
    if(n===4&&/^\d$/.test(e.text))color='#FFFFFF';
    if(n===38&&/^\d$/.test(e.text))color='#FFFFFF';
    if(['#365C25','#294D20'].includes(e.fillColor?.toUpperCase()))color='#FFFFFF';
    if(e.text==='한 줄 정리')color='#FFFFFF';
    o.text.style={...e.style,color};if(/Δ[fr]?H/.test(e.text))o.text=[chem(e.text)];
   }
  }
 }
}
