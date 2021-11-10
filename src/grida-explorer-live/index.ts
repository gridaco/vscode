import * as vscode from "vscode";
import { LiveSessionManager } from "./live-session-manager";

export function __register_live_session_provider(
  context: vscode.ExtensionContext
) {
  const manager = new LiveSessionManager(
    // FIXME: provide user id
    "authenticated-user-id-here"
  );
  manager.enterSession();
}
