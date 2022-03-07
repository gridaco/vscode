import * as vscode from "vscode";
import { GridaExplorerHelpProvider } from "./grida-explorer-help-provider";

// eslint-disable-next-line @typescript-eslint/naming-convention
export function __register_help_and_feedback_view() {
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

export { GridaExplorerHelpProvider };
