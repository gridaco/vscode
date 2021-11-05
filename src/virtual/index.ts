import * as vscode from "vscode";

/**
 * `gvd:virtual-file.tsx` will be recognized as v doc
 */
const GRIDA_VDOC_SCHEME = "gvd";

export function __register_v_doc({ subscriptions }: vscode.ExtensionContext) {
  const myProvider = new (class implements vscode.TextDocumentContentProvider {
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
      myProvider
    )
  );

  // register a command that opens a cowsay-document
  subscriptions.push(
    vscode.commands.registerCommand("grida-open-v-doc", async () => {
      // TODO: - how to open from current selection?
    })
  );

  subscriptions.push(
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
