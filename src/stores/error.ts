
export interface IStoreErrorConstructorOptions {
    originalError?: Error;
    message: string;
    uploadFailed?: boolean;
    getFileFailed?: boolean;
}

export class StoreError extends Error {

    originalError?: Error;
    uploadFailed: boolean;
    getFileFailed: boolean;
    stack?: string;

    constructor(options: IStoreErrorConstructorOptions) {
        super(options.message);

        this.originalError = options.originalError;
        this.uploadFailed = !!options.uploadFailed;
        this.getFileFailed = !!options.getFileFailed;
    }
}