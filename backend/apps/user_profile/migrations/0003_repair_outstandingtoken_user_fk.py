from django.db import migrations


def repair_sql_server_outstanding_token_fk(apps, schema_editor):
    if schema_editor.connection.vendor != "mssql":
        return

    outstanding_table = "token_blacklist_outstandingtoken"
    user_table = "user_profile"
    user_column = "user_id"
    referenced_pk = "id"
    constraint_name = "token_blacklist_outstandingtoken_user_id_fk_user_profile_id"
    quote_name = schema_editor.quote_name

    with schema_editor.connection.cursor() as cursor:
        existing_tables = set(schema_editor.connection.introspection.table_names(cursor))
        if outstanding_table not in existing_tables or user_table not in existing_tables:
            return

        cursor.execute(
            """
            SELECT fk.name, referenced_table.name
            FROM sys.foreign_keys AS fk
            INNER JOIN sys.foreign_key_columns AS fkc
                ON fk.object_id = fkc.constraint_object_id
            INNER JOIN sys.tables AS parent_table
                ON fk.parent_object_id = parent_table.object_id
            INNER JOIN sys.columns AS parent_column
                ON fkc.parent_object_id = parent_column.object_id
                AND fkc.parent_column_id = parent_column.column_id
            INNER JOIN sys.tables AS referenced_table
                ON fk.referenced_object_id = referenced_table.object_id
            WHERE parent_table.name = %s
              AND parent_column.name = %s
            """,
            [outstanding_table, user_column],
        )
        foreign_keys = list(cursor.fetchall())

        if any(referenced_table == user_table for _, referenced_table in foreign_keys):
            return

        for foreign_key_name, _ in foreign_keys:
            cursor.execute(
                f"ALTER TABLE {quote_name(outstanding_table)} DROP CONSTRAINT {quote_name(foreign_key_name)}"
            )

        cursor.execute(
            f"""
            UPDATE {quote_name(outstanding_table)}
            SET {quote_name(user_column)} = NULL
            WHERE {quote_name(user_column)} IS NOT NULL
              AND {quote_name(user_column)} NOT IN (
                  SELECT {quote_name(referenced_pk)} FROM {quote_name(user_table)}
              )
            """
        )

        cursor.execute(
            f"""
            ALTER TABLE {quote_name(outstanding_table)}
            ADD CONSTRAINT {quote_name(constraint_name)}
            FOREIGN KEY ({quote_name(user_column)})
            REFERENCES {quote_name(user_table)} ({quote_name(referenced_pk)})
            ON DELETE SET NULL
            """
        )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("token_blacklist", "0013_alter_blacklistedtoken_options_and_more"),
        ("user_profile", "0002_alter_userprofile_managers"),
    ]

    operations = [
        migrations.RunPython(repair_sql_server_outstanding_token_fk, noop_reverse),
    ]
