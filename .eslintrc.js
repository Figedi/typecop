module.exports = {
    extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'prettier'
    ],
    env: {
        node: true,
        browser: false,
        jest: false,
        mocha: true,
    },
    parserOptions: {
        project: "./tsconfig.json",
    },
    rules: {
        "quotes": "off",
        "@typescript-eslint/quotes": ["error"],
        "import/prefer-default-export": "off"
    },
};
