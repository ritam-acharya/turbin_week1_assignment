import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchAsset, mplCore, update } from '@metaplex-foundation/mpl-core';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

async function updateNft(assetPubkey: string) {
    let secretKey = process.env.PAYER_SECRET_KEY!;
    secretKey = secretKey.trim();

    // 1. Initialize Umi with mplCore
    let umi = createUmi('https://api.devnet.solana.com').use(mplCore());

    // 2. Create the keypair and signer
    const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(secretKey));
    const myKeypairSigner = createSignerFromKeypair(umi, keypair);

    // 3. Reassign umi to include the signer identity
    umi = umi.use(signerIdentity(myKeypairSigner));

    const assetAddress = publicKey(assetPubkey);
    const assetAccount = await fetchAsset(umi, assetAddress);

    // Update an existing NFT asset's metadata
    await update(umi, {
        asset: assetAccount,
        name: 'My Updated NFT',
        uri: 'https://ar-io.dev/nmrremzwvHhxvLeGotPR_iC2UsUyhsTes3kdGJDQlUM/metadata.json',
    }).sendAndConfirm(umi);

    console.log('Asset updated successfully');
}

updateNft("E75DhXRCbkcJF4LzoGcXEfvGWQJoKbBVKgbc2GJ66Hjs");