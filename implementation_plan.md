# Implementation Plan

## Goal
Reorganize the injected bridge script (`src/injected/bridge.js`) to improve readability, modularity, and maintainability. Split responsibilities into distinct modules:
- **fetch-wrapper.js**: Handles fetch interception, generation/start detection, and conversation/event stream handling.
- **history-listener.js**: Wraps history methods and dispatches URL change events.
- **utils.js**: Utility functions (`toAbsoluteUrl`, `getConversationMeta`).
- **message-handler.js**: Central `window.addEventListener('message')` logic for request handling (hash, usage, conversation).
- **ui.js** (already exists) stays unchanged.

Update the main `bridge.js` to import these modules (using ES modules) and expose a single `init()` that sets up everything.

## User Review Required
- Confirm that the extension can load ES modules in the injected script context (Chrome/Edge allow `type="module"` for injected scripts). If not, we will bundle the modules using a simple concatenation step.
- Approve any changes to `manifest.json` if additional permissions or content script settings are needed.

## Open Questions
- Does the project currently use a build step (e.g., Vite) or plain static files? The repository appears to be a plain extension, so we will keep it simple by using `<script type="module">` in `manifest.json`.
- Should we keep the original single-file fallback for older browsers? We can optionally retain a minified bundled version.

## Proposed Changes
---
### bridge.js (modified)
- Remove all function definitions and replace with imports from the new modules.
- Call `init()` on load.
---
### src/injected/fetch-wrapper.js (new)
- Export `wrapFetch(originalFetch)` that returns the overridden fetch function.
- Include `handleEventStream` and `handleConversationResponse` utilities.
---
### src/injected/history-listener.js (new)
- Export `initHistoryListener()` that patches `pushState`/`replaceState` and dispatches `cc:urlchange`.
---
### src/injected/utils.js (new)
- Export `toAbsoluteUrl`, `getConversationMeta`.
---
### src/injected/message-handler.js (new)
- Export `initMessageHandler(originalFetch, utils, post, postResponse)` to set up the `window.addEventListener('message')` logic.
---
### manifest.json (modified)
- Ensure the content script is loaded as a module: `{ "matches": ["*://claude.ai/*"], "js": ["src/injected/bridge.js"], "run_at": "document_start", "type": "module" }` (or appropriate syntax).
---
### Optional bundling (if needed)
- Add a simple npm script `build` that concatenates the new modules into a single file for compatibility.

## Verification Plan
### Automated Tests
- None provided in repo; we will manually load the extension in Chrome/Edge and verify that token counting, usage bars, and cache timer still function.
- Use the browser subagent to open a Chrome instance, load unpacked extension from the folder, navigate to `claude.ai`, and observe UI elements.
### Manual Verification
- Verify that the UI components still appear.
- Confirm that console shows no errors regarding missing modules.
- Ensure that generation start events, usage requests, and conversation fetches still trigger appropriate UI updates.
