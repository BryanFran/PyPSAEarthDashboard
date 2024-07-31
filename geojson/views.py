# SPDX-FileCopyrightText: 2024 Bryan Ramirez
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
import logging

logger = logging.getLogger(__name__)

from .models import (
    NominalGeneratorCapacity, NominalGeneratorCapacityCo, NominalGeneratorCapacityUS,
    OptimalGeneratorCapacity, OptimalGeneratorCapacityCo, OptimalGeneratorCapacityUS,
    NominalStorageCapacity, NominalStorageCapacityCo, NominalStorageCapacityUS,
    OptimalStorageCapacity, OptimalStorageCapacityCo, OptimalStorageCapacityUS,
    Lines, LinesCo, LinesUS
)

def index(request):
    context = {
        'GEOSERVER_URL': settings.GEOSERVER_URL,
        'GEOSERVER_WORKSPACE': 'PyPSAEarthDashboard',  
    }
    return render(request, 'index.html', context)

@csrf_exempt
def nominal_generator_capacity_json(request, country):
    if country.lower() == 'nigeria':
        data = list(NominalGeneratorCapacity.objects.all().values())
    elif country.lower() == 'colombia':
        data = list(NominalGeneratorCapacityCo.objects.all().values())
    elif country.lower() == 'united states':
        data = list(NominalGeneratorCapacityUS.objects.all().values())
    else:
        return JsonResponse({"error": "Country not supported"}, status=400)
    
    for item in data:
        item['geom'] = item['geom'].coords  # Convert Point to tuple

    return JsonResponse(data, safe=False)

@csrf_exempt
def optimal_generator_capacity_json(request, country):
    if country.lower() == 'nigeria':
        data = list(OptimalGeneratorCapacity.objects.all().values())
    elif country.lower() == 'colombia':
        data = list(OptimalGeneratorCapacityCo.objects.all().values())
    elif country.lower() == 'united states':
        data = list(OptimalGeneratorCapacityUS.objects.all().values())
    else:
        return JsonResponse({"error": "Country not supported"}, status=400)
    
    for item in data:
        item['geom'] = item['geom'].coords  

    return JsonResponse(data, safe=False)

@csrf_exempt
def nominal_storage_capacity_json(request, country):
    if country.lower() == 'nigeria':
        data = list(NominalStorageCapacity.objects.all().values())
    elif country.lower() == 'colombia':
        data = list(NominalStorageCapacityCo.objects.all().values())
    elif country.lower() == 'united states':
        # data = list(NominalStorageCapacityUS.objects.all().values())
        return JsonResponse({"message": "Storage data not available for United States"}, status=204)
    else:
        return JsonResponse({"error": "Country not supported"}, status=400)
    
    for item in data:
        item['geom'] = item['geom'].coords

    return JsonResponse(data, safe=False)

@csrf_exempt
def optimal_storage_capacity_json(request, country):
    if country.lower() == 'nigeria':
        data = list(OptimalStorageCapacity.objects.all().values())
    elif country.lower() == 'colombia':
        data = list(OptimalStorageCapacityCo.objects.all().values())
    elif country.lower() == 'united states':
        # data = list(OptimalStorageCapacityUS.objects.all().values())
        return JsonResponse({"message": "Storage data not available for United States"}, status=204)
    else:
        return JsonResponse({"error": "Country not supported"}, status=400)
    
    for item in data:
        item['geom'] = item['geom'].coords

    return JsonResponse(data, safe=False)

@csrf_exempt
def line_data_json(request, country):
    try:
        if country.lower() == 'united states':
            data = list(LinesUS.objects.all().values())
        elif country.lower() == 'colombia':
            data = list(LinesCo.objects.all().values())
        else:  # Asumimos que es Nigeria
            data = list(Lines.objects.all().values())

        for item in data:
            if 'geom' in item and item['geom']:
                item['line_geom'] = GEOSGeometry(item['geom']).coords
                del item['geom']
            elif 'line_geom' in item and item['line_geom']:
                item['line_geom'] = item['line_geom'].coords

        return JsonResponse(data, safe=False)
    except Exception as e:
        logger.error(f"Error in line_data_json for {country}: {str(e)}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)