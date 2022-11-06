import { useGetSession } from "../hooks/useContract";

function Viewer({
  address,
  clientAddress,
}: {
  address: string;
  clientAddress: string;
}) {
  const session = useGetSession(address, clientAddress);
  return (
    <div>
      Current Session Info
      <p>Epoch {session?.epoch?.toString()}</p>
      <p>Nullifiers {session?.nullifiers.map((bn) => bn.toString())}</p>
    </div>
  );
}

export default Viewer;
