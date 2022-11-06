import { useEthers, useLocalStorage } from "@usedapp/core";
import { ECRLNClient, Proof } from "circuits";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import "./App.css";
import Connect from "./components/Connect";
// import SendTx from "./components/SendTx";
// import SignEdDSA from "./components/SignEdDSA";
// import Viewer from "./components/Viewer";
// import CreateClient from "./components/CreateSamplePrivateKey";
import Deploy from "./components/Deploy";
import useECRLNClient from "./hooks/useECRLNClient";
import { BytesLike } from "ethers";
import CreateSamplePrivateKey from "./components/CreateSamplePrivateKey";
import StartSession from "./components/StartSession";
import RLNAccountBalance from "./components/RLNAccountBalance";
import SendTx from "./components/SendTx";
import Viewer from "./components/Viewer";
import RevealPrivateKey from "./components/RevealPrivateKey";
import { Nullifier } from "circuits/src/ecrln-session";

// const address = process.env["REACT_APP_CONTRACT_ADDRESS"] as string;
// if (typeof address !== "string") throw Error("Configure contract address");
const msgToSign = BigNumber.from("0x1234").toBigInt();

function App() {
  const { account } = useEthers();
  const [ecdsaSig, setECDSASig] = useState<BytesLike>();
  const [proof, setProof] = useState<Proof>();
  const [privKey, setPrivKey] = useState<string>();
  const { client } = useECRLNClient(privKey);
  const [deployed, setDeployed] = useState<string>();
  const [nullifiers, setNullifier] = useState<Nullifier[]>([]);
  return (
    <div className="App">
      <h1>EC - RLN (Elliptic Curve Rate Limiting Nullifier)</h1>
      <h2>Step 1. Connect your wallet</h2>
      <Connect />
      <h2>Step 2. Deploy Sample Smart Contract for EC RLN</h2>
      <Deploy onResult={setDeployed} />
      <h2>Step 3. Create a burner wallet for your RLN account</h2>
      <CreateSamplePrivateKey onResult={setPrivKey} />
      <h2>Step 4. Create a EC RLN Client and start session!</h2>
      {deployed && client && (
        <StartSession address={deployed} client={client} />
      )}
      <h2>Step 5. Stake your ETH to the RLN account</h2>
      {client && <RLNAccountBalance clientAddress={client.address} />}
      <h2>Step 6. Send messages</h2>
      {deployed && client && (
        <SendTx
          address={deployed}
          client={client}
          onResult={(nullifier) =>
            setNullifier([...(nullifiers || []), nullifier])
          }
        />
      )}
      <h2>Step 7. Going to reveal your private key</h2>
      {client && (
        <RevealPrivateKey clientAddress={client.address} nullifiers={nullifiers} />
      )}
    </div>
  );
}

export default App;
