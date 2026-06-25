import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from flask import Flask, request, jsonify, Response
from threading import Thread

app = Flask(__name__)

# --- MODEL CONFIGURATION ---
MODEL_PATH = "HuggingFaceTB/SmolLM2-360M-Instruct" 

device = "cuda" if torch.cuda.is_available() else "cpu"
tokenizer = None
model = None

print(f"--- Xb36 AI Bridge ---")
print(f"Loading model: {MODEL_PATH}")
print(f"Target device: {device}")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None,
        trust_remote_code=True
    )
    if device == "cpu":
        model = model.to(device)
    print("--- Model Loaded Successfully ---")
except Exception as e:
    print(f"\n❌ ERROR LOADING MODEL: {e}")

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Private-Network'] = 'true'
        return response

    if model is None or tokenizer is None:
        err_res = jsonify({"response": "Backend Error: Model is not loaded."})
        err_res.headers['Access-Control-Allow-Origin'] = '*'
        return err_res, 500

    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])

    print(f"\n[AI] Streaming started for: {message[:50]}...")
    
    default_system_prompt = "You are a helpful programming assistant. IMPORTANT: Always wrap code in markdown blocks with the language name (e.g. ```python or ```html). Always use neat formatting."
    system_prompt = data.get('system_prompt', default_system_prompt)
    
    prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
    for msg in history:
        role = msg['role']
        content = msg['content']
        prompt += f"<|im_start|>{role}\n{content}<|im_end|>\n"
    
    prompt += f"<|im_start|>user\n{message}<|im_end|>\n<|im_start|>assistant\n"

    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)

    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=512,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
        pad_token_id=tokenizer.eos_token_id
    )
    
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()

    def generate():
        for new_text in streamer:
            yield new_text

    response = Response(generate(), mimetype='text/plain')
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

if __name__ == "__main__":
    app.run(port=8000)
