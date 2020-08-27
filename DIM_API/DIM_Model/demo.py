import os
import cv2
import torch

from DIM_API.DIM_Model.api import pred_pre_trimap, extract_foreground
from DIM_API.DIM_Model.models_v16_4 import DIMModel

# checkpoint_name = 'checkpoint_62_0.0495.tar'
checkpoint_name = 'checkpoint.pt'

# if torch.cuda.is_available():
#     device = torch.device('cuda:0')
# else:
#     device = torch.device('cpu')

devices = ['cpu', 'cuda']
device = devices[0]

# Checkpoint folder
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# CHECKPOINT_FOLDER = os.path.join(BASE_DIR, name + '/DeepImageMatting/checkpoint/')
CHECKPOINT_FOLDER = os.path.join(CURRENT_DIR, 'DeepImageMatting', 'checkpoint')
CHECKPOINT_FILE = os.path.join(CHECKPOINT_FOLDER, checkpoint_name)

def loadModel():
    if device == 'cpu':
        checkpoint = torch.load(CHECKPOINT_FILE, map_location=lambda storage, loc: storage)
    else:
        checkpoint = torch.load(CHECKPOINT_FILE)
    
    model = checkpoint['model']
    model = model.module.to(device)
    model.eval()

    return model, device

def execute():
    name = 'vnexpress'

    img = cv2.imread(CURRENT_DIR + '/DeepImageMatting/test_images/' + name + '.jpg') #BGR image
    img = img[...,::-1]
    pre_trimap = cv2.imread(CURRENT_DIR + '/DeepImageMatting/test_images/' + name + '_pre_trimap.png', cv2.IMREAD_GRAYSCALE)

    checkpoint = CHECKPOINT_FILE
    # if device == 'cpu':
    #     checkpoint = torch.load(checkpoint, map_location=lambda storage, loc: storage)
    # else:
    #     checkpoint = torch.load(checkpoint)

    # model = checkpoint['model']
    # model = model.module.to(device)
    # model.eval()

    checkpoint = torch.load(checkpoint)
    model = DIMModel()
    model.load_state_dict(checkpoint)
    model = model.to(device)
    model.eval()

    out, scale = pred_pre_trimap(img, pre_trimap, model, device)

    foreground = extract_foreground(img, scale)

    # cv2.imshow('a', out)
    # cv2.imshow('fg', foreground[:, :, ::-1])
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    cv2.imwrite('vnexpres_out.jpg', out)
    cv2.imwrite('vnexpres_foreground.jpg', foreground[:, :, ::-1])

# if __name__ == '__main__':
#     predictor, divai = loadModel()
#     print(predictor)