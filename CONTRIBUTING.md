## Genral contribution

For contributing to this project, read the grida general contribution guideline at - https://github.com/gridaco/contributing-and-license

## The UX Design

[Grida VSCode extension design on Figma](https://www.figma.com/file/7nypWFtOiqRieFkv9Qjmsq)

## Publishing (for Grida team)

Learn more at [publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

```sh
npm install -g @vscode/vsce

cd extension
vsce login grida
vsce package --yarn
vsce publish --yarn
# or with auto version up
vsce publish minor --yarn
```

## Tips (that no one tells you)

- updating the .env variables requires the /dist to be cleared, build from scratch. - restarting the debugging is not enough.
- to access the `process.env`, you need to **fully** specify the variable to read the value, so the value will be included in the bundle. - `console.log(process.env)` won't print your custom variable unless it is explicityly referenced.

## Development references

Here you can find all the real world vscode extension examples by microsoft. - https://github.com/microsoft/vscode-extension-samples

### References - highlights.

- uri handling - https://github.com/microsoft/vscode-extension-samples/tree/main/uri-handler-sample
- [Tree view api](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Webview api](https://code.visualstudio.com/api/extension-guides/webview)
- [Web extension - extension for github.dev](https://code.visualstudio.com/api/extension-guides/web-extensions)
- [Virtual workspace](https://code.visualstudio.com/api/extension-guides/virtual-workspaces)
- [Custom editor](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample)
- [Github Pullrequests extension](https://github.com/microsoft/vscode-pull-request-github)
- [TabNine](https://github.com/codota/TabNine) & [TabNine VSCode extension](https://github.com/codota/tabnine-vscode)
- [VSCode extension monorepo setup with Lerna](https://github.com/IBM-Blockchain/blockchain-vscode-extension)
