from django.urls import path
import DIM_API.views as views

urlpatterns = [
    path('predict-bg/', views.BackgroundPredictor.as_view()),
    path('test/', views.Test.as_view(), name='test'),
]