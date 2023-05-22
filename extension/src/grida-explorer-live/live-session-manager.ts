import Pusher from "pusher-js";
// const Pusher = require("pusher-js");

const _base_url =
  "https://ahzdf5x4q3.execute-api.us-west-1.amazonaws.com/production"; // "https://assistant-live-session.grida.cc";

export class LiveSessionManager {
  // region singleton
  private static _instance: LiveSessionManager;
  private readonly pusher: Pusher;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  // endregion singleton

  constructor() {
    this.pusher = new Pusher(
      process.env.ASSISTANT_LIVE_SESSION_PUSHER_KEY as string,
      {
        // 'live-session-from-assistant'
        cluster: "us3",
        authEndpoint: _base_url + "/pusher/auth",
      }
    );

    // error
    this.pusher.connection.bind("error", (err) => {
      console.log("livesession: pusher error", err);
    });

    // connecting
    this.pusher.connection.bind("connecting", () => {
      console.log("livesession: pusher connecting");
    });

    // disconnected
    this.pusher.connection.bind("disconnected", () => {
      console.log("livesession: pusher disconnected");
    });

    // connected
    this.pusher.connection.bind("connected", () => {
      console.log("livesession: pusher connected");
    });
  }

  private userid: string | undefined;
  provideAuthentication(userid: string) {
    this.userid = userid;
  }

  onSelection(callback: (d: any) => void) {
    if (!this.userid) {
      return;
    }

    const subscription = this.pusher.subscribe(
      `private-live-session-${this.userid}`
    ); // channel

    // client-select
    subscription.bind("client-select", (e) => {
      console.log("livesession: client-select", e);
      callback(e);
    });

    // subscription_succeeded
    subscription.bind("pusher:subscription_succeeded", (e) => {
      console.log("livesession: pusher:subscription_succeeded", e);
    });

    // subscription_error
    subscription.bind("pusher:subscription_error", (e) => {
      console.log("livesession: pusher:subscription_error", e);
    });
  }
}
