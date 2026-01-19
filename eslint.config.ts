import { react } from "@mutualzz/eslint-config";

export default [
    ...react,
    {
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
        ignores: ["*", "!src"],
    },
];
