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


const imageFolderPath = path.join(__dirname, './assets');

async function uploadAssets(turbo: TurboAuthenticatedClient) {
    // Calculate the lamport required for uploading the assets folder
    const requiredLamportsForAssets = await calculateRequiredLamportsForUpload(
        turbo,
        calculateFolderSize(imageFolderPath)
    );

    // Top up wallet if required
    await turbo.topUpWithTokens({tokenAmount: lamportToTokenAmount(requiredLamportsForAssets)});

    // Upload assets folder
    const assetsUploadResponse = await turbo.uploadFolder({
        folderPath: imageFolderPath
    });

    console.log('Assets Manifest ID:', assetsUploadResponse.manifestResponse?.id);
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

async function uploader() {
    try {
        // Setup Turbo
        const turbo = TurboFactory.authenticated({
            privateKey: secretKey,
            token: 'solana',
            gatewayUrl: `https://api.devnet.solana.com`,
            paymentServiceConfig: { url: 'https://payment.services.ar-io.dev' },
            uploadServiceConfig: { url: 'https://upload.services.ar-io.dev' },
        });

        // Upload assets
        await uploadAssets(turbo);
    } catch (error) {
        console.error("Error during execution:", error);
    }
}

uploader();