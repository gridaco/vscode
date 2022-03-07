import * as vscode from "vscode";
import { GridaExplorerPreviewProvider } from "./grida-explorer-preview-webview";

export { GridaExplorerPreviewProvider };

export function __register_previewer_view(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GridaExplorerPreviewProvider.viewType,
      GridaExplorerPreviewProvider.Instance
    )
  );
}
