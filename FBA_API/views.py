import base64
import cv2
import numpy as np

from FBA_API.apps import FbaApiConfig
from FBA_API.FBA_Model.api import pred

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

# Create your views here.
class Test(APIView):
    def post(self, request, *args, **kwargs):
        return Response(request.data, status=status.HTTP_200_OK)

class BackgroundPredictor(APIView):
    def post(self, request, *args, **kwargs):
        input_image = request.data['input_image'].split(',')[1]
        input_image = self.b64_to_opencv(input_image, cv2.IMREAD_COLOR)
        input_image = self.read_image(input_image)

        input_trimap = request.data['input_trimap'].split(',')[1]
        input_trimap = self.b64_to_opencv(input_trimap, cv2.IMREAD_COLOR)
        input_trimap = self.read_trimap(input_trimap, request.data['autofill_mode'])

        model = FbaApiConfig.model

        fg, bg, alpha = pred(input_image, input_trimap, model)
        alpha_uint8 = (alpha * 255).astype(np.uint8)

        # fg = fg[:, :, ::-1] * 255
        # bg = bg[:, :, ::-1] * 255

        # fg_bytes = self.opencv_to_b64(fg)
        # bg_bytes = self.opencv_to_b64(fg)

        extracted_img = input_image * alpha[:, :, None]
        extracted_img = extracted_img[:, :, ::-1]
        extracted_img = (extracted_img * 255).astype(np.uint8)
        output_img = self.transparent_background_output(extracted_img, alpha_uint8)
        output_img_bytes = self.opencv_to_b64(output_img)

        # return Response(
        #     {'fg': fg_bytes, 'bg': bg_bytes}, 
        #     status=status.HTTP_200_OK
        # )
        return Response(
            {'fg': output_img_bytes}, 
            status=status.HTTP_200_OK
        )

    def opencv_to_b64(self, img):
        _, img_bytes = cv2.imencode('.png', img)
        img_bytes = img_bytes.tobytes()
        img_bytes = base64.b64encode(img_bytes)
        img_bytes = b'data:image/png;base64,' + img_bytes

        return img_bytes

    def b64_to_opencv(self, b64_string, imread_mode):
        b64_string += '=' * ((4-len(b64_string) % 4) % 4)
        img = base64.b64decode(b64_string)
        npimg = np.fromstring(img, dtype=np.uint8)
        source = cv2.imdecode(npimg, imread_mode)
        # if imread_mode == cv2.IMREAD_COLOR:
        #     source = cv2.cvtColor(source, cv2.COLOR_BGR2RGB)

        return source

    def read_image(self, img):
        # return (cv2.imread(name) / 255.0)[:, :, ::-1]
        return (img / 255.0)[:, :, ::-1]

    def read_trimap(self, pre_trimap, autofill_mode):
        if autofill_mode:
            pre_trimap = cv2.cvtColor(pre_trimap, cv2.COLOR_BGR2GRAY)
            mask = pre_trimap != 0
            cnts = cv2.findContours(pre_trimap, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = cnts[0] if len(cnts) == 2 else cnts[1]
            trimap_im = pre_trimap.copy()
            cv2.fillPoly(trimap_im, cnts, 255)
            trimap_im[mask] = 128
        else:
            trimap_im = cv2.cvtColor(pre_trimap, cv2.COLOR_BGR2HSV)
            green_lowb = (111/2 - 10, 87.9/100*255 - 40, 83.9/100*255 - 40)
            green_highb = (111/2 + 10, 87.9/100*255 + 40, 83.9/100*255 + 40)
            mask = cv2.inRange(trimap_im, green_lowb, green_highb)
            trimap_im = cv2.cvtColor(trimap_im, cv2.COLOR_HSV2BGR)
            trimap_im[mask > 0] = (255, 255, 255)
            trimap_im = cv2.cvtColor(trimap_im, cv2.COLOR_BGR2GRAY)

        trimap_im = trimap_im / 255.0
        h, w = trimap_im.shape
        trimap = np.zeros((h, w, 2))
        trimap[trimap_im == 1, 1] = 1
        trimap[trimap_im == 0, 0] = 1
        return trimap

    def transparent_background_output(self, extracted_img, output_trimap):
        output_trimap_expand = np.expand_dims(output_trimap, 2)
        transparent_out = np.concatenate([extracted_img, output_trimap_expand], axis=2)

        return transparent_out