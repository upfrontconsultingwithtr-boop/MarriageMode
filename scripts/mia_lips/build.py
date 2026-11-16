import json, cv2, numpy as np, sys
S=sys.argv[1]; V=sys.argv[2]; O=sys.argv[3]
d=json.load(open(S+'/lip/land.json'))
U=150; X0,X1,Y0,Y1=-0.62,0.62,0.02,1.12   # patch box in eye-distance units, origin at nose bottom
W,H=int((X1-X0)*U),int((Y1-Y0)*U)
def pose(r):
  p=np.array(r['p']); v=p[5]-p[4]; e=np.hypot(*v); a=np.arctan2(v[1],v[0]); return p[6],e,a,p
def feat(r):
  n,e,a,p=pose(r); b=r['bs']
  return np.array([np.hypot(*(p[1]-p[0]))/e, np.hypot(*(p[3]-p[2]))/e, b['mouthPucker']+b['mouthFunnel'], b['mouthRollLower'], b['mouthClose']+b['mouthPressLeft']])
T=np.array([feat(r) for r in d['talk']]); chin=[(np.array(r['p'])[7]-np.array(r['p'])[6]) for r in d['talk']]
print('nose->chin (eye units)',np.round(np.percentile([np.hypot(*c)/pose(r)[1] for c,r in zip(chin,d['talk'])],[5,50,95]),2))
# Oculus viseme targets: gap, width, round, rollLower, close
tg={'rest':[0,.6,.05,0,.35],'PP':[0,.57,.1,.1,.6],'FF':[.03,.6,.1,.6,.2],'TH':[.08,.62,.1,.1,0],'DD':[.11,.63,.1,0,0],'kk':[.13,.62,.1,0,0],'CH':[.07,.55,.45,0,0],'SS':[.04,.68,.05,0,0],'nn':[.09,.62,.1,0,0],'RR':[.09,.53,.5,0,0],'aa':[.27,.62,.1,0,0],'E':[.16,.68,.05,0,0],'I':[.11,.71,.05,0,0],'O':[.21,.53,.6,0,0],'U':[.06,.48,.9,0,0]}
def yaw(r):
  n,e,a,p=pose(r); m=(p[4]+p[5])/2; v=(p[5]-p[4])/e; return float(np.dot(n-m,v)/e)
Y=np.array([yaw(r) for r in d['talk']]); allY=np.concatenate([Y,[yaw(r) for r in d['idle']]]); cut=np.percentile(Y,[33.3,66.7]); print('yaw cuts',cut.round(3),'idle yaw',np.round(np.mean([yaw(r) for r in d['idle']]),3))
binOf=lambda y:int(np.searchsorted(cut,y)); mids=[np.median(Y[[binOf(y)==b for y in Y]]) for b in range(3)]
sc=np.array([.28,.25,1.0,.8,1.0]); rolls=np.array([pose(r)[2] for r in d['talk']]); idle_roll=np.mean([pose(r)[2] for r in d['idle']])
cap=cv2.VideoCapture(V+'/mia-talk.mp4'); frames=[]
while True:
  ok,f=cap.read()
  if not ok: break
  frames.append(f)
yy,xx=np.mgrid[0:H,0:W]; nx=(xx/U+X0)/((X1-X0)/2); ny=((yy/U+Y0)-(Y0+Y1)/2)/((Y1-Y0)/2)
mask=np.clip((1-np.sqrt(nx**2+ny**2))/0.36,0,1); mask=mask*mask*(3-2*mask)
top=np.clip(((yy/U+Y0)-Y0)/0.14,0,1); mask*=top   # soft join under the nose
cap2=cv2.VideoCapture(V+'/mia-idle.mp4'); ok,ref0=cap2.read()
def canon(img,r):
  n,e,a,p=pose(r); c,s_=np.cos(-a),np.sin(-a); k2=U/e
  M=np.array([[c*k2,-s_*k2,0],[s_*k2,c*k2,0]]); M[:,2]=-M[:,:2]@n+np.array([-X0*U,-Y0*U])
  return cv2.warpAffine(img,M,(W,H),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE).astype(float)
ref=canon(ref0,d['idle'][0]); ring0=(mask>0.05)&(mask<0.9)
skin=lambda im:(im[...,2]>im[...,1]+8)&(im[...,1]>im[...,0]-4)&(im.sum(2)>240)
def fit(a,b):
  m=ring0&skin(a)&skin(b); Gm=np.stack([np.ones(m.sum()),xx[m]/W-.5,yy[m]/H-.5],1)
  return [np.linalg.lstsq(Gm,np.log(a[...,ch][m]+1)-np.log(b[...,ch][m]+1),rcond=None)[0] for ch in range(3)]
ring=ring0
G=np.stack([np.ones(ring.sum()),xx[ring]/W-.5,yy[ring]/H-.5],1); Gall=np.stack([np.ones(W*H),xx.ravel()/W-.5,yy.ravel()/H-.5],1)
used=set(); names=list(tg); cells=[]
for bn in range(3):
 for k in names:
   dist=np.sqrt((((T-np.array(tg[k]))/sc)**2).sum(1))+1.2*np.abs(rolls-idle_roll)+8*np.abs(Y-mids[bn])
   for i in used: dist[max(0,i-2):i+3]+=9
   i=int(np.argmin(dist)); used.add(i)
   n,e,a,p=pose(d['talk'][i]); c,s=np.cos(-a),np.sin(-a); k2=U/e
   M=np.array([[c*k2,-s*k2,0],[s*k2,c*k2,0]]); M[:,2]=-M[:,:2]@n+np.array([-X0*U,-Y0*U])
   patch=canon(frames[i],d['talk'][i])
   for ch,co in enumerate(fit(ref,patch)):
     patch[...,ch]=(patch[...,ch]+1)*np.exp(Gall@co).reshape(H,W)-1
   patch=np.clip(patch,0,255).astype(np.uint8)
   cells.append(np.dstack([patch,(mask*255).astype(np.uint8)])); print(k,i,T[i].round(2))
cols=len(names); rows=(len(cells)+cols-1)//cols; atlas=np.zeros((rows*H,cols*W,4),np.uint8)
for j,cimg in enumerate(cells): atlas[(j//cols)*H:(j//cols+1)*H,(j%cols)*W:(j%cols+1)*W]=cimg
cv2.imwrite(O+'/mia-mouths.webp',atlas,[cv2.IMWRITE_WEBP_QUALITY,92])
def gains(name):
  cp=cv2.VideoCapture(V+f'/mia-{name}.mp4'); out=[]; i=0
  while True:
    ok,f=cp.read()
    if not ok: break
    b=canon(f,d[name][i]); i+=1
    out.append([round(float(c),3) for co in fit(b,ref) for c in co])
  return out
idle=[[round(float(v),2) for v in (pose(r)[0][0],pose(r)[0][1])]+[round(float(pose(r)[2]),4),round(float(pose(r)[1]),2)] for r in d['idle']]
json.dump({'u':U,'box':[X0,Y0,W,H],'cols':cols,'fps':25,'visemes':names,'idle':idle,'talk':[[round(float(v),2) for v in (pose(r)[0][0],pose(r)[0][1])]+[round(float(pose(r)[2]),4),round(float(pose(r)[1]),2)] for r in d['talk']],'bins':[float(c) for c in cut],'yIdle':[round(yaw(r),3) for r in d['idle']],'yTalk':[round(float(y),3) for y in Y],'gIdle':gains('idle'),'gTalk':gains('talk')},open(O+'/mia-lips.json','w'),separators=(',',':'))
