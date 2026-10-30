import path from 'node:path';
import fs from 'node:fs/promises';
export async function applyRevision48({p,ROOT,img,roundTable}) {
 const s=p.slides.items[27],l=JSON.parse(await(await s.export({format:'layout'})).text());
 const old=l.elements.find(e=>e.kind==='table');const values=old.text.split('\n').map(row=>row.split('\t'));
 p.delete(old.id);for(const e of l.elements)if(e.name==='표 둥근 외곽 마스크')p.delete(e.id);
 roundTable(s,values,400,500,1120,360,[280,840],32);
 for(const e of l.elements)if(e.text?.startsWith('1 M:')){p.resolve(e.id).position={left:410,top:885,width:1100,height:75};p.resolve(e.id).text.style={...e.style,fontSize:29,alignment:'center'};}
 const dir=path.join(ROOT,'units/3-02_헤스법칙/assets/revision-v48');const m=JSON.parse(await fs.readFile(path.join(dir,'placement.json'),'utf8'));
 for(let i=0;i<2;i++){const b=m.boxes[i],h=460,w=h*(b[2]-b[0])/(b[3]-b[1]);const x=i===0?200-w/2:1720-w/2;const im=await img(s,path.join(dir,'ox-students-balanced.png'),x,520,w,h,i===0?'등록 갈색 머리 남학생 · 검정 바지 · 중간 다리 비율 · 손잡이 O 원판':'등록 긴 머리 여학생 · 남색 치마 · 중간 다리 비율 · 손잡이 X 원판','cover');im.crop={left:b[0]/m.width,top:b[1]/m.height,right:(m.width-b[2])/m.width,bottom:(m.height-b[3])/m.height};}
}
