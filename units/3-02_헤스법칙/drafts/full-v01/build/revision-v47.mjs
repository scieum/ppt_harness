export async function applyRevision47({p}) {
 const s=p.slides.items[16],l=JSON.parse(await(await s.export({format:'layout'})).text());
 const e=l.elements.find(e=>e.alt==='교과서 수식체 생성 계산 패널 16');
 if(!e)throw Error('17장 대상 수식 없음');
 p.resolve(e.id).position={...e.position,top:860};
}
