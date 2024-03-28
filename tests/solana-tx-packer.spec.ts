import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { assert } from "chai";
import { buildOptimalTransactions } from "../src";

describe("solana-tx-packer", () => {
  const connection = new Connection("https://devnet.helius-rpc.com/?api-key=82376549-81c3-4f27-8778-a11fa2b4287a");
  const signerKey = Keypair.generate().publicKey;

  context("Packs some txs", () => {

    it("Transform instructions into transactions", async () => {
      const instructions: TransactionInstruction[] = Array(43).fill(0).map(n => {
        const targetWallet = Keypair.generate().publicKey;
        return SystemProgram.transfer({
          fromPubkey: signerKey,
          toPubkey: targetWallet,
          lamports: LAMPORTS_PER_SOL / 10_000,
        });
      });

      const { transactions } = await buildOptimalTransactions(connection, instructions, signerKey, []);
      console.log('transactions: ', transactions.length);
      assert(transactions.length > 0, "Transactions are packed");
    });
  });
});