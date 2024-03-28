// Using with love from the @helium repo

import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { estimatePrioritizationFee } from "./networking";

export async function batchInstructionsToTxsWithPriorityFee(
  connection: Connection,
  walletPubkey: PublicKey,
  instructions: TransactionInstruction[],
  {
    computeUnitLimit = 1000000,
    basePriorityFee,
  }: {
    computeUnitLimit?: number;
    basePriorityFee?: number;
  } = {}
): Promise<Transaction[]> {
  let currentTxInstructions: TransactionInstruction[] = [];
  const blockhash = (await connection.getLatestBlockhash()).blockhash;
  const transactions: Transaction[] = [];

  for (const instruction of instructions) {
    currentTxInstructions.push(instruction);
    const tx = new Transaction({
      feePayer: walletPubkey,
      recentBlockhash: blockhash,
    });
    tx.add(...currentTxInstructions);
    try {
      if (
        tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).length >=
        1232 - (64 + 32) * tx.signatures.length - 60 // 60 to leave room for compute budget stuff
      ) {
        // yes it's ugly to throw and catch, but .serialize can _also_ throw this error
        throw new Error("Transaction too large");
      }
    } catch (e: any) {
      if (e.toString().includes("Transaction too large")) {
        currentTxInstructions.pop();
        const tx = new Transaction({
          feePayer: walletPubkey,
          recentBlockhash: blockhash,
        });
        tx.add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnitLimit,
          }),
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: await estimatePrioritizationFee(
              connection,
              currentTxInstructions,
              basePriorityFee
            ),
          }),
          ...currentTxInstructions
        );
        transactions.push(tx);
        currentTxInstructions = [instruction];
      } else {
        throw e;
      }
    }
  }

  if (currentTxInstructions.length > 0) {
    const tx = new Transaction({
      feePayer: walletPubkey,
      recentBlockhash: blockhash,
    });
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnitLimit,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: await estimatePrioritizationFee(
          connection,
          currentTxInstructions,
          basePriorityFee
        ),
      }),
      ...currentTxInstructions
    );
    transactions.push(tx);
  }

  return transactions;
}