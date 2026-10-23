# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from unittest.mock import patch

from odoo import fields
from odoo.tests.common import tagged

from .common import TestCommonStockBarcodes


@tagged("post_install", "-at_install")
class TestStockQuant(TestCommonStockBarcodes):
    def test_operation(self):
        with patch.object(
            type(self.quant_lot_1), "enable_current_operations"
        ) as mock_operation:
            self.quant_lot_1.inventory_quantity = 10
            self.quant_lot_1.operation_quantities_rest()
            self.assertEqual(self.quant_lot_1.inventory_quantity, 9)

            self.quant_lot_1.operation_quantities()
            self.assertEqual(self.quant_lot_1.inventory_quantity, 10)

            self.assertEqual(mock_operation.call_count, 2)

        with (
            patch.object(type(self.quant_lot_1), "send_bus_done"),
            patch.object(
                type(self.quant_lot_1), "action_apply_inventory"
            ) as mock_operation,
        ):
            self.quant_lot_1.action_apply_inventory()
            self.assertTrue(mock_operation.called)

    def test_apply_inventory_accepts_odoo_19_date_kwarg(self):
        quant = self.StockQuant.with_context(inventory_mode=True).create(
            {
                "product_id": self.product_wo_tracking.id,
                "location_id": self.location_2.id,
                "inventory_quantity": 2,
            }
        )
        with patch.object(type(quant), "send_bus_done") as mock_bus:
            quant.action_apply_inventory(date=fields.Date.today())
            mock_bus.assert_not_called()
