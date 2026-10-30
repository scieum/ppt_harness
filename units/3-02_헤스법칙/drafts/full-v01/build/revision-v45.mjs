import path from 'node:path';
export async function applyRevision45({p,ROOT,img,text,box}){
 const A=path.join(ROOT,'units/3-02_헤스법칙/assets/revision-v45');
 const ly=async n=>JSON.parse(await(await p.slides.items[n-1].export({format:'layout'})).text());
 const move=(e,v)=>p.resolve(e.id).position={...e.position,...v};
 const slash=(s,x,y,w,h)=>s.shapes.add({geometry:'custom',name:'공통 물질 소거',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'#9FFF68',width:3},customPaths:[{width:w,height:h,commands:[{moveTo:{x:0,y:h}},{lineTo:{x:w,y:0}}]}]});
 {const s=p.slides.items[18];for(const e of (await ly(19)).elements)if(e.alt==='2015 완자137쪽 목표 반응식 원본')p.delete(e.id);const im=await img(s,path.join(A,'diamond-target-white-full.png'),239,586,450/62*106,106,'원본 목표식 닫는 괄호 복원 · 전체 원본에서 여유 있게 크롭','cover');im.crop={left:0,top:0,right:144/594,bottom:0};}
 {const s=p.slides.items[20];for(const e of (await ly(21)).elements)if(e.name==='참조 단계 결과'){const ob=p.resolve(e.id);ob.fill='linear(115deg, #526547 0%, #34492D 48%, #23301F 100%)';ob.line={fill:'#7B8B70/65',width:1};box(s,e.position.left+20,e.position.top+2,e.position.width-40,1,'#BFCCB0/45','얇은 표면 반사');}}
 {const s=p.slides.items[31];for(const e of (await ly(32)).elements)if(e.text?.startsWith('↖')){p.delete(e.id);text(s,'이 조건에서 더 안정한 기준 원소 물질',1010,858,750,65,28,'#9FFF68',true);}
 await img(s,path.join(A,'water-properties-p14-arrow.png'),870,835,130,56,'물에맛.Zip 물의 여러 가지 성질14장 원본 공통 곡선 화살표');}

 {const s=p.slides.items[33];for(const e of (await ly(34)).elements){if(e.name==='핵심 문장'){p.resolve(e.id).text='세 과정을 합하면 메테인의 연소 반응이 된다.';p.resolve(e.id).text.style={...e.style,fontSize:57};}if(e.name==='해석·결론'||e.name==='반응식·수식')p.delete(e.id);}
 for(const v of [[640,444,177,40],[410,595,173,40],[883,444,112,40],[410,747,113,40]])slash(s,...v);
 }
 {const s=p.slides.items[35];for(const e of (await ly(36)).elements)if(e.position.top>=480&&e.position.top<1000)p.delete(e.id);
 const cards=[['몰수 n','반응 계수에 따른 물질의 양'],['표준 생성 엔탈피','물질 1 mol이 생성될 때의 값'],['합 Σ','각 물질의 곱을 모두 더함']];
 for(let i=0;i<3;i++){const x=210+i*510;box(s,x,490,480,112,'#242B20','수식 기호별 설명 바',16);text(s,cards[i][0],x+20,499,440,42,30,'#9FFF68',true,'center');text(s,cards[i][1],x+20,547,440,42,25,'#DDDDDD',false,'center');}
 const im=await img(s,path.join(A,'formation-sum-white.png'),210,665,1500,1500*180/2010,'새로 생성한 몰수와 표준 생성 엔탈피의 합 차이 수식','cover');im.crop={left:75/2172,right:87/2172,top:250/724,bottom:294/724};
 box(s,250,840,1420,85,'#1D2918','몰수 적용 설명 바',16);text(s,'반응 계수로 생성되거나 반응하는 물질의 양을 반영한다.',285,852,1350,60,32,'#FFFFFF',false,'center');
 text(s,'기준 원소 물질의 표준 생성 엔탈피는 0이다.',300,950,1320,50,28,'#BBBBBB',false,'center');
 }
 {const s=p.slides.items[46];for(const e of (await ly(47)).elements){if(e.text==='용액의 열 → 반응한 양 → 반응 엔탈피')p.delete(e.id);if(e.name==='레퍼런스 내용 영역')move(e,{top:600,height:310});}
 for(const [i,label] of ['용액이 얻은 열','반응한 몰수','반응 엔탈피'].entries()){const x=300+i*450;box(s,x,490,420,90,'#222A1D','계산 순서 설명 바',16);box(s,x+18,511,46,46,'#9FFF68','계산 단계 번호',23);text(s,String(i+1),x+18,511,46,46,25,'#1B2815',true,'center');text(s,label,x+82,503,310,64,30,'#FFFFFF',true,'center');}
 }
 {for(const e of (await ly(48)).elements){if((e.kind==='table'||e.name==='표 둥근 외곽 마스크')&&e.position.top<1000)move(e,{top:e.position.top+65});if(e.text?.startsWith('교재에 제시된 반올림'))move(e,{top:402,height:64});}}
 {const s=p.slides.items[48];for(const e of (await ly(49)).elements)if(e.alt==='교과서 수식체 생성 계산 패널 48')p.delete(e.id);
 const file=path.join(ROOT,'units/3-02_헤스법칙/assets/calculation-v31/slide-48-white.png');
 for(const [i,top,bottom,cap] of [[0,75,235,99],[1,275,425,99],[2,450,615,99]]){const scale=30/cap;const h=(bottom-top)*scale;const im=await img(s,file,650,572.5+i*97-h/2,2019*scale,h,'비교 계산 '+(i+1)+'행 원본 크롭 · 옆 설명과 30px 크기','cover');im.crop={left:0,right:0,top:top/622,bottom:(622-bottom)/622};}
 }
 {const s=p.slides.items[49];for(const e of (await ly(50)).elements){if(e.alt?.startsWith('R03 PDF22'))p.delete(e.id);if(e.kind==='textbox'&&e.position.left===584){const o=p.resolve(e.id);o.text.style={...e.style,color:e.style.bold?'#9FFF68':'#EEEEEE',fontSize:e.style.bold?36:30};move(e,{left:600,width:730});}}
 const im=await img(s,path.join(ROOT,'units/3-02_헤스법칙/assets/revision-v41/dark-board.png'),510,366,900,642,'7장과 동일한 짙은 녹색 칠판');im.sendToBack();for(const y of [582,760])box(s,600,y,720,1,'#66836F/35','칠판 내용 구분선');}
}
