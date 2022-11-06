import { ECRLNClient, Proof } from "circuits";
import { BigNumber, BigNumberish } from "ethers";
import { useState } from "react";
import { useGetSession, useStartSession } from "../hooks/useContract";

function StartSession({
  address,
  client,
}: {
  address: string;
  client: ECRLNClient;
}) {
  const { txState, startSession } = useStartSession(address);
  const [generating, setGenerating] = useState<boolean>(false);
  const currentSession = useGetSession(address, client.address);
  return (
    <div>
      <p>Tx state: {txState}</p>
      <p>Create a session {!!startSession}</p>
      <p>{generating ? "Computing zkp..." : ""}</p>
      <button
        disabled={!startSession || !client}
        onClick={async () => {
          if (!!client && !!startSession) {
            let newEpoch;
            if (currentSession) {
              if (currentSession.nullifiers.length > 0) {
                newEpoch = currentSession.epoch.toNumber() + 1;
              } else {
                newEpoch = currentSession.epoch.toNumber();
              }
            } else {
              newEpoch = 0;
            }
            setGenerating(true);
            const newSession = await client.newSession(newEpoch);
            setGenerating(false);
            // const client.new;
            const epochCommitment = newSession.epochCommitment;
            startSession({
              publicSignals: [
                BigNumber.from(client.address),
                epochCommitment[0],
                epochCommitment[1],
              ],
              proof: newSession.zkp,
            });
          }
        }}
      >
        Start a sessoin!
      </button>
    </div>
  );
}

export default StartSession;
