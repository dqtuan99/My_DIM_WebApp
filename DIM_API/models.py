from django.db import models
from django.conf import settings

# Create your models here.
class InputImage(models.Model):
    input_image = models.ImageField(blank=False, null=False)
    input_trimap = models.ImageField(blank=False, null=False)

    output_image = models.ImageField(blank=True, null=True)
    output_trimap = models.ImageField(blank=True, null=True)

    def __str__(self):
        return self.input_image.name