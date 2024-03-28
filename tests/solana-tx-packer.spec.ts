import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { assert } from "chai";
import { buildOptimalTransactions } from "../src";

describe("solana-tx-packer", () => {
  const connection = new Connection("https://api.devnet.solana.com");
  const signerKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.TEST_WALLET!))).publicKey;

  context("Packs some txs", async () => {
    it("Transform instructions into transactions", async () => {
      const instructions: TransactionInstruction[] = Array(43).fill(0).map(() => {
        const targetWallet = Keypair.generate().publicKey;
        return SystemProgram.transfer({
          fromPubkey: signerKey,
          toPubkey: targetWallet,
          lamports: LAMPORTS_PER_SOL / 1_000,
        });
      });

      const { transactions } = await buildOptimalTransactions(connection, instructions, signerKey, []);
      assert(transactions.length === 3, "Wrong number of Transactions");
    });
  });
});