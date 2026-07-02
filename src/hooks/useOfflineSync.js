import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const QUEUE_KEY = 'getos_offline_queue';
const SYNC_EVENT = 'getos_sync_status';

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(readQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    const updateStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setPendingCount(readQueue().length);
    };
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener(SYNC_EVENT, updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener(SYNC_EVENT, updateStatus);
    };
  }, []);

  const executeOp = useCallback(async (op) => {
    if (op.type === 'create') {
      return await base44.entities[op.entity].create(op.data);
    } else if (op.type === 'update') {
      return await base44.entities[op.entity].update(op.id, op.data);
    }
  }, []);

  const flush = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = readQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    const remaining = [];
    for (const op of queue) {
      try {
        await executeOp(op);
      } catch (err) {
        // Keep in queue if it's a network error; drop on other failures
        if (err?.message?.includes('network') || err?.message?.includes('fetch') || !navigator.onLine) {
          remaining.push(op);
        }
      }
    }

    writeQueue(remaining);
    syncingRef.current = false;
    setIsSyncing(false);
  }, [executeOp]);

  // Auto-sync when connection is restored
  useEffect(() => {
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    // Also try syncing on mount if already online
    if (navigator.onLine && readQueue().length > 0) {
      flush();
    }
    return () => window.removeEventListener('online', onOnline);
  }, [flush]);

  const enqueue = useCallback((op) => {
    const queue = readQueue();
    queue.push({ ...op, queuedAt: Date.now() });
    writeQueue(queue);
  }, []);

  return { isOnline, pendingCount, isSyncing, enqueue, flush };
}