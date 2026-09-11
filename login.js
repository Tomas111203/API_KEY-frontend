document.addEventListener("DOMContentLoaded", () => {
  // If already authenticated, redirect to index.html
  const savedUser = sessionStorage.getItem("ldap_user");
  if (savedUser) {
    window.location.href = "index.html";
    return;
  }

  const loginForm = document.querySelector("#login-form");
  const usernameInput = document.querySelector("#username");
  const passwordInput = document.querySelector("#password");
  const togglePasswordBtn = document.querySelector("#toggle-password");
  const loginSubmitBtn = document.querySelector("#login-submit");
  const statusBox = document.querySelector("#login-status-box");

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.title = isPassword ? "Ocultar contraseña" : "Mostrar contraseña";
      togglePasswordBtn.setAttribute("aria-label", togglePasswordBtn.title);
    });
  }

  function showStatus(message, isError = false) {
    if (!statusBox) return;
    statusBox.classList.remove("hidden", "error", "success");
    statusBox.classList.add(isError ? "error" : "success");
    statusBox.textContent = message;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        showStatus("Por favor complete todos los campos.", true);
        return;
      }

      loginSubmitBtn.disabled = true;
      showStatus("Validando credenciales con LDAP...");

      try {
        // Nginx reverse proxy routes /ldap/login to ldap-api container and injects x-api-key automatically
        const response = await fetch("/ldap/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.authenticated) {
          showStatus(`¡Autenticación exitosa! Bienvenido ${data.username}. Redirigiendo...`);
          sessionStorage.setItem("ldap_user", JSON.stringify({
            username: data.username,
            dn: data.dn,
            loginTime: new Date().toISOString()
          }));

          setTimeout(() => {
            window.location.href = "index.html";
          }, 600);
        } else {
          const detail = data.detail || "Credenciales inválidas o error de autenticación.";
          showStatus(`Error (${response.status}): ${detail}`, true);
        }
      } catch (error) {
        showStatus(`Error de conexión: ${error.message}. Asegúrese de que el servidor LDAP esté activo.`, true);
      } finally {
        loginSubmitBtn.disabled = false;
      }
    });
  }
});
