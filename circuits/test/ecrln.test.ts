/* eslint-disable node/no-missing-import */
import { expect } from "chai";
import { ECRLNSession } from "circuits";
import {
  computeAddress,
  hexlify,
  hexZeroPad,
  randomBytes,
} from "ethers/lib/utils";
import { buildBabyjub } from "circomlibjs";
import { BigNumber } from "ethers";
import fs from "fs";
import path from "path";

const SNARK_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const BABYJUBJUB_SCALAR_FIELD = BigInt(
  "2736030358979909402780800718157159386076813972158567259200215660948447373041"
); // suborder of r

describe("Test lagrange interpolation", function () {
  let babyjub: any;
  let wasm: any;
  let zkey: any;
  before(async () => {
    babyjub = await buildBabyjub();
    wasm = fs.readFileSync(
      path.join(__dirname, "../../circuits/zk/circuits/main_js/main.wasm")
    );
    zkey = fs.readFileSync(
      path.join(__dirname, "../../circuits/zk/zkeys/main.zkey")
    );
  });
  it("Should able to construct the polynomial correctly", async function () {
    const privKey = hexZeroPad(
      BigNumber.from(randomBytes(32))
        .mod(BABYJUBJUB_SCALAR_FIELD)
        .toHexString(),
      32
    );
    const address = computeAddress(privKey);
    const session = new ECRLNSession(privKey, 5, 1, babyjub);
    const epochCommitment = session.epochCommitment;
    const key1 = session.sharedKey(0);
    const ref1 = session.sharedReference(0);
    const computedCommitment = babyjub.mulPointEscalar(ref1, key1); 
    expect(hexlify(epochCommitment[0])).to.eq(hexlify(computedCommitment[0].reverse())); // endian problem..
    expect(hexlify(epochCommitment[1])).to.eq(hexlify(computedCommitment[1].reverse()));
    await session.init(wasm, zkey);
  });
});
