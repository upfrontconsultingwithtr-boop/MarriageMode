import json,cv2,numpy as np,sys
S,C=sys.argv[1],sys.argv[2]; d=json.load(open(S+'/lip/land.json')); L=json.load(open(C+'/mia-lips.json'))
X0,Y0,W,H=L['box']; U=L['u']
def pose(r): p=np.array(r['p']); v=p[5]-p[4]; return p[6],np.hypot(*v),np.arctan2(v[1],v[0])
skin=lambda im:(im[...,2]>im[...,1]+8)&(im[...,1]>im[...,0]-4)&(im.sum(2)>240)
band=slice(int((0.25-Y0)*U),int((0.95-Y0)*U))
for name,key in (('idle','eIdle'),('talk','eTalk')):
  cap=cv2.VideoCapture(f'{C}/mia-{name}.mp4'); out=[]; i=0
  while True:
    ok,f=cap.read()
    if not ok: break
    n,e,a=pose(d[name][i]); i+=1; c,s=np.cos(-a),np.sin(-a); k=U/e
    M=np.array([[c*k,-s*k,0],[s*k,c*k,0]]); M[:,2]=-M[:,:2]@n+np.array([-X0*U,-Y0*U])
    b=cv2.warpAffine(f,M,(W,H),borderMode=cv2.BORDER_REPLICATE).astype(int)
    col=skin(b)[band].mean(0); cx=int(-X0*U); o=int(0.38*U)
    r=next((x for x in range(cx+o,W) if col[x]<0.75),W); l=next((x for x in range(cx-o,-1,-1) if col[x]<0.75),-1)
    out.append([round((l+1)/U+X0,3),round(r/U+X0,3)])
  L[key]=out; a=np.array(out); print(name,'left',a[:,0].min(),a[:,0].max(),'right',a[:,1].min(),a[:,1].max())
json.dump(L,open(C+'/mia-lips.json','w'),separators=(',',':'))
