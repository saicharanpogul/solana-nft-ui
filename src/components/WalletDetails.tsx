import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import styled from "styled-components";
import { Metaplex } from "@metaplex-foundation/js";

import Button from "./Button";
import { getSolanaProvider, truncateAddress } from "../utils";
import NFT from "./NFT";

const WalletDetailsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Address = styled.h2`
  color: #f5e9e2;
`;

const NFTs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  grid-auto-rows: minmax(100px, auto);

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }
`;

const WalletDetails = () => {
  const provider = getSolanaProvider();
  const [connected, setConnected] = useState(false);
  const connectionState = useConnection();
  const [nfts, setNfts] = useState<any>([]);
  const wallet = useWallet();

  useEffect(() => {
    if (provider) {
      provider.on("connect", () => {
        setConnected(true);
        console.log("Connected to wallet " + provider.publicKey?.toBase58());
      });
      provider.on("disconnect", () => {
        setConnected(false);
        console.log("Disconnected from wallet");
      });
      provider.connect({ onlyIfTrusted: true });
      return () => {
        provider.disconnect();
      };
    }
  }, [provider]);

  useEffect(() => {
    if (provider && provider.publicKey) {
      console.log("Getting all NFTs..");
      // metaplex.use(keypairIdentity(provider.payer));
      (async () => {
        const metaplex = new Metaplex(connectionState.connection);
        const allNFTs = await metaplex
          .nfts()
          .findAllByOwner({ owner: provider.publicKey });
        console.log("All_NFTs: ", allNFTs);
        setNfts(allNFTs);
      })();
    }
  }, [connected, provider]);

  const connectWallet = async () => {
    await provider?.connect();
  };
  const disconnectWallet = async () => {
    await provider?.disconnect();
    setNfts([]);
  };
  return (
    <WalletDetailsWrapper>
      <Button
        title={
          provider
            ? provider.isConnected
              ? "Disconnect"
              : "Connect Wallet"
            : "Install Phantom"
        }
        onClick={
          provider
            ? provider.isConnected
              ? () => disconnectWallet()
              : () => connectWallet()
            : () => window.open("https://phantom.app/", "_blank")
        }
      />
      {provider?.publicKey && (
        <Address>
          Address: {truncateAddress(provider?.publicKey?.toBase58())}
        </Address>
      )}
      <NFTs>
        {nfts.map((nft: any, index: any) => (
          <NFT key={nft.mintAddress + index} data={nft} />
        ))}
      </NFTs>
    </WalletDetailsWrapper>
  );
};

export default WalletDetails;
