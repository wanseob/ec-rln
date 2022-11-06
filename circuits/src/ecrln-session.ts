import { Bytes, computeAddress, hexZeroPad } from "ethers/lib/utils";
import { BigNumber, BigNumberish } from "ethers";
import * as snarkjs from "snarkjs";
import { Point, Polynomial } from "./lagrange";
import buildCalculator from "../zk/circuits/main_js/witness_calculator";

const BABYJUBJUB_Q = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const SUB_ORDER = BigInt(
  "2736030358979909402780800718157159386076813972158567259200215660948447373041"
);

export interface Proof {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
}
export interface Nullifier {
  index: number;
  sharedKey: BigNumberish;
  sharedRef: BigNumberish[];
}

const EVAL_OFFSET = 1; // just a random number
export class ECRLNSession {
  private _babyJub: any;
  private _polynomial: Polynomial;
  private _nonce: number = 0;
  private _zkp?: Proof;
  private _calculator: any;
  private _zkey: any;
  private _epoch: number;

  constructor(
    privKey: BigNumberish,
    threshold: number,
    epoch: number,
    babyJub: any
  ) {
    if (BigNumber.from(privKey).gte(SUB_ORDER))
      throw Error(
        "Create a zksnark friendly private key which is less than 2736030358979909402780800718157159386076813972158567259200215660948447373041"
      );
    if (threshold < 2) throw Error("Threshold should be greater than 1");
    this._polynomial = Polynomial.random(privKey, threshold, epoch);
    this._babyJub = babyJub;
    this._epoch = epoch;
  }

  get epoch() {
    return this._epoch;
  }

  get initialized() {
    return (
      this._calculator !== undefined &&
      this._zkp !== undefined &&
      this._zkey !== undefined
    );
  }

  get threshold() {
    return this._polynomial.order;
  }

  get zkp() {
    if (!this._zkp) throw Error("proof is not available");
    return this._zkp;
  }

  async init(wasm: Buffer, zKey: Buffer) {
    if (this.initialized) return this;
    // you can adjust the file path here
    [this._zkey, this._calculator] = await Promise.all([
      zKey,
      buildCalculator(wasm),
    ]);
    this._zkey.type = "mem";
    const privateKey = hexZeroPad(
      BigNumber.from(this._polynomial.evaluate(0)).toHexString(),
      32
    );
    const address: BigInt = BigNumber.from(
      computeAddress(privateKey)
    ).toBigInt();
    const epochCommitment = this.epochCommitment;
    const sharedKeys = this.keys();
    const zkp = await this.genZKP({
      privateKey: BigInt(privateKey),
      address,
      epochCommitment: [epochCommitment[0], epochCommitment[1]],
      sharedKeys,
    });
    this._zkp = zkp;
    return this;
  }

  /**
   *
   * @param sharings # of total shared keys
   */
  get epochCommitment() {
    const keys = this.keys();
    let commitment = this._babyJub.Base8;
    for (const key of keys) {
      commitment = this._babyJub.mulPointEscalar(commitment, key);
    }
    return [
      BigNumber.from(commitment[0].reverse()).toBigInt(),
      BigNumber.from(commitment[1].reverse()).toBigInt(),
    ];
  }

  sharedReference(index: number) {
    const keys = this.keys();
    let commitment = this._babyJub.Base8;
    for (let i = 0; i < keys.length; i += 1) {
      if (index !== i) {
        const key = keys[i];
        commitment = this._babyJub.mulPointEscalar(commitment, key);
      }
    }
    return commitment;
  }

  /**
   * Gives you the private key in a deterministic way
   * @param i should start from 0
   */
  sharedKey(i: number) {
    if (i < 0) throw Error("index should start from 0");
    return this._polynomial.evaluate(i + EVAL_OFFSET);
  }

  spendKey(i?: number): Nullifier {
    const index = i || this._nonce;
    this._nonce += 1;
    const sharedRef = this.sharedReference(index);
    return {
      index,
      sharedKey: BigNumber.from(this.sharedKey(index)),
      sharedRef: [
        BigNumber.from(sharedRef[0].reverse()),
        BigNumber.from(sharedRef[1].reverse()),
      ],
    };
  }

  keys() {
    return new Array(this._polynomial.order + 1)
      .fill(undefined)
      .map((_, i) => this.sharedKey(i));
  }

  private async genZKP({
    privateKey,
    address,
    epochCommitment,
    sharedKeys,
  }: {
    privateKey: BigInt;
    address: BigInt;
    epochCommitment: [BigInt, BigInt];
    sharedKeys: BigInt[];
  }): Promise<Proof> {
    const inputs = {
      address,
      epochCommitment,
      privateKey,
      sharedKeys,
    };
    const wtns = await this._calculator.calculateWTNSBin(inputs, 0);
    const { proof } = await snarkjs.groth16.prove(this._zkey, wtns);
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [proof.pi_b[0].reverse(), proof.pi_b[1].reverse()],
      c: [proof.pi_c[0], proof.pi_c[1]],
    };
  }
}
