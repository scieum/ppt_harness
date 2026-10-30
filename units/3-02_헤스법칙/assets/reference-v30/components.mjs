// Native layouts derived from user-provided reference screenshots. No reference text/artwork copied into slides.
export function referenceLayouts({box,text,line}){
 return {
  card(s,{x,y,w,h,title,body,number}){box(s,x,y,w,h,'#242424','참조 3열 카드',24);text(s,number,x+28,y+30,w-56,70,46,'#9FFF68',true);text(s,title,x+28,y+118,w-56,68,44,'#FFFFFF',true);text(s,body,x+28,y+212,w-56,h-235,35,'#C9C9C9',false);},
  branch(s,{x,y,w,title,body}){box(s,x,y,w,205,'#252525','참조 분기 설명',26);text(s,title,x+30,y+28,w-60,60,40,'#9FFF68',true,'center');text(s,body,x+35,y+104,w-70,85,35,'#FFFFFF',false,'center');},
  stage(s,{y,number,action,result}){box(s,218,y+5,128,61,'#FFFFFF','참조 단계 번호',9);text(s,number,225,y+9,114,52,32,'#222222',true,'center');text(s,action,382,y,850,85,37,'#FFFFFF',false);text(s,'→',1260,y+6,70,61,38,'#BEBEBE',false,'center');box(s,1370,y,330,78,'#414141','참조 단계 결과',12);text(s,result,1385,y+10,300,58,32,'#FFFFFF',false,'center');},
  check(s,{y,title,detail}){box(s,248,y+10,38,38,'#333333','확인 표시 상자',7);text(s,'□',246,y-1,45,60,43,'#CCCCCC');text(s,title,326,y,1110,62,39,'#FFFFFF',true);text(s,detail,326,y+65,1110,62,31,'#AAAAAA');}
 };
}
