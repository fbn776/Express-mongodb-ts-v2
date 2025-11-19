import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Fix __dirname in ES modules
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize S3 client
const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT, // needed only for MinIO, Wasabi, etc.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // replaces s3ForcePathStyle
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
});

// -------- Upload File --------
export async function uploadFile(file_data: { file: string | any[]; fileName: any; fileExtension: any; path: any; contentType: any; }) {
    try {
        const fileSizeInBytes = file_data?.file?.length;
        const MAX_FILE_SIZE = 5 * 1024 * 1024;

        if (fileSizeInBytes > MAX_FILE_SIZE) {
            throw new Error("File size should be less than 5 MB");
        }

        const fileName = `${file_data?.fileName}.${file_data?.fileExtension}`;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file_data?.path ? `${file_data?.path}/${fileName}` : `files/${fileName}`,
            Body: file_data?.file,
            ContentType: file_data?.contentType,
        };

        // @ts-ignore
        await s3.send(new PutObjectCommand(params));

        // Generate a public URL if using AWS S3 (for other providers, URL rules may differ)
        const fileUrl = `${process.env.S3_ENDPOINT || `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`}/${params.Key}`;

        return fileUrl;
    } catch (error) {
        throw error;
    }
}

// -------- List Files --------
export async function listFiles(files_data: { directory: any; type: string; }) {
    try {
        if (!files_data?.directory) throw new Error("Directory is required");

        if (files_data?.type === "local") {
            const directoryPath = path.join(__dirname, `../${files_data.directory}`);
            const files = fs
                .readdirSync(directoryPath)
                .filter((file) => fs.statSync(path.join(directoryPath, file)).isFile());
            return files;
        }

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: `${files_data.directory}`,
        };

        const data = await s3.send(new ListObjectsV2Command(params));
        // @ts-ignore
        return (data.Contents || []).filter((file) => !file.Key.endsWith("/"));
    } catch (error) {
        throw error;
    }
}

// -------- List Files Without Extension --------
export async function listFilesWithoutExtension(files_data: { directory: any; type: string; }) {
    try {
        if (!files_data?.directory) throw new Error("Directory is required");

        if (files_data?.type === "local") {
            const directoryPath = path.join(__dirname, `../${files_data.directory}`);
            const files = fs
                .readdirSync(directoryPath)
                .filter((file) => fs.statSync(path.join(directoryPath, file)).isFile())
                .map((file) => path.parse(file).name);
            return files;
        }

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: `${files_data.directory}`,
        };

        const data = await s3.send(new ListObjectsV2Command(params));
        return (data.Contents || [])
            // @ts-ignore
            .filter((file) => !file.Key.endsWith("/"))
            // @ts-ignore
            .map((file) => path.parse(file.Key).name);
    } catch (error) {
        throw error;
    }
}
