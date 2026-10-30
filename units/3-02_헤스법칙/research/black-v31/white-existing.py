from pathlib import Path
import zipfile,xml.etree.ElementTree as ET,posixpath,json,hashlib
from PIL import Image,ImageOps,ImageChops
import io
u=Path('units/3-02_헤스법칙');out=u/'assets/equations-white-v31';out.mkdir(exist_ok=True)
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
rows={}
with zipfile.ZipFile(u/'drafts/full-v01/build/candidate.pptx') as z:
 for slide in sorted(n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')):
  rel=posixpath.dirname(slide)+'/_rels/'+posixpath.basename(slide)+'.rels';rels={r.get('Id'):r.get('Target') for r in ET.fromstring(z.read(rel))}
  sn=int(posixpath.basename(slide)[5:-4]);layout=json.loads((u/f'drafts/full-v01/build/slide-{sn:02}.layout.json').read_text()); ims=[v for v in layout['elements'] if v['kind']=='image']
  for e in ET.fromstring(z.read(slide)).findall('.//p:pic',ns):
   meta=e.find('p:nvPicPr/p:cNvPr',ns);xf=e.find('p:spPr/a:xfrm',ns);off=xf.find('a:off',ns);ext=xf.find('a:ext',ns);x=int(off.get('x'))/9525;y=int(off.get('y'))/9525
   match=min(ims,key=lambda v:abs(v['position']['left']-x)+abs(v['position']['top']-y));alt=match.get('alt','')
   if not any(k in alt for k in ['반응식','수식 이미지']):continue
   if any(k in alt for k in ['graph','경로','그래프']):continue
   rid=e.find('.//a:blip',ns).get('{'+ns['r']+'}embed');target=rels[rid];member=target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.dirname(slide)+'/'+target);raw=z.read(member)
   h=hashlib.sha256(raw).hexdigest();name=h[:16]+'.png';src=Image.open(io.BytesIO(raw)).convert('RGBA')
   # Authorized color/alpha correction only. Pixel dimensions and glyph outlines unchanged.
   lum=ImageOps.grayscale(src);mask=lum.point(lambda v:max(0,min(255,round((245-v)*255/245))))
   alpha=ImageChops.multiply(mask,src.getchannel('A'))
   white=Image.new('RGBA',src.size,(255,255,255,0));white.putalpha(alpha);white.save(out/name)
   (out/(h[:16]+'-source.png')).write_bytes(raw)
   rows[alt]={'file':str((out/name).resolve()),'source_sha256':h,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest(),'size':list(src.size),'operation':'white RGB; alpha from original dark-ink luminance multiplied by existing alpha; no glyph rendering','origin':'generated' if '생성한' in alt else 'preserved-source'}
(out/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(len(rows),'equation assets converted')
