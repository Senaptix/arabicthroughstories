import assert from "node:assert/strict";
import { missingPasswordParts, weakPasswordMessage } from "./password-rules";

assert.deepEqual(missingPasswordParts("Garden-Lamp-47-River!"), []);
assert.equal(missingPasswordParts("short").length, 4); // length, upper, number, symbol
assert.match(weakPasswordMessage("alllowercase1!", false), /uppercase letter/);
assert.match(weakPasswordMessage("Garden-Lamp-47-River!", false), /common or breached/);
assert.match(weakPasswordMessage("whatever", true), /data breach/);
console.log("password-rules.check: ok");
