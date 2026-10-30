import path from 'node:path';
export async function applyRevision41({p,ROOT,img,text,box}) {
 {const s=p.slides.items[6],l=JSON.parse(await(await s.export({format:'layout'})).text());
 for(const e of l.elements){if(e.alt?.startsWith('R03 PDF22'))p.delete(e.id);if(e.kind==='textbox'&&e.position.left===584){const o=p.resolve(e.id);o.text.style={...e.style,color:e.style.bold?'#9FFF68':'#EEEEEE',fontSize:e.style.bold?36:30};o.position={left:600,top:e.position.top,width:730,height:e.position.height};}}
 const board=await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/revision-v41/dark-board.png'),510,366,900,642,'새로 생성한 짙은 녹색 칠판 · v41');board.sendToBack();
 for(const y of [582,760])box(s,600,y,720,1,'#66836F/35','칠판 내용 구분선');
 }
 {const s=p.slides.items[16];
 const slash=(x,y,w,h)=>s.shapes.add({geometry:'custom',name:'공통 CO₂ 소거 표시',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'#9FFF68',width:3},customPaths:[{width:w,height:h,commands:[{moveTo:{x:0,y:h}},{lineTo:{x:w,y:0}}]}]});
 slash(1190,465,170,43);slash(1170,580,170,43);
 box(s,1450,484,335,152,'#172015','소거 설명',18);
 text(s,'같은 CO₂는 소거',1470,501,295,49,28,'#9FFF68',true,'center');
 text(s,'두 식에서 사라진다.',1470,557,295,49,25,'#FFFFFF',false,'center');
 text(s,'산소는 절반이 남는다.',710,809,500,50,28,'#BBBBBB',false,'center');
 }
}
