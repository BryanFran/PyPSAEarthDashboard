# SPDX-FileCopyrightText: 2024 Bryan Ramirez <bryan.ramirez@openenergytransition.org>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.apps import AppConfig

class GeojsonConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'geojson'
