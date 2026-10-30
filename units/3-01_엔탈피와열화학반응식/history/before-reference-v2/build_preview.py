from pathlib import Path
import json,shutil,html
W=Path.cwd();U=W/'units/3-01_엔탈피와열화학반응식';B=U/'build/full-v1';O=W/'output';P=O/'full31-preview';P.mkdir(exist_ok=True)
rows=json.loads((U/'build/lesson-content.json').read_text());cards=[]
for r in rows:
 n=r['number'];name=f'{n:02}.png';shutil.copy2(B/name,P/name)
 layout=json.loads((B/f'{n:02}.layout.json').read_text());masks=[]
 for el in layout['elements']:
  if el.get('name','').startswith('answer-'):
   p=el['position'];masks.append(f'<div class="mask" style="left:{(p["left"]-3)/19.2}%;top:{(p["top"]-3)/10.8}%;width:{(p["width"]+6)/19.2}%;height:{(p["height"]+6)/10.8}%"></div>')
 controls='<button onclick="reveal(this)">답 보기</button> <button onclick="reset(this)">답 가리기</button>' if masks else ''
 cards.append(f'<article id="s{n}"><header><b>{n:02} · {html.escape(r["title"])}</b><span>{r["minutes"]:g}분</span></header><div class="slide"><img src="full31-preview/{name}" alt="{html.escape(r["title"])}" loading="lazy">{"".join(masks)}</div><footer>{controls}<details><summary>발표 대본과 출처</summary><p>{html.escape(r["script"])}</p><p class="source">{html.escape(r["source"])}</p></details></footer></article>')
css='''@font-face{font-family:Pretendard;src:url(fonts/Pretendard-Regular.woff2);font-weight:400}@font-face{font-family:Pretendard;src:url(fonts/Pretendard-Bold.woff2);font-weight:700}*{box-sizing:border-box}body{margin:0;background:#eef0ed;color:#202420;font-family:Pretendard,sans-serif}nav{position:sticky;top:0;z-index:10;background:#202620;color:white;padding:14px 4vw;display:flex;gap:18px;align-items:center;flex-wrap:wrap}nav a{color:white}main{max-width:1400px;margin:auto;padding:24px}h1{font-size:28px}article{background:white;margin:28px 0 44px;box-shadow:0 3px 18px #0001;scroll-margin-top:100px}header,footer{padding:16px 22px}header{display:flex;justify-content:space-between;border-bottom:1px solid #eee}header span,.source{color:#777}.slide{position:relative;aspect-ratio:16/9}.slide img{display:block;width:100%;height:100%}.mask{position:absolute;background:white}button,select{font:inherit;padding:9px 14px;border:1px solid #cdd1ca;border-radius:6px;background:white;cursor:pointer}button:disabled{color:#999}details{margin-top:12px}summary{cursor:pointer}p{line-height:1.8}footer:empty{display:none}@media(max-width:600px){main{padding:10px}nav{gap:10px;font-size:14px}header{font-size:14px;padding:12px}}'''
js='''function reveal(b){let a=b.closest('article'),m=[...a.querySelectorAll('.mask')].find(x=>!x.hidden);if(m)m.hidden=true;if(!a.querySelector('.mask:not([hidden])'))b.disabled=true}function reset(b){let a=b.closest('article');a.querySelectorAll('.mask').forEach(m=>m.hidden=false);a.querySelector('button').disabled=false}'''
options=''.join(f'<option value="s{r["number"]}">{r["number"]:02} {html.escape(r["title"])}</option>' for r in rows)
(O/'전체시안.html').write_text(f'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>엔탈피와 열화학 반응식 전체 31장</title><style>{css}</style><nav><b>전체 31장 · 50분</b><select aria-label="슬라이드 이동" onchange="location.hash=this.value">{options}</select><a href="3-01_엔탈피와열화학반응식_전체31장.pptx">PPTX</a><a href="3-01_엔탈피와열화학반응식_발표대본.docx">발표 대본</a></nav><main><h1>엔탈피와 열화학 반응식</h1><p>대표시안의 글꼴·사진 설명 상자·수식 표기를 적용한 전체 수업안입니다. 13·21·31장의 답은 아래 버튼으로 순서대로 확인하세요.</p>{"".join(cards)}</main><script>{js}</script></html>')
shutil.copy2(B/'script.docx',O/'3-01_엔탈피와열화학반응식_발표대본.docx')
print('31-slide preview and DOCX published')
