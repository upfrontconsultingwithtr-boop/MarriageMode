import sys, json, cv2, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
S=sys.argv[1]; V=sys.argv[2]
opt=vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=S+'/face_landmarker.task'),output_face_blendshapes=True,running_mode=vision.RunningMode.VIDEO,num_faces=1)
lm=vision.FaceLandmarker.create_from_options(opt)
out={}; T=0
for name in ['idle','talk']:
  cap=cv2.VideoCapture(f'{V}/mia-{name}.mp4'); i=0; rows=[]
  while True:
    ok,f=cap.read()
    if not ok: break
    r=lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(f,cv2.COLOR_BGR2RGB)),(T+i)*40)
    if not r.face_landmarks: rows.append(None); i+=1; continue
    p=np.array([[q.x*720,q.y*720] for q in r.face_landmarks[0]])
    bs={b.category_name:round(b.score,3) for b in r.face_blendshapes[0]}
    rows.append({'p':p[[13,14,61,291,33,263,2,152,0,17]].round(1).tolist(),'bs':{k:bs[k] for k in ['jawOpen','mouthFunnel','mouthPucker','mouthSmileLeft','mouthSmileRight','mouthClose','mouthRollLower','mouthRollUpper','mouthStretchLeft','mouthPressLeft','mouthLowerDownLeft','mouthUpperUpLeft']}})
    i+=1
  T+=i+10; out[name]=rows; print(name,len(rows),sum(r is None for r in rows))
json.dump(out,open(S+'/lip/land.json','w'))
