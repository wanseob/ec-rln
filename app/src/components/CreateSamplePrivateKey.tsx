import { Verifier__factory, ECRLNSample__factory } from "contracts";
import { useEthers } from "@usedapp/core";
import { BytesLike, computeAddress, solidityKeccak256 } from "ethers/lib/utils";
import { useEffect, useState } from "react";
import { ECRLNClient } from "circuits";
import { useSamplePrivateKey } from "../hooks/useSamplePrivateKey";
import { useECRLNContract } from "../hooks/useContract";
import useECRLNClient from "../hooks/useECRLNClient";

export const key = (bytecode: BytesLike, chainId?: number) =>
  `${solidityKeccak256(["bytes"], [bytecode])}:${chainId}`;

function CreateSamplePrivateKey({
  onResult,
}: {
  onResult: (privKey: string) => void;
}) {
  const { library } = useEthers();
  const { ecrlnClient: samplePrivateKey, setEcrlnClient: getSamplePrivateKey } = useSamplePrivateKey();

  useEffect(() => {
    if (samplePrivateKey) onResult(samplePrivateKey);
  }, [samplePrivateKey]);

  return (
    <div>
      <button disabled={!library} onClick={getSamplePrivateKey}>
        Create a burner wallet
      </button>
      <p>Private Key: {samplePrivateKey}</p>
      <p>Address: {samplePrivateKey && computeAddress(samplePrivateKey)}</p>
    </div>
  );
}

export default CreateSamplePrivateKey;
