import { stringify } from 'jsan';

const listeners = {};

/*
function stringify(obj) {
   return jsan.stringify(obj, function(key, value) {
   if (value && value.toJS) { return value.toJS(); }
   return value;
   }, null, true);
}
*/

export function generateId(instanceId) {
  return instanceId || Math.random().toString(36).substr(2);
}

export function toContentScript(message, shouldStringify) {
  if (shouldStringify) {
    if (message.payload) message.payload = stringify(message.payload);
    if (message.action) message.action = stringify(message.action);
  }
  window.postMessage(message, '*');
}

export function sendMessage(action, state, shouldStringify, id) {
  toContentScript({
    type: 'ACTION',
    action: typeof action === 'object' ? action : { type: action },
    payload: state,
    source: '@devtools-page',
    name: document.title,
    id
  }, shouldStringify);
}

function handleMessages(event) {
  if (!event || event.source !== window) return;
  const message = event.data;
  if (!message || message.source !== '@devtools-extension') return;
  Object.keys(listeners).forEach(id => {
    if (message.id && id !== message.id) return;
    if (typeof listeners[id] === 'function') listeners[id](message);
    else listeners[id].forEach(fn => { fn(message); });
  });
}

export function setListener(onMessage, instanceId) {
  listeners[instanceId] = onMessage;
  window.addEventListener('message', handleMessages, false);
}

export function disconnect() {
  window.removeEventListener('message', handleMessages);
  toContentScript({ type: 'DISCONNECT', source: '@devtools-page' });
}