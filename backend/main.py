"""
AccidentIQ — Final Integrated Backend
Trained on: Kaggle (folders 1, 2, 3 = Minor, Serious, Fatal)
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn, logging, io, json, os, random, base64, uuid
import numpy as np
from PIL import Image
from sqlalchemy.orm import Session
from passlib.context import CryptContext

import database, models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Globals ───────────────────────────────────────────────────────
_model      = None
MODEL_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')
HISTORY_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'history_images')
os.makedirs(HISTORY_DIR, exist_ok=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# These match the ORDER your model was trained in (folders 1, 2, 3)
CLASSES     = ['Minor', 'Serious', 'Fatal']
IMG_SIZE    = 224

SEVERITY_COLORS = {
    'Minor'  : '#22c55e',
    'Serious': '#f59e0b',
    'Fatal'  : '#ef4444'
}
SEVERITY_DESC = {
    'Minor'  : 'Low impact accident. Minor injuries or vehicle damage only. Standard emergency protocols apply.',
    'Serious': 'Significant accident detected. Injuries likely require medical attention. Dispatch emergency services.',
    'Fatal'  : '⚠️ Critical accident detected. Immediate emergency response required. All services must be mobilized now.'
}

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def find_model_file():
    candidates = [
        os.path.join(MODEL_DIR, 'accident_model.keras'),
        os.path.join(MODEL_DIR, 'accident_image_model.keras'),
        os.path.join(MODEL_DIR, 'best_model.keras'),
        os.path.join(MODEL_DIR, 'accident_model.h5'),
        os.path.join(MODEL_DIR, 'accident_image_model.h5'),
        os.path.join(MODEL_DIR, 'best_model.h5'),
    ]
    for path in candidates:
        if os.path.exists(path): return path
    return None

def load_metadata():
    global CLASSES, IMG_SIZE
    meta_path = os.path.join(MODEL_DIR, 'metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        CLASSES  = meta.get('classes', CLASSES)
        IMG_SIZE = meta.get('img_size', IMG_SIZE)

def load_model():
    global _model
    load_metadata()
    model_path = find_model_file()
    if model_path is None: return
    try:
        import tensorflow as tf
        _model = tf.keras.models.load_model(model_path)
    except Exception as e:
        logger.error(f"Failed to load model: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB
    models.Base.metadata.create_all(bind=database.engine)
    load_model()
    yield

app = FastAPI(
    title    = "AccidentIQ — Severity Prediction API",
    version  = "3.0.0",
    lifespan = lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# Mount static files for images
app.mount("/images", StaticFiles(directory=HISTORY_DIR), name="images")

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, 0)

def generate_gradcam(img_array: np.ndarray) -> str:
    if _model is None: return ""
    try:
        import tensorflow as tf
        import cv2
        last_conv = next((l.name for l in reversed(_model.layers) if hasattr(l, 'filters') or 'conv' in l.name.lower()), None)
        if not last_conv: return ""
        
        grad_model = tf.keras.Model(inputs=_model.inputs, outputs=[_model.get_layer(last_conv).output, _model.output])
        with tf.GradientTape() as tape:
            conv_out, preds = grad_model(img_array)
            loss = preds[:, np.argmax(preds[0])]
        grads = tape.gradient(loss, conv_out)
        pooled = tf.reduce_mean(grads, axis=(0, 1, 2))
        heatmap = tf.reduce_mean(tf.multiply(pooled, conv_out), axis=-1)[0]
        heatmap = np.maximum(heatmap.numpy(), 0)
        heatmap = heatmap / (heatmap.max() + 1e-8)
        heatmap = cv2.resize(heatmap, (IMG_SIZE, IMG_SIZE))
        
        orig = (img_array[0] * 255).astype(np.uint8)
        hm = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(cv2.cvtColor(orig, cv2.COLOR_RGB2BGR), 0.55, hm, 0.45, 0)
        _, buf = cv2.imencode('.png', overlay)
        return base64.b64encode(buf).decode('utf-8')
    except Exception:
        return ""

def demo_predict(img_array: np.ndarray) -> dict:
    img = img_array[0]
    score = 0
    if float(np.mean(img)) < 0.30: score += 2
    if float(np.mean(img)) < 0.45: score += 1
    if float(np.std(img)) > 0.22: score += 1
    
    idx = min(score // 2, 2)
    bases = ([73, 19, 8], [16, 66, 18], [6, 21, 73])[idx]
    probs = [max(1.0, bases[i] + (random.random() - 0.5)*8) for i in range(3)]
    probs = [round(p / sum(probs) * 100, 1) for p in probs]
    return {
        'severity': CLASSES[idx], 'confidence': probs[idx],
        'probabilities': dict(zip(CLASSES, probs)), 'gradcam': '', 'demo_mode': True
    }

# ── API ENDPOINTS ─────────────────────────────────────────────────

@app.post("/auth/register")
def register(name: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(name=name, email=email, hashed_password=get_password_hash(password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Success", "user": {"name": new_user.name, "email": new_user.email, "avatar": "👤"}}

@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {"message": "Success", "user": {"name": user.name, "email": user.email, "avatar": "👤"}}

@app.get("/api/history/{email}")
def get_user_history(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    histories = db.query(models.History).filter(models.History.user_id == user.id).order_by(models.History.id.desc()).all()
    # Return formatted history including full URL to image
    res = []
    for h in histories:
        res.append({
            "id": h.id,
            "timestamp": h.timestamp,
            "severity": h.severity,
            "confidence": h.confidence,
            "image_url": f"http://localhost:8000/images/{h.image_path}" if h.image_path else None
        })
    return {"history": res}

@app.post("/predict")
async def predict(
    image: UploadFile = File(...), 
    email: str = Form(None),
    db: Session = Depends(database.get_db)
):
    if not image.content_type or not image.content_type.startswith('image/'):
        raise HTTPException(400, "Please upload a valid image")
    
    img_bytes = await image.read()
    if len(img_bytes) == 0 or len(img_bytes) > 15 * 1024 * 1024:
        raise HTTPException(400, "Invalid image size")
        
    try:
        img_array = preprocess_image(img_bytes)
    except Exception as e:
        raise HTTPException(400, f"Cannot read image: {e}")

    if _model is not None:
        preds = _model.predict(img_array, verbose=0)[0]
        idx = int(np.argmax(preds))
        probs = {CLASSES[i]: round(float(p)*100, 1) for i, p in enumerate(preds)}
        result = {
            'severity': CLASSES[idx], 'confidence': round(float(preds[idx]) * 100, 1),
            'probabilities': probs, 'gradcam': generate_gradcam(img_array), 'demo_mode': False
        }
    else:
        result = demo_predict(img_array)

    # Save to history if logged in
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            img_filename = f"{uuid.uuid4().hex}.jpg"
            img_path = os.path.join(HISTORY_DIR, img_filename)
            try:
                # Save the image physically
                with open(img_path, "wb") as f:
                    f.write(img_bytes)
                
                # Save purely in DB
                history_record = models.History(
                    user_id=user.id,
                    severity=result['severity'],
                    confidence=result['confidence'],
                    image_path=img_filename
                )
                db.add(history_record)
                db.commit()
            except Exception as e:
                logger.error(f"Failed to save history: {e}")

    return JSONResponse({
        **result,
        'color': SEVERITY_COLORS.get(result['severity'], '#ffffff'),
        'description': SEVERITY_DESC.get(result['severity'], ''),
    })

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)