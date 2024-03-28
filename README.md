# 📦 Solana transactions packer
Get your transactions confirmed.

## 💁‍♀️ What this packages does
Transform a list of instructions into as many Transactions as necessary with fine tuned Compute Units and Priority Fee setup.

## 🙅 What this packages does not do
Handle sending or confirming the transactions

## Example
Let's create a list of 43 basic SOL transfers from wallet A to wallets on devnet:
```ts
const instructions: TransactionInstruction[] = Array(43).fill(0).map(() => {
  const targetWallet = Keypair.generate().publicKey;
  return SystemProgram.transfer({
    fromPubkey: signerKey,
    toPubkey: targetWallet,
    lamports: LAMPORTS_PER_SOL / 1_000,
  });
});

const { transactions } = await buildOptimalTransactions(connection, instructions, signerKey, []);
```

This will return the following data:
```
Priority fees:  100  / CUs:  3240
Priority fees:  100  / CUs:  3240
Priority fees:  100  / CUs:  1458
```

The lib calculates a priority fee (here 100 is the default minimum) alongside the right CU budget.

The CU budget gets a 8% error margin boost, just to be sure.

`transactions` will contain a list of each 3 transactions with their CU budgets and priority fees instructions already included. 

All you need to do is send them sequentially or in parallel depending on what you are doing 

Happy RPC spamming 🤝

# Credits
This software uses some code from the following open source packages:
- [Mango v4](https://github.com/blockworks-foundation/mango-v4)
- [Helium program library](https://github.com/helium/helium-program-library)
