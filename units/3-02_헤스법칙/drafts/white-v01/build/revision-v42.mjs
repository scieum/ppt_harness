// Reference: R06 PDF p15, bottom summary container + compact colored badge.
export function summaryCallout({s,text,box,message,x=580,y=900,w=760}) {
 box(s,x,y,w,80,'#10200C','R06 p15 한 줄 정리 컨테이너',18);
 box(s,x+16,y+16,154,48,'#9FFF68','R06 p15 한 줄 정리 배지',9);
 text(s,'한 줄 정리',x+24,y+16,138,48,25,'#14200C',true,'center');
 text(s,message,x+190,y+10,w-212,60,30,'#FFFFFF',false,'left');
}
export async function applyRevision42({p,text,box}) {
 const s=p.slides.items[39],l=JSON.parse(await(await s.export({format:'layout'})).text());
 const e=l.elements.find(e=>e.text==='액체 물을 수증기로 바꾸려면 열이 필요하다');
 if(!e)throw Error('Slide 40 summary not found');
 p.delete(e.id);summaryCallout({s,text,box,message:e.text});
}
