export async function applyRevision35({p}) {
 for (const n of [3,4]) {
  const l=JSON.parse(await(await p.slides.items[n-1].export({format:'layout'})).text());
  for(const e of l.elements.filter(e=>e.kind==='textbox')){
   const o=p.resolve(e.id);
   if(n===3&&e.text.startsWith('Part '))o.text.style={...e.style,typeface:'Pretendard',fontSize:28,bold:true};
   else if(n===3&&e.position.top>=470&&e.position.top<900)o.text.style={...e.style,typeface:'Pretendard',fontSize:36,bold:false};
   else if(n===4&&['1','2','3'].includes(e.text))o.text.style={...e.style,typeface:'Pretendard',fontSize:36,bold:true};
   else if(n===4&&e.position.top>=490&&e.position.top<900)o.text.style={...e.style,typeface:'Pretendard',fontSize:42,bold:false};
  }
 }
}
