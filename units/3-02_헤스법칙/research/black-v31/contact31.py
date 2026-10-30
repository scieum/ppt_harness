from PIL import Image,ImageDraw
from pathlib import Path
r=Path('units/3-02_헤스법칙/drafts/full-v01/output');o=Path('units/3-02_헤스법칙/research/black-v31');o.mkdir(exist_ok=True)
for start in range(1,51,10):
 c=Image.new('RGB',(960,5*294),(60,60,60));d=ImageDraw.Draw(c)
 for j,n in enumerate(range(start,min(start+10,51))):
  im=Image.open(r/f'slide-{n:02}.png').convert('RGB');im.thumbnail((480,270));x=j%2*480;y=j//2*294;c.paste(im,(x,y));d.text((x+5,y+271),str(n),fill='white')
 c.save(o/f'contact-{start}.jpg')
