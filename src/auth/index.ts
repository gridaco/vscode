import * as vscode from "vscode";
import { GridaAuthenticationProvider } from "./provider";

export function __register_auth_manager(context: vscode.ExtensionContext) {
  context.subscriptions.push(new GridaAuthenticationProvider(context));
}

// class AuthenticationProvider implements vscode.AuthenticationProvider {
//   onDidChangeSessions =
//     new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>()
//       .event;

//   getSessions(
//     scopes?: readonly string[]
//   ): Thenable<readonly vscode.AuthenticationSession[]> {
//     return Promise.resolve([]);
//   }

//   createSession(
//     scopes: readonly string[]
//   ): Thenable<vscode.AuthenticationSession> {
//     return Promise.resolve(<vscode.AuthenticationSession>{
//       accessToken: "",
//       account: {
//         id: "",
//         label: "user",
//       },
//       id: "",
//       scopes: [""],
//     });
//   }

//   removeSession(sessionId: string): Thenable<void> {
//     return Promise.resolve();
//   }
// }
