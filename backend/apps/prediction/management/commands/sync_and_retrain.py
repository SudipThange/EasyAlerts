import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.history.models import History
from apps.prediction.ml.train import train_pipeline
from apps.prediction.models import RawData


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Sync new user_history records into RawData and retrain the model."

    @staticmethod
    def _normalize_alarm(history):
        label = (history.prediction_label or "").strip().lower()

        if label == "hazard":
            return 1
        if label == "safe":
            return 0

        raise ValueError(
            f"user_history id={history.id} has unsupported prediction_label="
            f"{history.prediction_label!r}"
        )

    @staticmethod
    def _build_key(timestamp, gas_level, temperature, pressure, smoke_level, alarm):
        return (
            timestamp,
            float(gas_level),
            float(temperature),
            float(pressure),
            float(smoke_level),
            int(alarm),
        )

    def handle(self, *args, **options):
        logger.info("sync_and_retrain command started")

        try:
            logger.info("Step 1: reading records from user_history")
            histories = History.objects.order_by("id").only(
                "id",
                "timestamp",
                "gas_level",
                "temperature",
                "pressure",
                "smoke_level",
                "prediction_label",
            )
            total_history_rows = histories.count()
            logger.info("Step 1 complete: loaded %s rows from user_history", total_history_rows)
        except Exception:
            logger.exception("Step 1 failed: could not read from user_history")
            self.stderr.write(
                self.style.ERROR("Sync failed before retraining. Check logs for details.")
            )
            return

        try:
            logger.info("Step 2: checking for rows not already present in RawData")
            existing_raw_keys = {
                self._build_key(
                    timestamp,
                    gas_level,
                    temperature,
                    pressure,
                    smoke_level,
                    alarm,
                )
                for timestamp, gas_level, temperature, pressure, smoke_level, alarm in (
                    RawData.objects.values_list(
                        "timestamp",
                        "gas_level",
                        "temperature",
                        "pressure",
                        "smoke_level",
                        "alarm",
                    ).iterator(chunk_size=1000)
                )
            }

            new_records = []
            for history in histories.iterator(chunk_size=1000):
                alarm = self._normalize_alarm(history)
                row_key = self._build_key(
                    history.timestamp,
                    history.gas_level,
                    history.temperature,
                    history.pressure,
                    history.smoke_level,
                    alarm,
                )

                if row_key in existing_raw_keys:
                    continue

                existing_raw_keys.add(row_key)
                new_records.append(
                    RawData(
                        timestamp=history.timestamp,
                        gas_level=history.gas_level,
                        temperature=history.temperature,
                        pressure=history.pressure,
                        smoke_level=history.smoke_level,
                        alarm=alarm,
                    )
                )

            logger.info(
                "Step 2 complete: identified %s new rows to insert into RawData",
                len(new_records),
            )
        except Exception:
            logger.exception("Step 2 failed: could not prepare new RawData rows")
            self.stderr.write(
                self.style.ERROR("Sync failed before retraining. Check logs for details.")
            )
            return

        if not new_records:
            logger.info("Step 7: No new data")
            self.stdout.write(self.style.SUCCESS("No new data"))
            return

        try:
            logger.info("Step 3: inserting %s new rows into RawData", len(new_records))
            with transaction.atomic():
                RawData.objects.bulk_create(new_records, batch_size=1000)

            logger.info("Step 4: inserted %s new rows into RawData", len(new_records))
            self.stdout.write(
                self.style.SUCCESS(f"Inserted {len(new_records)} new rows into RawData.")
            )
        except Exception:
            logger.exception("Step 3 failed: sync to RawData did not complete")
            self.stderr.write(
                self.style.ERROR("Sync failed before retraining. Check logs for details.")
            )
            return

        logger.info("Step 5: starting train_pipeline()")
        try:
            training_result = train_pipeline()
        except Exception:
            logger.exception("Step 5 failed: retraining raised an error")
            self.stderr.write(
                self.style.WARNING("New rows synced, but retraining failed. Check logs for details.")
            )
            return

        logger.info("Step 6: retraining completed successfully: %s", training_result)
        self.stdout.write(self.style.SUCCESS("Retraining completed successfully."))
