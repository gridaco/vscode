import * as vscode from "vscode";
import {
  canSuggestInitially,
  getInitialSuggestionsFromFileName,
} from "./suggestions";
import { getcompletion } from "./_demo/api";

export function __register_inlinecompletion(context: vscode.ExtensionContext) {
  console.info("start register:: inline completion");

  const disposable = vscode.commands.registerCommand(
    "extension.inline-completion-settings",
    () => {
      vscode.window.showInformationMessage("Show settings");
    }
  );

  context.subscriptions.push(disposable);

  let someTrackingIdCounter = 0;

  const provider: vscode.InlineCompletionItemProvider = {
    provideInlineCompletionItems: async (
      document,
      position,
      context,
      token
    ) => {
      const { languageId: lang, fileName, uri, getText } = document;
      const raw = getText();

      // test
      const suggestions = await getcompletion(raw);
      return suggestions.map((suggestion) => {
        const { text, index, logprobs, finish_reason } = suggestion;
        const trackingId = someTrackingIdCounter++;
        return new vscode.InlineCompletionItem(
          text,
          new vscode.Range(position, position)
        );
      });

      // initial trigger
      if (canSuggestInitially(document)) {
        //
        return [
          {
            insertText: await getInitialSuggestionsFromFileName(fileName, lang),
            // range: new vscode.Range(
            //   position.line,
            //   0,
            //   position.line,
            //   100
            // ),
            someTrackingId: someTrackingIdCounter++,
          },
        ] as DefaultInlineCompletionItem[];
      }

      console.log("provideInlineCompletionItems triggered", fileName, lang);

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
            insertText: text,
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

  // react only: .tsx, .jsx
  // react compat: .ts, .js
  // vue only: .vue
  // vue compat: .ts, .js
  // flutter only: .dart
  // html only: .html, .htm
  // css only: .css, .scss, .sass, .less, .styl

  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" },
    provider
  );

  // // Be aware that the API around `getInlineCompletionItemController` will not be finalized as is!
  // vscode.window
  //   .getInlineCompletionItemController(provider)
  //   .onDidShowCompletionItem((e) => {
  //     const id = (e.completionItem as DefaultInlineCompletionItem)
  //       .someTrackingId;
  //   });

  console.info("end register:: inline completion");
}

interface DefaultInlineCompletionItem extends vscode.InlineCompletionItem {
  someTrackingId: number;
}
