# SPDX-FileCopyrightText: 2024 Bryan Ramirez <bryan.ramirez@openenergytransition.org>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import glob
import zipfile
from sqlalchemy import *
from geo.Geoserver import Geoserver
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import GEOSGeometry
from django.db.models import JSONField
import datetime
import json
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine
from geoserver.catalog import Catalog
from geoalchemy2 import Geometry, WKTElement
from sqlalchemy import text
from sqlalchemy import MetaData
from django.db import models

import logging

from django.contrib.gis.db import models

from environ import Env
env = Env()
env.read_env()

GEOSERVER_URL = env("GEOSERVER_URL")
GEOSERVER_USER = env("GEOSERVER_USER")
GEOSERVER_PASS = env("GEOSERVER_PASS")
DATABASE_URL = env("DATABASE_URL")

DATABASE_HOST = env("DATABASE_HOST")
DATABASE_PORT = env("DATABASE_PORT")
DATABASE_DB = env("DATABASE_NAME")
DATABASE_USER = env("DATABASE_USER")
DATABASE_PASS = env("DATABASE_PASS")

logger = logging.getLogger(__name__)

geo = Catalog(GEOSERVER_URL, username=GEOSERVER_USER, password=GEOSERVER_PASS)
conn_str = DATABASE_URL

class Bus(models.Model):
    name = models.CharField(max_length=100, default="Buses_geojson_data")
    geojson_file = models.FileField(upload_to='geojson_files/', null=True, blank=True)
    uploaded_time = models.DateTimeField(default=datetime.datetime.now)
    geometry = gis_models.GeometryField(srid=4326, db_index=True, null=True, blank=True)

    def __str__(self):
        return self.name

@receiver(post_save, sender=Bus)
def publish_data(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        if instance.geojson_file:
            gdf = gpd.read_file(instance.geojson_file.path)

            if not gdf.empty and 'geometry' in gdf and not gdf['geometry'].is_empty.all():
                engine = create_engine(conn_str, echo=True)
                gdf['geom'] = gdf['geometry'].apply(lambda x: x.wkt)
                gdf.drop('geometry', axis=1, inplace=True)
                table_name = "geojson_" + instance.name
                gdf.to_sql(name=table_name, con=engine, if_exists='replace', index=False,
                           dtype={'geom': Geometry('GEOMETRY', srid=4326)})

                geo.create_featurestore(name=instance.name, workspace='PyPSAEarthDashboard',
                                        db=DATABASE_DB, host=DATABASE_HOST,
                                        port=DATABASE_PORT, pg_user=DATABASE_USER,
                                        pg_password=DATABASE_PASS, schema='public')
                geo.publish_featurestore(workspace='PyPSAEarthDashboard', store_name=instance.name,
                                         pg_table=instance.name)
    except Exception as e:
        logger.error(f"Error processing file: {e}", exc_info=True)

@receiver(post_delete, sender=Bus)
def delete_data(sender, instance, **kwargs):
    engine = create_engine(conn_str)
    try:
        geojson_table_name = f"geojson_{instance.name}"
        sql = text(f"DROP TABLE IF EXISTS public.\"{geojson_table_name}\"")
        with engine.begin() as connection:
            connection.execute(sql)
            logger.info(f"Table '{geojson_table_name}' deleted from the database.")
    except Exception as e:
        logger.error(f"Error deleting table for {geojson_table_name}: {e}")

class JSONBus(models.Model):
    name = models.CharField(max_length=100)
    json_file = models.FileField(upload_to='json_files/', null=True, blank=True)
    uploaded_time = models.DateTimeField(default=datetime.datetime.now)

    def __str__(self):
        return self.name

@receiver(post_save, sender=JSONBus)
def publish_json_data(sender, instance, created, **kwargs):
    if not created or not instance.json_file:
        logger.info("Signal triggered, but no new file was created.")
        return

    try:
        logger.info(f"Processing JSON file for instance '{instance.name}'")
        if not os.path.isfile(instance.json_file.path):
            logger.error(f"File not found at '{instance.json_file.path}'")
            return

        with open(instance.json_file.path, 'r') as file:
            json_data = json.load(file)

        if 'data' in json_data and json_data['data']:
            if 'columns' in json_data:
                json_df = pd.DataFrame(json_data['data'], columns=json_data['columns'])
            else:
                json_df = pd.DataFrame(json_data['data'])

            logger.info(f"DataFrame created for '{instance.name}'")

            engine = create_engine(conn_str, echo=True)
            json_table_name = "json_" + instance.name
            json_df.to_sql(name=json_table_name, con=engine, if_exists='replace', index=False)
            logger.info(f"Data written to SQL table '{json_table_name}'")
        else:
            logger.warning(f"No data to write for '{instance.name}'")

    except Exception as e:
        logger.error(f"Error processing JSON file: {e}", exc_info=True)

@receiver(post_delete, sender=JSONBus)
def delete_json_data(sender, instance, **kwargs):
    engine = create_engine(conn_str)
    try:
        json_table_name = f"json_{instance.name}"
        sql = text(f"DROP TABLE IF EXISTS public.\"{json_table_name}\"")
        with engine.begin() as connection:
            connection.execute(sql)
            logger.info(f"Table '{json_table_name}' deleted from the database.")
    except Exception as e:
        logger.error(f"Error deleting table for {json_table_name}: {e}")

class LinesBase(models.Model):
    Line = models.CharField(max_length=255, primary_key=True)
    bus0 = models.CharField(max_length=255)
    bus1 = models.CharField(max_length=255)
    length = models.FloatField()
    num_parallel = models.FloatField()
    carrier = models.CharField(max_length=255)
    type = models.CharField(max_length=255)
    s_max_pu = models.FloatField()
    s_nom = models.FloatField()
    capital_cost = models.FloatField()
    s_nom_extendable = models.BooleanField()
    s_nom_min = models.FloatField()
    x = models.FloatField()
    r = models.FloatField()
    b = models.FloatField()
    build_year = models.IntegerField(null=True, blank=True)
    x_pu_eff = models.FloatField()
    r_pu_eff = models.FloatField()
    s_nom_opt = models.FloatField()
    v_nom = models.FloatField()
    g = models.FloatField(null=True, blank=True)
    s_nom_max = models.FloatField(null=True, blank=True)
    lifetime = models.FloatField(null=True, blank=True)
    terrain_factor = models.FloatField(null=True, blank=True)
    v_ang_min = models.FloatField(null=True, blank=True)
    v_ang_max = models.FloatField(null=True, blank=True)
    sub_network = models.CharField(max_length=255, null=True, blank=True)
    x_pu = models.FloatField(null=True, blank=True)
    r_pu = models.FloatField(null=True, blank=True)
    g_pu = models.FloatField(null=True, blank=True)
    b_pu = models.FloatField(null=True, blank=True)
    line_geom = gis_models.GeometryField(db_index=True, null=True, blank=True)

    class Meta:
        abstract = True

class Lines(LinesBase):
    class Meta:
        managed = False
        db_table = 'network_lines_view'

class LinesCo(LinesBase):
    class Meta:
        managed = False
        db_table = 'network_lines_view_co'
        
class LinesUS(models.Model):
    Line = models.CharField(max_length=255, primary_key=True)
    bus0 = models.CharField(max_length=255)
    bus1 = models.CharField(max_length=255)
    num_parallel = models.FloatField()
    length = models.FloatField()
    carrier = models.CharField(max_length=255)
    type = models.CharField(max_length=255)
    s_max_pu = models.FloatField()
    s_nom = models.FloatField()
    capital_cost = models.FloatField()
    s_nom_extendable = models.BooleanField()
    s_nom_min = models.FloatField()
    x = models.FloatField()
    r = models.FloatField()
    g = models.FloatField()
    b = models.FloatField()
    s_nom_max = models.FloatField()
    build_year = models.IntegerField()
    lifetime = models.FloatField()
    terrain_factor = models.FloatField()
    v_ang_min = models.FloatField()
    v_ang_max = models.FloatField()
    sub_network = models.CharField(max_length=255)
    x_pu = models.FloatField()
    r_pu = models.FloatField()
    g_pu = models.FloatField()
    b_pu = models.FloatField()
    x_pu_eff = models.FloatField()
    r_pu_eff = models.FloatField()
    s_nom_opt = models.FloatField()
    geom = models.GeometryField(srid=4326)

    class Meta:
        managed = False
        db_table = 'geojson_network_lines_view_US'

class NominalGeneratorCapacityBase(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    Bus = models.CharField(max_length=255)
    v_nom = models.FloatField()
    country = models.CharField(max_length=255)
    x = models.FloatField()
    y = models.FloatField()
    control = models.CharField(max_length=255)
    generator = models.CharField(max_length=255)
    type = models.CharField(max_length=255, null=True, blank=True)
    unit = models.CharField(max_length=255, null=True, blank=True)
    v_mag_pu_set = models.FloatField()
    v_mag_pu_min = models.FloatField()
    sub_network = models.CharField(max_length=255, null=True, blank=True)
    geom = gis_models.GeometryField(db_index=True)
    carrier = models.CharField(max_length=255)
    p_nom = models.FloatField()

    class Meta:
        abstract = True

class NominalGeneratorCapacity(NominalGeneratorCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_nominal_generator_capacity_with_geom'

class NominalGeneratorCapacityCo(NominalGeneratorCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_nominal_generator_capacity_with_geom_co'
        
class NominalGeneratorCapacityUS(NominalGeneratorCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_nominal_generator_capacity_with_geom_us'

class OptimalGeneratorCapacityBase(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    Bus = models.CharField(max_length=255)
    v_nom = models.FloatField()
    country = models.CharField(max_length=255)
    x = models.FloatField()
    y = models.FloatField()
    control = models.CharField(max_length=255)
    generator = models.CharField(max_length=255)
    type = models.CharField(max_length=255, null=True, blank=True)
    unit = models.CharField(max_length=255, null=True, blank=True)
    v_mag_pu_set = models.FloatField()
    v_mag_pu_min = models.FloatField()
    sub_network = models.CharField(max_length=255, null=True, blank=True)
    geom = gis_models.GeometryField(db_index=True)
    carrier = models.CharField(max_length=255)
    p_nom_opt = models.FloatField()

    class Meta:
        abstract = True

class OptimalGeneratorCapacity(OptimalGeneratorCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_optimal_generator_capacity_with_geom'

class OptimalGeneratorCapacityCo(OptimalGeneratorCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_optimal_generator_capacity_with_geom_co'
        
class OptimalGeneratorCapacityUS(OptimalGeneratorCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_optimal_generator_capacity_with_geom_us'

class NominalStorageCapacityBase(models.Model):
    Bus = models.CharField(max_length=255, primary_key=True)
    geom = gis_models.GeometryField(db_index=True)
    carrier = models.CharField(max_length=255)
    p_nom = models.FloatField()

    class Meta:
        abstract = True

class NominalStorageCapacity(NominalStorageCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_nominal_storage_unit_capacity_with_geom'

class NominalStorageCapacityCo(NominalStorageCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_nominal_storage_unit_capacity_with_geom_co'
        
class NominalStorageCapacityUS(NominalStorageCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_nominal_storage_unit_capacity_with_geom_us'
    
    @classmethod
    def is_available(cls):
        return False

class OptimalStorageCapacityBase(models.Model):
    Bus = models.CharField(max_length=255, primary_key=True)
    geom = gis_models.GeometryField(db_index=True)
    carrier = models.CharField(max_length=255)
    p_nom_opt = models.FloatField()

    class Meta:
        abstract = True

class OptimalStorageCapacity(OptimalStorageCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_optimal_storage_unit_capacity_with_geom'

class OptimalStorageCapacityCo(OptimalStorageCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_optimal_storage_unit_capacity_with_geom_co'
        
class OptimalStorageCapacityUS(OptimalStorageCapacityBase):
    class Meta:
        managed = False
        db_table = 'view_optimal_storage_unit_capacity_with_geom_us'
    
    @classmethod
    def is_available(cls):
        return False

class CombinedGeneratorData(models.Model):
    name = models.CharField(max_length=255)
    x = models.FloatField()
    y = models.FloatField()
    country = models.CharField(max_length=255)
    geographic_name = models.CharField(max_length=255)
    geom = models.GeometryField()
    p_nom_max = models.FloatField()
    weight = models.FloatField()
    p_nom = models.FloatField()
    capital_cost = models.FloatField()
    efficiency = models.FloatField()
    p_nom_min = models.FloatField()
    marginal_cost = models.FloatField()
    bus = models.CharField(max_length=255)
    p_nom_extendable = models.BooleanField()
    carrier = models.CharField(max_length=255)
    control = models.CharField(max_length=255)
    p_nom_opt = models.FloatField()
    sign = models.IntegerField()
    build_year = models.IntegerField()
    min_up_time = models.IntegerField()
    min_down_time = models.IntegerField()
    up_time_before = models.IntegerField()
    down_time_before = models.IntegerField()
    type = models.CharField(max_length=255)
    p_min_pu = models.FloatField()
    p_max_pu = models.FloatField()
    p_set = models.FloatField()
    q_set = models.FloatField()
    marginal_cost_quadratic = models.FloatField()
    lifetime = models.FloatField()
    committable = models.BooleanField()
    start_up_cost = models.FloatField()
    shut_down_cost = models.FloatField()
    ramp_limit_up = models.FloatField()
    ramp_limit_down = models.FloatField()
    ramp_limit_start_up = models.FloatField()
    ramp_limit_shut_down = models.FloatField()
    cf = models.FloatField()
    crt = models.FloatField()
    usdpt = models.FloatField()

    class Meta:
        managed = False
        db_table = 'combined_generator_data_co'
        
class EconomicData(models.Model):
    index = models.CharField(max_length=100, primary_key=True)
    capacity_factor = models.FloatField()
    capital_expenditure = models.FloatField()
    curtailment = models.FloatField()
    dispatch = models.FloatField()
    installed_capacity = models.FloatField()
    market_value = models.FloatField()
    operational_expenditure = models.FloatField()
    optimal_capacity = models.FloatField()
    revenue = models.FloatField()
    supply = models.FloatField()
    withdrawal = models.FloatField()
    scenario = models.CharField(max_length=10) 

    class Meta:
        managed = False
        db_table = 'json_statistics_%(scenario)s_US'

    def __str__(self):
        return f"{self.index} - {self.scenario}"