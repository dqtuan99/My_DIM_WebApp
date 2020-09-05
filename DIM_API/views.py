import os
import base64
import cv2
import numpy as np

from DIM_API.apps import DimApiConfig
from DIM_API.serializers import InputImageSerializer
from DIM_API.DIM_Model.api import pred_pre_trimap, pred_trimap, extract_foreground

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FileUploadParser
from rest_framework.response import Response
from rest_framework.views import APIView

# Create your views here.
class BackgroundPredictor(APIView):
    parser_class = (FileUploadParser, )
    
    def post(self, request, *args, **kwargs):
        input_image_serializer = InputImageSerializer(data=request.data)

        if input_image_serializer.is_valid():
            input_image_instance = input_image_serializer.save()
            input_image_path = os.path.join(settings.BASE_DIR + input_image_serializer.data['input_image'])
            input_trimap_path = os.path.join(settings.BASE_DIR + input_image_serializer.data['input_trimap'])

            input_image = cv2.imread(input_image_path)
            input_image = input_image[..., ::-1]
            input_trimap = cv2.imread(input_trimap_path)

            model = DimApiConfig.model
            device = DimApiConfig.device

            output_trimap, scale = pred_pre_trimap(input_image, input_trimap, model, device)
            output_image = extract_foreground(input_image, scale)

            output_image_name = (input_image_instance.input_image.url.split('.')[0] + '_output_image.png').split('/')[2]
            output_trimap_name = (input_image_instance.input_image.url.split('.')[0] + '_output_trimap.png').split('/')[2]
            output_image_path = os.path.join(settings.BASE_DIR + '/media/' + output_image_name)
            output_trimap_path = os.path.join(settings.BASE_DIR + '/media/' + output_trimap_name)

            cv2.imwrite(output_image_path, output_image[..., ::-1])
            cv2.imwrite(output_trimap_path, output_trimap)

            input_image_instance.output_image = output_image_name
            input_image_instance.output_trimap = output_trimap_name
            input_image_instance.save()

            return Response('OK', status=status.HTTP_200_OK)
        else:
            return Response('Failed', status=status.HTTP_400_BAD_REQUEST)


class Test(APIView):
    
    def post(self, request, *args, **kwargs):
        
        return Response(request.data, status=status.HTTP_200_OK)


class BackgroundPredictor2(APIView):

    def post(self, request, *args, **kwargs):
        input_image = request.data['input_image'].split(',')[1]
        input_image = self.b64_to_opencv(input_image, cv2.IMREAD_COLOR)
        input_trimap = request.data['input_trimap'].split(',')[1]
        input_trimap = self.b64_to_opencv(input_trimap, cv2.IMREAD_COLOR)
        
        model = DimApiConfig.model
        device = DimApiConfig.device

        output_trimap, scale = pred_pre_trimap(input_image, input_trimap, model, device)
        output_image = extract_foreground(input_image, scale)

        _, output_image = cv2.imencode('.png', output_image)
        print(_)
        output_image = output_image.tobytes()
        output_image = base64.b64encode(output_image)
        output_image = b'data:image/png;base64,' + output_image

        return Response(output_image, status=status.HTTP_200_OK)

    def b64_to_opencv(self, b64_string, imread_mode):
        b64_string += '=' * ((4-len(b64_string) % 4) % 4)
        img = base64.b64decode(b64_string)
        npimg = np.fromstring(img, dtype=np.uint8)
        source = cv2.imdecode(npimg, imread_mode)
        # if imread_mode == cv2.IMREAD_COLOR:
        #     source = cv2.cvtColor(source, cv2.COLOR_BGR2RGB)

        return source
        


