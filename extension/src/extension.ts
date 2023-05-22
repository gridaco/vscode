import * as vscode from "vscode";
import { __register_auth_manager, __request_login_if_not } from "./auth";
import {
  __register_command_open_in_vdoc_editor,
  __register_help_and_feedback_view,
  __register_live_session_view,
  __register_previewer_view,
} from "./grida-explorer";
import { GRIDA_VDOC_SCHEME } from "./k";
import { CodeEmbedVscodePanel } from "./panel-webview-embed";
import { __register_v_doc } from "./virtual";
import __register_flutter_preview, {
  deactivate as __deactivate_flutter_preview,
} from "./support-flutter-preview";
import { config } from "./_envs";

// since we can't use dotenv-webpack, we load .env for our extension here in runtime.
config();

console.log("mode", process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  console.log("env", process.env);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  __register_commands(context);
  __register_v_doc(context);

  __register_auth_manager(context);
  __request_login_if_not(context);

  // (not ready) register grida explorer data provider
  // vscode.window.registerTreeDataProvider(
  //   "grida-explorer-project-scenes",
  //   new GridaExplorerScenesProvider(vscode.workspace.rootPath as string)
  // );

  vscode.authentication.onDidChangeSessions((e) => {
    if (e.provider.id === "grida") {
      console.log("session changed", e);
      // register after-auth initalization here.
    }
  });

  __register_previewer_view(context);
  console.log("registering live session view...");
  __register_live_session_view(context);
  __register_help_and_feedback_view();

  __register_flutter_preview(context);
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

  __register_command_open_in_vdoc_editor(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "grida-open-v-doc-load-from-input-url",
      async () => {
        const what = await vscode.window.showInputBox({
          placeHolder: "Your Figma design url",
        });
        if (what) {
          const uri = vscode.Uri.parse(
            GRIDA_VDOC_SCHEME + ":" + "docs-annotation.example.tsx"
          );
          const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
          await vscode.window.showTextDocument(doc, { preview: false });
        }
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  __deactivate_flutter_preview();
}
