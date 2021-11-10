import Pusher from "pusher-js";

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
  constructor(private readonly userid: string) {}

  public async enterSession() {
    // subscribe once wheb the page is loaded
    // TODO: update channel name with userid
    const subscription = pusher.subscribe("private-live-session"); // channel
    subscription.bind("client-select", (d: any) => {
      console.log("event from assistant", d);
      // setFilekey(d.filekey);
      // setNodeid(d.node);
    });
  }
}
