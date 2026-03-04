import ssl
import sys

def enable_unverified_https():
    """ 
    This disables ssl checks, which is sometimes required on windows systems 
    when downloading pre-trained pytorch models! 
    """
    ssl._create_default_https_context = ssl._create_unverified_context
    
enable_unverified_https()

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

app = FastAPI(title="Blood Infection Detection AI API")

# Allow requests from the Node.js/React App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Define the Multi-Modal Neural Network Architecture ---
class InfectionDetectionModel(nn.Module):
    def __init__(self):
        super().__init__()
        # Branch 1: Vision (ResNet18)
        self.cnn = models.resnet18(pretrained=True)
        num_ftrs = self.cnn.fc.in_features
        self.cnn.fc = nn.Linear(num_ftrs, 128)

        # Branch 2: Tabular (Hb Count)
        self.tabular = nn.Sequential(
            nn.Linear(1, 16),
            nn.ReLU(),
            nn.Linear(16, 32)
        )

        # Branch 3: Final Fusion layer
        self.classifier = nn.Sequential(
            nn.Linear(128 + 32, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, image, hb_count):
        img_features = self.cnn(image)
        tab_features = self.tabular(hb_count)
        
        # Merge both branches
        combined = torch.cat((img_features, tab_features), dim=1)
        return self.classifier(combined)

# Initialize the model 
model = InfectionDetectionModel()

# Try to load the trained weights if we ran the training script
import os
WEIGHTS_PATH = "blood_infection_weights.pth"
if os.path.exists(WEIGHTS_PATH):
    # Depending on if it was trained on CPU/GPU, we load it safely to CPU for serving
    model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=torch.device('cpu')))
    print(f"✅ Loaded trained custom AI weights from {WEIGHTS_PATH}!")
else:
    print("⚠️ WARNING: Running UNTRAINED base model. Run train_model.py first!")

model.eval()

# --- 2. Define Image Preprocessing ---
# ResNet models expect images to be scaled to 224x224 and normalized.
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

@app.get("/")
def read_root():
    return {"status": "AI Model Microservice is running!"}

@app.post("/predict-infection")
async def predict_infection(image: UploadFile = File(...), hb_count: float = Form(...)):
    try:
        # Read the uploaded image
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Preprocess the image & add a batch dimension (1, 3, 224, 224)
        input_tensor_image = transform(pil_image).unsqueeze(0)
        
        # Preprocess the Hemoglobin count & add a batch dimension (1, 1)
        input_tensor_hb = torch.tensor([[hb_count]], dtype=torch.float32)

        # Run model inference (turn off gradients to speed it up)
        with torch.no_grad():
            output_prob = model(input_tensor_image, input_tensor_hb)

        # Convert the output probability to a usable format
        probability = output_prob.item()
        
        # Threshold: if the network thinks there's >50% chance, we flag it.
        is_infected = bool(probability > 0.5)

        # Calculate a basic reasoning simulation based on Hb Count rules
        anomalies = []
        if is_infected:
            anomalies.append("Visual anomaly detected in cell morphology.")
        if hb_count < 11.5:
            anomalies.append(f"Low Hemoglobin count ({hb_count} g/dL).")
        elif hb_count > 17.5:
             anomalies.append(f"High Hemoglobin count ({hb_count} g/dL).")

        return {
            "success": True,
            "infectionDetected": is_infected,
            "infectionProbability": round(probability * 100, 2),
            "hbCount": hb_count,
            "anomalies": anomalies,
            "warning": "This response is from an UNTRAINED base model. It is for testing the pipeline only."
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Run the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
