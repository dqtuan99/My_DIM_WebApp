# -*- coding: utf-8 -*-
"""
Created on Fri Apr 23 15:48:49 2021

@author: Do Quang Tuan
"""

import os
import cv2
import imutils
import numpy as np

import warnings
warnings.filterwarnings("ignore")

# import mrcnn.model as modellib
import FBA_API.trimap_gen2.mrcnn.model as modellib

# from samples.coco import coco
from FBA_API.trimap_gen2.samples.coco import coco

def get_binary_mask(input_img):
    
    class InferenceConfig(coco.CocoConfig):
        # Set batch size to 1 since we'll be running inference on
        # one image at a time. Batch size = GPU_COUNT * IMAGES_PER_GPU
        GPU_COUNT = 1
        IMAGES_PER_GPU = 1
    
    config = InferenceConfig()
    # config.display()
    
    # Create model object in inference mode.
    model = modellib.MaskRCNN(mode="inference", model_dir='mask_rcnn_coco.hy', config=config)
    
    # Load weights trained on MS-COCO
    module_folder = 'trimap_gen2'
    weight_name = 'mask_rcnn_coco.h5'
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    WEIGHT_FOLDER = os.path.join(BASE_DIR, module_folder)    
    WEIGHT_FILE = os.path.join(WEIGHT_FOLDER, weight_name)
    print("=====================================================")
    print(WEIGHT_FILE)
    print("=====================================================")
    model.load_weights(WEIGHT_FILE, by_name=True)
    
    results = model.detect([input_img], verbose=1)
    r = results[0]    
    
    masks = r['masks']
    if masks.size != 0:
        stacked_mask = masks.max(2)
        stacked_mask = ((stacked_mask + 0) * 255).astype(np.uint8)
    
    return stacked_mask