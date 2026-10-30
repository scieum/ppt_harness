export async function applyRevision43({p}) {
 const s=p.slides.items[2],l=JSON.parse(await(await s.export({format:'layout'})).text());
 for(const e of l.elements)if(e.kind==='textbox'&&e.position.top===616){p.resolve(e.id).text.style={...e.style,verticalAlignment:'top',insets:0};}
}
