import Pusher from "pusher-js";

const _base_url =
  "https://ahzdf5x4q3.execute-api.us-west-1.amazonaws.com/production"; // "https://assistant-live-session.grida.cc";

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
  // 'live-session-from-assistant'
  cluster: "us3",
  authEndpoint: _base_url + "/pusher/auth",
});

export class LiveSessionManager {}
