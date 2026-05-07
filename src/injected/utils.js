export function toAbsoluteUrl(input) {
  if (typeof input === 'string') {
    if (input.startsWith('/')) return `https://claude.ai${input}`;
    return input;
  }
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return '';
}

export function getConversationMeta(url) {
  // /api/organizations/{orgId}/chat_conversations/{conversationId}
  const match = url.match(/^https:\/\/claude\.ai\/api\/organizations\/([^/]+)\/chat_conversations\/([^/?]+)/);
  return match ? { orgId: match[1], conversationId: match[2] } : null;
}
