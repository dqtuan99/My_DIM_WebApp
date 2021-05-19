# -*- coding: utf-8 -*-
"""
Created on Tue Apr 13 18:01:43 2021

@author: Do Quang Tuan
"""

import torch
from torchvision import models
import torchvision.transforms as T
import cv2
from PIL import Image
import numpy as np
import os


def get_fg_mask(input_img):
    
    os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
    
    model = models.segmentation.deeplabv3_resnet101(pretrained=1).eval()    
    
    trf = T.Compose([T.Resize(320),
                 T.ToTensor(),
                 T.Normalize(mean = [0.485, 0.456, 0.406], 
                                 std = [0.229, 0.224, 0.225])])
    input_img = trf(input_img).unsqueeze(0)
    
    if torch.cuda.is_available():
        model.to('cuda')
        input_img = input_img.to('cuda')
    
    with torch.no_grad():
        output = model(input_img)['out']
    
    mask = torch.argmax(output.squeeze(), dim=0).detach().cpu().numpy()
    
    binary_mask = (mask != 0).astype(np.uint8) * 255
    
    return binary_mask
    