import cv2
import numpy as np
import torch
from torchvision import transforms

data_transforms = {
    'train': transforms.Compose([
        transforms.ColorJitter(brightness=0.125,
                               contrast=0.125,
                               saturation=0.125),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.225, 0.225]),
    ]),
    'valid': transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.225, 0.225]),
    ]),
}
transformer = data_transforms['valid']

def pred_trimap(img, trimap, model, device):
    with torch.no_grad():
        h, w = img.shape[:2]
        x = torch.zeros((1, 4, h, w), dtype=torch.float)
        image = img
        image = transforms.ToPILImage()(image)
        image = transformer(image)
        x[0:, 0:3, :, :] = image
        x[0:, 3, :, :] = torch.from_numpy(trimap.copy() / 255.)
        x = x.type(torch.FloatTensor).to(device)
        pred = model(x)

        pred_numpy = pred.cpu().numpy()
    pred_numpy_reshape = pred_numpy.reshape((h, w))

    pred_numpy_reshape[trimap==0] = 0.0
    pred_numpy_reshape[trimap==255] = 1.0

    out = (pred_numpy_reshape.copy() * 255).astype(np.uint8)
    
    return out, pred_numpy_reshape

def pred_pre_trimap(img, pre_trimap, model, device):
    # pre_trimap = cv2.cvtColor(pre_trimap, cv2.COLOR_BGR2GRAY)
    # mask = pre_trimap != 0
    # cnts = cv2.findContours(pre_trimap, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    # cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    # trimap = pre_trimap.copy()
    # cv2.fillPoly(trimap, cnts, 255)
    # trimap[mask] = 128
    trimap = cv2.cvtColor(pre_trimap, cv2.COLOR_BGR2HSV)
    green_lowb = (111/2 - 10, 87.9/100*255 - 40, 83.9/100*255 - 40)
    green_highb = (111/2 + 10, 87.9/100*255 + 40, 83.9/100*255 + 40)
    mask = cv2.inRange(trimap, green_lowb, green_highb)
    trimap = cv2.cvtColor(trimap, cv2.COLOR_HSV2BGR)
    trimap[mask > 0] = (255, 255, 255)
    trimap = cv2.cvtColor(trimap, cv2.COLOR_BGR2GRAY)

    return pred_trimap(img, trimap, model, device)

def extract_foreground(img, scale):
    foreground = img * scale[:, :, None]
    
    return foreground.astype(np.uint8)

def transparent_background_output(extracted_img, output_trimap):
    output_trimap_expand = np.expand_dims(output_trimap, 2)
    transparent_out = np.concatenate([extracted_img, output_trimap_expand], axis=2)

    return transparent_out
