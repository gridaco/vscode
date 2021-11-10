// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { __register_auth_manager } from "./auth";
import {
  GridaExplorerScenesProvider,
  __register_help_and_feedback,
  GridaExplorerPreviewProvider,
  GridaExplorerLiveTreeProvider,
} from "./grida-explorer";
import { CodeEmbedVscodePanel } from "./panel-webview-embed";
import { __register_v_doc } from "./virtual";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  __register_commands(context);
  __register_v_doc(context);

  __register_auth_manager(context);

  vscode.authentication.getSession("grida", [], {}).then((session) => {
    console.log("session", session);
  });

  // register grida explorer data provider
  vscode.window.registerTreeDataProvider(
    "grida-explorer-project-scenes",
    new GridaExplorerScenesProvider(vscode.workspace.rootPath as string)
  );

  vscode.authentication.onDidChangeSessions((e) => {
    if (e.provider.id === "grida") {
      console.log("session changed", e);
      // register after-auth initalization here.
    }
  });

  vscode.window.registerTreeDataProvider(
    "grida-explorer-live",
    // "live" uses singleton
    GridaExplorerLiveTreeProvider.Instance
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GridaExplorerPreviewProvider.viewType,
      new GridaExplorerPreviewProvider(context.extensionUri)
    )
  );

  __register_help_and_feedback();
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
