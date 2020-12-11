import { v4 as uuidv4 } from 'uuid';

export interface IFileInfo extends IBasicFileInfo {
    buffer: Buffer;
    data?: { [key: string] : any };
    path?: string;
    generateUuid?: boolean;
}

export interface IBasicFileInfo {
    fileName: string;
    contentType: string;
    contentLength?: number;
    contentEncoding?: string;
}

export interface IUploadedFile {
    fullFilePath: string;
    url?: string;
    eTag?: string;
    storageInfo?: any;
}

export interface IUploadFilesOptions {
    files: IFileInfo[]
}

export interface IGetFilesOptions {
    fileKeys: string[];
}

export abstract class BaseStore {

    public abstract uploadFiles(options: IUploadFilesOptions): Promise<IUploadedFile[]>;
    public abstract getFiles(options: IGetFilesOptions): Promise<IFileInfo[]>;
    public abstract getStoreTypeName(): string;

    getFullFilePath(file: IFileInfo): string {
        const fileName = file.generateUuid ? uuidv4() : file.fileName;
        return `${file.path ? file.path : ''}/${fileName}`;
    }
}

