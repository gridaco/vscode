import * as vscode from "vscode";
import { GridaAuthenticationProvider } from "./provider";

export function __register_auth_manager(context: vscode.ExtensionContext) {
  context.subscriptions.push(new GridaAuthenticationProvider(context));
}
