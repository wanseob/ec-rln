import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Scalar } from "ffjavascript";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Verifier,
  Verifier__factory,
  ECRLNSample,
  ECRLNSample__factory,
} from "../typechain";
import { ECRLNClient, ECRLNSession, Point, Polynomial } from "circuits";
import { BigNumber, BigNumberish } from "ethers";
import fs from "fs";
import path from "path";
import {
  computeAddress,
  formatEther,
  hexZeroPad,
  parseEther,
} from "ethers/lib/utils";

const SNARK_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
describe("Test contract", function () {
  let verifier: Verifier;
  let demoApp: ECRLNSample;
  let deployer: SignerWithAddress;
  let client: ECRLNClient;
  this.beforeEach(async () => {
    [deployer] = await ethers.getSigners();
    verifier = await new Verifier__factory(deployer).deploy();

    demoApp = await new ECRLNSample__factory(deployer).deploy(verifier.address);
    client = ECRLNClient.create();
    await client.init(
      fs.readFileSync(
        path.join(__dirname, "../../circuits/zk/circuits/main_js/main.wasm")
      ),
      fs.readFileSync(path.join(__dirname, "../../circuits/zk/zkeys/main.zkey"))
    );
  });
  it("Should stake some eth to the client address", async function () {
    [deployer] = await ethers.getSigners();
    await deployer.sendTransaction({
      to: client.address,
      value: parseEther("1"),
    });
    expect(await ethers.provider.getBalance(client.address)).to.eq(
      parseEther("1")
    );
  });
  let session!: ECRLNSession;
  it("Should start a session", async function () {
    const currentSession = await demoApp.getSession(client.address);
    const session = await client.newSession(currentSession.epoch.toNumber()); // default val is 5
    const epochCommitment = session.epochCommitment;
    await demoApp
      .connect(deployer)
      .startSession(
        [
          BigNumber.from(client.address),
          epochCommitment[0],
          epochCommitment[1],
        ],
        session.zkp
      );
    const keys = [];
    for (let i = 0; i < 6; i += 1) {
      const spendKey = session.spendKey();
      await demoApp.sendMessage(
        client.address,
        spendKey.sharedRef as [BigNumberish, BigNumberish],
        spendKey.sharedKey
      );
      keys.push(spendKey.sharedKey);
    }
    const recovered = Polynomial.interpolate(
      keys.map((key, i) => new Point(i + 1, key))
    );
    const recoveredPrivateKey = hexZeroPad(
      BigNumber.from(recovered.evaluate(0).toString()).toHexString(),
      32
    );
    const recoveredAddress = computeAddress(recoveredPrivateKey);
    expect(recoveredAddress).to.eq(client.address);
  });
});
