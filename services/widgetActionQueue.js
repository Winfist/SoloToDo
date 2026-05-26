import { Capacitor } from '@capacitor/core';
import { WIDGET_ACTION_QUEUE_KEY } from './widgetDataService.js';

const APP_GROUP = 'group.com.solotodo.app';

function canUseWidgetBridge() {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  } catch (_) {
    return false;
  }
}

async function getWidgetBridge() {
  if (!canUseWidgetBridge()) return null;
  const { WidgetBridgePlugin } = await import('capacitor-widget-bridge');
  return WidgetBridgePlugin || null;
}

function parseQueue(raw) {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export async function readWidgetActionQueue() {
  const bridge = await getWidgetBridge();
  if (!bridge?.getItem) return [];
  const result = await bridge.getItem({
    group: APP_GROUP,
    key: WIDGET_ACTION_QUEUE_KEY,
  });
  return parseQueue(result?.results);
}

export async function removeProcessedWidgetActions(processedActionIds) {
  const ids = new Set(processedActionIds || []);
  if (ids.size === 0) return;

  const bridge = await getWidgetBridge();
  if (!bridge?.getItem || !bridge?.setItem || !bridge?.removeItem) return;

  const result = await bridge.getItem({
    group: APP_GROUP,
    key: WIDGET_ACTION_QUEUE_KEY,
  });
  const current = parseQueue(result?.results);
  const remaining = current.filter(action => !ids.has(action?.actionId));

  if (remaining.length === 0) {
    await bridge.removeItem({ group: APP_GROUP, key: WIDGET_ACTION_QUEUE_KEY });
  } else {
    await bridge.setItem({
      group: APP_GROUP,
      key: WIDGET_ACTION_QUEUE_KEY,
      value: JSON.stringify(remaining),
    });
  }

  if (bridge.reloadAllTimelines) {
    await bridge.reloadAllTimelines();
  }
}
