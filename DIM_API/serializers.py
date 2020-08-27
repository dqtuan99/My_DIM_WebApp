from rest_framework import serializers
from DIM_API.models import InputImage

class InputImageSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = InputImage
        fields = '__all__'