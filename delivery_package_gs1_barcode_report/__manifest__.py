# Copyright 2024 Therp BV <https://therp.nl>.
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl.html).
{
    "name": "Delivery package GS1 barcode report",
    "summary": """Print a label for outgoing stock packages, including a GS1 barcode""",
    "author": "Therp BV, Odoo Community Association (OCA)",
    "version": "16.0.1.0.0",
    "license": "AGPL-3",
    "category": "Delivery",
    "depends": [
        "delivery",
        "product_expiry",
        "sale_stock",
    ],
    "data": [
        "data/report_paperformat.xml",
        "reports/report_package_barcode.xml",
        "reports/stock_report_views.xml",
    ],
    "website": "https://github.com/OCA/stock-logistics-barcode",
}
