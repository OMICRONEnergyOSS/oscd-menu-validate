declare const schemas: {
    '2003': string;
    '2007B': string;
    '2007B4': string;
};
type SupportedVersion = keyof typeof schemas;
export declare function getSchemaKey(version: string, revision: string, release: string): SupportedVersion | null;
export declare function getSchema(version: string, revision: string, release: string): string | null;
export {};
