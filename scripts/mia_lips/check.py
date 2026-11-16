import json,cv2,numpy as np,sys
C,out,name=sys.argv[1],sys.argv[2],sys.argv[3]
L=json.load(open(C+'/mia-lips.json')); A=cv2.imread(C+'/mia-mouths.webp',cv2.IMREAD_UNCHANGED)
X0,Y0,W,H=L['box']; U=L['u']; cols=L['cols']; cap=cv2.VideoCapture(f'{C}/mia-{name}.mp4'); fr=[]
while True:
  ok,f=cap.read()
  if not ok: break
  fr.append(f)
yy,xx=np.mgrid[0:H,0:W]; res=[]
picks=[int(x) for x in sys.argv[4].split(',')]; vs=sys.argv[5].split(',')
for fi,v in zip(picks,vs):
  yv=L['yIdle' if name=='idle' else 'yTalk'][fi]; bn=int(np.searchsorted(L['bins'],yv)); j=bn*len(L['visemes'])+L['visemes'].index(v); p=A[(j//cols)*H:(j//cols+1)*H,(j%cols)*W:(j%cols+1)*W].astype(float)
  g=L['gIdle' if name=='idle' else 'gTalk'][fi]
  for ch in range(3): p[...,ch]*=np.exp(g[ch*3]+g[ch*3+1]*(xx/W-.5)+g[ch*3+2]*(yy/H-.5))
  p[...,:3]=np.clip(p[...,:3],0,255)
  nx,ny,a,e=L[name][fi]; k=e/U; c,s=np.cos(a),np.sin(a)
  M=np.array([[c*k,-s*k,0],[s*k,c*k,0]]); M[:,2]=np.array([nx,ny])+M[:,:2]@np.array([X0*U,Y0*U])
  w=cv2.warpAffine(p,M,(720,720),flags=cv2.INTER_LINEAR); al=w[...,3:]/255
  img=fr[fi]*(1-al)+w[...,:3]*al; cx,cy=int(nx),int(ny)
  res.append(cv2.resize(img[max(0,cy-170):cy+190,max(0,cx-150):cx+150].astype(np.uint8),(200,240)))
cv2.imwrite(out,np.hstack(res))
