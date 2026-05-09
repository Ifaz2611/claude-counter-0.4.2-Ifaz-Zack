import { toAbsoluteUrl, getConversationMeta, post } from './utils.js';

export function wrapFetch(originalFetch) {
	return async (...args) => {
		const url = toAbsoluteUrl(args[0]);
		const opts = args[1] || {};

		// Detect generation start (completion requests)
		if (url && opts.method === 'POST' && (url.includes('/completion') || url.includes('/retry_completion'))) {
			post('cc:generation_start', {});
		}

		const response = await originalFetch.apply(window, args);

		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('event-stream')) {
			handleEventStream(response);
		}

		// Catch conversation tree fetches
		if (url && url.includes('/chat_conversations/') && url.includes('tree=')) {
			const meta = getConversationMeta(url);
			if (meta) {
				handleConversationResponse(meta, response);
			}
		}

		return response;
	};
}

async function handleConversationResponse({ orgId, conversationId }, response) {
	try {
		const cloned = response.clone();
		const data = await cloned.json();
		post('cc:conversation', { orgId, conversationId, data });
	} catch {
		// ignore parse failures
	}
}

async function handleEventStream(response) {
	try {
		const cloned = response.clone();
		const reader = cloned.body?.getReader?.();
		if (!reader) return;
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split(/\r\n|\r|\n/);
			buffer = lines.pop() || '';
			for (const line of lines) {
				if (!line.startsWith('data:')) continue;
				const raw = line.slice(5).trim();
				if (!raw) continue;
				try {
					const json = JSON.parse(raw);
					if (json?.type === 'message_limit' && json.message_limit) {
						post('cc:message_limit', json.message_limit);
					}
				} catch {
					// ignore
				}
			}
		}
	} catch {

	}
}
