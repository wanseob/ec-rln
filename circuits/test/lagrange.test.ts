/* eslint-disable node/no-missing-import */
import { expect } from "chai";
import { Point, Polynomial } from "circuits";

const BABYJUBJUB_SCALAR_FIELD = BigInt(
  "2736030358979909402780800718157159386076813972158567259200215660948447373041"
); // suborder of r
describe("Test lagrange interpolation", function () {
  it("Should able to construct the polynomial correctly", async function () {
    const a = new Point(0, 0);
    const b = new Point(1, 1);
    const p = Polynomial.interpolate([a, b]);
    expect(p.evaluate(0)).to.eq(0n);
    expect(p.evaluate(1)).to.eq(1n);
    expect(p.evaluate(2)).to.eq(2n);
    expect(p.order).to.eq(1);
  });
  it("should able to work with finite fields", () => {
    const a = new Point(BABYJUBJUB_SCALAR_FIELD - 120n, 3n);
    const b = new Point(21n, 8n);
    const c = new Point(BABYJUBJUB_SCALAR_FIELD - 20n, 9128n);
    const d = new Point(90n, 3n);
    const e = new Point(0n, 1n);
    const p = Polynomial.interpolate([a, b, c, d, e]);
    expect(p.evaluate(a.x)).to.eq(a.y)
    expect(p.evaluate(b.x)).to.eq(b.y)
    expect(p.evaluate(c.x)).to.eq(c.y)
    expect(p.evaluate(d.x)).to.eq(d.y)
    expect(p.evaluate(e.x)).to.eq(e.y)
    expect(p.order).to.eq(4);
  });
});
