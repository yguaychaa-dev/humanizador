# Chat con Mistral

App web mínima de chat que llama a la API de Mistral con el SDK oficial de TypeScript (`@mistralai/mistralai`), usando el modelo `mistral-small-latest`.

- Backend: Express + SDK oficial. La clave `MISTRAL_API_KEY` se lee solo en el servidor (desde `.env`) y nunca se envía al navegador.
- Frontend: HTML/CSS/JS estático sin framework, servido por el mismo servidor.

## Requisitos

- Node.js 20 o superior

## Configuración

Crea un archivo `.env` en la raíz del proyecto (o edita el existente):

```
MISTRAL_API_KEY=tu-clave-de https://console.mistral.ai/
```

Opcional: `MISTRAL_MODEL` (por defecto `mistral-small-latest`) y `PORT` (por defecto `3000`).

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (recarga automática)
npm run dev
```

Abre http://localhost:3000 en el navegador.

### Producción

```bash
npm run build
npm start
```

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila TypeScript y copia el cliente a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm run check` | Comprobación de tipos sin emitir archivos |

## Estructura

```
src/
  server.ts        Servidor Express + SDK de Mistral (POST /api/chat)
  client/          Interfaz de chat (index.html, style.css, script.js)
scripts/
  copy-client.mjs  Copia el cliente al build
.env               Clave API (no subir a git)
```

## API

- `GET /api/health` → estado del servidor y si hay clave configurada.
- `POST /api/chat` → cuerpo `{ "messages": [{ "role": "user" | "assistant", "content": "..." }] }`; responde `{ "reply": "..." }`.

Nunca compartas tu archivo `.env` ni publiques tu clave.
