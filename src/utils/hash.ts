import MurmurHash from "imurmurhash";

export const murmur = (input: string): string =>
    MurmurHash(input).result().toString();
