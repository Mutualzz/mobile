import { JSONReplacer } from "./JSON";

export type Encoding = "json" | "etf";

export interface Codec {
    name: Encoding;
    encode(data: any): Uint8Array;
    decode(bytes: Uint8Array): any;
}

export async function createCodec(name: Encoding): Promise<Codec> {
    if (name === "etf") {
        return {
            name: "json",
            encode: (d) =>
                new TextEncoder().encode(JSON.stringify(d, JSONReplacer)),
            decode: (b) => JSON.parse(new TextDecoder().decode(b)),
        };
    }

    return {
        name: "json",
        encode: (d) =>
            new TextEncoder().encode(JSON.stringify(d, JSONReplacer)),
        decode: (b) => JSON.parse(new TextDecoder().decode(b)),
    };
}
