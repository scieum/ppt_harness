import numpy as np
from PIL import Image

def measure(file):
 a=np.asarray(Image.open(file).convert('RGBA'));m=a[:,:,3]>150
 # alpha-corrected glyphs are white; connected ink components supply cap-height candidates.
 parent=[];b=[]
 def root(k):
  while parent[k]!=k:parent[k]=parent[parent[k]];k=parent[k]
  return k
 prev=[]
 for y,row in enumerate(m):
  edges=np.diff(np.r_[False,row,False].astype(np.int8));starts=np.where(edges==1)[0];ends=np.where(edges==-1)[0];cur=[];j=0
  for x,e in zip(starts,ends):
   while j<len(prev) and prev[j][1]<x:j+=1
   near=[];k=j
   while k<len(prev) and prev[k][0]<=e:near.append(root(prev[k][2]));k+=1
   if near:
    q=near[0]
    for r in set(near[1:]):
     if r!=q:parent[r]=q;b[q]=[min(b[q][0],b[r][0]),min(b[q][1],b[r][1]),max(b[q][2],b[r][2]),max(b[q][3],b[r][3])]
    b[q]=[min(b[q][0],x),min(b[q][1],y),max(b[q][2],e),y+1]
   else:q=len(parent);parent.append(q);b.append([x,y,e,y+1])
   cur.append((x,e,q))
  prev=cur
 boxes=[bb for i,bb in enumerate(b) if root(i)==i and bb[2]-bb[0]>3 and bb[3]-bb[1]>7]
 heights=[q[3]-q[1] for q in boxes if .10<(q[2]-q[0])/(q[3]-q[1])<1.8]
 if not heights:return {'glyph':None}
 # mode of upper character-height cluster avoids dots/subscripts and long bars.
 hi=np.percentile(heights,75);selected=[v for v in heights if .7*hi<=v<=1.25*hi]
 ys,xs=np.where(m)
 return {'glyph':float(np.median(selected)),'ink':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],'size':[m.shape[1],m.shape[0]],'components':len(boxes)}
if __name__=='__main__':
 from pathlib import Path
 import json
 p=Path('units/3-02_헤스법칙/assets/equations-white-v31/manifest.json');d=json.loads(p.read_text())
 for k,v in d.items():v.update(measure(v['file']))
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2));print([(k[:35],v['glyph']) for k,v in d.items()])
