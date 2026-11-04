import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { burn, fetchAsset} from '@metaplex-foundation/mpl-core'
import { mplCore } from '@metaplex-foundation/mpl-core'
import { createSignerFromKeypair, publicKey, signerIdentity } from '@metaplex-foundation/umi'
import bs58 from 'bs58';
import dotenv from "dotenv";


dotenv.config();

async function burnNft(assetPubkey: string) {
        
    let newOwnerSecretKey = process.env.NEW_OWNER_SECRET_KEY!;
    newOwnerSecretKey = newOwnerSecretKey.trim();
    // Initialize UMI
    let umi = createUmi('https://api.devnet.solana.com')
    .use(mplCore())

    const assetAddress = publicKey(assetPubkey);
    const assetAccount = await fetchAsset(umi, assetAddress);

    // 2. Create the keypair and signer
    const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(newOwnerSecretKey));
    const newOwnerKeypairSigner = createSignerFromKeypair(umi, keypair);
    umi = umi.use(signerIdentity(newOwnerKeypairSigner));

    // Transfer an existing NFT asset to a new owner
    const result = await burn(umi, {
    asset: assetAccount
    }).sendAndConfirm(umi)

    console.log('Asset burned successfully', bs58.encode(result.signature));
}

burnNft("E75DhXRCbkcJF4LzoGcXEfvGWQJoKbBVKgbc2GJ66Hjs");