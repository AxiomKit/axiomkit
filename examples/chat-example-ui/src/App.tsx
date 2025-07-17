import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { context, createAxiom } from "@axiomkit/core";
import { groq } from "@ai-sdk/groq";

function App() {
  const [count, setCount] = useState(0);
  const echoContext = context({
    type: "echo",
    instructions: "You Are a agents use for response something for user funny",
  });

  const agent = createAxiom({
    model: groq("qwen/qwen3-32b"),
    contexts: [echoContext],
  });
  const initialCreateAgent = async () => {
    // const result = await generateText({
    //   model: groq("qwen-qwq-32b"),
    //   providerOptions: {
    //     groq: { reasoningFormat: "parsed" },
    //   },
    //   prompt: 'How many "r"s are in the word "strawberry"?',
    // });
    // console.log("Rest", result);
    await agent.start();

    console.log("Echo agent started. Type 'exit' to quit.");
    await agent.run({
      context: echoContext,
      args: {},
    });

    console.log("Agent stopped.");
  };
  useEffect(() => {
    initialCreateAgent();
  }, []);
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
