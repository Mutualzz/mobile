import { deflate, inflate } from "pako";

export type Compression = "none" | "zlib-stream";

export interface Compressor {
    name: Compression;
    compress(bytes: Uint8Array): Uint8Array;
    decompress(bytes: Uint8Array): Uint8Array;
}

export async function createCompressor(name: Compression): Promise<Compressor> {
    if (name === "zlib-stream") {
        return {
            name: "zlib-stream",
            compress: (b) => deflate(b, { level: 6 }),
            decompress: (b) => inflate(b),
        };
    }

    return {
        name: "none",
        compress: (b) => b,
        decompress: (b) => b,
    };
}
