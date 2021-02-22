from django.apps import AppConfig
from FBA_API.FBA_Model.model_loader import load_model

class FbaApiConfig(AppConfig):
    name = 'FBA_API'

    model = load_model()
