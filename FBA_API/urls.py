from django.urls import path
import FBA_API.views as views

urlpatterns = [    
    path('get-trimap/', views.TrimapGenerator.as_view()),
    path('get-trimap2/', views.TrimapGenerator2.as_view()),
    path('predict-bg/', views.BackgroundPredictor.as_view()),
    path('test/', views.Test.as_view(), name='test'),
]