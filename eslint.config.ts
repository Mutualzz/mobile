import { react } from "@mutualzz/eslint-config";

export default [
    {
        ignores: [
            ".expo/**",
            "android/**",
            "ios/**",
            "node_modules/**",
            "eslint.config.ts",
        ],
    },
    ...react,
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-this-alias": "off",
            "react/no-children-prop": "off",
        },
    },
];
