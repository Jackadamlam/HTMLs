(function () {
  "use strict";

  const SESSION_KEY = "jack-private-access-v1";
  const EXPECTED_HASH = "c59e6a3d54fe04f4ddebfcadb5df34d9c74a70101e124cfb331f32b376531f4e";
  const SALT = "northstar-v1:";
  const guardStyle = document.createElement("style");
  guardStyle.id = "access-gate-guard";
  guardStyle.textContent = `
    html.access-locked, html.access-locked body { min-height: 100%; overflow: hidden !important; }
    html.access-locked body > *:not(#access-gate-root) { visibility: hidden !important; }
    #access-gate-root { visibility: visible !important; position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 22px; background: #101816; color: #edf2ec; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    #access-gate-root * { box-sizing: border-box; }
    .access-gate-card { width: min(420px, 100%); padding: 36px; border: 1px solid rgba(255,255,255,.14); background: #17221f; box-shadow: 0 28px 80px rgba(0,0,0,.35); }
    .access-gate-mark { width: 46px; height: 46px; display: grid; place-items: center; margin-bottom: 28px; border-radius: 50%; background: #e8d690; color: #17221f; font-size: 20px; font-weight: 800; }
    .access-gate-kicker { margin: 0 0 9px; color: #9aa9a3; font-size: 10px; font-weight: 700; letter-spacing: .18em; }
    .access-gate-card h1 { margin: 0; color: #fff; font-family: Georgia, "Songti SC", serif; font-size: 29px; font-weight: 400; }
    .access-gate-copy { margin: 12px 0 25px; color: #aab5b0; font-size: 13px; line-height: 1.7; }
    .access-gate-label { display: block; margin-bottom: 8px; color: #dce4df; font-size: 12px; font-weight: 650; }
    .access-gate-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
    .access-gate-input { width: 100%; min-width: 0; height: 46px; padding: 0 14px; border: 1px solid rgba(255,255,255,.18); border-radius: 0; outline: none; background: #0f1715; color: white; font: inherit; letter-spacing: .12em; }
    .access-gate-input:focus { border-color: #e8d690; box-shadow: 0 0 0 2px rgba(232,214,144,.12); }
    .access-gate-submit { height: 46px; padding: 0 19px; border: 0; background: #e8d690; color: #17221f; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
    .access-gate-submit:disabled { opacity: .55; cursor: wait; }
    .access-gate-error { min-height: 20px; margin: 9px 0 0; color: #ff9b8e; font-size: 11px; }
    .access-gate-home { display: inline-block; margin-top: 18px; color: #9eaaa5; font-size: 11px; text-decoration: none; }
    .access-gate-home:hover { color: #fff; }
    @media (max-width: 480px) { .access-gate-card { padding: 28px 22px; } .access-gate-row { grid-template-columns: 1fr; } .access-gate-submit { width: 100%; } }
  `;
  document.documentElement.classList.add("access-locked");
  document.head.appendChild(guardStyle);

  if (sessionStorage.getItem(SESSION_KEY) === EXPECTED_HASH) {
    document.documentElement.classList.remove("access-locked");
    guardStyle.remove();
    return;
  }

  async function hashPassword(value) {
    const bytes = new TextEncoder().encode(SALT + value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function unlock(root) {
    sessionStorage.setItem(SESSION_KEY, EXPECTED_HASH);
    document.documentElement.classList.remove("access-locked");
    guardStyle.remove();
    root.remove();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const root = document.createElement("div");
    root.id = "access-gate-root";
    root.innerHTML = `
      <main class="access-gate-card" role="dialog" aria-modal="true" aria-labelledby="access-gate-title">
        <div class="access-gate-mark" aria-hidden="true">J</div>
        <p class="access-gate-kicker">PRIVATE PAGE</p>
        <h1 id="access-gate-title">此页面需要密码</h1>
        <p class="access-gate-copy">请输入访问密码。验证通过后，本次浏览器会话内可继续访问三个私人页面。</p>
        <form id="access-gate-form">
          <label class="access-gate-label" for="access-gate-password">访问密码</label>
          <div class="access-gate-row">
            <input class="access-gate-input" id="access-gate-password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required autofocus>
            <button class="access-gate-submit" type="submit">进入页面</button>
          </div>
          <p class="access-gate-error" id="access-gate-error" role="alert" aria-live="polite"></p>
        </form>
        <a class="access-gate-home" href="/HTMLs/">← 返回个人主页</a>
      </main>`;
    document.body.appendChild(root);

    const form = root.querySelector("#access-gate-form");
    const input = root.querySelector("#access-gate-password");
    const button = root.querySelector(".access-gate-submit");
    const error = root.querySelector("#access-gate-error");
    input.focus();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      button.disabled = true;
      error.textContent = "正在验证…";
      try {
        if (await hashPassword(input.value) === EXPECTED_HASH) {
          unlock(root);
          return;
        }
        error.textContent = "密码不正确，请重试。";
        input.value = "";
        input.focus();
      } catch (_) {
        error.textContent = "当前浏览器无法完成验证，请换用现代浏览器。";
      }
      window.setTimeout(function () { button.disabled = false; }, 700);
    });
  }, { once: true });
})();
