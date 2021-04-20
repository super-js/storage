import {BaseStore, IFileInfo, IUploadedFile, ICreateStoreOptions} from "./base";
import {StoreError} from "./error";
import path from "path";
import fs from "fs";

export interface ICreateLocalStoreOptions extends ICreateStoreOptions {
    baseFullPath: string;
}

export interface ILocalStoreConstructorOptions extends ICreateLocalStoreOptions {
}

export class LocalStore extends BaseStore {

    static STORE_TYPE_NAME = "LOCAL";

    _baseFullPath: string;

    constructor(options: ILocalStoreConstructorOptions) {
        super();

        this._baseFullPath = path.resolve(options.baseFullPath);
    }

    static async createStore(options: ICreateLocalStoreOptions): Promise<LocalStore> {
        return new LocalStore(options);
    }

    getStoreTypeName() {
        return LocalStore.STORE_TYPE_NAME;
    }

    async uploadFiles(options): Promise<IUploadedFile[]> {
        try {
            const {files} = options;

            console.log(options)

            return Promise.all(files.map(async file => {

                const {data = {} } = file;

                return new Promise((resolve, reject) => {

                    const fullFilePath = path.resolve(
                        this._baseFullPath,
                        this.getFullFilePath(file)
                    );

                    fs.writeFile(
                        fullFilePath,
                        file.buffer,
                        err => {
                            if(err) return reject(err);

                            return resolve({
                                fullFilePath,
                                url: fullFilePath,
                                storageInfo: {
                                    fullFilePath,
                                    baseFullPath: this._baseFullPath,
                                    fileName: file.fileName
                                }
                            })
                        }
                    )
                });
            }));

        } catch(err) {
            throw new StoreError({
                message: `Unable to store the files, please check that provided files are in a correct format.`,
                uploadFailed: true,
                originalError: err
            })
        }
    }

    async getFiles(options): Promise<IFileInfo[]> {
        try {
            return Promise.all(options.fileKeys.map(fileKey => {

                return new Promise((resolve, reject) => {
                    fs.readFile(
                        fileKey,
                        (err, fileBuffer) => {
                            if(err) return reject(err);

                            return resolve({
                                buffer: fileBuffer,
                                fileName: path.basename(fileKey),
                                path: path.dirname(fileKey)
                            })
                        }
                    )
                })
            }))
        } catch(err) {
            throw new StoreError({
                message: `Unable to get files, please check that provided file paths are existing and valid.`,
                getFileFailed: true,
                originalError: err
            })
        }
    }

}