# -*- coding: utf-8 -*-
"""
Created on Tue Apr 13 18:33:01 2021

@author: Do Quang Tuan
"""

import cv2
import numpy as np
from PIL import Image

def get_trimap(input_mask, erosion_iter=3, dilation_iter=3):
    """ Hàm giúp biến đổi binary mask đầu vào thành ảnh trimap

    Tham số đầu vào
    ----------
    input_mask : numpy array
        Là binary mask mà ta cần truyền vào để biến thành trimap
    erosion_iter : int
        Cho biết số vòng lặp của phép toán Erosion
    dilation_iter : int
        Cho biết số vòng lặp của phép toán Dilation

    Kết quả trả về
    -------
    trimap : Bản đồ trimap mà ta cần chuyển đổi từ binary mask
    
    """
    input_mask[input_mask==1] = 255
    
    d_kernel = np.ones((3,3))
    
    # denoising
    input_mask = cv2.morphologyEx(input_mask, cv2.MORPH_OPEN, d_kernel)
    input_mask = cv2.morphologyEx(input_mask, cv2.MORPH_CLOSE, d_kernel)
    
    # generate unknown region around object contour
    erode  = cv2.erode(input_mask, d_kernel, iterations=erosion_iter)
    dilate = cv2.dilate(input_mask, d_kernel, iterations=dilation_iter)    
    unknown1 = cv2.subtract(input_mask, erode)
    unknown2 = cv2.subtract(dilate, input_mask)
    unknowns = cv2.add(unknown1, unknown2)    
    unknowns[unknowns != 0] = 128
    
    # add unknown region to origin binary mask to create trimap
    trimap = cv2.add(erode, unknowns)
    
    return trimap

def beautify_trimap(trimap):
    
    known_region_rgb = (55, 214, 26) # green
    unknown_region_rgb = (128, 128, 128) # gray
    
    r = np.zeros_like(trimap).astype(np.uint8)
    g = np.zeros_like(trimap).astype(np.uint8)
    b = np.zeros_like(trimap).astype(np.uint8)
    
    known_region_idx = trimap == 255
    r[known_region_idx] = known_region_rgb[0]
    g[known_region_idx] = known_region_rgb[1]
    b[known_region_idx] = known_region_rgb[2]
    
    unknown_region_idx = trimap == 128
    r[unknown_region_idx] = unknown_region_rgb[0]
    g[unknown_region_idx] = unknown_region_rgb[1]
    b[unknown_region_idx] = unknown_region_rgb[2]
      
    rgb = np.stack([r, g, b], axis=2)
    
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    bgra = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
    
    black_pixels = np.where(
        (bgra[:, :, 0] == 0) & 
        (bgra[:, :, 1] == 0) & 
        (bgra[:, :, 2] == 0)
    )
    bgra[black_pixels] = [0, 0, 0, 0]
    
    return bgra

    