// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CodeEmbedVscodePanel } from "./panel-webview-embed";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable_hello_world = vscode.commands.registerCommand(
    "grida-vscode-extension.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from grida!");
    }
  );

  const disposable_enter_live_session = vscode.commands.registerCommand(
    "grida-vscode-extension.enter-assistant-live-session",
    () => {
      CodeEmbedVscodePanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(disposable_hello_world);
  context.subscriptions.push(disposable_enter_live_session);
}

// this method is called when your extension is deactivated
export function deactivate() {}
