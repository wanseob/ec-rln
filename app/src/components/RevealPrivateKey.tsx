import { Point, Polynomial } from "circuits";
import { Nullifier } from "circuits/src/ecrln-session";
import { BigNumber } from "ethers";
import { computeAddress, hexZeroPad } from "ethers/lib/utils";
import { useGetSession } from "../hooks/useContract";

function RevealPrivateKey({
  clientAddress,
  nullifiers,
}: {
  clientAddress: string;
  nullifiers: Nullifier[];
}) {
  const recovered =
    nullifiers.length >= 5
      ? Polynomial.interpolate(
          nullifiers.map(
            (nullifier, i) =>
              new Point(nullifier.index + 1, nullifier.sharedKey)
          )
        )
      : undefined;

  const recoveredPrivateKey = recovered
    ? hexZeroPad(
        BigNumber.from(recovered.evaluate(0).toString()).toHexString(),
        32
      )
    : undefined;

  const recoveredAddress = recoveredPrivateKey
    ? computeAddress(recoveredPrivateKey)
    : undefined;
  return (
    <div>
      Shared keys
      <p>
        {nullifiers.map((nullifier) => nullifier.sharedKey.toString()).join('\n')}
      </p>
      Recovered private key
      <p>
        {recoveredAddress === clientAddress
          ? recoveredPrivateKey
          : "under threshold..."}
      </p>
    </div>
  );
}

export default RevealPrivateKey;
