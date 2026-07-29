interface GlobalVersionInfo {
    app: string;
    platform: {
        name: string;
        arch: string;
        version: string;
        locale: string | null;
    };
}

declare module "*.png" {
    const value: number;
    export default value;
}

declare module "*.wav" {
    const value: number;
    export default value;
}
