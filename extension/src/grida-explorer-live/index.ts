import * as vscode from "vscode";

import { GridaExplorerLiveTreeProvider } from "./live-tree-provider";

export function __register_live_session_view(context: vscode.ExtensionContext) {
  const liveTreeView = vscode.window.createTreeView("grida-explorer-live", {
    // "live" uses singleton
    treeDataProvider: GridaExplorerLiveTreeProvider.Instance,
  });
  liveTreeView.onDidChangeSelection((e) => {
    e.selection.forEach((item) => {
      item.handleClick();
    });
  });
}
