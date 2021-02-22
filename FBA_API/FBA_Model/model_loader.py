# import argparse
import os

from FBA_API.FBA_Model.networks.models import build_model

module_folder = 'FBA_Model'
weight_name = 'FBA.pth'

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEIGHT_FOLDER = os.path.join(BASE_DIR, module_folder, 'model')
WEIGHT_FILE = os.path.join(WEIGHT_FOLDER, weight_name)

def load_model():
    # parser = argparse.ArgumentParser()
    # # Model related arguments
    # parser.add_argument('--encoder', default='resnet50_GN_WS', help="encoder model")
    # parser.add_argument('--decoder', default='fba_decoder', help="Decoder model")
    # parser.add_argument('--weights', default='FBA.pth')

    # args = parser.parse_args()

    args = {
        'encoder': 'resnet50_GN_WS', 
        'decoder': 'fba_decoder', 
        'weights': WEIGHT_FILE
    }
    
    model = build_model(args)
    model.eval()

    return model