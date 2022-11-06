import { useEffect, useState } from "react";
import { ECRLNClient } from "circuits";
import { BytesLike } from "ethers";

function useECRLNClient(privKey?: BytesLike) {
  const [client, setClient] = useState<ECRLNClient>();

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.PUBLIC_URL}/main.wasm`).then((res) =>
        res.arrayBuffer()
      ),
      fetch(`${process.env.PUBLIC_URL}/main.zkey`).then((res) =>
        res.arrayBuffer()
      ),
    ]).then(([wasm, zkey]) => {
      const client = privKey ? new ECRLNClient(privKey) : ECRLNClient.create();
      client.init(Buffer.from(wasm), Buffer.from(zkey)).then((_client) => {
        setClient(_client);
      });
    });
  }, [privKey]);

  return { client };
}

export default useECRLNClient;
