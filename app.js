const apiUrlInput = document.querySelector("#api-url");
const apiKeyInput = document.querySelector("#api-key");
const dbMessageInput = document.querySelector("#db-message");
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
    body: method === "POST"
      ? "Cifrando datos y guardando en la base de datos SQL..."
      : "Consultando y descifrando registros de la base de datos SQL...",
  });

  try {
    const requestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method === "POST") {
      const messageText = dbMessageInput ? dbMessageInput.value.trim() : "";
      requestOptions.body = JSON.stringify({
        message: messageText || "Mensaje guardado en base de datos SQL",
      });
    }

    // API key is injected by Nginx proxy; no x-api-key header is attached by client JavaScript.
    const response = await fetch(endpoint, requestOptions);

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
      statusText: response.ok ? "Operación exitosa" : "Petición rechazada",
      body: formattedBody,
    });
  } catch (error) {
    setResponseState({
      method,
      url: endpoint,
      code: "ERR",
      statusText: "Error de conexión",
      body: JSON.stringify({
        error: "No se pudo conectar con la API o el proxy Nginx.",
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

document.addEventListener("DOMContentLoaded", () => {
  const userBadge = document.querySelector("#user-badge");
  const logoutBtn = document.querySelector("#logout-btn");

  const rawUser = sessionStorage.getItem("ldap_user");
  if (rawUser) {
    try {
      const userData = JSON.parse(rawUser);
      if (userBadge) {
        userBadge.textContent = `👤 ${userData.username}`;
      }
    } catch (e) {
      if (userBadge) userBadge.textContent = "👤 Usuario";
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("ldap_user");
      window.location.href = "login.html";
    });
  }
});

