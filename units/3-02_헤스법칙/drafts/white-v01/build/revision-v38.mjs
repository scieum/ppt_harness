export async function applyRevision38({p}) {
 const s=p.slides.items[5],l=JSON.parse(await(await s.export({format:'layout'})).text());
 for(const e of l.elements){
  if(e.alt==='단순한 검정 눈 점토 인형 스타일 헤스')p.resolve(e.id).flipHorizontal=true;
  if(e.kind==='textbox'&&e.text.startsWith('·'))p.resolve(e.id).text.style={...e.style,fontSize:42};
 }
}
