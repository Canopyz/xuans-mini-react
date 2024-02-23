import { Dispatch } from '@xuans-mini-react/react'
import { Action } from '@xuans-mini-react/shared'
import { Lane } from './fiberLanes'

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
): { memoizedState: State } => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
  }

  if (pendingUpdate !== null) {
    const first = pendingUpdate.next
    let pending = pendingUpdate.next!
    do {
      const updateLane = pending.lane
      if (updateLane === renderLane) {
        const action = pending.action
        if (action instanceof Function) {
          baseState = action(baseState)
        } else {
          baseState = action
        }
      } else {
        if (__DEV__) {
          console.error('Not implemented yet')
        }
      }
      pending = pending.next!
    } while (pending !== first)

    result.memoizedState = baseState
  }

  return result
}
