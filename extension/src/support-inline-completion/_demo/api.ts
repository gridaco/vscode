// demo api with openai codex completion engine
// uses code-davinci-002
import { Configuration, OpenAIApi } from "openai";

// const DEV_ONLY_OPENAI_API_KEY =
const DEV_ONLY_OPENAI_API_KEY = process.env.DEV_ONLY_OPENAI_API_KEY;

const configuration = new Configuration({
  apiKey: DEV_ONLY_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function getcompletion(prompt: string) {
  try {
    console.log("openai call with prompt", prompt);
    const { data } = await openai.createCompletion({
      // model: "code-davinci-002",
      model: "code-cushman-001",
      prompt: prompt,
      temperature: 0,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      // user: process.env.DEV_ONLY_MY_USER_ID,
    });

    const { id, object, created, model, choices, usage } = data;

    console.log("res", data);

    return choices;
  } catch (e) {
    console.error(e);
    return [];
  }
}
