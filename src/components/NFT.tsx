import React, { useEffect, useState } from "react";
import { UploadMetadataInput } from "@metaplex-foundation/js";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import styled from "styled-components";
import { Modal, Tabs } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import PuffLoader from "react-spinners/PuffLoader";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  createTransferCheckedInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getSolanaProvider } from "../utils";
import * as anchor from "@project-serum/anchor";
import { WalletName } from "@solana/wallet-adapter-base";

const NFTWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 5px;
  padding-top: 10px;
  padding-bottom: 10px;
  cursor: pointer;
  border: 2px solid #f5e9e2;
  border-radius: 8px;
  margin: 4px;
  :hover {
    border: 2px solid #e3b5a4;
  }
`;

const Name = styled.h3`
  color: #f5e9e2;
  padding: 0;
  margin: 0;
  margin-top: 10px;
`;

const Image = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 8px;
`;

const StyledTabs = styled(Tabs)`
  align-items: center;
`;

const Metadata = styled.div`
  display: flex;
`;

const Input = styled.input`
  width: 280px;
  padding: 10px;
  border-radius: 8px;
`;

const Error = styled.p`
  color: red;
`;

const StyledTabPane = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
`;

const StyledPuffLoader = styled(PuffLoader)`
  margin-top: 20px;
`;

type Props = {
  data: DataV2;
};

const NFT: React.FC<Props> = ({ data }) => {
  const schema = yup.object({
    to: yup
      .string()
      .required("Address is required.")
      .test({
        name: "valid",
        message: "Invalid Address",
        test: (value, context) => {
          if (!value) return true;
          try {
            return PublicKey.isOnCurve(new PublicKey(value as string));
          } catch (error) {
            console.error("Invalid Address", error);
            return false;
          }
        },
      }),
  });
  const [metadata, setMetadata] = useState<UploadMetadataInput | any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const connection = useConnection().connection;
  const provider = getSolanaProvider();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const getProvider = () => {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as AnchorWallet,
      {}
    );
    return provider;
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const showModal = () => {
    setGeneralError("");
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    console.log("Cancel");
    setIsModalOpen(false);
    reset({
      to: "",
    });
  };
  useEffect(() => {
    (async () => {
      try {
        fetch(data.uri, {
          method: "GET",
        })
          .then((res) => res.json())
          .then((data) => {
            setMetadata(data);
          });
      } catch (error) {
        console.error("Get Metadata Failed.");
      }
    })();
  }, []);
  const onSubmit = async (formData: any) => {
    try {
      setIsLoading(true);
      console.log("Data", formData);
      if (provider) {
        console.log("PublicKey: ", provider.publicKey.toBase58());
        const to = new PublicKey(formData.to);
        console.log("To: ", to.toBase58());
        // console.log("mintPubkey", data!.mintAddress as any);
        const _data = data as any;
        const mintPubkey = new PublicKey(_data.mintAddress);
        console.log("mintPubkey", mintPubkey);
        const fromTokenAccountAddress = await getAssociatedTokenAddress(
          mintPubkey,
          provider.publicKey
        );
        console.log(
          "fromTokenAccountAddress",
          fromTokenAccountAddress.toBase58()
        );
        const toTokenAccountAddress = await getAssociatedTokenAddress(
          mintPubkey,
          to
        );
        console.log("toTokenAccountAddress", toTokenAccountAddress.toBase58());
        let toTokenAccount = await connection.getParsedTokenAccountsByOwner(
          to,
          {
            mint: mintPubkey,
          }
        );
        console.log("toTokenAccount", toTokenAccount);
        const recentBlockhash = await connection.getLatestBlockhash();
        let tx = new Transaction({
          recentBlockhash: recentBlockhash.blockhash,
        });
        if (toTokenAccount.value.length === 0) {
          console.log("No Token Account");
          tx.add(
            createAssociatedTokenAccountInstruction(
              provider.publicKey as PublicKey,
              toTokenAccountAddress,
              to,
              mintPubkey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
        tx.add(
          createTransferCheckedInstruction(
            fromTokenAccountAddress, // from
            mintPubkey, // mint
            toTokenAccountAddress, // to
            provider.publicKey, // from's owner
            1, // amount
            0 // decimals
          )
        );
        tx.feePayer = provider.publicKey;
        const signedTx = await provider.signTransaction(tx);
        console.log("signedTx", signedTx);
        const sig = await connection.sendRawTransaction(signedTx.serialize());
        console.log("SIGNATURE", sig);
        setIsModalOpen(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Sending Error: ", error);
      setIsLoading(false);
      setGeneralError("Something went wrong!");
    } finally {
      reset({
        to: "",
      });
    }
  };
  return (
    <NFTWrapper onClick={showModal}>
      <Image src={metadata.image} alt="" />
      <Name>{data.name}</Name>
      <Modal
        title={data.name}
        open={isModalOpen}
        okText="Send"
        onOk={(e) => {
          e.stopPropagation();
          handleSubmit(onSubmit)();
        }}
        onCancel={(e) => {
          e.stopPropagation();
          handleCancel();
        }}
      >
        <StyledTabs>
          <Tabs.TabPane tab="Metadata" key="item-1">
            {metadata?.attributes?.length > 0 ? (
              metadata?.attributes?.map((attribute: any, index: any) => (
                <Metadata key={attribute.trait_type + index}>
                  <h3>
                    {attribute.trait_type}
                    {":  "}
                    {attribute.value}
                  </h3>
                </Metadata>
              ))
            ) : (
              <p>No Attributes</p>
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Send" key="item-2">
            <StyledTabPane>
              <Input
                {...register("to")}
                placeholder="Recipient's SOL Address"
              />
              {errors.to?.message && (
                <Error>{errors.to?.message.toString()}</Error>
              )}
              {generalError && <Error>{generalError}</Error>}
              <StyledPuffLoader size={40} loading={isLoading} />
            </StyledTabPane>
          </Tabs.TabPane>
        </StyledTabs>
      </Modal>
    </NFTWrapper>
  );
};

export default NFT;
