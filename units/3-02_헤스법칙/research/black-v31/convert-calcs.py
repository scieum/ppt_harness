from pathlib import Path
from PIL import Image,ImageOps,ImageChops,ImageDraw
import json,shutil,sys
from importlib.machinery import SourceFileLoader
measure=SourceFileLoader('measure',str(Path(__file__).with_name('measure-glyphs.py'))).load_module().measure
root=Path('units/3-02_헤스법칙/assets/calculation-v31');d=json.loads((root/'generation.json').read_text());res={}
for r in d:
 src=Path(r['path']);n=r['slide'];shutil.copy2(src,root/f'slide-{n}-source.png');im=Image.open(src).convert('RGBA');m=ImageOps.grayscale(im).point(lambda v:max(0,min(255,round((245-v)*255/245))));alpha=ImageChops.multiply(m,im.getchannel('A'));w=Image.new('RGBA',im.size,(255,255,255,0));w.putalpha(alpha);bb=alpha.getbbox();w=w.crop((max(0,bb[0]-12),max(0,bb[1]-12),min(w.width,bb[2]+12),min(w.height,bb[3]+12)));f=root/f'slide-{n}-white.png';w.save(f);res[str(n)]={**r,'file':str(f.resolve()),**measure(f)}
(root/'manifest.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
for offset in range(0,len(res),6):
 m=Image.new('RGB',(1500,900),'#050505');dr=ImageDraw.Draw(m)
 for j,(k,r) in enumerate(list(res.items())[offset:offset+6]):
  im=Image.open(r['file']);im.thumbnail((710,220));x=j%2*750;y=j//2*300;m.paste(im,(x+15,y+45),im);dr.text((x+15,y+10),'Slide '+k,fill='white')
 m.save(root/f'contact-{offset}.jpg')
print(list(res))
