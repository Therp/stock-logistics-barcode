/* @odoo-module */

import {StockBarcodesKanbanRenderer} from "./kanban_renderer.esm";
import {kanbanView} from "@web/views/kanban/kanban_view";
import {registry} from "@web/core/registry";

registry.category("views").add("stock_barcodes_kanban", {
    ...kanbanView,
    Renderer: StockBarcodesKanbanRenderer,
});
