/* @odoo-module */

/* Copyright 2021 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {FormController} from "@web/views/form/form_controller";

export class StockBarcodesFormController extends FormController {
    setup() {
        super.setup();
        // Barcode actions open the scan form as a full-screen working view.
        // Keep the control panel available for other uses of this js_class.
        if (this.props.context.control_panel_hidden) {
            this.display.controlPanel = false;
        }
    }
}
