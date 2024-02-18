import { Action, ReactElementType } from '@xuans-mini-react/shared'
import { internals } from '@xuans-mini-react/shared/src/internals'

import { FiberNode } from './fiber'
import {
  UpdateQueue,
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { Dispatch, Dispatcher } from '@xuans-mini-react/react'

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null

const { currentDispatcher } = internals

interface Hook {
  memoizedState: any
  updateQueue: any
  next: Hook | null
}

export function renderWithHooks(wip: FiberNode) {
  currentlyRenderingFiber = wip
  wip.memoizedState = null

  const current = wip.alternate

  if (current !== null) {
    currentDispatcher.current = null
  } else {
    currentDispatcher.current = HooksDispatcherOnMount
  }

  const Component = wip.type as (props: any) => ReactElementType
  const props = wip.pendingProps

  const children = Component(props)

  currentlyRenderingFiber = null
  return children
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
}

function mountState<State>(
  initialState: State | (() => State),
): [State, Dispatch<State>] {
  const hook = mountWorkInProgressHook()

  if (initialState instanceof Function) {
    hook.memoizedState = initialState()
  } else {
    hook.memoizedState = initialState
  }

  const queue = createUpdateQueue<State>()
  hook.updateQueue = queue

  const dispatch: Dispatch<State> = dispatchSetState.bind(
    null,
    currentlyRenderingFiber!,
    // @ts-expect-error let me do it
    queue,
  )
  queue.dispatch = dispatch

  return [hook.memoizedState, dispatch]
}

function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>,
) {
  const update = createUpdate(action)
  enqueueUpdate(updateQueue, update)
  scheduleUpdateOnFiber(fiber)
}

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null,
  }

  if (workInProgressHook === null) {
    if (currentlyRenderingFiber === null) {
      throw new Error(
        'Hooks can only be called inside the body of a function component.',
      )
    }

    currentlyRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    workInProgressHook = workInProgressHook.next = hook
  }

  return workInProgressHook
}
