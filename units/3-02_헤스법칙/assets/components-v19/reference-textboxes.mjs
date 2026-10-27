// Editable reference-derived text containers. References: R04 p33, R05 p29, R03 p38.
export function referenceTextboxes({box,text,rich,chem,C}){
 return {
  pairedRow(s,num,label,body,x,y,w=1520,h=112){
   box(s,x,y,475,h,'#303030','R05-29 번호 표제 상자',16);
   text(s,num,x+24,y+24,62,h-48,38,'#9FFF68',true,'center');
   rich(s,chem(label),x+110,y+20,345,h-40,42,'#FFFFFF',true);
   box(s,x+491,y,w-491,h,'#F5F5F5','R05-29 대응 설명 상자',16);
   rich(s,chem(body),x+525,y+20,w-555,h-40,41,C.black,false);
  },
  explanation(s,label,body,x,y,w,h=166){
   box(s,x,y,w,h,'#F5F5F5','R04-33 표제와 해석 영역',20);
   rich(s,chem(label),x+32,y+17,w-64,56,41,C.green,true);
   rich(s,chem(body),x+32,y+83,w-64,59,40,C.black,false);
  },
  calculation(s,num,label,body,x,y,w,h=160,final=false){
   box(s,x,y,w,h,final?'#303030':'#F5F5F5','R05-29 계산 행 '+num,18);
   text(s,num,x+24,y+45,76,66,45,final?'#9FFF68':C.green,true,'center');
   rich(s,chem(label),x+132,y+16,w-164,50,35,final?'#C8C8C8':'#777777',true);
   rich(s,chem(body),x+132,y+75,w-164,66,44,final?'#9FFF68':C.black,final);
  },
  checklist(s,items,x,y,w,h){
   box(s,x,y,w,h,'#F5F5F5','R03-38 확인 목록 영역',28);
   items.forEach(([label,body],i)=>{
    const yy=y+30+i*170;
    const square=box(s,x+32,yy+12,39,39,'#FFFFFF','R03-38 확인 칸',5);
    square.line={fill:'#898989',width:2};
    rich(s,chem(label),x+100,yy,w-132,60,43,C.green,true);
    rich(s,chem(body),x+100,yy+65,w-132,65,40,C.black,false);
   });
  }
 };
}
