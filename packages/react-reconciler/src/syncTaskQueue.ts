let syncQueue: Array<(...args: any) => void> | null = null
let isFlushingSyncQueue = false

export function scheduleSyncCallback(callback: (...args: any) => void) {
  if (syncQueue === null) {
    syncQueue = [callback]
  } else {
    syncQueue.push(callback)
  }
}

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true
    const queue = syncQueue
    syncQueue = null
    try {
      for (let i = 0; i < queue.length; i++) {
        const callback = queue[i]
        callback()
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error in a sync callback', error)
      }
    } finally {
      isFlushingSyncQueue = false
    }
  }
}
