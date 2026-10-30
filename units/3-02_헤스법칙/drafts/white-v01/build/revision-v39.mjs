export async function applyRevision39({p,rich,r,chem}) {
 const names=['동기 유발','헤스 법칙','반응 엔탈피 구하기','표준 생성 엔탈피','실험으로 확인하는 헤스 법칙'];
 for(const s of p.slides.items){const l=JSON.parse(await(await s.export({format:'layout'})).text());for(const e of l.elements){if(e.kind==='textbox'&&e.position.top===134&&/^\d{2}$/.test(e.text))p.resolve(e.id).text.style={...e.style,color:'#9FFF68'};if(e.kind==='textbox'&&e.position.top===134&&/^\d{2} /.test(e.text)){const o=p.resolve(e.id);o.text.style={...e.style};o.text=[[r(e.text.slice(0,2),{color:'#9FFF68'}),r(e.text.slice(2),{color:'#FFFFFF'})]];}const m=e.text?.match(/^Part (\d)(?: .*)?$/);if(m&&e.position.top<150){const o=p.resolve(e.id);o.text=`Part ${m[1]} ${names[+m[1]]}`;o.text.style={...e.style,color:"#898989"};}}}
 {const s=p.slides.items[5],l=JSON.parse(await(await s.export({format:'layout'})).text());
 const points=[[r('· 반응 전후 물질의 종류와 상태가 같으면, '),...chem('ΔH'),r('는 '),r('경로',{color:'#9FFF68',bold:true}),r('와 무관하다.')],[r('· '),r('총 열량 불변의 법칙',{color:'#9FFF68',bold:true}),r('이라고 부르기도 한다.')],[r('· 직접 측정하기 어려운 반응의 '),...chem('ΔH'),r('도 '),r('간접적으로',{color:'#9FFF68',bold:true}),r(' 구할 수 있다.')]];
 for(const e of l.elements){if(e.name==='가운데 정렬 헤스 법칙 설명 상자')p.resolve(e.id).fill='#242424';if(e.text?.startsWith('·'))p.delete(e.id);if(e.alt==='단순한 검정 눈 점토 인형 스타일 헤스')p.resolve(e.id).position={left:1480,top:690,width:380,height:340};}
 for(let i=0;i<3;i++)rich(s,points[i],245,470+i*145,1250,72,42,'#FFFFFF',false,'left','v26 핵심어 강조 설명 '+(i+1));
 }
 {const s=p.slides.items[25],l=JSON.parse(await(await s.export({format:'layout'})).text());for(const e of l.elements)if(e.kind==='textbox'&&e.position.top>=700&&e.position.top<1000){const o=p.resolve(e.id);o.fill='#172015';o.position={left:220,top:e.position.top,width:1480,height:94};o.text.style={...e.style,color:'#FFFFFF'};}}
}
