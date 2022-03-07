import * as vscode from "vscode";
import { GridaExplorerPreviewProvider } from "../grida-explorer-preview";

export function __register_command_open_in_vdoc_editor(
  context: vscode.ExtensionContext
) {
  // register a command that opens a cowsay-document
  context.subscriptions.push(
    vscode.commands.registerCommand("grida-open-v-doc", async () => {
      // TODO: - how to open from current selection?
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "grida-explorer-preview.open-in-editor",
      () => {
        GridaExplorerPreviewProvider.Instance.openInEditor();
      }
    )
  );
}
