# Generated by Django 5.0.4 on 2024-08-05 23:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('geojson', '0009_linesus_nominalgeneratorcapacityus_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='EconomicData',
            fields=[
                ('index', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('capacity_factor', models.FloatField()),
                ('capital_expenditure', models.FloatField()),
                ('curtailment', models.FloatField()),
                ('dispatch', models.FloatField()),
                ('installed_capacity', models.FloatField()),
                ('market_value', models.FloatField()),
                ('operational_expenditure', models.FloatField()),
                ('optimal_capacity', models.FloatField()),
                ('revenue', models.FloatField()),
                ('supply', models.FloatField()),
                ('withdrawal', models.FloatField()),
                ('scenario', models.CharField(max_length=10)),
            ],
            options={
                'db_table': 'json_statistics_%(scenario)s_US',
                'managed': False,
            },
        ),
    ]
