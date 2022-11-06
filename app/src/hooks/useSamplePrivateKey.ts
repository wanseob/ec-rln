import { useCallback, useState } from "react";
import { useEthers } from "@usedapp/core";
import { BigNumber } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { hexZeroPad } from "ethers/lib/utils";

const BABYJUBJUB_SCALAR_FIELD = BigInt(
  "2736030358979909402780800718157159386076813972158567259200215660948447373041"
); // suborder of r

export const useSamplePrivateKey = () => {
  const { account, library, chainId } = useEthers();
  const signer = account ? library?.getSigner(account) : undefined;
  const [samplePrivateKey, setSamplePrivateKey] = useState<string>();

  const getSamplePrivateKey = useCallback(async () => {
    if (!signer) return;
    const sig = await signer.signMessage("Sample Message");
    const key = hexZeroPad(
      BigNumber.from(keccak256(sig)).mod(BABYJUBJUB_SCALAR_FIELD).toHexString(),
      32
    );
    setSamplePrivateKey(key);
    return key;
  }, [signer]);

  return {
    ecrlnClient: samplePrivateKey,
    setEcrlnClient: getSamplePrivateKey,
  };
};
