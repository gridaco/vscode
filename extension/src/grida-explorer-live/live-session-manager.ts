// import Pusher from "pusher-js";
const Pusher = require("pusher-js");

const _base_url =
  "https://ahzdf5x4q3.execute-api.us-west-1.amazonaws.com/production"; // "https://assistant-live-session.grida.cc";

const pusher = new Pusher(
  process.env.ASSISTANT_LIVE_SESSION_PUSHER_KEY as string,
  {
    // 'live-session-from-assistant'
    cluster: "us3",
    authEndpoint: _base_url + "/pusher/auth",
  }
);

export class LiveSessionManager {
  // region singleton
  private static _instance: LiveSessionManager;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  // endregion singleton

  constructor() {}

  private userid: string | undefined;
  provideAuthentication(userid: string) {
    this.userid = userid;
  }

  onSelection(callback: (d: any) => void) {
    if (!this.userid) {
      return;
    }

    const subscription = pusher.subscribe(
      `private-live-session-${this.userid}`
    ); // channel
    subscription.bind("client-select", callback);
  }
}
