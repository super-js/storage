import {S3Store} from "./stores/s3";

export const AVAILABLE_STORES = [S3Store.STORE_TYPE_NAME];

export * from './stores/s3';
export * from './stores/base';
export * from './stores/error';