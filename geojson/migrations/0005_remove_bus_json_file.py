# Generated by Django 4.2.7 on 2024-02-16 00:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('geojson', '0004_alter_lines_table'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='bus',
            name='json_file',
        ),
    ]
