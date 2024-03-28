import { AddressLookupTableAccount, ComputeBudgetProgram, Connection, PublicKey, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { batchInstructionsToTxsWithPriorityFee } from "./tx-builder";
import { estimatePrioritizationFee, getSimulationUnits } from "./networking";
import { BuildOptimalTransactionsReturns } from "./types";

export async function buildOptimalTransactions(
  connection: Connection,
  instructions: TransactionInstruction[],
  signerKey: PublicKey,
  lookupTables: AddressLookupTableAccount[]
): Promise<BuildOptimalTransactionsReturns> {
  // Add all instructions into as many transactions as needed
  const txs: Transaction[] = await batchInstructionsToTxsWithPriorityFee(
    connection,
    signerKey,
    instructions
  );

  const transactions: VersionedTransaction[] = []

  const recentBlockhash = await connection.getLatestBlockhash();

  for (const tx of txs) {
    // Get CU budget and priority fee for each tx
    const [microLamportsEstimate, computeUnits] = await Promise.all([
      estimatePrioritizationFee(connection, tx.instructions, 100),
      getSimulationUnits(connection, tx.instructions, signerKey, lookupTables)
    ]);

    // console.log('Priority fees: ', microLamportsEstimate, ' / CUs: ', computeUnits);

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits || 200_000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: microLamportsEstimate,
      }),
      ...tx.instructions,
    ];

    transactions.push(new VersionedTransaction(
      new TransactionMessage({
        instructions,
        recentBlockhash: recentBlockhash.blockhash,
        payerKey: signerKey
      }).compileToV0Message(lookupTables)
    ));
  }

  return {
    transactions,
    recentBlockhash,
  };
}