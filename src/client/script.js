const form = document.getElementById('form');
const input = document.getElementById('input');
const send = document.getElementById('send');
const messages = document.getElementById('messages');
const status = document.getElementById('status');

const history = [];

function addBubble(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    status.textContent = data.configured
      ? `Conectado · modelo ${data.model}`
      : 'Falta MISTRAL_API_KEY en el archivo .env';
  } catch {
    status.textContent = 'Sin conexión con el servidor';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  send.disabled = true;
  addBubble('user', text);
  history.push({ role: 'user', content: text });
  const pending = addBubble('assistant', '…');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    pending.textContent = data.reply;
    history.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    pending.className = 'message error';
    pending.textContent = err instanceof Error ? err.message : 'Error inesperado';
    history.pop();
  } finally {
    send.disabled = false;
    input.focus();
  }
});

checkHealth();
