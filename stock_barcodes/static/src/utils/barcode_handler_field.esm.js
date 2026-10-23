/* @odoo-module */

import {BarcodeHandlerField} from "@barcodes/barcode_handler_field";
import {patch} from "@web/core/utils/patch";

const _origOnBarcodeScanned = BarcodeHandlerField.prototype.onBarcodeScanned;

patch(BarcodeHandlerField.prototype, {
    async onBarcodeScanned(event) {
        const resModel = this.props?.record?.resModel || "";
        if (
            !resModel.startsWith("wiz.stock.barcodes.read") ||
            this.props?.name !== "_barcode_scanned"
        ) {
            // Preserve core Odoo barcode handling outside the OCA wizard.
            return _origOnBarcodeScanned?.call(this, event);
        }
        // Odoo 19's core handler calls record.update() without awaiting it.
        // The update triggers the _barcode_scanned onchange, which copies the
        // barcode into the wizard's `barcode` field. The object button must
        // execute only after that onchange has finished; otherwise its RPC
        // can process the previous or an empty barcode.
        await this.props.record.update({
            [this.props.name]: event.detail.barcode,
        });
        const btn = document.getElementById("dummy_on_barcode_scanned");
        if (btn instanceof HTMLElement) {
            btn.click();
        }
    },
});
