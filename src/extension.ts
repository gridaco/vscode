// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { __register_auth_manager } from "./auth";
import {
  GridaExplorerScenesProvider,
  GridaExplorerHelpProvider,
  GridaExplorerPreviewProvider,
} from "./grida-explorer";
import { CodeEmbedVscodePanel } from "./panel-webview-embed";
import { __register_v_doc } from "./virtual";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  __register_commands(context);
  __register_v_doc(context);
  __register_auth_manager(context);

  //
  vscode.authentication.getSession("grida", [], {
    clearSessionPreference: true,
    createIfNone: true,
  });

  // register grida explorer data provider
  vscode.window.registerTreeDataProvider(
    "grida-explorer-project-scenes",
    new GridaExplorerScenesProvider(vscode.workspace.rootPath as string)
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GridaExplorerPreviewProvider.viewType,
      new GridaExplorerPreviewProvider(context.extensionUri)
    )
  );

  // vscode.window.createWebviewPanel
  const helpTreeView = vscode.window.createTreeView(
    "grida-explorer-help-and-feedback",
    {
      treeDataProvider: new GridaExplorerHelpProvider(),
    }
  );

  helpTreeView.onDidChangeSelection((e) => {
    e.selection.forEach((item) => {
      item.handleClick();
    });
  });
}

function __register_commands(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "grida-vscode-extension.enter-assistant-live-session",
      () => {
        CodeEmbedVscodePanel.createOrShow(context.extensionUri);
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
