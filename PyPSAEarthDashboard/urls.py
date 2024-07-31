# SPDX-FileCopyrightText: 2024 Bryan Ramirez <bryan.ramirez@openenergytransition.org>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
URL configuration for PyPSAEarthDashboard project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from geojson.views import (
    index, nominal_generator_capacity_json, optimal_generator_capacity_json,
    nominal_storage_capacity_json, optimal_storage_capacity_json, line_data_json
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('api/line-data/<str:country>/', line_data_json, name='line_data_json'),
    path('api/optimal-storage-capacity/<str:country>/', optimal_storage_capacity_json, name='optimal_storage_capacity_json'),
    path('api/nominal-storage-capacity/<str:country>/', nominal_storage_capacity_json, name='nominal_storage_capacity_json'),
    path('api/optimal-generator-capacity/<str:country>/', optimal_generator_capacity_json, name='optimal_generator_capacity_json'),
    path('api/nominal-generator-capacity/<str:country>/', nominal_generator_capacity_json, name='nominal_generator_capacity_json'),
]



