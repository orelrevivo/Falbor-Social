import os
import torch
import base64
from io import BytesIO
from flask import Flask, request, jsonify
from diffusers import AutoPipelineForText2Image

app = Flask(__name__)

# --- MODEL CONFIGURATION ---
MODEL_ID = "stabilityai/sd-turbo"
device = "cuda" if torch.cuda.is_available() else "cpu"
pipe = None

print(f"--- Xb36 AI Image Bridge ---")
print(f"Loading model: {MODEL_ID}")
print(f"Target device: {device}")

try:
    pipe = AutoPipelineForText2Image.from_pretrained(
        MODEL_ID, 
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        variant="fp16" if device == "cuda" else None
    )
    pipe.to(device)
    print("--- Image Model Loaded Successfully ---")
except Exception as e:
    print(f"\n❌ ERROR LOADING IMAGE MODEL: {e}")

@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Private-Network'] = 'true'
        return response

    if pipe is None:
        response = jsonify({"error": "Backend Error: Image model is not loaded."})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 500

    data = request.json
    prompt = data.get('prompt', '')

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    print(f"\n[AI] Generating image for: {prompt[:50]}...")
    
    try:
        # sd-turbo can generate good images in 1-4 steps. We use 1 for max speed.
        image = pipe(prompt=prompt, num_inference_steps=1, guidance_scale=0.0).images[0]
        
        # Convert PIL image to base64
        buffered = BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        response = jsonify({"image_base64": img_str})
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        print(f"Generation error: {e}")
        err_res = jsonify({"error": str(e)})
        err_res.headers['Access-Control-Allow-Origin'] = '*'
        return err_res, 500

if __name__ == "__main__":
    app.run(port=8001)
