import { ECRLNClient, Proof } from "circuits";
import { Nullifier } from "circuits/src/ecrln-session";
import { BigNumberish } from "ethers";
import { useSendMessage } from "../hooks/useContract";

function SendTx({
  address,
  client,
  onResult,
}: {
  address: string;
  client?: ECRLNClient;
  onResult: (nullifier: Nullifier) => void;
}) {
  const { txState, sendMessage } = useSendMessage(address);
  return (
    <div>
      <p>Tx state: {txState}</p>
      <p>{!!sendMessage}</p>
      <button
        disabled={!sendMessage || !client}
        onClick={async () => {
          if (!!client && !!sendMessage && !!client.currentSession) {
            const session = client.currentSession;
            const spendKey = session.spendKey();
            await sendMessage({
              clientAddress: client.address,
              refPoint: spendKey.sharedRef as [BigNumberish, BigNumberish],
              sharedSecret: spendKey.sharedKey,
            });
            onResult(spendKey);
          }
        }}
      >
        Send a message..!
      </button>
    </div>
  );
}

export default SendTx;
