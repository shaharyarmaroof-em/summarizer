module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: [
    ".eslintrc.cjs",
    "plugins/**/*.eslintrc.js", // Ignore plugin eslint file
  ],
  extends: ["airbnb-base", "airbnb-typescript/base", "eslint-config-prettier"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      files: ["**/*.{test,spec}.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "implicit-arrow-linebreak": "off",
    "linebreak-style": "off",
    "nonblock-statement-body-position": "off",

    "max-len": "off",
    "operator-linebreak": "off",
    "object-curly-newline": "off",
    "max-lines": "off",
    semi: "off",

    "function-paren-newline": "off",
    "func-call-spacing": "off",
    "spaced-comment": [
      "error",
      "always",
      {
        markers: ["/**"],
      },
    ],
    "space-before-function-paren": "off",
    "default-param-last": "error",

    "no-console": "warn",
    "no-param-reassign": [
      2,
      {
        props: false,
      },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "ForInStatement",
        message:
          "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
      },
      {
        selector: "LabeledStatement",
        message:
          "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
      },
      {
        selector: "WithStatement",
        message:
          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
    ],

    "no-unreachable": "error",
    "no-trailing-spaces": "error",
    "no-confusing-arrow": "error",
    "no-spaced-func": "error",
    "no-unused-vars": "off", // Handled by typescript
    "no-return-assign": "error",
    "no-underscore-dangle": "error",
    radix: "off",

    "max-classes-per-file": "off",
    "class-methods-use-this": "off",
    "arrow-body-style": "off",

    "import/extensions": "off",
    "import/order": "off",
    "import/no-cycle": "warn",
    // handled by https://www.npmjs.com/package/prettier-plugin-organize-imports
    "import/no-extraneous-dependencies": "off",

    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-assertions": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/quotes": "off",
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        // Disable the rule for side effect imports
        disallowTypeAnnotations: false,
      },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-indexed-object-style": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/semi": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/space-before-function-paren": "off",
    "@typescript-eslint/promise-function-async": "off",
    "@typescript-eslint/strict-boolean-expressions": "off", // Turned off to use falsy values directly
    "@typescript-eslint/return-await": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/default-param-last": "error",
    "@typescript-eslint/no-shadow": "off",
  },
};
