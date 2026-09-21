# Stock Barcodes technical notes

## Quantity handling

Picked quantities are provided by `stock_move_line_qty_picked`.

During scanning, `qty_picked` is kept separate from `stock.move.line.quantity`, so
reservations are not changed by each scan. Before stock moves are completed, the
dependency updates the quantities used by the standard Odoo stock workflow.

Quantities are converted explicitly between `stock.move.product_uom`,
`stock.move.line.product_uom_id`, and the product base UoM.

## Packaging barcodes

Product packaging barcodes use Odoo's `product.uom` model.

The packaging unit is a `uom.uom` linked to the product through
`product.template.uom_ids`. The `product.uom` record associates the product, packaging
UoM, barcode and company.

Creating a packaging from the scanner creates the additional UoM and its `product.uom`
barcode record.

## Packages

Stock packages use `stock.package`.

Package scans resolve the package and reuse Odoo's standard stock package workflow.

## Client integration

The barcode Kanban uses a dedicated renderer registered as `stock_barcodes_kanban`.

Barcode events use the standard barcode service. Server notifications use the bus
service and are scoped to the current user where appropriate.

The module extends current Odoo web components only where barcode-specific behavior is
required.

## Core workflow

`wiz.stock.barcodes.read` routes scans through `process_barcode_<field>()` handlers
according to the active option group.

Picking and inventory wizards then apply the scanned values to stock moves, move lines,
packages, lots, locations or inventory quants.

`barcode_scan_state` tracks whether a move line is still pending, completed, or
force-completed.

`stock.move.barcode_backorder_action` controls the barcode-specific backorder behavior
during picking validation.
