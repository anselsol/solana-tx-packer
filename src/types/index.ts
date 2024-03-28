import { Blockhash, VersionedTransaction } from "@solana/web3.js"

export type BuildOptimalTransactionsReturns = {
  transactions: VersionedTransaction[],
  recentBlockhash: Readonly<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>
};