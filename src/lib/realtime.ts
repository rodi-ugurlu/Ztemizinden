import { getApiRootUrl } from '@/lib/backendUrl';
import { getStoredAccessToken } from '@/store/useAuthStore';
import type { Ticket, TicketMessage } from '@/store/useCustomerStore';

type TicketMessageHandler = (message: TicketMessage) => void;
export type TicketEventPayload = {
  type: string;
  conversationId?: string | null;
  ticket: Ticket;
};
type TicketEventHandler = (event: TicketEventPayload) => void;
type ConnectionState = 'idle' | 'connecting' | 'connected';

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

const NULL_CHAR = '\u0000';
const RECONNECT_DELAY_MS = 2_000;
const TICKET_TOPIC_PREFIX = '/topic/tickets/';
const TICKET_TOPIC_SUFFIX = '/messages';
const CONVERSATION_TOPIC_MARKER = '/conversations/';
const CUSTOMER_TICKET_TOPIC_PREFIX = '/topic/customers/';
const PROVIDER_TICKET_TOPIC_PREFIX = '/topic/providers/';
const TICKET_EVENT_TOPIC_SUFFIX = '/tickets';

const ticketSubscribers = new Map<string, Map<string, TicketMessageHandler>>();
const activeTicketSubscriptions = new Map<string, string>();
const conversationSubscribers = new Map<string, Map<string, TicketMessageHandler>>();
const activeConversationSubscriptions = new Map<string, string>();
const ticketEventSubscribers = new Map<string, Map<string, TicketEventHandler>>();
const activeTicketEventSubscriptions = new Map<string, string>();

let socket: WebSocket | null = null;
let connectionState: ConnectionState = 'idle';
let reconnectTimer: number | null = null;
let currentToken: string | null = null;
let nextHandlerId = 0;
let nextSubscriptionId = 0;
let nextReceiptId = 0;

export function subscribeToTicketMessages(ticketId: string, onMessage: TicketMessageHandler) {
  const handlerId = `handler-${++nextHandlerId}`;
  const handlers = ticketSubscribers.get(ticketId) ?? new Map<string, TicketMessageHandler>();
  handlers.set(handlerId, onMessage);
  ticketSubscribers.set(ticketId, handlers);

  ensureConnected();

  return () => {
    removeTicketMessageHandler(ticketId, handlerId);
  };
}

export function subscribeToConversationMessages(
  ticketId: string,
  conversationId: string,
  onMessage: TicketMessageHandler
) {
  const key = conversationKey(ticketId, conversationId);
  const handlerId = `handler-${++nextHandlerId}`;
  const handlers = conversationSubscribers.get(key) ?? new Map<string, TicketMessageHandler>();
  handlers.set(handlerId, onMessage);
  conversationSubscribers.set(key, handlers);

  ensureConnected();

  return () => {
    removeConversationMessageHandler(key, handlerId);
  };
}

export function subscribeToCustomerTicketEvents(customerId: string, onEvent: TicketEventHandler) {
  return subscribeToTicketEvents(ticketEventKey('customer', customerId), onEvent);
}

export function subscribeToProviderTicketEvents(providerId: string, onEvent: TicketEventHandler) {
  return subscribeToTicketEvents(ticketEventKey('provider', providerId), onEvent);
}

function subscribeToTicketEvents(key: string, onEvent: TicketEventHandler) {
  const handlerId = `handler-${++nextHandlerId}`;
  const handlers = ticketEventSubscribers.get(key) ?? new Map<string, TicketEventHandler>();
  handlers.set(handlerId, onEvent);
  ticketEventSubscribers.set(key, handlers);

  ensureConnected();

  return () => {
    removeTicketEventHandler(key, handlerId);
  };
}

function ensureConnected() {
  if (!hasSubscribers()) return;

  const token = getStoredAccessToken();
  if (!token && !canConnectWithoutToken()) {
    scheduleReconnect();
    return;
  }

  if (socket && connectionState !== 'idle') {
    if (currentToken !== token) {
      closeSocket();
    } else {
      subscribeToMissingTopics();
      return;
    }
  }

  clearReconnectTimer();
  currentToken = token;
  connectionState = 'connecting';
  socket = new WebSocket(webSocketUrl('/ws'));

  socket.onopen = () => {
    const connectHeaders: Record<string, string> = {
      'accept-version': '1.2',
      'heart-beat': '0,0',
    };
    if (token) {
      connectHeaders.Authorization = `Bearer ${token}`;
    }

    socket?.send(frame('CONNECT', connectHeaders));
  };

  socket.onmessage = (event) => {
    for (const stompFrame of parseFrames(String(event.data))) {
      if (stompFrame.command === 'CONNECTED') {
        connectionState = 'connected';
        subscribeToMissingTopics();
      }

      if (stompFrame.command === 'MESSAGE' && stompFrame.body) {
        dispatchTicketMessage(stompFrame);
      }

      if (stompFrame.command === 'ERROR') {
        socket?.close();
      }
    }
  };

  socket.onclose = () => {
    socket = null;
    connectionState = 'idle';
    activeTicketSubscriptions.clear();
    activeConversationSubscriptions.clear();
    activeTicketEventSubscriptions.clear();
    if (hasSubscribers()) {
      scheduleReconnect();
    }
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function subscribeToMissingTopics() {
  if (connectionState !== 'connected' || socket?.readyState !== WebSocket.OPEN) return;

  for (const ticketId of ticketSubscribers.keys()) {
    if (activeTicketSubscriptions.has(ticketId)) continue;

    const subscriptionId = `ticket-${ticketId}-${++nextSubscriptionId}`;
    activeTicketSubscriptions.set(ticketId, subscriptionId);
    socket.send(frame('SUBSCRIBE', {
      id: subscriptionId,
      destination: ticketMessageDestination(ticketId),
    }));
  }

  for (const key of conversationSubscribers.keys()) {
    if (activeConversationSubscriptions.has(key)) continue;

    const [ticketId, conversationId] = splitConversationKey(key);
    const subscriptionId = `conversation-${conversationId}-${++nextSubscriptionId}`;
    activeConversationSubscriptions.set(key, subscriptionId);
    socket.send(frame('SUBSCRIBE', {
      id: subscriptionId,
      destination: conversationMessageDestination(ticketId, conversationId),
    }));
  }

  for (const key of ticketEventSubscribers.keys()) {
    if (activeTicketEventSubscriptions.has(key)) continue;

    const subscriptionId = `ticket-event-${++nextSubscriptionId}`;
    activeTicketEventSubscriptions.set(key, subscriptionId);
    socket.send(frame('SUBSCRIBE', {
      id: subscriptionId,
      destination: ticketEventDestination(key),
    }));
  }
}

function removeTicketMessageHandler(ticketId: string, handlerId: string) {
  const handlers = ticketSubscribers.get(ticketId);
  if (!handlers) return;

  handlers.delete(handlerId);
  if (handlers.size > 0) return;

  ticketSubscribers.delete(ticketId);
  unsubscribeFromTicketTopic(ticketId);

  if (!hasSubscribers()) {
    closeSocket();
    clearReconnectTimer();
  }
}

function unsubscribeFromTicketTopic(ticketId: string) {
  const subscriptionId = activeTicketSubscriptions.get(ticketId);
  if (!subscriptionId) return;

  activeTicketSubscriptions.delete(ticketId);
  if (connectionState === 'connected' && socket?.readyState === WebSocket.OPEN) {
    socket.send(frame('UNSUBSCRIBE', { id: subscriptionId }));
  }
}

function removeConversationMessageHandler(key: string, handlerId: string) {
  const handlers = conversationSubscribers.get(key);
  if (!handlers) return;

  handlers.delete(handlerId);
  if (handlers.size > 0) return;

  conversationSubscribers.delete(key);
  unsubscribeFromConversationTopic(key);

  if (!hasSubscribers()) {
    closeSocket();
    clearReconnectTimer();
  }
}

function unsubscribeFromConversationTopic(key: string) {
  const subscriptionId = activeConversationSubscriptions.get(key);
  if (!subscriptionId) return;

  activeConversationSubscriptions.delete(key);
  if (connectionState === 'connected' && socket?.readyState === WebSocket.OPEN) {
    socket.send(frame('UNSUBSCRIBE', { id: subscriptionId }));
  }
}

function removeTicketEventHandler(key: string, handlerId: string) {
  const handlers = ticketEventSubscribers.get(key);
  if (!handlers) return;

  handlers.delete(handlerId);
  if (handlers.size > 0) return;

  ticketEventSubscribers.delete(key);
  unsubscribeFromTicketEventTopic(key);

  if (!hasSubscribers()) {
    closeSocket();
    clearReconnectTimer();
  }
}

function unsubscribeFromTicketEventTopic(key: string) {
  const subscriptionId = activeTicketEventSubscriptions.get(key);
  if (!subscriptionId) return;

  activeTicketEventSubscriptions.delete(key);
  if (connectionState === 'connected' && socket?.readyState === WebSocket.OPEN) {
    socket.send(frame('UNSUBSCRIBE', { id: subscriptionId }));
  }
}

function dispatchTicketMessage(stompFrame: StompFrame) {
  if (isTicketEventDestination(stompFrame.headers.destination)) {
    dispatchTicketEvent(stompFrame);
    return;
  }

  const message = parseTicketMessage(stompFrame.body);
  if (!message) return;

  const ticketId = message.ticketId || ticketIdFromDestination(stompFrame.headers.destination);
  if (!ticketId) return;

  if (message.conversationId) {
    const handlers = conversationSubscribers.get(conversationKey(ticketId, message.conversationId));
    if (!handlers) return;

    for (const handler of Array.from(handlers.values())) {
      handler(message);
    }
    return;
  }

  const handlers = ticketSubscribers.get(ticketId);
  if (!handlers) return;

  for (const handler of Array.from(handlers.values())) {
    handler(message);
  }
}

function dispatchTicketEvent(stompFrame: StompFrame) {
  const event = parseTicketEvent(stompFrame.body);
  if (!event) return;

  const key = ticketEventKeyFromDestination(stompFrame.headers.destination);
  if (!key) return;

  const handlers = ticketEventSubscribers.get(key);
  if (!handlers) return;

  for (const handler of Array.from(handlers.values())) {
    handler(event);
  }
}

function scheduleReconnect() {
  if (reconnectTimer != null || !hasSubscribers()) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    ensureConnected();
  }, RECONNECT_DELAY_MS);
}

function clearReconnectTimer() {
  if (reconnectTimer == null) return;
  window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function closeSocket() {
  const socketToClose = socket;
  const wasStompConnected = connectionState === 'connected';

  activeTicketSubscriptions.clear();
  activeConversationSubscriptions.clear();
  activeTicketEventSubscriptions.clear();
  connectionState = 'idle';
  currentToken = null;
  socket = null;

  if (!socketToClose) return;

  socketToClose.onopen = null;

  if (wasStompConnected && socketToClose.readyState === WebSocket.OPEN) {
    const receiptId = `disconnect-${++nextReceiptId}`;
    let closeTimer: number | null = null;
    const closeNow = () => {
      if (closeTimer != null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      socketToClose.onmessage = null;
      socketToClose.onclose = null;
      socketToClose.onerror = null;
      if (
        socketToClose.readyState === WebSocket.OPEN ||
        socketToClose.readyState === WebSocket.CONNECTING
      ) {
        socketToClose.close(1000);
      }
    };

    socketToClose.onmessage = (event) => {
      for (const stompFrame of parseFrames(String(event.data))) {
        if (stompFrame.command === 'RECEIPT' && stompFrame.headers['receipt-id'] === receiptId) {
          closeNow();
          return;
        }
      }
    };
    socketToClose.onclose = closeNow;
    socketToClose.onerror = closeNow;

    try {
      socketToClose.send(frame('DISCONNECT', { receipt: receiptId }));
      closeTimer = window.setTimeout(closeNow, 750);
    } catch {
      closeNow();
    }
    return;
  }

  socketToClose.onmessage = null;
  socketToClose.onclose = null;
  socketToClose.onerror = null;
  socketToClose.close();
}

function hasSubscribers() {
  return ticketSubscribers.size > 0 || conversationSubscribers.size > 0 || ticketEventSubscribers.size > 0;
}

function ticketMessageDestination(ticketId: string) {
  return `${TICKET_TOPIC_PREFIX}${ticketId}${TICKET_TOPIC_SUFFIX}`;
}

function conversationMessageDestination(ticketId: string, conversationId: string) {
  return `${TICKET_TOPIC_PREFIX}${ticketId}${CONVERSATION_TOPIC_MARKER}${conversationId}${TICKET_TOPIC_SUFFIX}`;
}

function ticketEventDestination(key: string) {
  const [type, id] = splitTicketEventKey(key);
  const prefix = type === 'customer' ? CUSTOMER_TICKET_TOPIC_PREFIX : PROVIDER_TICKET_TOPIC_PREFIX;
  return `${prefix}${id}${TICKET_EVENT_TOPIC_SUFFIX}`;
}

function isTicketEventDestination(destination?: string) {
  return Boolean(ticketEventKeyFromDestination(destination));
}

function ticketEventKeyFromDestination(destination?: string) {
  if (!destination || !destination.endsWith(TICKET_EVENT_TOPIC_SUFFIX)) return null;
  if (destination.startsWith(CUSTOMER_TICKET_TOPIC_PREFIX)) {
    const id = destination.slice(CUSTOMER_TICKET_TOPIC_PREFIX.length, -TICKET_EVENT_TOPIC_SUFFIX.length);
    return id ? ticketEventKey('customer', id) : null;
  }
  if (destination.startsWith(PROVIDER_TICKET_TOPIC_PREFIX)) {
    const id = destination.slice(PROVIDER_TICKET_TOPIC_PREFIX.length, -TICKET_EVENT_TOPIC_SUFFIX.length);
    return id ? ticketEventKey('provider', id) : null;
  }
  return null;
}

function ticketIdFromDestination(destination?: string) {
  if (
    !destination ||
    !destination.startsWith(TICKET_TOPIC_PREFIX) ||
    !destination.endsWith(TICKET_TOPIC_SUFFIX)
  ) {
    return null;
  }

  const topicPath = destination.slice(TICKET_TOPIC_PREFIX.length, -TICKET_TOPIC_SUFFIX.length);
  return topicPath.split(CONVERSATION_TOPIC_MARKER)[0] || null;
}

function conversationKey(ticketId: string, conversationId: string) {
  return `${ticketId}:${conversationId}`;
}

function splitConversationKey(key: string) {
  const separatorIndex = key.indexOf(':');
  return [key.slice(0, separatorIndex), key.slice(separatorIndex + 1)] as const;
}

function ticketEventKey(type: 'customer' | 'provider', id: string) {
  return `${type}:${id}`;
}

function splitTicketEventKey(key: string) {
  const separatorIndex = key.indexOf(':');
  return [key.slice(0, separatorIndex) as 'customer' | 'provider', key.slice(separatorIndex + 1)] as const;
}

function parseTicketMessage(body: string) {
  try {
    return JSON.parse(body) as TicketMessage;
  } catch {
    return null;
  }
}

function parseTicketEvent(body: string) {
  try {
    return JSON.parse(body) as TicketEventPayload;
  } catch {
    return null;
  }
}

function canConnectWithoutToken() {
  return import.meta.env.VITE_AUTH_MODE === 'demo';
}

function frame(command: string, headers: Record<string, string>, body = '') {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${escapeHeader(value)}`);
  const headerBlock = headerLines.length > 0 ? `${headerLines.join('\n')}\n` : '';
  return `${command}\n${headerBlock}\n${body}${NULL_CHAR}`;
}

function parseFrames(raw: string): StompFrame[] {
  return raw
    .split(NULL_CHAR)
    .map((chunk) => chunk.trimStart())
    .filter(Boolean)
    .map(parseFrame);
}

function parseFrame(raw: string): StompFrame {
  const [head, ...bodyParts] = raw.split('\n\n');
  const [command, ...headerLines] = head.split('\n');
  const headers = Object.fromEntries(
    headerLines
      .map((line) => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex < 0) return null;
        return [line.slice(0, separatorIndex), unescapeHeader(line.slice(separatorIndex + 1))] as const;
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry))
  );
  return {
    command,
    headers,
    body: bodyParts.join('\n\n'),
  };
}

function webSocketUrl(path: string) {
  const apiRootUrl = getApiRootUrl();
  if (!apiRootUrl) {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${path}`;
  }

  const url = new URL(apiRootUrl, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`;
  return url.toString();
}

function escapeHeader(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/:/g, '\\c');
}

function unescapeHeader(value: string) {
  return value
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\c/g, ':')
    .replace(/\\\\/g, '\\');
}
