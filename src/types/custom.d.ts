interface GlobalVersionInfo {
    app: string;
    platform: {
        name: string;
        arch: string;
        version: string;
        locale: string | null;
    };
}
