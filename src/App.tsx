import React, { useMemo } from "react";
import "./App.css";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletDetails } from "./components";
import {
  createDefaultAuthorizationResultCache,
  SolanaMobileWalletAdapter,
} from "@solana-mobile/wallet-adapter-mobile";
import styled from "styled-components";
import "antd/dist/antd.css";

const RootContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100vw;
  height: 100%;
  padding-top: 5%;
`;

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      // @ts-ignore
      new SolanaMobileWalletAdapter({
        appIdentity: { name: "Solana Wallet Adapter App" },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
      }),
      new PhantomWalletAdapter(),
    ],
    [network]
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <RootContainer>
          <div>
            <WalletDetails />
          </div>
        </RootContainer>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
