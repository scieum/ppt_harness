import path from 'node:path';
export async function applyRevision37({p,ROOT,img,box,text}){
 const A=path.join(ROOT,'units/3-02_헤스법칙/assets/revision-v37');
 {const s=p.slides.items[1];const l=JSON.parse(await(await s.export({format:'layout'})).text());for(const e of l.elements)if(e.alt==='경계 없는 초록빛 배경'||e.name==='동기 유발 초록색 방사형 그라데이션')p.delete(e.id);const o=await img(s,path.join(A,'green-glow.png'),0,0,1920,1080,'경계 없이 퍼지는 진한 초록빛 배경');o.sendToBack();}
 {const s=p.slides.items[5];const l=JSON.parse(await(await s.export({format:'layout'})).text());const texts=l.elements.filter(e=>e.text?.startsWith('·')).map(e=>e.text);for(const e of l.elements)if(e.position.top>=400&&e.position.top<1020)p.delete(e.id);for(let i=0;i<3;i++){box(s,200,450+i*145,1520,112,'#FFFFFF','가운데 정렬 헤스 법칙 설명 상자',22);text(s,texts[i],245,470+i*145,1190,72,34,'#202020',false,'left');}await img(s,path.join(A,'hess-clay.png'),1375,550,485,480,'단순한 검정 눈 점토 인형 스타일 헤스');}
}
