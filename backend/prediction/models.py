from django.db import models

# Create your models here.
class RawData(models.Model):
    timestamp    = models.DateTimeField()
    gas_level = models.FloatField()
    temperature = models.FloatField()
    pressure = models.FloatField()
    smoke_level = models.FloatField()
    alarm = models.IntegerField()
   
    def __str__(self):
        return f"Reading at {self.timestamp} — Alarm: {self.alarm}"
   
    class Meta:
        db_table = "raw_data"
        ordering = ["-timestamp"]
        