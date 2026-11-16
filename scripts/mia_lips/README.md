# Mia lip-sync assets (built free, offline)
Rebuild `app/public/coach/mia-mouths.webp` and `mia-lips.json` from the two actor clips:
1. `python3 -m venv v && v/bin/pip install mediapipe opencv-python-headless numpy` (Linux needs `libegl1 libgles2`)
2. Download `face_landmarker.task` (MediaPipe, Apache 2.0) into a work folder W.
3. `v/bin/python analyze.py W app/public/coach` then `v/bin/python build.py W app/public/coach app/public/coach`
4. Cap light gains (offset ±0.25, gradients ±0.3), then `v/bin/python edges.py W app/public/coach` (hair-edge limits), and check with `check.py ... --edge`.
