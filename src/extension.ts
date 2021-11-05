// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { GridaExplorerTreeProvider } from "./grida-explorer";
import { CodeEmbedVscodePanel } from "./panel-webview-embed";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  __register_commands(context);

  // register grida explorer data provider
  vscode.window.registerTreeDataProvider(
    "grida-explorer",
    new GridaExplorerTreeProvider(vscode.workspace.rootPath as string)
  );
}

function __register_commands(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  const disposable_enter_live_session = vscode.commands.registerCommand(
    "grida-vscode-extension.enter-assistant-live-session",
    () => {
      CodeEmbedVscodePanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(disposable_enter_live_session);
}

// this method is called when your extension is deactivated
export function deactivate() {}
