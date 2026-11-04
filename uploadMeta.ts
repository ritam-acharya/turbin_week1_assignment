import { 
    TurboFactory, 
    TurboAuthenticatedClient, 
    lamportToTokenAmount,  
} from '@ardrive/turbo-sdk';

import path from 'path';
import fs from 'fs';
import BigNumber from 'bignumber.js';

let secretKey = process.env.PAYER_SECRET_KEY!;
secretKey = secretKey.trim();


const metadataFolderPath = path.join(__dirname, './metadata');

async function uploadMetadata(turbo: TurboAuthenticatedClient) {
    // Calculate the lamport required for uploading the metadata folder
    const requiredLamportsForMetadata = await calculateRequiredLamportsForUpload(
        turbo,
        calculateFolderSize(metadataFolderPath)
    );

    // Top up wallet if required
    await turbo.topUpWithTokens({tokenAmount: lamportToTokenAmount(requiredLamportsForMetadata)});

    // Upload metadata folder
    const metadataUploadResponse = await turbo.uploadFolder({
        folderPath: metadataFolderPath,
        dataItemOpts: { tags: [{ name: 'Content-Type', value: 'application/json' }] },
    });

    console.log('Metadata Manifest ID:', metadataUploadResponse.manifestResponse?.id);
}

function calculateFolderSize(folderPath: string): number {
  return fs.readdirSync(folderPath).reduce((totalSize, item) => {
    const fullPath = path.join(folderPath, item);
    
    const stats = fs.statSync(fullPath);

    return stats.isFile() 
        ? totalSize + stats.size 
        : totalSize + calculateFolderSize(fullPath);
  }, 0);
}

async function calculateRequiredLamportsForUpload(turbo: TurboAuthenticatedClient, fileSize: number): Promise<number> {
    /// If the file size is less than 105 KiB, then we don't need to pay for it
    if (fileSize < 107_520) { return 0; }

    /// Check how many winc does it cost to upload the file
    const uploadPrice = new BigNumber((await turbo.getUploadCosts({ bytes: [fileSize]}))[0]!.winc);

    /// Check the current Winc balance
    const currentBalance = new BigNumber((await turbo.getBalance()).winc);

    /// Calculate how much Winc is required to upload the file
    const requiredWinc = uploadPrice.isGreaterThan(currentBalance)
        ? uploadPrice.minus(currentBalance)
        : new BigNumber(0); // If balance is enough, no Winc is required

    /// If the required Winc is 0, we already have enough to upload the file
    if (requiredWinc.isEqualTo(0)) { return 0; }

    /// Calculate how much Winc 1 SOL is worth (1 SOL = 1_000_000_000 Lamports)
    const wincForOneSol = new BigNumber((await turbo.getWincForToken({ tokenAmount: 1_000_000_000 })).winc);

    /// Calculate how much SOL is required to upload the file (return in SOL)
    const requiredSol = requiredWinc.dividedBy(wincForOneSol).toNumber();

    /// Return the amount of SOL required in Lamports
    return Math.ceil(requiredSol * 1_000_000_000)
}

// uncomment and run this if airdroping takes time and your code returns error
// async function uploadMetadata(turbo: TurboAuthenticatedClient) {
//     // Manually submit the successful transaction ID so Turbo credits your balance
//     const stuckTxId = "4Gzecu76W68w4Lqd45jTpE2TZTJyPXuK6Gd7UWWTEA5bVGNc83XAwRS9LumRN3tLSTenZALaHnkq6uHWfAEcaNFj";
    
//     console.log("Submitting previous fund transaction to Turbo...");
//     try {
//         await turbo.submitFundTransaction({
//             txId: stuckTxId
//         });
//         console.log("Fund transaction successfully registered with Turbo!");
//     } catch (e) {
//         console.log("Transaction might already be registered, proceeding to upload...", e);
//     }

//     // Upload metadata folder
//     const metadataUploadResponse = await turbo.uploadFolder({
//         folderPath: metadataFolderPath,
//         dataItemOpts: { tags: [{ name: 'Content-Type', value: 'application/json' }] },
//     });

//     console.log('Metadata Manifest ID:', metadataUploadResponse.manifestResponse?.id);
// }

async function uploader() {
    try {
        /// Step 1: Setup Turbo
        const turbo = TurboFactory.authenticated({
            privateKey: secretKey,
            token: 'solana',
            gatewayUrl: `https://api.devnet.solana.com`,
            paymentServiceConfig: { url: 'https://payment.services.ar-io.dev' },
            uploadServiceConfig: { url: 'https://upload.services.ar-io.dev' },
        });

        /// Step 2: Upload Metadata
        await uploadMetadata(turbo);
    } catch (error) {
        console.error("Error during execution:", error);
    }
}

uploader();