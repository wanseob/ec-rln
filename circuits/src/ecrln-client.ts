import { buildBabyjub } from "circomlibjs";
import { BigNumber, BigNumberish, Bytes, BytesLike } from "ethers";
import {
  computeAddress,
  hexlify,
  hexZeroPad,
  randomBytes,
} from "ethers/lib/utils";
import * as snarkjs from "snarkjs";
import { ECRLNSession } from "./ecrln-session";

const SUB_ORDER = BigInt(
  "2736030358979909402780800718157159386076813972158567259200215660948447373041"
);

const DEFAULT_THRESHOLD = 5;

export class ECRLNClient {
  private _babyjub: any;
  private _zkey: any;
  private _wasm: any;
  private _session?: ECRLNSession;
  private _privateKey: string;
  private _address: string;

  constructor(privateKey: BytesLike) {
    this._privateKey = hexZeroPad(hexlify(privateKey), 32);
    this._address = computeAddress(this._privateKey);
  }

  static create() {
    const snarkFriendlyPrivKey = BigNumber.from(randomBytes(32)).mod(SUB_ORDER);
    return new ECRLNClient(snarkFriendlyPrivKey.toHexString());
  }

  get initialized() {
    return this._babyjub !== undefined && this._zkey !== undefined;
  }

  get address() {
    return this._address;
  }

  get babyjub() {
    if (!this.initialized) throw Error("Not initialized");
    return this._babyjub;
  }

  get currentSession(): ECRLNSession | undefined {
    return this._session;
  }

  async init(wasm: Buffer, zKey: Buffer) {
    if (this.initialized) return this;
    // you can adjust the file path here
    [this._wasm, this._zkey, this._babyjub] = await Promise.all([
      wasm,
      zKey,
      buildBabyjub(),
    ]);
    this._zkey.type = "mem";
    return this;
  }

  async newSession(epoch: number, threshold?: number): Promise<ECRLNSession> {
    if (!this.initialized) throw Error("Not initialized yet");
    const session = new ECRLNSession(
      this._privateKey,
      threshold || DEFAULT_THRESHOLD,
      epoch,
      this._babyjub
    );
    await session.init(this._wasm, this._zkey);
    this._session = session;
    return session;
  }
}
