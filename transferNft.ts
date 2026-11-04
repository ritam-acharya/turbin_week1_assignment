import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchAsset, transfer } from '@metaplex-foundation/mpl-core'
import { mplCore } from '@metaplex-foundation/mpl-core'
import { createSignerFromKeypair, publicKey, signerIdentity } from '@metaplex-foundation/umi'
import bs58 from 'bs58';
import dotenv from "dotenv";


dotenv.config();

async function transferNft(assetPubkey: string) {
    let secretKey = process.env.PAYER_SECRET_KEY!;
    secretKey = secretKey.trim();
    // Initialize UMI
    let umi = createUmi('https://api.devnet.solana.com')
    .use(mplCore())

    const assetAddress = publicKey(assetPubkey);
    const assetAccount = await fetchAsset(umi, assetAddress);

    // 2. Create the keypair and signer
    const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(secretKey));
    const myKeypairSigner = createSignerFromKeypair(umi, keypair);
    umi = umi.use(signerIdentity(myKeypairSigner));

    // Transfer an existing NFT asset to a new owner
    const result = await transfer(umi, {
    asset: assetAccount,
    newOwner: publicKey('3MsX76eGtDR2NqHN487aUD9FTQ5dxksUPMzKC4YKJ92V'),
    }).sendAndConfirm(umi)

    console.log('Asset transferred:', result.signature)
}

transferNft("E75DhXRCbkcJF4LzoGcXEfvGWQJoKbBVKgbc2GJ66Hjs");