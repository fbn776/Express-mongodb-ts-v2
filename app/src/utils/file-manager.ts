import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import { Readable } from 'stream';
import * as s3 from "./s3-manager";

export const fileUpload = async function (options: {
    multiple?: boolean,
    files: any[],
    type?: string[],
    maxFileSize?: number,
    uploadPath?: string,
    uploadType?: string
}) {
    return new Promise(async (resolve, reject) => {
        try {
            const defaultOptions = {
                multiple: false,
                files: [],
                type: ['image/jpg', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg', 'image/svg+xml', 'video/mp4', 'video/mpeg', 'application/pdf', 'application/zip', 'application/x-rar-compressed'],
                maxFileSize: 100 * 1024 * 1024, // 100MB
                uploadPath: 'uploads',
                uploadType: 's3' //s3 or local
            };

            // Merge default options with user-provided options
            const config = { ...defaultOptions, ...options };

            const uploadDir = config.uploadPath;
            // Ensure upload directory exists, if uploading locally
            if (config.uploadType === 'local' && !fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Process and save files
            const processFiles = async (files: any[]) => {
                if (!Array.isArray(files)) {
                    files = [files];
                }

                const uploadedFiles = await Promise.all(files.map(async (file) => {
                    // Validate file type
                    if (!config.type.includes(file?.mimetype)) {
                        throw new Error(`Invalid file type. Allowed types: ${config.type.join(', ')}`);
                    }

                    // Validate file size
                    if (file.size > config.maxFileSize) {
                        throw new Error(`File size exceeds limit of ${config.maxFileSize} bytes`);
                    }

                    // Generate unique filename
                    const unique_suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const filename = file.fieldname + '-' + unique_suffix ;
                    const filename_with_extension = filename + path.extname(file.originalname);
                    const filepath = path.join(uploadDir, filename_with_extension);

                    let s3_path = '';

                    if (config.uploadType == 's3') {
                        s3_path = await s3.uploadFile(
                            {
                                file: file.buffer,
                                fileName: filename,
                                fileExtension: file.mimetype.split('/')[1],
                                contentType: file.mimetype,
                                path: uploadDir
                            }
                        );
                    }
                    else {
                        // Create a write stream
                        await new Promise((resolve, reject) => {
                            const writeStream = fs.createWriteStream(filepath);
                            const bufferStream = new Readable();
                            bufferStream.push(file.buffer);
                            bufferStream.push(null);

                            bufferStream.pipe(writeStream);
                            // @ts-ignore
                            writeStream.on('finish', resolve);
                            writeStream.on('error', reject);
                        });
                    }

                    return {
                        name: filename_with_extension,
                        path: (config?.uploadType == "s3") ? s3_path : filepath,
                        mime_type: file.mimetype,
                        size: file.size
                    };
                }));
                
                // If multiple files are not allowed, return only the first file
                if (!config.multiple) {
                    return uploadedFiles[0];
                }
                else {
                    return uploadedFiles;
                }
            };

            // Process files
            const files = config.multiple ? config.files : config.files[0];
            const uploadedFiles = await processFiles(files);
            resolve(uploadedFiles);

        } catch (error) {
            if (process.env.ENVIRONMENT == 'development') console.log(error);
            let error_data = { date: dayjs().format("DD/MM/YYYY HH:mm"), error: error }
            fs.appendFile('./logs/upload-logs.txt', JSON.stringify(error_data) + "\n", (error) => { if (error) console.log(error); });
            reject(error);
        }
    });
}