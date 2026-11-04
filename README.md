# Solana Week 1 Assignment

This project is a collection of Bun/TypeScript scripts for practicing Solana
development on **devnet**. It demonstrates:

- Creating and transferring an SPL token.
- Uploading NFT assets and JSON metadata through the Arweave/Turbo services.
- Creating, updating, transferring, and burning a Metaplex Core NFT.

The scripts submit real transactions to Solana devnet. They are intended for
testing and learning only; do not use a production wallet or production
endpoints with this code.

## Prerequisites

- [Bun](https://bun.sh/) installed (the project was initialized with Bun
  1.3.9).
- A Solana keypair funded with devnet SOL.
- A base58-encoded private key for that keypair.
- Basic familiarity with Solana accounts, public keys, token accounts, and
  transaction signatures.

You can request devnet SOL from a faucet such as
[faucet.solana.com](https://faucet.solana.com/) or by using the Solana CLI:

```bash
solana config set --url devnet
solana airdrop 2
```

## Installation

Clone the repository, enter the project directory, and install dependencies:

```bash
git clone <repository-url>
cd week1_assignment
bun install
```

This installs the Solana, SPL Token, Metaplex Core, Umi, Turbo, `bs58`, and
`dotenv` dependencies recorded in [`package.json`](./package.json) and
[`bun.lock`](./bun.lock).

## Configuration

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Set the private key for the wallet that pays for transactions:

```dotenv
PAYER_SECRET_KEY=<base58-encoded-secret-key>
```

The burn script signs with a separate owner wallet after the NFT is
transferred. Add this variable when running that script:

```dotenv
NEW_OWNER_SECRET_KEY=<base58-encoded-secret-key>
```

Never commit `.env`, private keys, seed phrases, or wallet JSON files. The
repository ignores local dotenv files through [`.gitignore`](./.gitignore).
Use disposable devnet wallets because the scripts contain fixed example
addresses and perform irreversible blockchain operations such as burning an
NFT.

## Running the scripts

There are no custom package scripts; run each TypeScript file directly with
Bun:

```bash
bun run <file>.ts
```

### Recommended NFT workflow

The NFT scripts use Solana devnet and a metadata URI hosted through ar.io. Run
the operations in this order when starting with the included example:

1. Upload the image assets:

   ```bash
   bun run uploadImage.ts
   ```

   This uploads the [`assets/`](./assets/) directory and prints an assets
   manifest ID.

2. Upload the NFT metadata:

   ```bash
   bun run uploadMeta.ts
   ```

   This uploads [`metadata/metadata.json`](./metadata/metadata.json) with an
   `application/json` content type and prints a metadata manifest ID. If you
   change the image or metadata, update the URI used by `nft.ts` and
   `updateNft.ts` to point to the new uploaded metadata before minting.

3. Mint a Metaplex Core NFT:

   ```bash
   bun run nft.ts
   ```

   The script creates an asset named `My NFT` and prints its asset address.
   Save that address; it is needed by the update and transfer operations.

4. Update the NFT name and metadata URI:

   ```bash
   bun run updateNft.ts
   ```

5. Transfer the NFT to the receiver address configured in
   [`transferNft.ts`](./transferNft.ts):

   ```bash
   bun run transferNft.ts
   ```

6. Burn the NFT from the new owner's wallet:

   ```bash
   bun run burnNft.ts
   ```

   Before running this step, set `NEW_OWNER_SECRET_KEY` and confirm that the
   hard-coded asset address is the NFT you intend to destroy. Burning is
   irreversible.

The asset address is currently embedded in `updateNft.ts`, `transferNft.ts`,
and `burnNft.ts`. Replace it with the address printed by `nft.ts` when working
with a newly minted asset.

### SPL token workflow

Run the complete SPL token example with:

```bash
bun run spl_token.ts
```

The script performs these operations sequentially:

1. Creates a zero-decimal mint.
2. Creates an associated token account (ATA) for the payer.
3. Mints 10 tokens to the payer's ATA.
4. Creates an ATA for the configured receiver.
5. Transfers 5 tokens to the receiver.

The script prints the mint address, ATA addresses, and transaction signatures.
The receiver public key is currently defined in
[`spl_token.ts`](./spl_token.ts); update it before using a different wallet.

## Script reference

| File | Purpose |
| --- | --- |
| [`uploadImage.ts`](./uploadImage.ts) | Uploads the `assets/` directory through Turbo and reports its manifest ID. |
| [`uploadMeta.ts`](./uploadMeta.ts) | Uploads the `metadata/` directory as JSON through Turbo and reports its manifest ID. |
| [`nft.ts`](./nft.ts) | Creates a Metaplex Core NFT on devnet. |
| [`updateNft.ts`](./updateNft.ts) | Updates an existing Core NFT's name and metadata URI. |
| [`transferNft.ts`](./transferNft.ts) | Transfers an existing Core NFT to the configured receiver. |
| [`burnNft.ts`](./burnNft.ts) | Burns an existing Core NFT using the new owner's key. |
| [`spl_token.ts`](./spl_token.ts) | Creates, mints, and transfers a zero-decimal SPL token. |

## Project layout

```text
.
├── assets/                 # Image files uploaded to Turbo
├── metadata/
│   └── metadata.json       # NFT metadata and image URI
├── burnNft.ts              # Burn a Core NFT
├── nft.ts                  # Mint a Core NFT
├── spl_token.ts            # SPL token lifecycle example
├── transferNft.ts          # Transfer a Core NFT
├── updateNft.ts            # Update a Core NFT
├── uploadImage.ts          # Upload image assets
├── uploadMeta.ts           # Upload JSON metadata
├── .env.example            # Environment variable template
├── package.json             # Dependencies and Bun project metadata
└── tsconfig.json            # TypeScript configuration
```

## Network and services

All Solana RPC calls in the scripts target:

```text
https://api.devnet.solana.com
```

The upload scripts use the ar.io payment and upload services through the
Turbo SDK. Upload pricing and required funding depend on the size of the
folder and the current service balance. The scripts calculate the required
amount and top up the Turbo balance when necessary.

## Troubleshooting

- **Invalid or missing secret key:** Verify that the value is base58 encoded,
  contains no surrounding quotes or whitespace, and is assigned to the
  correct environment variable.
- **Insufficient funds:** Fund the payer with devnet SOL. Upload scripts may
  also require Turbo service funding.
- **Account already exists:** The SPL token script creates fresh accounts but
  does not check for existing mint or ATA accounts. Use a fresh run/wallet or
  adapt the script to make account creation idempotent.
- **Wrong NFT address:** Replace the example asset address in the NFT
  operation scripts with the address printed by the mint command.
- **Metadata does not display:** Confirm that the metadata upload completed,
  that `metadata.json` contains a reachable `image` URI, and that the NFT URI
  points to the correct uploaded metadata.
- **Transaction confirmation issues:** Check the printed signature on
  [Solana Explorer](https://explorer.solana.com/?cluster=devnet) with the
  `?cluster=devnet` query parameter.

## License

No license has been specified for this assignment.
