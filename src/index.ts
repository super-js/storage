import {S3Store} from "./stores/s3";
import {LocalStore} from "./stores/local";

export const AVAILABLE_STORES = {
    [S3Store.STORE_TYPE_NAME]: S3Store,
    [LocalStore.STORE_TYPE_NAME]: LocalStore
}

export * from './stores/s3';
export * from './stores/local';
export * from './stores/base';
export * from './stores/error';