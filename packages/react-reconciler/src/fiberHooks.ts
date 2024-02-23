import { Action, ReactElementType } from '@xuans-mini-react/shared'
import { internals } from '@xuans-mini-react/shared/src/internals'

import { FiberNode } from './fiber'
import {
  UpdateQueue,
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { Dispatch, Dispatcher } from '@xuans-mini-react/react'
import { Lane, NoLane, requestUpdateLane } from './fiberLanes'

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null
let renderLane: Lane = NoLane

const { currentDispatcher } = internals

interface Hook {
  memoizedState: any
  updateQueue: any
  next: Hook | null
}

export function renderWithHooks(wip: FiberNode, lane: Lane) {
  currentlyRenderingFiber = wip
  wip.memoizedState = null
  renderLane = lane

  const current = wip.alternate

  if (current !== null) {
    currentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    currentDispatcher.current = HooksDispatcherOnMount
  }

  const Component = wip.type as (props: any) => ReactElementType
  const props = wip.pendingProps

  const children = Component(props)

  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  renderLane = NoLane
  return children
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
}

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
}

function updateState<State>(): [State, Dispatch<State>] {
  const hook = updateWorkInProgressHook()

  const queue = hook.updateQueue
  const pending = queue.shared.pending
  queue.shared.pending = null

  if (pending !== null) {
    const { memoizedState } = processUpdateQueue(
      hook.memoizedState,
      pending,
      renderLane,
    )
    hook.memoizedState = memoizedState
  }

  return [hook.memoizedState, queue.dispatch]
}

function updateWorkInProgressHook() {
  // TODO: handle update triggerd in render
  let nextCurrentHook: Hook | null = null

  if (currentHook === null) {
    const current = currentlyRenderingFiber?.alternate
    nextCurrentHook = current?.memoizedState
  } else {
    nextCurrentHook = currentHook.next
  }

  if (nextCurrentHook === null) {
    throw new Error('Rendered more hooks than during the previous render.')
  }

  currentHook = nextCurrentHook
  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,
    updateQueue: currentHook.updateQueue,
    next: null,
  }

  if (workInProgressHook === null) {
    if (currentlyRenderingFiber === null) {
      throw new Error(
        'Hooks can only be called inside the body of a function component.',
      )
    } else {
      workInProgressHook = currentlyRenderingFiber.memoizedState = newHook
    }
  } else {
    workInProgressHook = workInProgressHook.next = newHook
  }

  return workInProgressHook
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
  const lane = requestUpdateLane()
  const update = createUpdate(action, lane)
  enqueueUpdate(updateQueue, update)
  scheduleUpdateOnFiber(fiber, lane)
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
