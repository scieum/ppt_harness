from pathlib import Path
import zipfile,xml.etree.ElementTree as E,json,re
U=Path(__file__).resolve().parents[1];B=U/'build/full-v2';A='http://schemas.openxmlformats.org/drawingml/2006/main';P='http://schemas.openxmlformats.org/presentationml/2006/main';NS={'a':A,'p':P};E.register_namespace('a',A);E.register_namespace('p',P)
def sub(p,t,**kw):return E.SubElement(p,'{'+P+'}'+t,{k:str(v)for k,v in kw.items()})
with zipfile.ZipFile(B/'candidate.pptx')as z:entries={n:z.read(n)for n in z.namelist()}
reveals={};state_count=0;enthalpy_count=0
for i in range(1,40):
 name=f'ppt/slides/slide{i}.xml';root=E.fromstring(entries[name]);answer=[]
 for sp in root.findall('.//p:sp',NS):
  nv=sp.find('p:nvSpPr/p:cNvPr',NS)
  if nv is not None and nv.get('name','').startswith('answer-'):answer.append((nv.get('name'),nv.get('id')))
 for tag in ['rPr','defRPr','endParaRPr']:
  for el in root.findall('.//a:'+tag,NS):
   latin=el.find('a:latin',NS);family=latin.get('typeface','Pretendard')if latin is not None else'Pretendard'
   for script in ['latin','ea','cs']:
    f=el.find('a:'+script,NS)
    if f is None:f=E.SubElement(el,'{'+A+'}'+script)
    f.set('typeface',family)
 for p in root.findall('.//a:p',NS):
  chars=[]
  for r in p.findall('a:r',NS):
   t=r.find('a:t',NS);pr=r.find('a:rPr',NS);chars.extend((c,pr is not None and pr.get('i')=='1')for c in (t.text or '')if t is not None)
  text=''.join(c for c,it in chars)
  for m in re.finditer('ΔH',text):
   assert chars[m.start()+1][1],(i,text,'enthalpy H not italic')
   enthalpy_count+=1
  for m in re.finditer(r'\((s|l|g|aq)\)',text):
   assert not chars[m.start()][1]and not chars[m.end()-1][1],(i,text,'italic parentheses')
   assert all(it for c,it in chars[m.start()+1:m.end()-1]),(i,text,'state not italic')
   state_count+=1
 if answer:
  answer.sort();old=root.find('p:timing',NS)
  if old is not None:root.remove(old)
  timing=sub(root,'timing');tn=sub(timing,'tnLst');par=sub(tn,'par');ct=sub(par,'cTn',id=1,dur='indefinite',restart='never',nodeType='tmRoot');ch=sub(ct,'childTnLst');seq=sub(ch,'seq',concurrent=1,nextAc='seek');main=sub(seq,'cTn',id=2,dur='indefinite',nodeType='mainSeq');children=sub(main,'childTnLst')
  for j,(an,spid)in enumerate(answer):
   k=3+j*4;pa=sub(children,'par');c=sub(pa,'cTn',id=k,fill='hold');sub(sub(c,'stCondLst'),'cond',delay='indefinite');pa2=sub(sub(c,'childTnLst'),'par');c2=sub(pa2,'cTn',id=k+1,fill='hold');sub(sub(c2,'stCondLst'),'cond',delay=0);pa3=sub(sub(c2,'childTnLst'),'par');c3=sub(pa3,'cTn',id=k+2,presetID=1,presetClass='entr',presetSubtype=0,fill='hold',nodeType='clickEffect');sub(sub(c3,'stCondLst'),'cond',delay=0);se=sub(sub(c3,'childTnLst'),'set');bh=sub(se,'cBhvr');c4=sub(bh,'cTn',id=k+3,dur=1,fill='hold');sub(sub(c4,'stCondLst'),'cond',delay=0);sub(sub(bh,'tgtEl'),'spTgt',spid=spid);sub(sub(bh,'attrNameLst'),'attrName').text='style.visibility';sub(sub(se,'to'),'strVal',val='visible')
  for t,event in [('prevCondLst','onPrev'),('nextCondLst','onNext')]:
   cond=sub(sub(seq,t),'cond',evt=event,delay=0);sub(sub(cond,'tgtEl'),'sldTgt')
  bl=sub(timing,'bldLst')
  for an,spid in answer:sub(bl,'bldP',spid=spid,grpId=0)
  reveals[i]=[an for an,spid in answer]
 entries[name]=E.tostring(root,encoding='utf-8',xml_declaration=True)
with zipfile.ZipFile(B/'candidate-final.pptx','w',zipfile.ZIP_DEFLATED)as z:
 for n,b in entries.items():z.writestr(n,b)
(B/'package-checks.json').write_text(json.dumps({'native_enthalpy_H_checked':enthalpy_count,'native_state_runs_checked':state_count,'chemical_parentheses_upright':True,'answer_reveals':reveals,'animation_validation':'OOXML structure checked; native PowerPoint playback not tested'},indent=2))
print('Checked',state_count,'state labels;',reveals)
