import assert from "node:assert/strict";
import {
  DEFAULT_KOTA_BAR_HOURS,
  getCartAvailability,
  getMainCategoryAvailability,
} from "../lib/menuAvailability";

const config = {
  ...DEFAULT_KOTA_BAR_HOURS,
  monThuOpen: "11:00",
  monThuClose: "20:00",
  friSunOpen: "11:00",
  friSunClose: "21:00",
};

const atSouthAfricaTime = (hours: number, minutes: number) =>
  new Date(Date.UTC(2026, 7, 20, hours - 2, minutes)); // Thursday, Africa/Johannesburg = UTC+2

assert.equal(getMainCategoryAvailability(atSouthAfricaTime(6, 59), "kota", config).isOrderable, false);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(7, 0), "kota", config).isOrderable, true);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(10, 59), "kota", config).isOrderable, true);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(10, 59), "burgers", config).isOrderable, false);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(11, 0), "burgers", config).isOrderable, true);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(17, 59), "kota", config).isOrderable, true);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(18, 0), "kota", config).isOrderable, false);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(18, 0), "burgers", config).isOrderable, true);
assert.equal(getMainCategoryAvailability(atSouthAfricaTime(20, 0), "burgers", config).isOrderable, false);
assert.equal(
  getCartAvailability(
    atSouthAfricaTime(18, 0),
    [
      { slug: "burgers", menuType: "main" },
      { slug: "kota", menuType: "main" },
    ],
    config
  ).isOrderable,
  false
);
assert.equal(
  getCartAvailability(
    atSouthAfricaTime(7, 30),
    [{ slug: "kota", menuType: "main" }],
    config
  ).isOrderable,
  true
);
assert.equal(
  getCartAvailability(atSouthAfricaTime(7, 30), [{ slug: "burgers", menuType: "main" }], config).isOrderable, false);
assert.equal(
  getCartAvailability(
    atSouthAfricaTime(7, 30),
    [{ slug: "mogodu-trotters", menuType: "majita_monday" }],
    config
  ).isOrderable,
  true
);

console.log("Menu availability boundary tests passed.");
