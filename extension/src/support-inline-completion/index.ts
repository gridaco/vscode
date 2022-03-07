import * as vscode from "vscode";

function reg() {
  let someTrackingIdCounter = 0;

  const provider: vscode.InlineCompletionItemProvider = {
    provideInlineCompletionItems: async (
      document,
      position,
      context,
      token
    ) => {
      console.log("provideInlineCompletionItems triggered");

      const regexp = /\/\/ \[(.+),(.+)\)\:(.*)/;
      if (position.line <= 0) {
        return;
      }

      const lineBefore = document.lineAt(position.line - 1).text;
      const matches = lineBefore.match(regexp);
      if (matches) {
        const start = matches[1];
        const startInt = parseInt(start, 10);
        const end = matches[2];
        const endInt =
          end === "*"
            ? document.lineAt(position.line).text.length
            : parseInt(end, 10);
        const text = matches[3].replace(/\\n/g, "\n");

        return [
          {
            text,
            range: new vscode.Range(
              position.line,
              startInt,
              position.line,
              endInt
            ),
            someTrackingId: someTrackingIdCounter++,
          },
        ] as DefaultInlineCompletionItem[];
      }
    },
  };

  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" },
    provider
  );

  // Be aware that the API around `getInlineCompletionItemController` will not be finalized as is!
  vscode.window
    .getInlineCompletionItemController(provider)
    .onDidShowCompletionItem((e) => {
      const id = (e.completionItem as DefaultInlineCompletionItem)
        .someTrackingId;
    });
}

interface DefaultInlineCompletionItem extends vscode.InlineCompletionItem {
  someTrackingId: number;
}
