import path from 'node:path';
import {summaryCallout} from './revision-v42.mjs';
export async function applyRevision44({p,ROOT,img,text,box}) {
 const layout=async n=>JSON.parse(await(await p.slides.items[n-1].export({format:'layout'})).text());
 const move=(e,patch)=>{p.resolve(e.id).position={...e.position,...patch};};
 for(const n of [11,12])for(const e of (await layout(n)).elements)if(e.position.top>=452&&e.position.top<900)move(e,{top:e.position.top+55});
 {const s=p.slides.items[16];
 for(const [x,y,w,h] of [[934,466,116,42],[845,577,182,47]])s.shapes.add({geometry:'custom',name:'산소 공통 부분 소거 · 최종 절반 잔류',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'#9FFF68',width:3},customPaths:[{width:w,height:h,commands:[{moveTo:{x:0,y:h}},{lineTo:{x:w,y:0}}]}]});
 for(const e of (await layout(17)).elements){if(e.text==='두 식에서 사라진다.')p.resolve(e.id).text='산소는 절반만 소거';if(e.text==='두 반응식을 빼면 양쪽의 이산화 탄소가 소거된다.')p.resolve(e.id).text='공통 물질을 소거하고, 산소는 남은 양을 확인한다.';}
 }
 for(const [n,prefix] of [[27,'생성되는 물질 1 mol 기준'],[32,'원소 물질이어도'],[33,'물질의 상태가 다르면']])for(const e of (await layout(n)).elements)if(e.text?.startsWith(prefix)){move(e,{left:220,top:395,width:1480,height:64});p.resolve(e.id).text.style={...e.style,fontSize:32,color:'#BBBBBB',alignment:'center',verticalAlignment:'middle'};}
 {for(const e of (await layout(29)).elements)if(e.text?.startsWith('이 수업의 완자'))p.delete(e.id);}
 {const s=p.slides.items[31];for(const e of (await layout(32)).elements){if(e.position.top>=440&&e.position.top<900)move(e,{top:e.position.top+55});if(e.name==='해석·결론')p.delete(e.id);if(e.text?.startsWith('흑연은 이 조건')){p.delete(e.id);text(s,'↖  이 조건에서 더 안정한 기준 원소 물질',860,858,870,65,29,'#9FFF68',true);}}}
 {for(const e of (await layout(33)).elements){if(e.position.top>=625&&e.position.top<=820)move(e,{top:e.position.top+110});else if(e.position.top>=430&&e.position.top<625)move(e,{top:e.position.top+50});}}
 {for(const e of (await layout(35)).elements)if(e.alt==='교과서 수식체 생성 계산 패널 34'){const k=.9;move(e,{left:e.position.left+e.position.width*(1-k)/2,top:e.position.top+e.position.height*(1-k)/2,width:e.position.width*k,height:e.position.height*k});}}
 {const s=p.slides.items[37];for(const e of (await layout(38)).elements)if(e.alt==='새로 생성한 세 생성 반응 수식 이미지')p.delete(e.id);
 const file=path.join(ROOT,'units/3-02_헤스법칙/assets/equations-white-v31/dabb8fbddb97f538.png');
 for(const [i,top,bottom,cap,baseline] of [[0,110,225,75,593],[1,300,420,76,722],[2,470,675,72,852]]){const sc=44/cap,w=2141*sc,h=(bottom-top)*sc;const im=await img(s,file,330,baseline-h/2,w,h,'생성 반응 '+(i+1)+' · 원본 이미지 행 크롭 · 실제 대문자 높이 44px','cover');im.crop={left:0,right:0,top:top/734,bottom:(734-bottom)/734};}
 }
 {const s=p.slides.items[40];for(const e of (await layout(41)).elements){if(e.name==='레퍼런스 내용 영역')move(e,{height:335});if(e.position.top===681.76)move(e,{height:96});if(e.text==='생성물의 합에서 반응물의 합을 뺀다.'){p.delete(e.id);summaryCallout({s,text,box,message:e.text,x:400,y:900,w:1120});}}}
}
