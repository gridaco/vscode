# Working with `package.json`

run

```sh
yarn vscode:packagejson
```

## Note - do not directly edit `package.json`

Since vscode contribution point declaration in package.json is hard to work with, (can't use comments or en/disabling commands) we chose to use a separate file, merging the final package.json with [this script](./scripts/copy-vscode-attributes.js)
