# modern-node-template

Template repository for creating packages targeting modern Node.JS (>=14) with support for native ECMAScript modules, private class fields and other ES2020 features.

- ESLint 7 configured to support ES2020 features, including shipped proposals (via @typescript-eslint/parser)
- mocha 7.2 supporting native modules
- V8 native code coverage via `c8`
- Husky+ling-staged for Prettier, as well as configured VSCode extensions
- VSCode debug configuration
- nvm settings
- Codecov settings and GitHub Action integration
- VSCode TypeScript Intellisense for JavaScript
- Renovate
