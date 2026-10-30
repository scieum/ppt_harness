from pathlib import Path
import json,hashlib
W=Path.cwd();U=W/'units/3-01_엔탈피와열화학반응식';B=U/'build/full-v1'
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
rows=json.loads((U/'build/lesson-content.json').read_text());assert sum(r['minutes'] for r in rows)==50
assert [round(x,1) for x in [890.5/16,2877/58,1367/46,285.8/2]]==[55.7,49.6,29.7,142.9]
assert 2*436+498-4*460==-470 and 436+159-2*570==-545
save(U/'checks/local-full31-review.json',{'status':'local artifacts reviewed; Figma incomplete','reviewer':'Codex','slides':31,'minutes':50,'artifacts':{p:h(U/p) for p in ['drafts/deck.pptx','drafts/script.docx']},'visual_review':{'pptx':'31 rendered slides inspected; revised 7,10,21 separately inspected at full resolution','docx':'32 pages rendered with bundled LibreOffice and explicit local Pretendard fontconfig; all page PNGs visually inspected','html':'31 slides; sequential answer reveal and reset verified in isolated headless Chrome'},'science':'Fuel mass conversions and bond energy arithmetic checked; state and quantity conditions retained; native state text 74 runs checked; parentheses upright','native_powerpoint_playback':'not tested; animation OOXML structure checked','slides_review':[{'number':r['number'],'render_sha256':h(B/f'{r["number"]:02}.png'),'source':r['source'],'science':'passed against recorded source and conditions','curriculum':'approved first subsection scope; supplemental calorimetry marked','visual':'passed'} for r in rows],'remaining':['Figma full31 upload and remote verification blocked by Starter plan MCP limit']})
save(U/'checks/figma-blocked.json',{'file_key':'lb4rUG6jqjQOx6VIizMNEs','status':'blocked','operation':'read existing Figma document before upload','tool_response':"You've reached the Figma MCP tool call limit on the Starter plan.",'full31_uploaded':False})
p=U/'state.json';d=json.loads(p.read_text());d['production']='local31 slides and script complete';d['delivery']='local PPTX DOCX HTML available; Figma pending';d['last_user_feedback']='이제 대표시안을 뽑아봤으니 실제로 전부 돌려 볼까?';d['remaining']=['Figma MCP Starter limit; remote full31 mapping not verified'];save(p,d)
(U/'checks/next-step.md').write_text('2026-10-20 전체31장/50분 PPTX,32쪽 대본 DOCX,HTML 미리보기 제작 및 로컬 검수 완료. G05 통과. 체크 기록 local-full31-review.json과 full31-validation.json 참조. Figma Starter MCP 한도로 전체 업로드 및 원격 검증 미완료: 전체 G06/최종화 통과로 표시하지 않음. 다음 작업은 호출 가능 시 기존 파일 lb4rUG6jqjQOx6VIizMNEs 반영과 전체 프레임 검증.\n')
print('Local review and Figma blocker recorded')
