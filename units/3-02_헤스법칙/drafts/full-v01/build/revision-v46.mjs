export async function applyRevision46({p}){
 const ly=async n=>JSON.parse(await(await p.slides.items[n-1].export({format:'layout'})).text());
 for(const n of [43,44])for(const e of (await ly(n)).elements){
  const o=p.resolve(e.id),b=e.position;
  if(e.kind==='image'&&((n===43&&e.alt?.startsWith('반응식 이미지 w120'))||(n===44&&e.alt==='교과서 수식체 생성 계산 패널 43'))){const k=.8;o.position={left:b.left+b.width*(1-k)/2,top:b.top+b.height*(1-k)/2,width:b.width*k,height:b.height*k};}
  if(n===43&&e.text==='경로 2 · 고체와 직접 반응')o.fill='#344E67';
 }
 const l=await ly(49),es=l.elements.filter(e=>e.position.top>=530&&e.position.top+e.position.height<=850);
 const minX=Math.min(...es.map(e=>e.position.left)),maxX=Math.max(...es.map(e=>e.position.left+e.position.width));
 const minY=Math.min(...es.map(e=>e.position.top)),maxY=Math.max(...es.map(e=>e.position.top+e.position.height));
 const dx=960-(minX+maxX)/2,dy=685-(minY+maxY)/2;
 for(const e of es)p.resolve(e.id).position={...e.position,left:e.position.left+dx,top:e.position.top+dy};
}
