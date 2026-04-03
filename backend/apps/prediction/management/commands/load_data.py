import os

import pandas as pd
from django.core.management.base import BaseCommand

from apps.prediction.models import RawData

class Command(BaseCommand):
    help = "Load raw_data.csv into the database"

    def handle(self, *args, **kwargs):
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        csv_path = os.path.join(base_dir, "resources", "data", "raw_data.csv")

        self.stdout.write(f"📂 Reading CSV from: {csv_path}")

        df = pd.read_csv(csv_path)

        self.stdout.write(f"📊 Total rows found: {len(df)}")

        RawData.objects.all().delete()
        self.stdout.write("🗑️  Cleared existing data")

        records = []
        for _, row in df.iterrows():
            records.append(RawData(
                timestamp   = row["timestamp"],
                gas_level   = row["gas_level"],
                temperature = row["temperature"],
                pressure    = row["pressure"],
                smoke_level = row["smoke_level"],
                alarm       = int(row["alarm"]),
            ))

        RawData.objects.bulk_create(records)

        self.stdout.write(self.style.SUCCESS(f"✅ Successfully loaded {len(records)} rows into DB!"))
