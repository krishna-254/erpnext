import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const source = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../selling/page/point_of_sale/pos_payment.js"
);

// Currency controls keep the raw value but parse get_value() from formatted input.
test("POS payment keypad retains cents when number format hides decimals", () => {
  const sandbox = {
    erpnext: { PointOfSale: {} },
    frappe: {
      sys_defaults: { number_format: "#,###", currency_precision: 2 },
      utils: { play_sound() {} },
    },
    get_number_format_info: () => ({ precision: 0 }),
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(source, "utf8"), sandbox, {
    filename: source,
  });

  const payment = Object.create(sandbox.erpnext.PointOfSale.Payment.prototype);
  payment.selected_mode = {
    value: 0,
    get_value() {
      return Math.round(this.value);
    },
    set_value(value) {
      this.value = value;
    },
  };

  for (const digit of ["1", "0", "4"]) {
    payment.on_numpad_clicked(digit, false);
  }
  assert.equal(payment.selected_mode.value, 1.04);

  payment.on_numpad_clicked("Backspace", false);
  assert.equal(payment.selected_mode.value, 0.1);
  payment.on_numpad_clicked("-", false);
  assert.equal(payment.selected_mode.value, -0.1);
});
