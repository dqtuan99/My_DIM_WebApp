import os
import cv2
import torch
import torch.nn

from DIM_API.DIM_Model.api import pred_pre_trimap, extract_foreground
from DIM_API.DIM_Model.models import DIMModel
from DIM_API.DIM_Model.config import device

checkpoint_name = 'checkpoint.pt'

module_folder = 'DIM_Model'

# Checkpoint folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_FOLDER = os.path.join(BASE_DIR, module_folder, 'checkpoint')
CHECKPOINT_FILE = os.path.join(CHECKPOINT_FOLDER, checkpoint_name)

def loadModel():
    checkpoint = CHECKPOINT_FILE
    checkpoint = torch.load(checkpoint, map_location=device)
    model = DIMModel()
    model.load_state_dict(checkpoint)
    model = model.to(device)
    model.eval()

    return model, device