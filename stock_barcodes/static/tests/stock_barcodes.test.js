import "../src/utils/barcode_handler_field.esm.js";
import {afterEach, expect, test} from "@odoo/hoot";
import {BarcodeHandlerField} from "@barcodes/barcode_handler_field";
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

test("kanban header opens OCA barcode menu without an empty picking RPC", async () => {
    const calls = [];
    const renderer = {
        showMessageScanProductPackage: true,
        action: {
            doAction: async (value) => {
                calls.push(value);
                return "done";
            },
        },
    };

    const result =
        await StockBarcodesKanbanRenderer.prototype.openBarcodeScanner.call(renderer);

    expect(calls).toEqual(["stock_barcodes.action_stock_barcodes_action_client"]);
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

test("wizard barcode scan waits for onchange before processing", async () => {
    const events = [];
    let releaseUpdate = null;
    const updateCompleted = new Promise((resolve) => {
        releaseUpdate = resolve;
    });
    const button = document.createElement("button");
    button.id = "dummy_on_barcode_scanned";
    button.addEventListener("click", () => events.push("process"));
    document.body.appendChild(button);

    const widget = {
        props: {
            name: "_barcode_scanned",
            record: {
                resModel: "wiz.stock.barcodes.read.picking",
                async update(value) {
                    expect(value).toEqual({_barcode_scanned: "SERIAL-0001"});
                    events.push("update");
                    await updateCompleted;
                    events.push("onchange complete");
                },
            },
        },
    };

    const scan = BarcodeHandlerField.prototype.onBarcodeScanned.call(widget, {
        detail: {barcode: "SERIAL-0001"},
    });
    expect(events).toEqual(["update"]);
    releaseUpdate();
    await scan;
    expect(events).toEqual(["update", "onchange complete", "process"]);
});

test("barcode handler outside OCA wizard keeps standard Odoo behavior", async () => {
    const updates = [];
    const button = document.createElement("button");
    button.id = "dummy_on_barcode_scanned";
    button.addEventListener("click", () => updates.push("incorrect click"));
    document.body.appendChild(button);

    await BarcodeHandlerField.prototype.onBarcodeScanned.call(
        {
            props: {
                name: "_barcode_scanned",
                record: {
                    resModel: "stock.picking",
                    update(value) {
                        updates.push(value);
                    },
                },
            },
        },
        {detail: {barcode: "SERIAL-0002"}}
    );
    expect(updates).toEqual([{_barcode_scanned: "SERIAL-0002"}]);
});
