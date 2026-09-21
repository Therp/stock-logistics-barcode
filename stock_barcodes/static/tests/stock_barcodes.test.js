import {afterEach, expect, test} from "@odoo/hoot";
import {StockBarcodesKanbanRenderer} from "../src/views/kanban/kanban_renderer.esm";
import {StockBarcodesMainMenu} from "../src/views/actions/stock_barcode_main_menu.esm";
import {isAllowedBarcodeModel} from "../src/utils/barcodes_models_utils.esm";
import {waitVisibleElement} from "../src/utils/wait_visible_elment_helper.esm";

test.tags("headless");

afterEach(() => {
    document.body.replaceChildren();
});

test("barcode models are restricted to supported models", () => {
    expect(isAllowedBarcodeModel("stock.picking")).toBe(true);
    expect(isAllowedBarcodeModel("wiz.stock.barcodes.read.picking")).toBe(true);
    expect(isAllowedBarcodeModel("res.partner")).toBe(false);
});

test("waitVisibleElement resolves an existing visible element", async () => {
    const element = document.createElement("input");
    element.className = "barcode-test-input";
    element.getBoundingClientRect = () => ({
        width: 10,
        height: 10,
        top: 0,
        right: 10,
        bottom: 10,
        left: 0,
    });
    document.body.appendChild(element);

    const result = await waitVisibleElement(".barcode-test-input", 50);

    expect(result).toBe(element);
});

test("main menu sends scanned barcode to the barcode wizard", async () => {
    const calls = [];
    const mainMenu = {
        ormService: {
            call: async (...args) => {
                calls.push(args);
            },
        },
    };

    await StockBarcodesMainMenu.prototype._onBarcodeScanned.call(
        mainMenu,
        "0123456789012"
    );

    expect(calls).toEqual([
        ["wiz.stock.barcodes.read", "process_barcode", [[], "0123456789012"]],
    ]);
});

test("kanban scanner does nothing outside stock pickings", async () => {
    let rpcCalled = false;
    const renderer = {
        showMessageScanProductPackage: false,
        orm: {
            call: async () => {
                rpcCalled = true;
            },
        },
    };

    const result =
        await StockBarcodesKanbanRenderer.prototype.openBarcodeScanner.call(renderer);

    expect(result).toBe(undefined);
    expect(rpcCalled).toBe(false);
});

test("kanban scanner opens the action returned by stock picking", async () => {
    const calls = [];
    const action = {
        type: "ir.actions.act_window",
        res_model: "wiz.stock.barcodes.read.picking",
    };
    const renderer = {
        showMessageScanProductPackage: true,
        orm: {
            call: async (...args) => {
                calls.push(args);
                return action;
            },
        },
        action: {
            doAction: async (value) => {
                calls.push(["doAction", value]);
                return "done";
            },
        },
    };

    const result =
        await StockBarcodesKanbanRenderer.prototype.openBarcodeScanner.call(renderer);

    expect(calls).toEqual([
        ["stock.picking", "action_barcode_scan", [[], false, false]],
        ["doAction", action],
    ]);
    expect(result).toBe("done");
});

test("kanban update reveals the selected operation", () => {
    const root = document.createElement("div");
    const operation = document.createElement("div");
    operation.className = "oe_kanban_operations-42 d-none";
    root.appendChild(operation);

    const renderer = {
        barcodeState: {enableCurrentOperation: 42},
        rootRef: {el: root},
    };

    StockBarcodesKanbanRenderer.prototype._showEnabledOperation.call(renderer);

    expect(operation.classList.contains("d-none")).toBe(false);
});
