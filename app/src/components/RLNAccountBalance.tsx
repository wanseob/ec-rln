import { useEtherBalance } from "@usedapp/core";
import { formatEther } from "ethers/lib/utils";

function RLNAccountBalance({ clientAddress }: { clientAddress: string }) {
  const balance = useEtherBalance(clientAddress);
  return (
    <div>
      <p>RLN Account balance: {formatEther(balance || "0")} ETH</p>
    </div>
  );
}

export default RLNAccountBalance;
