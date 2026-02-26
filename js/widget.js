/* ═══════════════════════════════════════════════════════════════
   widget.js — Digital Twin Chat Widget
   Uses official @gradio/client (via esm.sh CDN) — works on
   Gradio 3 / 4 / 5 automatically, no endpoint guessing needed.
   ═══════════════════════════════════════════════════════════════ */

const Widget = (() => {
  const HF_SPACE = "shuangyihu/career_conversation";

  let isOpen = false;
  let isBusy = false;
  let clientPromise = null; // single shared promise, lazily initialized

  // ── Connect once, reuse forever ───────────────────────────
  function getClient() {
    if (!clientPromise) {
      clientPromise = import("https://esm.sh/@gradio/client")
        .then(({ Client }) => Client.connect(HF_SPACE))
        .catch((err) => {
          clientPromise = null; // reset so next send retries
          throw err;
        });
    }
    return clientPromise;
  }

  // ── UI helpers ─────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    document.getElementById("twinPanel").classList.toggle("open", isOpen);
    document.getElementById("twinBtn").classList.toggle("open", isOpen);
    // Hide the label badge when panel is open
    document
      .getElementById("twinAnchor")
      .classList.toggle("panel-open", isOpen);
    if (isOpen)
      setTimeout(() => document.getElementById("chatInp")?.focus(), 350);
    if (isOpen && !clientPromise) getClient().catch(() => {});
  }

  function setTab(tab, btn) {
    document
      .querySelectorAll(".chat-tab")
      .forEach((t) => t.classList.remove("on"));
    btn.classList.add("on");
    ["chat", "resume", "fullapp"].forEach((t) => {
      const el = document.getElementById("tab-" + t);
      if (el) el.style.display = t === tab ? "block" : "none";
    });
  }

  function addMsg(role, html) {
    const c = document.getElementById("chatMsgs");
    const d = document.createElement("div");
    d.className = `cm ${role}`;
    d.innerHTML = `<div class="cm-av">${role === "b" ? "🤖" : "👤"}</div>
      <div class="cm-bub">${html}</div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
    return d;
  }

  function showTyping() {
    if (document.getElementById("typingEl")) return;
    const c = document.getElementById("chatMsgs");
    const d = document.createElement("div");
    d.className = "cm b";
    d.id = "typingEl";
    d.innerHTML = `<div class="cm-av">🤖</div>
      <div class="cm-bub">
        <div class="typing-bub">
          <div class="td"></div><div class="td"></div><div class="td"></div>
        </div>
      </div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }

  function removeTyping() {
    document.getElementById("typingEl")?.remove();
  }

  function setSendBusy(busy) {
    isBusy = busy;
    const btn = document.querySelector(".chat-send");
    if (btn) {
      btn.textContent = busy ? "…" : "↑";
      btn.disabled = busy;
    }
    const inp = document.getElementById("chatInp");
    if (inp) inp.disabled = busy;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Call HF via official gradio client ────────────────────
  async function callGradio(userMessage) {
    const client = await getClient();

    // predict() works across all Gradio versions.
    // api_name="/chat" matches gr.ChatInterface which always
    // registers the function under the name "chat".
    const result = await client.predict("/chat", {
      message: userMessage,
    });

    // result.data is an array; first element is the reply string
    const reply = result?.data?.[0];
    if (typeof reply !== "string" && reply == null) {
      throw new Error(
        "Empty or unexpected response: " + JSON.stringify(result),
      );
    }
    return typeof reply === "string" ? reply : JSON.stringify(reply);
  }

  // ── Core send flow ─────────────────────────────────────────
  async function sendMessage(userText) {
    if (!userText.trim() || isBusy) return;

    addMsg("u", escapeHtml(userText));
    document.getElementById("quickQs").style.display = "none";
    setSendBusy(true);
    showTyping();

    try {
      const reply = await callGradio(userText);
      removeTyping();
      addMsg("b", escapeHtml(reply).replace(/\n/g, "<br>"));
    } catch (err) {
      removeTyping();
      console.error("[Widget]", err);
      addMsg(
        "b",
        `⚠️ Couldn't connect to AI twin.<br>` +
          `<small style="opacity:.5">${escapeHtml(err.message)}</small><br><br>` +
          `Try the <strong>Full App</strong> tab, or ` +
          `<a href="mailto:amandashuangyihu@gmail.com" style="color:var(--terra)">email directly</a>.`,
      );
    } finally {
      setSendBusy(false);
    }
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    toggle,
    setTab,
    quickSend(btn) {
      const txt = btn.textContent;
      btn.closest(".quick-qs").style.display = "none";
      sendMessage(txt);
    },
    send() {
      const inp = document.getElementById("chatInp");
      const txt = inp.value.trim();
      if (!txt) return;
      inp.value = "";
      sendMessage(txt);
    },
    handleKey(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        Widget.send();
      }
    },
  };
})();
