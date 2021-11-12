import * as vscode from "vscode";
import { GRIDA_VDOC_SCHEME } from "../k";

export function __register_v_doc({ subscriptions }: vscode.ExtensionContext) {
  const gridaDocProvider = new (class
    implements vscode.TextDocumentContentProvider
  {
    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): string {
      // simply invoke cowsay, use uri-path as text
      return "//Ahoy!!!";
    }
  })();

  subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      GRIDA_VDOC_SCHEME,
      gridaDocProvider
    )
  );
}
