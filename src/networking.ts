import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  RecentPrioritizationFees,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";

export async function estimatePrioritizationFee(
  connection: Connection,
  ixs: TransactionInstruction[],
  basePriorityFee?: number
): Promise<number> {
  const MAX_RECENT_PRIORITY_FEE_ACCOUNTS = 128;
  const writableAccounts = ixs
    .map((x) => x.keys.filter((a) => a.isWritable).map((k) => k.pubkey))
    .flat();
  const uniqueWritableAccounts = [
    ...new Set(writableAccounts.map((x) => x.toBase58())),
  ]
    .map((a) => new PublicKey(a))
    .slice(0, MAX_RECENT_PRIORITY_FEE_ACCOUNTS);

  const priorityFees = await connection.getRecentPrioritizationFees({
    lockedWritableAccounts: uniqueWritableAccounts,
  });

  if (priorityFees.length < 1) {
    return Math.max(basePriorityFee || 0, 1);
  }

  // get max priority fee per slot (and sort by slot from old to new)
  const groupedBySlot = priorityFees.reduce((acc, fee) => {
    const key = fee.slot;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(fee);
    return acc;
  }, {} as Record<string, RecentPrioritizationFees[]>);

  const maxFeeBySlot = Object.keys(groupedBySlot).reduce((acc, slot) => {
    acc[slot] = groupedBySlot[slot].reduce((max, fee) => {
      return fee.prioritizationFee > max.prioritizationFee ? fee : max;
    });
    return acc;
  }, {} as Record<string, RecentPrioritizationFees>);
  const maximumFees = Object.values(maxFeeBySlot).sort(
    (a: RecentPrioritizationFees, b: RecentPrioritizationFees) =>
      a.slot - b.slot
  ) as RecentPrioritizationFees[];

  // get median of last 20 fees
  const recentFees = maximumFees.slice(Math.max(maximumFees.length - 20, 0));
  const mid = Math.floor(recentFees.length / 2);
  const medianFee =
    recentFees.length % 2 !== 0
      ? recentFees[mid].prioritizationFee
      : (recentFees[mid - 1].prioritizationFee +
        recentFees[mid].prioritizationFee) /
      2;

  return Math.max(basePriorityFee || 1, Math.ceil(medianFee));
}

export async function withPriorityFees({
  connection,
  computeUnits,
  instructions,
  basePriorityFee
}: {
  connection: Connection;
  computeUnits: number;
  instructions: TransactionInstruction[];
  basePriorityFee?: number;
}): Promise<TransactionInstruction[]> {
  const estimate = await estimatePrioritizationFee(connection, instructions, basePriorityFee);

  return [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: estimate,
    }),
    ...instructions,
  ];
}

export async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[],
  computeErrorMargin: number = 800
): Promise<number | undefined> {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );

  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  console.log('simulation.value.err', simulation.value.err);
  if (simulation.value.err) {
    return undefined;
  }
  if (!simulation.value.unitsConsumed) {
    return 200_000;
  }
  return simulation.value.unitsConsumed * (1 + computeErrorMargin / 10_000);
}