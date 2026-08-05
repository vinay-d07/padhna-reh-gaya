import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const listConversations = async (workspaceId) => {
  try {
    const response = await api.get(`/workspaces/${workspaceId}/conversations`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const createConversation = async (workspaceId, clerkId, title) => {
  try {
    const response = await api.post(`/workspaces/${workspaceId}/conversations`, {
      clerkId,
      title,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// EventSource can't do POST, so the SSE frames the backend writes
// (`event: ...\ndata: ...\n\n`) are parsed by hand off a fetch ReadableStream.
export const sendMessage = async (
  conversationId,
  clerkId,
  content,
  { onToken, onDone, onError } = {}
) => {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId, content }),
  });

  if (!response.ok || !response.body) {
    const error = new Error(`Request failed with status ${response.status}`);
    onError?.(error);
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseEvent(rawEvent);
      if (!parsed) continue;

      if (parsed.event === 'token') {
        onToken?.(parsed.data.token);
      } else if (parsed.event === 'done') {
        onDone?.(parsed.data.assistantMessage);
      } else if (parsed.event === 'error') {
        onError?.(new Error(parsed.data.message));
      }
    }
  }
};

function parseEvent(raw) {
  let eventName = 'message';
  const dataLines = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { event: eventName, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return null;
  }
}
