import { PhantomProvider } from "../types";

export const getSolanaProvider = () => {
  if (typeof window !== "undefined") {
    if ("solana" in window) {
      return (window as any).solana as PhantomProvider;
    }
  }
  return null;
};

export const truncateAddress = (address: string | undefined) => {
  const first4Chars = address?.slice(0, 4);
  const last4Chars = address?.slice(40, 44);
  return first4Chars + "..." + last4Chars;
};
