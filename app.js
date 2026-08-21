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
  const rawUrl = apiUrlInput ? apiUrlInput.value.trim().replace(/\/$/, "") : "";
  const endpoint = rawUrl ? `${rawUrl}/api/data` : "/api/data";

  buttons.forEach((button) => { button.disabled = true; });
  setResponseState({
    method,
    url: endpoint,
    code: "...",
    statusText: "Request in progress",
    body: "Sending request through Nginx reverse proxy...",
  });

  try {
    // API key is injected by Nginx proxy; no x-api-key header is attached by client JavaScript.
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
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
      body: JSON.stringify({
        error: "The API or Nginx reverse proxy is unavailable.",
        detail: error.message,
      }, null, 2),
    });
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

if (toggleKeyButton && apiKeyInput) {
  toggleKeyButton.addEventListener("click", () => {
    const isHidden = apiKeyInput.type === "password";
    apiKeyInput.type = isHidden ? "text" : "password";
    toggleKeyButton.title = isHidden ? "Hide API key" : "Show API key";
    toggleKeyButton.setAttribute("aria-label", toggleKeyButton.title);
  });
}

getButton.addEventListener("click", () => sendRequest("GET"));
postButton.addEventListener("click", () => sendRequest("POST"));

