import typescript from "@typescript-eslint/eslint-plugin"
import parserTs from "@typescript-eslint/parser"
import globals from "globals"
import { default as eslintPluginAstro } from "eslint-plugin-astro"
import js from "@eslint/js"
import jsxA11y from "eslint-plugin-jsx-a11y"
import tseslint from "typescript-eslint"

export default [
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  // ...eslintPluginAstro.configs.recommended,
  ...tseslint.configs.recommended,
  js.configs.recommended,

  {
    ignores: ["**/node_modules/**", "**/.astro/**", "**/public/**", "**/dist/**", "**/**.d.ts"],
  },
  {
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      eslintPluginAstro,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "no-unused-vars": "off", // ❌ turn off base rule
      "@typescript-eslint/no-unused-vars": "error",

      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "no-multi-assign": "error",

      // ref: https://github.com/antfu/eslint-config/blob/main/src/configs/javascript.ts
      "array-callback-return": "error",
      "block-scoped-var": "error",
      "constructor-super": "error",
      "default-case-last": "error",
      "dot-notation": ["error", { allowKeywords: true }],
      eqeqeq: ["error", "smart"],
      "new-cap": ["error", { capIsNew: false, newIsCap: true, properties: true }],
      "no-alert": "error",
      "no-array-constructor": "error",
      "no-async-promise-executor": "error",
      "no-caller": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-const-assign": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-eval": "error",
      "no-ex-assign": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-implied-eval": "error",
      "no-import-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-iterator": "error",
      "no-labels": ["error", { allowLoop: false, allowSwitch: false }],
      "no-lone-blocks": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-multi-str": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-native-nonconstructor": "error",
      "no-new-wrappers": "error",
      "no-obj-calls": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-proto": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": ["error", { builtinGlobals: false }],
      "no-regex-spaces": "error",
      "no-restricted-globals": [
        "error",
        { message: "Use `globalThis` instead.", name: "global" },
        { message: "Use `globalThis` instead.", name: "self" },
      ],
      "no-restricted-properties": [
        "error",
        { message: "Use `Object.getPrototypeOf` or `Object.setPrototypeOf` instead.", property: "__proto__" },
        { message: "Use `Object.defineProperty` instead.", property: "__defineGetter__" },
        { message: "Use `Object.defineProperty` instead.", property: "__defineSetter__" },
        { message: "Use `Object.getOwnPropertyDescriptor` instead.", property: "__lookupGetter__" },
        { message: "Use `Object.getOwnPropertyDescriptor` instead.", property: "__lookupSetter__" },
      ],
      "no-restricted-syntax": ["error", "TSEnumDeclaration[const=true]", "TSExportAssignment"],
      "no-self-assign": ["error", { props: true }],
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error",
      "no-this-before-super": "error",
      "no-throw-literal": "error",
      "no-undef-init": "error",
      "no-unexpected-multiline": "error",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": ["error", { defaultAssignment: false }],
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTaggedTemplates: true,
          allowTernary: true,
        },
      ],
      "no-use-before-define": ["error", { classes: false, functions: false, variables: true }],
      "no-useless-backreference": "error",
      "no-useless-call": "error",
      "no-useless-catch": "error",
      "no-useless-computed-key": "error",
      "no-useless-constructor": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-with": "error",
      "object-shorthand": [
        "error",
        "always",
        {
          avoidQuotes: true,
          ignoreConstructors: false,
        },
      ],
      "one-var": ["error", { initialized: "never" }],
      "prefer-arrow-callback": [
        "error",
        {
          allowNamedFunctions: false,
          allowUnboundThis: true,
        },
      ],
      "prefer-const": [
        "warn",
        {
          destructuring: "all",
          ignoreReadBeforeAssign: true,
        },
      ],
      "prefer-exponentiation-operator": "error",
      "prefer-promise-reject-errors": "error",
      "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      "symbol-description": "error",
      "unicode-bom": ["error", "never"],
      "use-isnan": ["error", { enforceForIndexOf: true, enforceForSwitchCase: true }],
      "valid-typeof": ["error", { requireStringLiterals: true }],
      "vars-on-top": "error",
      yoda: ["error", "never"],
    },
  },

  // Overrides for .astro files
  {
    files: ["*.astro"],
    languageOptions: {
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: parserTs,
        extraFileExtensions: [".astro"],
        project: "./tsconfig.json",
        tsconfigRootDir: new URL(".", import.meta.url).pathname,
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "deprecation/deprecation": "off",
      ...eslintPluginAstro.configs.recommended.rules,
    },
    plugins: {
      eslintPluginAstro,
      typescript,
    },
    settings: {},
  },

  // TypeScript files
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    plugins: {
      "@typescript-eslint": typescript,
    },
    languageOptions: {
      parser: parserTs,
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-param-reassign": "error",
    },
  },
]
