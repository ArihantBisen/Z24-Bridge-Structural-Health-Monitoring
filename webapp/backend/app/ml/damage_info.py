"""Z24 Bridge damage class definitions and DSI mapping."""

DAMAGE_INFO = {
    1:  {'name': 'Reference (before damage)',   'type': 'Healthy',    'dsi': 0.00, 'severity': 'Healthy'},
    2:  {'name': 'Reference (after repair)',     'type': 'Healthy',    'dsi': 0.03, 'severity': 'Healthy'},
    3:  {'name': 'Pier settlement 20mm',         'type': 'Settlement', 'dsi': 0.12, 'severity': 'Minor'},
    4:  {'name': 'Pier settlement 40mm',         'type': 'Settlement', 'dsi': 0.25, 'severity': 'Moderate'},
    5:  {'name': 'Pier settlement 80mm',         'type': 'Settlement', 'dsi': 0.50, 'severity': 'Severe'},
    6:  {'name': 'Pier settlement 95mm',         'type': 'Settlement', 'dsi': 0.60, 'severity': 'Severe'},
    7:  {'name': 'Foundation tilt',              'type': 'Foundation', 'dsi': 0.35, 'severity': 'Moderate'},
    8:  {'name': 'Concrete spalling',            'type': 'Foundation', 'dsi': 0.15, 'severity': 'Minor'},
    9:  {'name': 'Landslide at abutment',        'type': 'Foundation', 'dsi': 0.40, 'severity': 'Moderate'},
    10: {'name': 'Hinge failure (one side)',      'type': 'Hinge',     'dsi': 0.55, 'severity': 'Severe'},
    11: {'name': 'Hinge failure (both sides)',    'type': 'Hinge',     'dsi': 0.75, 'severity': 'Critical'},
    12: {'name': 'Anchor head failure',           'type': 'Tendon',    'dsi': 0.55, 'severity': 'Severe'},
    13: {'name': '2 anchor heads failed',         'type': 'Tendon',    'dsi': 0.65, 'severity': 'Critical'},
    14: {'name': 'Rupture of 2 tendons',          'type': 'Tendon',    'dsi': 0.75, 'severity': 'Critical'},
    15: {'name': 'Rupture of 4 tendons',          'type': 'Tendon',    'dsi': 0.85, 'severity': 'Critical'},
    16: {'name': 'All tendons cut (one side)',     'type': 'Tendon',    'dsi': 0.92, 'severity': 'Extreme'},
    17: {'name': 'All tendons cut (both sides)',   'type': 'Tendon',    'dsi': 0.98, 'severity': 'Extreme'},
}

T_DESIGN = 75  # Design lifespan in years
K_DEGRADE = 1.5  # Degradation exponent