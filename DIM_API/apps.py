from django.apps import AppConfig
from DIM_API.DIM_Model.loadModel import loadModel

class DimApiConfig(AppConfig):
    name = 'DIM_API'

    model, device = loadModel()
