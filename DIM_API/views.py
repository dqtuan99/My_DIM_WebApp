import os
import base64
import cv2
import math
import numpy as np

from DIM_API.apps import DimApiConfig
from DIM_API.DIM_Model.api import pred_pre_trimap, pred_trimap,extract_foreground, transparent_background_output

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FileUploadParser
from rest_framework.response import Response
from rest_framework.views import APIView

class Test(APIView):    
    def post(self, request, *args, **kwargs):
        return Response(request.data, status=status.HTTP_200_OK)


class BackgroundPredictor(APIView):
    def post(self, request, *args, **kwargs):
        input_image = request.data['input_image'].split(',')[1]
        input_image = self.b64_to_opencv(input_image, cv2.IMREAD_COLOR)
        input_trimap = request.data['input_trimap'].split(',')[1]
        input_trimap = self.b64_to_opencv(input_trimap, cv2.IMREAD_COLOR)
        
        origin_h, origin_w, _ = input_image.shape
        origin_size = (origin_w, origin_h)

        ratio = self.calculate_downscale(input_image, 800, 600)
        resized_w = math.ceil(origin_w/ratio)
        resized_h = math.ceil(origin_h/ratio)
        resized_size = (resized_w, resized_h)

        resized_input_image = cv2.resize(input_image, resized_size, interpolation=cv2.INTER_AREA)
        resized_input_trimap = cv2.resize(input_trimap, resized_size, interpolation=cv2.INTER_AREA)
        
        model = DimApiConfig.model
        device = DimApiConfig.device

        resized_output_trimap, resized_scale = pred_pre_trimap(resized_input_image, resized_input_trimap, model, device)

        scale = cv2.resize(resized_scale, origin_size, interpolation=cv2.INTER_LINEAR)
        extracted_image = extract_foreground(input_image, scale)

        output_trimap = cv2.resize(resized_output_trimap, origin_size, interpolation=cv2.INTER_LINEAR)
        output_image = transparent_background_output(extracted_image, output_trimap)
        
        _, output_image_bytes = cv2.imencode('.png', output_image)
        output_image_bytes = output_image_bytes.tobytes()
        output_image_bytes = base64.b64encode(output_image_bytes)
        output_image_bytes = b'data:image/png;base64,' + output_image_bytes

        return Response(output_image_bytes, status=status.HTTP_200_OK)

    def b64_to_opencv(self, b64_string, imread_mode):
        b64_string += '=' * ((4-len(b64_string) % 4) % 4)
        img = base64.b64decode(b64_string)
        npimg = np.fromstring(img, dtype=np.uint8)
        source = cv2.imdecode(npimg, imread_mode)
        # if imread_mode == cv2.IMREAD_COLOR:
        #     source = cv2.cvtColor(source, cv2.COLOR_BGR2RGB)

        return source
        
    def calculate_downscale(self, img, max_w, max_h):
        origin_h, origin_w, _ = img.shape
        scale_w = 1.0
        scale_h = 1.0
        scaled = False

        if origin_w > max_w:
            scale_w = origin_w / max_w
            scaled = True
        elif origin_h > max_h:
            scale_h = origin_h / max_h
            scaled = True
        
        if scaled:
            if scale_w > scale_h:
                return scale_w
            else:
                return scale_h
        
        return 1.0
