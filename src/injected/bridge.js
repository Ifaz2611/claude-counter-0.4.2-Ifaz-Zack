import { initHistoryListener } from './history-listener.js';
import { wrapFetch } from './fetch-wrapper.js';
import { initMessageHandler } from './message-handler.js';

function init() {
	// Capture original fetch before anyone else can wrap it
	const originalFetch = window.fetch;

	// Wrap history methods
	initHistoryListener();

	// Wrap fetch
	window.fetch = wrapFetch(originalFetch);

	// Init message handler
	initMessageHandler(originalFetch);
}

init();
