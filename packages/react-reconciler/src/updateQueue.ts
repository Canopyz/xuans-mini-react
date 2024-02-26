import { Dispatch } from '@xuans-mini-react/react'
import { Action } from '@xuans-mini-react/shared'
import { Lane, NoLane, isSubsetOfLanes } from './fiberLanes'

export interface Update<State> {
  action: Action<State>
  lane: Lane
  next?: Update<any>
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null
  }
  dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(
  action: Action<State>,
  lane: Lane,
): Update<State> => {
  return {
    action,
    lane,
  }
}

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
  return {
    shared: {
      pending: null,
    },
    dispatch: null,
  } as UpdateQueue<State>
}

export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>,
) => {
  const pending = updateQueue.shared.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
  updateQueue.shared.pending = update
}

export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null,
  renderLane: Lane,
): {
  memoizedState: State
  baseState: State
  baseQueue: Update<State> | null
} => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
    baseState,
    baseQueue: null,
  }

  if (pendingUpdate !== null) {
    const first = pendingUpdate.next
    let pending = pendingUpdate.next!

    let newBaseState = baseState
    let newBaseQueueFirst: Update<State> | null = null
    let newBaseQueueLast: Update<State> | null = null
    let newState = newBaseState

    do {
      const updateLane = pending.lane
      if (!isSubsetOfLanes(updateLane, renderLane)) {
        const clone = createUpdate(pending.action, updateLane)
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone
          newBaseState = newState
        } else {
          newBaseQueueLast.next = clone
          newBaseQueueLast = clone
        }
      } else {
        const action = pending.action
        if (newBaseQueueLast !== null) {
          const clone = createUpdate(action, NoLane)
          newBaseQueueLast.next = clone
          newBaseQueueLast = clone
        }
        if (action instanceof Function) {
          newState = action(baseState)
        } else {
          newState = action
        }
      }
      pending = pending.next!
    } while (pending !== first)

    if (newBaseQueueLast === null) {
      newBaseState = newState
    } else {
      newBaseQueueLast.next = newBaseQueueFirst!
    }
    result.memoizedState = newState
    result.baseState = newBaseState
    result.baseQueue = newBaseQueueLast
  }

  return result
}
