window.apiHost = "";

(() => {
  (async () => {
    customElements.define(
      "ui-include",
      class extends HTMLElement {
        async connectedCallback() {
          let src = this.getAttribute("src");

          const response = await fetch(src);

          this.innerHTML = await response.text();
        }
      }
    );

    // to get api-host header - if exists
    const dummyUrl = "/login.html";

    let response = await fetch(dummyUrl);

    const apiHost = response.headers.get("api-host");

    if (apiHost && window.apiHost.length == 0) {
      // dangerous!!! use only in dev stage
      window.apiHost = apiHost;
    }

    response = await api(null, 200, `${window.apiHost}/api/v1/auth/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let domainName = "";

    if (response && response.domain_name) {
      domainName = response.domain_name;
    }

    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const profileForm = document.getElementById("profileForm");

    if (domainName.length > 0) {
      if (registerForm) {
        registerForm.querySelector('input[name="domainName"]').placeholder =
          domainName;
      }

      if (loginForm) {
        loginForm.querySelector('input[name="domainName"]').placeholder =
          domainName;
      }

      if (profileForm) {
        profileForm.querySelector("#profileDomainName").innerHTML =
          domainName;
      }
    }
  })();
})();

// (() => {
//   (async () => {
//     const dummyUrl = "/logoutx.html";

//     const response = await fetch(dummyUrl);

//     // const apiHost = response.headers.get("api-host");

//     // if (apiHost && window.apiHost.length == 0) {
//     //   // dangerous!!! use only in dev stage
//     //   window.apiHost = apiHost;
//     // }
//   })();
// })();
