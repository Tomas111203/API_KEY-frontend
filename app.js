const apiUrlInput = document.querySelector("#api-url");
const apiKeyInput = document.querySelector("#api-key");
const toggleKeyButton = document.querySelector("#toggle-key");
const getButton = document.querySelector("#get-data");
const postButton = document.querySelector("#post-data");
const responseCode = document.querySelector("#response-code");
const responseMethod = document.querySelector("#response-method");
const responseUrl = document.querySelector("#response-url");
const responseOutput = document.querySelector("#response-output");
const responseStatus = document.querySelector("#response-status");
const buttons = [getButton, postButton];

function setResponseState({ method, url, code, statusText, body }) {
  responseMethod.textContent = method;
  responseUrl.textContent = url;
  responseCode.textContent = code;
  responseStatus.textContent = statusText;
  responseOutput.textContent = body;
}

async function sendRequest(method) {
  const baseUrl = apiUrlInput.value.trim().replace(/\/$/, "");
  const endpoint = `${baseUrl}/api/data`;
  const apiKey = apiKeyInput.value;

  if (!baseUrl || !apiKey) {
    setResponseState({
      method,
      url: endpoint,
      code: "—",
      statusText: "Missing request settings",
      body: JSON.stringify({ error: "Enter both an API base URL and an API key." }, null, 2),
    });
    return;
  }

  buttons.forEach((button) => { button.disabled = true; });
  setResponseState({ method, url: endpoint, code: "...", statusText: "Request in progress", body: "Contacting the API..." });

  try {
    const response = await fetch(endpoint, {
      method,
      headers: { "x-api-key": apiKey },
    });
    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const formattedBody = typeof responseBody === "string"
      ? responseBody
      : JSON.stringify(responseBody, null, 2);

    setResponseState({
      method,
      url: endpoint,
      code: response.status,
      statusText: response.ok ? "Request completed" : "Request rejected",
      body: formattedBody,
    });
  } catch (error) {
    setResponseState({
      method,
      url: endpoint,
      code: "ERR",
      statusText: "Could not reach API",
      body: JSON.stringify({ error: "The API is unavailable. Start uvicorn and check the base URL.", detail: error.message }, null, 2),
    });
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

toggleKeyButton.addEventListener("click", () => {
  const isHidden = apiKeyInput.type === "password";
  apiKeyInput.type = isHidden ? "text" : "password";
  toggleKeyButton.title = isHidden ? "Hide API key" : "Show API key";
  toggleKeyButton.setAttribute("aria-label", toggleKeyButton.title);
});

getButton.addEventListener("click", () => sendRequest("GET"));
postButton.addEventListener("click", () => sendRequest("POST"));
