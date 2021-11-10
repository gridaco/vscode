import * as vscode from "vscode";

interface HistoryItem {}

/**
 * A interactive node interaction history store key
 */
const _key = "grida-vscode.live.interactive-nodes.history";

export class HistoryManager {
  public history: HistoryItem[] = [];
  constructor(private readonly context: vscode.ExtensionContext) {
    this._load();
  }

  private _load() {
    this.history = this.context.workspaceState.get(_key) || [];
  }

  add(item: HistoryItem) {
    this.history.push(item);
    this.context.workspaceState.update(_key, this.history);
  }

  clear() {
    this.history = [];
    this.context.workspaceState.update(_key, this.history);
  }
}
