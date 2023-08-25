


import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as schedule from 'node-schedule';

// Configure AWS credentials and region
const awsConfig = {
    credentials: {
        accessKeyId: 'AKIAUFG3RWTFGBO22ANW',
        secretAccessKey: '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'
    },
    region: 'eu-north-1',
    useArnRegion: true
};

// Create an S3 client
const s3Client = new S3Client(awsConfig);

// Local folder to upload
const localFolderPath = path.join(__dirname, 'destination');
const s3BucketName = 'headspintest';

// Recursive function to upload files and subdirectories
async function uploadFolderRecursively(localPath: string, s3KeyPrefix: string): Promise<void> {
    const items = fs.readdirSync(localPath);

    for (const item of items) {
        const itemPath = path.join(localPath, item);
        const s3Key = path.join(s3KeyPrefix, item);

        if (fs.statSync(itemPath).isDirectory()) {
            // Recurse for subdirectories
            await uploadFolderRecursively(itemPath, s3Key);
        } else {
            // Upload files
            const fileContent = fs.readFileSync(itemPath);
            const params = {
                Bucket: s3BucketName,
                Key: s3Key,
                Body: fileContent
            };
            await s3Client.send(new PutObjectCommand(params));
            console.log(`Uploaded: ${s3Key}`);
        }
    }
}

// Start the upload process
const uploadBackup = async () => {
    try {
        const timestamp = new Date().toISOString();
        const backupFileName = `backup_${timestamp}.zip`;
        await uploadFolderRecursively(localFolderPath, backupFileName)
        console.log('Upload completed.');
    } catch (error) {
        console.error('Error uploading:', error);
    }
}

// Schedule backups
schedule.scheduleJob('0 0 * * 0', () => {
    console.log('Performing weekly backup...');
    uploadBackup();
});

schedule.scheduleJob('0 0 1 * *', () => {
    console.log('Performing monthly backup...');
    uploadBackup();
});

uploadBackup();