import { useMemo, useCallback, useEffect, useState } from "react";
import { useEthers } from "@usedapp/core";
import { ECRLNSample__factory } from "contracts";
import { BigNumber, BigNumberish } from "ethers";

export const useECRLNContract = (address: string) => {
  const { account, library, chainId } = useEthers();
  const signer = account ? library?.getSigner(account) : undefined;
  return useMemo(() => {
    if (!library) return undefined;
    const _contract = ECRLNSample__factory.connect(address, library);
    return signer ? _contract.connect(signer) : _contract;
  }, [library, address, signer, chainId]);
};

/**
 * @dev This fetches data once the react component is rendered
 */
export const useVerifier = (address: string) => {
  const ecrlnContract = useECRLNContract(address);
  const [verifier, setVerifier] = useState<string>();
  const { library, chainId } = useEthers();

  const fetchVerifierAddress = useCallback(async () => {
    if (!ecrlnContract) return;
    const _verifier = await ecrlnContract.verifier();
    setVerifier(_verifier);
  }, [ecrlnContract]);

  useEffect(() => {
    fetchVerifierAddress();
  }, [address, library, chainId, fetchVerifierAddress]);

  return verifier;
};

/**
 * @dev This fetches data every block when the component is mounted
 */
export const useGetSession = (address: string, clientAddress: string) => {
  const ecrlnContract = useECRLNContract(address);
  const [session, setSession] = useState<
    [BigNumber, [BigNumber, BigNumber], BigNumber[]] & {
      epoch: BigNumber;
      epochCommitment: [BigNumber, BigNumber];
      nullifiers: BigNumber[];
    }
  >();
  const { library, chainId } = useEthers();

  const fetchSession = useCallback(async () => {
    if (!ecrlnContract) return;
    const _session = await ecrlnContract.getSession(clientAddress);
    console.log('session...')
    setSession(_session);
  }, [ecrlnContract]);

  useEffect(() => {
    fetchSession();
    library?.on("block", fetchSession);
    return () => {
      library?.off("block", fetchSession);
    };
  }, [address, library, chainId]);

  return session;
};

export enum TxState {
  NONE = "NONE",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * @dev Contract interfaction example with ZKP
 */
export const useStartSession = (address: string) => {
  const ecrlnApp = useECRLNContract(address);
  const [txState, setTxState] = useState<TxState>(TxState.NONE);
  const { library, chainId, account } = useEthers();

  const startSession = useCallback(
    async ({
      publicSignals,
      proof,
    }: {
      publicSignals: [BigNumberish, BigNumberish, BigNumberish];
      proof: {
        a: [BigNumberish, BigNumberish];
        b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
        c: [BigNumberish, BigNumberish];
      };
    }) => {
      if (!ecrlnApp || !account) return;
      if (!library) return;
      const signer = library.getSigner(account);
      ecrlnApp
        .connect(signer)
        .startSession(publicSignals, proof)
        .then((tx) => {
          setTxState(TxState.PENDING);
          tx.wait()
            .then(() => setTxState(TxState.CONFIRMED))
            .catch(() => setTxState(TxState.FAILED));
        })
        .catch(() => setTxState(TxState.CANCELLED));
    },
    [library, chainId, account, ecrlnApp]
  );
  return { txState, startSession: account ? startSession : undefined };
};

export const useSendMessage = (address: string) => {
  const ecrlnApp = useECRLNContract(address);
  const [txState, setTxState] = useState<TxState>(TxState.NONE);
  const { library, chainId, account } = useEthers();

  const sendMessage = useCallback(
    async ({
        clientAddress,
        refPoint,
        sharedSecret,
    }: {
      clientAddress: string,
      refPoint: [BigNumberish, BigNumberish],
      sharedSecret: BigNumberish,
    }) => {
      if (!ecrlnApp || !account) return;
      if (!library) return;
      const signer = library.getSigner(account);
      ecrlnApp
        .connect(signer)
        .sendMessage(clientAddress, refPoint, sharedSecret)
        .then((tx) => {
          setTxState(TxState.PENDING);
          tx.wait()
            .then(() => setTxState(TxState.CONFIRMED))
            .catch(() => setTxState(TxState.FAILED));
        })
        .catch(() => setTxState(TxState.CANCELLED));
    },
    [library, chainId, account, ecrlnApp]
  );
  return { txState, sendMessage: account ? sendMessage : undefined };
};

