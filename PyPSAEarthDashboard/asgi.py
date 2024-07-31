# SPDX-FileCopyrightText: 2024 Bryan Ramirez <bryan.ramirez@openenergytransition.org>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
ASGI config for PyPSAEarthDashboard project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PyPSAEarthDashboard.settings')

application = get_asgi_application()
