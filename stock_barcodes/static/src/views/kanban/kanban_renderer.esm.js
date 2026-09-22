/* @odoo-module */

/* Copyright 2022 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {onPatched, onWillStart, useEffect, useState} from "@odoo/owl";
import {KanbanRenderer} from "@web/views/kanban/kanban_renderer";
import {useService} from "@web/core/utils/hooks";
import {user} from "@web/core/user";

export class StockBarcodesKanbanRenderer extends KanbanRenderer {
    static template = "stock_barcodes.BarcodeKanbanRenderer";

    setup() {
        super.setup();
        this.orm = useService("orm");
        this.action = useService("action");
        this.busService = useService("bus_service");
        this.barcodeState = useState({enableCurrentOperation: 0});
        this.showMessageScanProductPackage =
            this.props.list.resModel === "stock.picking";
        this.packageEnabled = false;

        onWillStart(async () => {
            // Lots/serial numbers can only be scanned when the corresponding
            // Inventory feature is enabled for the current user.
            this.packageEnabled = await user.hasGroup("stock.group_production_lot");
        });

        const handleKanbanUpdate = (notification) => {
            if (
                notification?.type === "enable_operations" &&
                notification.payload?.id
            ) {
                this.barcodeState.enableCurrentOperation = notification.payload.id;
            }
        };

        useEffect(
            () => {
                this.busService.start();
                this.busService.subscribe(
                    "stock_barcodes_kanban_update",
                    handleKanbanUpdate
                );
                return () => {
                    this.busService.unsubscribe(
                        "stock_barcodes_kanban_update",
                        handleKanbanUpdate
                    );
                };
            },
            () => []
        );

        onPatched(() => this._showEnabledOperation());
    }

    _showEnabledOperation() {
        const operationId = this.barcodeState.enableCurrentOperation;
        if (!operationId || !this.rootRef.el) {
            return;
        }
        for (const el of this.rootRef.el.querySelectorAll(
            `.oe_kanban_operations-${operationId}`
        )) {
            el.classList.remove("d-none");
        }
    }

    async openBarcodeScanner() {
        if (!this.showMessageScanProductPackage) {
            return;
        }
        const action = await this.orm.call("stock.picking", "action_barcode_scan", [
            [],
            false,
            false,
        ]);
        return this.action.doAction(action);
    }
}
