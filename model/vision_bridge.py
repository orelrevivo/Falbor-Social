from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from PIL import Image
import base64
import io

app = FastAPI()

print("Loading Moondream2 Vision Model (vikhyatk/moondream2)...")
# Moondream2 is tiny, we can load it in bfloat16 to save memory
model_id = "vikhyatk/moondream2"

# --- TRANSFORMERS 5.X COMPATIBILITY PATCH ---
# Transformers 5.x renamed _tied_weights_keys to all_tied_weights_keys.
# Moondream's custom code doesn't define it. We patch nn.Module to safely return it.
if not hasattr(torch.nn.Module, "all_tied_weights_keys"):
    setattr(torch.nn.Module, "all_tied_weights_keys", property(lambda self: getattr(self, "_tied_weights_keys", None) or {}))
# --------------------------------------------

tokenizer = AutoTokenizer.from_pretrained(model_id, revision="main")
model = AutoModelForCausalLM.from_pretrained(
    model_id, trust_remote_code=True, revision="main",
    torch_dtype=torch.bfloat16 # Half-precision to save memory!
)
if torch.cuda.is_available():
    model = model.to("cuda")
print("Moondream2 loaded successfully!")

class VisionRequest(BaseModel):
    image_base64: str
    prompt: str

@app.post("/vision")
def analyze_vision(request: VisionRequest):
    try:
        image_data = base64.b64decode(request.image_base64)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Moondream handles its own image encoding
        enc_image = model.encode_image(image)
        description = model.answer_question(enc_image, request.prompt, tokenizer)
        
        return {"description": description}
    except Exception as e:
        print(f"Error analyzing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start on port 8002
    uvicorn.run(app, host="127.0.0.1", port=8002)
