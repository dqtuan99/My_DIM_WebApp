from django.urls import path
import DIM_API.views as views

urlpatterns = [
    path('predict-bg/', views.BackgroundPredictor.as_view(), name='background-predictor'),
    path('predict-bg2/', views.BackgroundPredictor2.as_view()),
    path('test/', views.Test.as_view(), name='test'),
]