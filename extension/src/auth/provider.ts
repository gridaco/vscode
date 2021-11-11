import * as vscode from "vscode";
import { GridaServer } from "./auth-server";
import { arrayEquals } from "./utils";
import { v4 as uuid } from "uuid";
import { Keychain } from "./keychain";

export enum AuthProviderType {
  grida = "grida",
}

interface SessionData {
  id: string; // not a userid, a locally generated id.
  account?: {
    username?: string;
    id: string;
  };
  scopes: string[];
  accessToken: string;
}

export class GridaAuthenticationProvider
  implements vscode.AuthenticationProvider, vscode.Disposable
{
  private readonly type: AuthProviderType = AuthProviderType.grida;

  private _sessionChangeEmitter =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _server: GridaServer;
  private _keychain: Keychain = new Keychain(this.context, `${this.type}.auth`);
  private _sessionsPromise: Promise<vscode.AuthenticationSession[]>;
  private _disposable: vscode.Disposable;

  constructor(private readonly context: vscode.ExtensionContext) {
    const { name, version, aiKey } = context.extension.packageJSON as {
      name: string;
      version: string;
      aiKey: string;
    };

    this._server = new GridaServer();

    // Contains the current state of the sessions we have available.
    this._sessionsPromise = this.readSessions();

    this._disposable = vscode.Disposable.from(
      this._server,
      vscode.authentication.registerAuthenticationProvider(
        this.type,
        this._server.friendlyName,
        this,
        { supportsMultipleAccounts: false }
      ),
      this.context.secrets.onDidChange(() => this.checkForUpdates())
    );
  }

  dispose() {
    this._disposable.dispose();
  }

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  async getSessions(
    scopes?: string[]
  ): Promise<vscode.AuthenticationSession[]> {
    console.info(
      `Getting sessions for ${scopes?.join(",") || "all scopes"}...`
    );
    const sessions = await this._sessionsPromise;
    const finalSessions = scopes
      ? sessions.filter((session) =>
          arrayEquals([...session.scopes].sort(), scopes.sort())
        )
      : sessions;

    console.info(
      // e.g. Got 1 sessions for all scopes...
      `Got ${finalSessions.length} sessions for ${
        scopes?.join(",") || "all scopes"
      }...`,
      finalSessions
    );
    return finalSessions;
  }

  private async afterTokenLoad(token: string): Promise<void> {
    //
  }

  private async checkForUpdates() {
    const previousSessions = await this._sessionsPromise;
    this._sessionsPromise = this.readSessions();
    const storedSessions = await this._sessionsPromise;

    const added: vscode.AuthenticationSession[] = [];
    const removed: vscode.AuthenticationSession[] = [];

    storedSessions.forEach((session) => {
      const matchesExisting = previousSessions.some((s) => s.id === session.id);
      // Another window added a session to the keychain, add it to our state as well
      if (!matchesExisting) {
        console.info("Adding session found in keychain");
        added.push(session);
      }
    });

    previousSessions.forEach((session) => {
      const matchesExisting = storedSessions.some((s) => s.id === session.id);
      // Another window has logged out, remove from our state
      if (!matchesExisting) {
        console.info("Removing session no longer found in keychain");
        removed.push(session);
      }
    });

    if (added.length || removed.length) {
      this._sessionChangeEmitter.fire({ added, removed, changed: [] });
    }
  }

  private async readSessions(): Promise<vscode.AuthenticationSession[]> {
    let sessionData: SessionData[];
    try {
      console.info("Reading sessions from keychain...");
      const storedSessions = await this._keychain.getToken();
      if (!storedSessions) {
        return [];
      }
      console.info("Got stored sessions!");

      try {
        sessionData = JSON.parse(storedSessions);
      } catch (e) {
        await this._keychain.deleteToken();
        throw e;
      }
    } catch (e) {
      console.error(`Error reading token: ${e}`);
      return [];
    }

    const sessionPromises = sessionData.map(async (session: SessionData) => {
      let userInfo: { id: string; username: string } | undefined;
      if (!session.account) {
        try {
          userInfo = await this._server.getUserInfo(session.accessToken);
          console.info(
            `Verified session with the following scopes: ${session.scopes}`
          );
        } catch (e: any) {
          // Remove sessions that return unauthorized response
          if (e.message === "Unauthorized") {
            return undefined;
          }
        }
      }

      setTimeout(() => this.afterTokenLoad(session.accessToken), 1000);

      console.info(
        `Read the following session from the keychain with the following scopes: ${session.scopes}`
      );
      return {
        id: session.id,
        account: {
          label: session.account
            ? session.account.username ?? "Signed in"
            : userInfo?.username ?? "Signed in",
          id: session.account?.id ?? userInfo?.id ?? "Signed in",
        },
        scopes: session.scopes,
        accessToken: session.accessToken,
      };
    });

    const verifiedSessions = (await Promise.allSettled(sessionPromises))
      .filter((p) => p.status === "fulfilled")
      .map(
        (p) =>
          (
            p as PromiseFulfilledResult<
              vscode.AuthenticationSession | undefined
            >
          ).value
      )
      .filter(<T>(p?: T): p is T => Boolean(p));

    console.info(`Got ${verifiedSessions.length} verified sessions.`);
    if (verifiedSessions.length !== sessionData.length) {
      await this.storeSessions(verifiedSessions);
    }

    return verifiedSessions;
  }

  private async storeSessions(
    sessions: vscode.AuthenticationSession[]
  ): Promise<void> {
    console.info(`Storing ${sessions.length} sessions...`);
    this._sessionsPromise = Promise.resolve(sessions);
    await this._keychain.setToken(JSON.stringify(sessions));
    console.info(`Stored ${sessions.length} sessions!`, sessions);
  }

  public async createSession(
    scopes: string[]
  ): Promise<vscode.AuthenticationSession> {
    try {
      const scopeString = scopes.join(" ");
      const token = await this._server.login(scopeString);
      this.afterTokenLoad(token);
      const session = await this.tokenToSession(token, scopes);

      const sessions = await this._sessionsPromise;
      const sessionIndex = sessions.findIndex(
        (s) => s.id === session.id || s.scopes.join(" ") === scopeString
      );
      if (sessionIndex > -1) {
        sessions.splice(sessionIndex, 1, session);
      } else {
        sessions.push(session);
      }
      await this.storeSessions(sessions);

      this._sessionChangeEmitter.fire({
        added: [session],
        removed: [],
        changed: [],
      });

      console.info("Login success!");

      return session;
    } catch (e) {
      // If login was cancelled, do not notify user.
      if (e === "Cancelled") {
        throw e;
      }

      vscode.window.showErrorMessage(`Sign in failed: ${e}`);
      console.error(e);
      throw e;
    }
  }

  private async tokenToSession(
    token: string,
    scopes: string[]
  ): Promise<vscode.AuthenticationSession> {
    const userInfo = await this._server.getUserInfo(token);
    return {
      id: uuid(),
      accessToken: token,
      account: { label: userInfo.username, id: userInfo.id },
      scopes,
    };
  }

  public async removeSession(id: string) {
    try {
      console.info(`Logging out of ${id}`);

      const sessions = await this._sessionsPromise;
      const sessionIndex = sessions.findIndex((session) => session.id === id);
      if (sessionIndex > -1) {
        const session = sessions[sessionIndex];
        sessions.splice(sessionIndex, 1);

        await this.storeSessions(sessions);

        this._sessionChangeEmitter.fire({
          added: [],
          removed: [session],
          changed: [],
        });
      } else {
        console.error("Session not found");
      }
    } catch (e) {
      vscode.window.showErrorMessage(`Sign out failed: ${e}`);
      console.error(e);
      throw e;
    }
  }
}
