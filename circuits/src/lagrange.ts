import { F1Field } from "ffjavascript";
import { isHexString, randomBytes, solidityKeccak256 } from "ethers/lib/utils";
import { BigNumber, BigNumberish } from "ethers";

const BABYJUBJUB_SCALAR_FIELD = BigInt(
  "2736030358979909402780800718157159386076813972158567259200215660948447373041"
); // suborder of r
const Field = new F1Field(BABYJUBJUB_SCALAR_FIELD);
const a: BigInt = BigInt("1");
export interface Point {}

export class Point {
  private _x: BigInt;
  private _y: BigInt;
  constructor(x: BigNumberish, y: BigNumberish) {
    this._x = BigInt(BigNumber.from(x).toString());
    this._y = BigInt(BigNumber.from(y).toString());
    if ([this._x, this._y].every((v) => v >= BABYJUBJUB_SCALAR_FIELD))
      throw Error("Out of finite field");
  }

  static fromString(encoded: string) {
    const coords = encoded.split(":");
    if (coords.length != 2 || coords.every(isHexString))
      throw Error("Not a valid string");
    return new Point(BigInt(coords[0]), BigInt(coords[1]));
  }

  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }

  encode() {
    return `${BigNumber.from(this._x).toHexString()}:${BigNumber.from(
      this._y
    ).toHexString()}`;
  }
}

export class Polynomial {
  private _coeffs: BigInt[];

  constructor(coeffs: BigInt[]) {
    if (coeffs.length == 0)
      throw Error("You should provide at least one coefficient.");
    coeffs.forEach((coeff) => {
      if (BigNumber.from(coeff).gte(BABYJUBJUB_SCALAR_FIELD))
        throw Error("Coefficient is out of the finite field");
    });
    this._coeffs = coeffs.map((coeff) => BigInt(coeff.toString()));
    while (true) {
      const last = this._coeffs.pop();
      if (last && last > BigInt("0")) {
        this._coeffs.push(last);
        break;
      }
    }
  }

  get order(): number {
    return this._coeffs.length - 1;
  }

  get coefficients() {
    return this._coeffs;
  }

  evaluate(x: BigNumberish | BigInt): BigInt {
    const power = BigInt(BigNumber.from(x).toString());
    if (power >= BABYJUBJUB_SCALAR_FIELD) throw Error("Out of finite field");
    const powers: BigInt[] = [BigInt("1")];
    for (let i = 0; i < this._coeffs.length - 1; i += 1) {
      powers.push(Field.mul(power, powers[i]));
    }
    const result = powers.reduce(
      (acc, pow, i) => Field.add(acc, Field.mul(pow, this._coeffs[i])),
      BigInt("0")
    );
    return result;
  }

  static random(yIntercept: BigNumberish, order: number, seed?: BigNumberish) {
    const yI = BigNumber.from(yIntercept);
    if (yI.gte(BABYJUBJUB_SCALAR_FIELD))
      throw Error("Private key is too large to generate a polynomial");
    if (order == 0) {
      throw Error("Threshold should be greater than 9");
    }

    const points = [new Point(0, yI)];
    let randomSeed = seed
      ? BigNumber.from(seed)
      : BigNumber.from(randomBytes(32));
    while (points.length < order + 1) {
      const randX = BigNumber.from(
        solidityKeccak256(
          ["uint256", "uint256"],
          [randomSeed.toString(), points.length]
        )
      ).mod(BABYJUBJUB_SCALAR_FIELD);
      const randY = BigNumber.from(
        solidityKeccak256(
          ["uint256", "uint256", "uint256"],
          [randomSeed.toString(), yI, points.length]
        )
      ).mod(BABYJUBJUB_SCALAR_FIELD);
      if (points.every((point) => !randX.eq(point.x.toString()))) {
        points.push(new Point(randX, randY));
      }
    }
    return Polynomial.interpolate(points);
  }

  static interpolate(points: Point[]) {
    const polynomial = points.map((_) => BigInt("0"));
    for (let i = 0; i < points.length; ++i) {
      const coefficients = this.subInterpolate(i, points);
      for (var k = 0; k < points.length; ++k) {
        polynomial[k] = Field.add(
          polynomial[k],
          Field.mul(points[i].y, coefficients[k])
        );
      }
    }
    return new Polynomial(polynomial);
  }

  private static subInterpolate(i: number, points: Point[]) {
    let coefficients = points.map((_) => BigInt("0"));
    coefficients[0] = Field.div(BigInt("1"), Polynomial.denominator(i, points));
    for (let k = 0; k < points.length; k++) {
      if (k == i) {
        continue;
      }
      const newCoeffs = points.map((_) => BigInt("0"));
      for (let j = k < i ? k + 1 : k; j--; ) {
        newCoeffs[j + 1] = Field.add(newCoeffs[j + 1], coefficients[j]);
        newCoeffs[j] = Field.sub(
          newCoeffs[j],
          Field.mul(points[k].x, coefficients[j])
        );
      }
      coefficients = newCoeffs;
    }
    return coefficients;
  }

  private static denominator(i: number, points: Point[]) {
    let result = BigInt("1");
    const xi = points[i].x;
    for (let j = points.length; j--; ) {
      if (i != j) {
        result = Field.mul(result, Field.sub(xi, points[j].x));
      }
    }
    return result;
  }
}
