import S3 from "aws-sdk/clients/s3";
import {BaseStore, IFileInfo, IGetFilesOptions, IUploadedFile} from "./base";
import {StoreError} from "./error";
import path from "path";

export interface IS3StoreConstructorOptions {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
}

export interface IS3BucketOptions {
    name: string;
    acl?: "private" | "public-read" | "public-read-write" | "authenticated-read";
}

export interface ICreateS3StoreOptions extends IS3StoreConstructorOptions {
    bucket: IS3BucketOptions;
}

export class S3Store extends BaseStore {

    _s3: S3;
    _region: string;
    _bucketName: string;

    constructor(options: IS3StoreConstructorOptions) {
        super();

        const {accessKeyId, secretAccessKey, region} = options;

        this._region = region || "ap-southeast-2";

        this._s3 = new S3({
            credentials: {accessKeyId, secretAccessKey},
            region: this._region,
        })

    }

    static async createS3Store(options: ICreateS3StoreOptions): Promise<S3Store> {
        const {bucket, ...s3StoreOptions} = options;

        const s3Store = new S3Store(s3StoreOptions);
        await s3Store.setBucket(bucket);

        return s3Store;
    }

    async setBucket(bucket: IS3BucketOptions) {
        try {

            await this._s3.headBucket({
                Bucket: bucket.name
            }).promise();
            this.setBucketName(bucket.name);

        } catch(err) {
            if(err.code && err.code === "NotFound") {

                await this.createBucket(bucket);
                this.setBucketName(bucket.name);

            } else {
                throw new StoreError({
                    originalError: err,
                    message: `Unable to check S3 Bucket ${bucket.name} - Please check your AWS credentials and permissions`
                })
            }
        }
    }

    async createBucket(bucket: IS3BucketOptions): Promise<void> {
        try {
            await this._s3.createBucket({
                Bucket: bucket.name,
                ACL: bucket.acl || "private",
                CreateBucketConfiguration: {
                    LocationConstraint: this._region
                }
            }).promise();

            await this._s3.putBucketEncryption({
                Bucket: bucket.name,
                ServerSideEncryptionConfiguration: {
                    Rules: [
                        {ApplyServerSideEncryptionByDefault: {
                            SSEAlgorithm: "AES256"
                        }}
                    ]
                }
            });

        } catch(err) {
            throw new StoreError({
                originalError: err,
                message: `Unable to create S3 Bucket ${bucket.name} - Please check your AWS credentials and permissions`
            })
        }
    }

    setBucketName(bucketName: string) {
        this._bucketName = bucketName;
    }

    getBucketName() {
        return this._bucketName;
    }

    async uploadFiles(options): Promise<IUploadedFile[]> {
        try {
            const {files} = options;

            return Promise.all(files.map(async file => {

                const s3key = this.getFullFilePath(file);

                const uploadedFile = await this._s3.upload({
                    Key: s3key,
                    Bucket: this.getBucketName(),
                    Body: file.buffer,
                    ServerSideEncryption: "AES256",
                    ContentType: file.contentType,
                    ContentEncoding: file.contentEncoding,
                    Metadata: file.data
                }).promise();

                return {
                    fullFilePath: uploadedFile.Key,
                    url: uploadedFile.Location,
                    eTag: uploadedFile.ETag
                }

            }));

        } catch(err) {
            throw new StoreError({
                message: `Unable to upload files, please check AWS credentials and Bucket permissions`,
                uploadFailed: true,
                originalError: err
            })
        }
    }

    async getFiles(options): Promise<IFileInfo[]> {
        try {
            return Promise.all(options.fileKeys.map(async fileKey => {
                const file = await this._s3.getObject({
                    Bucket: this._bucketName,
                    Key: fileKey
                }).promise();

                return {
                    buffer: file.Body,
                    contentType: file.ContentType,
                    contentLength: file.ContentLength,
                    contentEncoding: file.ContentEncoding,
                    eTag: file.ETag,
                    data: file.Metadata,
                    fileName: path.basename(fileKey),
                    path: path.dirname(fileKey)
                }
            }))
        } catch(err) {
            throw new StoreError({
                message: `Unable to download files, please check AWS credentials, Bucket permissions and whether all the files exist`,
                getFileFailed: true,
                originalError: err
            })
        }
    }

}