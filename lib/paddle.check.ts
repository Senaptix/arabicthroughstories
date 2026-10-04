// Run: npx tsx lib/paddle.check.ts
// Self-check for the Paddle webhook signature and price -> book mapping.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { bookForPrice, priceIdFor, verifyPaddleSignature } from "./paddle";

const secret = "pdl_ntfset_test_secret";
const body = '{"event_type":"transaction.completed"}';
const ts = 1_800_000_000;
const h1 = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
const now = ts * 1000;

assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, secret, now), true);
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=deadbeef;h1=${h1}`, secret, now), true, "rotation: any h1 may match");
assert.equal(verifyPaddleSignature(body + " ", `ts=${ts};h1=${h1}`, secret, now), false, "tampered body");
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, "wrong", now), false, "wrong secret");
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, secret, now + 301_000), false, "stale replay");
assert.equal(verifyPaddleSignature(body, null, secret, now), false);
assert.equal(verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, "", now), false, "unset secret never verifies");

process.env.PADDLE_PRICE_IBRAHIM = "pri_ibrahim";
assert.equal(priceIdFor("ibrahim"), "pri_ibrahim");
assert.equal(priceIdFor("../etc"), null);
assert.equal(bookForPrice("pri_ibrahim"), "ibrahim");
assert.equal(bookForPrice("pri_unknown"), null);
console.log("paddle.check: ok");
