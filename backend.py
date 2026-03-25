from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import torch
import io
import os
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer
    
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    upsampler = RealESRGANer(scale=4, model_path='weights/RealESRGAN_x4plus.pth', model=model, tile=400, tile_pad=10, pre_pad=0, half=True)
    MODEL_LOADED = True
except Exception as e:
    print(f"Model loading failed: {e}")
    MODEL_LOADED = False

@app.post("/api/upscale")
async def upscale(file: UploadFile = File(...)):
    if not MODEL_LOADED:
        return {"error": "Model not loaded"}
    
    img_data = await file.read()
    img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
    
    if img is None:
        return {"error": "Invalid image"}
    
    output, _ = upsampler.enhance(img, outscale=4)
    
    _, buffer = cv2.imencode('.png', output)
    return FileResponse(io.BytesIO(buffer.tobytes()), media_type="image/png")

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": MODEL_LOADED}
