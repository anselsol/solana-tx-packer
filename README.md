<p align="center">
  <a href="https://github.com/anselsol"><img src="https://github.com/anselsol/solana-tx-packer/blob/main/assets/package-new.png?raw=true" alt="Solana Transactions Packer" width="320"></a>
</p>

<h2 align="center">
  ⚡️ Get your transactions ready for takeoff. ⚡️
</h2>


<p align="center">
  <a href="#example">Example</a> •
  <a href="#running-tests">Running tests</a> •
  <a href="#credits">Credits</a>
</p>

## 💁‍♀️ What this packages does
Transform a list of instructions into as many Transactions as necessary with fine tuned Compute Units and Priority Fee setup.

## 🙅 What this packages does not do
Handle sending or confirming the transactions

# Installation [![npm version](https://badge.fury.io/js/solana-tx-packer.svg)](https://badge.fury.io/js/solana-tx-packer)

Yarn:
```zsh
yarn add solana-tx-packer
```

Npm:
```zsh
npm i solana-tx-packer
```

# Example
Let's create a list of 43 basic SOL transfers from wallet A to wallets on devnet:
```ts
import { buildOptimalTransactions } from "solana-tx-packer";

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

`transactions` will contain a list of each 3 transactions (in this example) with their CU budgets and priority fees instructions already included as instructions.

All you need to do is send them sequentially or in parallel depending on what you are doing 

Happy RPC spamming 🤝

## Details
Internally, the function got this data for each of the 3 transactions (it's an example):
```
Priority fees:  100  / CUs:  3240
Priority fees:  100  / CUs:  3240
Priority fees:  100  / CUs:  1458
```

The lib calculates a priority fee (here 100 is the default minimum) alongside the right CU budget.

The CU budget gets a 8% error margin boost, just to be sure.

# Running tests
1. Duplicate the `.env-template`
2. Change TEST_WALLET="wallet in uint8Array format" to the array representation of your private key (make sure to create a test wallet just for this)
3. Go to `https://faucet.solana.com/` to load some SOL on this test wallet
4. Install deps `yarn`
5. Run tests `yarn test`
6. Enjoy!

# Credits
This software uses some code from the following open source packages:
- [Mango v4](https://github.com/blockworks-foundation/mango-v4)
- [Helium program library](https://github.com/helium/helium-program-library)


# License
MIT
