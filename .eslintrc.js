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
        "import/prefer-default-export": "off"
    }
};
