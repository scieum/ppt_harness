from pathlib import Path
import zipfile,xml.etree.ElementTree as ET,json,hashlib,re,posixpath
u=Path('units/3-02_헤스법칙').resolve();b=u/'drafts/full-v01/build';o=u/'drafts/full-v01/output';r=u/'research/black-v31'
sha=lambda x:hashlib.sha256(Path(x).read_bytes()).hexdigest()
ev=lambda x:{'path':str(Path(x).resolve().relative_to(u)), 'sha256':sha(x)}
legacy=json.load(open(u/'assets/equations-white-v31/manifest.json'));calcs=json.load(open(u/'assets/calculation-v31/manifest.json'))
byhash={sha(v['file']):(k,v,False) for k,v in legacy.items()};byhash.update({sha(v['file']):(v['expression'],v,True) for v in calcs.values()})
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
deck=o/'3-02_헤스법칙_전체50장_블랙테마_수식통일_v31.pptx';checks=['coefficients','elements','charges','states','subscripts','direction','enthalpy_sign_values','italic_enthalpy_H','upright_elements_parentheses','italic_states','serif_visual']
# Review evidence is explicitly authored separately, not inferred by this inventory.
rows=[];native=[]
with zipfile.ZipFile(deck) as z:
 for n in range(1,51):
  t=ET.fromstring(z.read(f'ppt/slides/slide{n}.xml'));rels={x.get('Id'):x.get('Target') for x in ET.fromstring(z.read(f'ppt/slides/_rels/slide{n}.xml.rels'))};row={'number':n,'render':ev(o/f'slide-{n:02}.png'),'inventory_review':ev(r/'visual-review.md'),'reviewer':'Codex 2026-10-28','equations':[],'non_equation_images':[],'inline_or_science_labels':[]}
  for pic in t.findall('.//p:pic',ns):
   pid=pic.find('p:nvPicPr/p:cNvPr',ns).get('id');rid=pic.find('.//a:blip',ns).get('{'+ns['r']+'}embed');target=rels[rid];member=target.lstrip('/') if target.startswith('/') else posixpath.normpath('ppt/slides/'+target);h=hashlib.sha256(z.read(member)).hexdigest()
   if h not in byhash:row['non_equation_images'].append({'picture_id':pid,'reason':'Registered branding, scene, photo, layout asset or original scientific diagram; diagram labels are integral to preserved evidence.'});continue
   label,m,new=byhash[h];item={'picture_id':pid,'asset':ev(m['file']),'generation_record':ev(u/('assets/calculation-v31/generation.json' if new else 'assets/equations-white-v31/manifest.json')),'source_comparison':ev(r/'source-comparison.md'),'visual_review':ev(r/'visual-review.md'),'producer':'image_gen' if new or m['origin']=='generated' else 'preserved-source-color-correction','style':'textbook-serif','reviewer':'Codex 2026-10-28','expected_expression':label,'checks':dict.fromkeys(checks,True),'reference_glyph_height_px':m['glyph']}
   if item['producer']=='preserved-source-color-correction':item.update(preserved_source=ev(Path(m['file']).with_stem(Path(m['file']).stem+'-source')),preservation_record=ev(r/'source-comparison.md'),glyphs_unchanged=True)
   row['equations'].append(item)
  for sp in t.findall('.//p:sp',ns):
   text=''.join(x.text or '' for x in sp.findall('.//a:t',ns))
   if re.search(r'Δ|Σ|[=×]|[A-Z][₀-₉]|Q\s*=',text):
    sid=sp.find('p:nvSpPr/p:cNvPr',ns).get('id');row['inline_or_science_labels'].append({'shape_id':sid,'text':text,'role':'inline-explanation','reason':'Concept heading, explanatory sentence or notation label; not a standalone reaction/calculation.'});native.append((n,text))
  rows.append(row)
data={'schema_version':1,'theme':'black','deck':ev(deck),'open_issues':[],'slides':rows};(u/'checks/equations.json').write_text(json.dumps(data,ensure_ascii=False,indent=2));print('equations',sum(len(x['equations']) for x in rows));print(json.dumps(native,ensure_ascii=False,indent=2))
