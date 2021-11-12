import * as vscode from "vscode";
import { GRIDA_VDOC_SCHEME } from "../k";

let dangerous_explicitly_set_current_doc_content: string;
export function dangerously_provide_next_document_content(doc: string) {
  dangerous_explicitly_set_current_doc_content = doc;
}

export function __register_v_doc({ subscriptions }: vscode.ExtensionContext) {
  const gridaDocProvider = new (class
    implements vscode.TextDocumentContentProvider
  {
    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): string {
      // TODO: load content from store using uri params.
      return dangerous_explicitly_set_current_doc_content ?? "";
    }
  })();

  subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      GRIDA_VDOC_SCHEME,
      gridaDocProvider
    )
  );
}
