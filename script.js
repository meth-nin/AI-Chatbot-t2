const API_URL = "http://ai-web-production-5f615.up.railway.app-t2-production.up.railway.apps:8000/chat";

let conversationHistory = [];
const chatWindow = document.getElementById("chatWindow");
const userInput  = document.getElementById("userInput");
const sendBtn    = document.getElementById("sendBtn");

userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) sendMessage();
});

function appendBubble(role, text = "") {
  const row    = document.createElement("div");
  row.className = `chat-row ${role}`;

  const avatar  = document.createElement("div");
  avatar.className = `avatar ${role}`;
  avatar.textContent = role === "bot" ? "🚗" : "🙂";

  const bubble  = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function showTyping() {
  const row    = document.createElement("div");
  row.className = "chat-row bot";
  row.id = "typingRow";

  const avatar = document.createElement("div");
  avatar.className = "avatar bot";
  avatar.textContent = "🚗";

  const bubble = document.createElement("div");
  bubble.className = "bubble bot typing";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typingRow");
  if (el) el.remove();
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendBubble("user", text);
  userInput.value = "";
  sendBtn.disabled = true;

  //update history
  conversationHistory.push({ role: "user", content: text });

  showTyping();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    removeTyping();
    const botBubble = appendBubble("bot");

    //stream the response text chunk by chunk
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let botReply  = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      botReply += chunk;
      botBubble.textContent = botReply;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    //save bot reply to history
    conversationHistory.push({ role: "assistant", content: botReply });

    //memory limit
    if (conversationHistory.length > 38) {
      conversationHistory = conversationHistory.slice(-38);
    }

  } catch (err) {
    removeTyping();
    appendBubble("bot", `⚠️ Error: ${err.message}`);
  }

  sendBtn.disabled = false;
  userInput.focus();
}