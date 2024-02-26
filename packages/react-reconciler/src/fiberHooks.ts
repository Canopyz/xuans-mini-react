import { Action, ReactElementType } from '@xuans-mini-react/shared'
import { internals } from '@xuans-mini-react/shared/src/internals'

import { FiberNode } from './fiber'
import {
  Update,
  UpdateQueue,
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
} from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { Dispatch, Dispatcher } from '@xuans-mini-react/react'
import { Lane, NoLane, requestUpdateLane } from './fiberLanes'
import { HookEffectTag, HookHasEffect, Passive } from './hookEffectTags'
import { PassiveEffect } from './fiberFlags'

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null
let renderLane: Lane = NoLane

const { currentDispatcher, ReactCurrentBatchConfig } = internals

interface Hook {
  memoizedState: any
  baseState: any
  baseQueue: Update<any> | null
  updateQueue: any
  next: Hook | null
}

export interface Effect {
  tag: HookEffectTag
  create: () => EffectCallback | void
  destroy: EffectCallback | void
  deps: EffectDeps
  next: Effect | null
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
  lastEffect: Effect | null
}

type EffectCallback = () => void
type EffectDeps = any[] | null

export function renderWithHooks(wip: FiberNode, lane: Lane) {
  currentlyRenderingFiber = wip
  wip.memoizedState = null
  wip.updateQueue = null
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
  useEffect: mountEffect,
  useTransition: mountTransition,
}

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
  useEffect: updateEffect,
  useTransition: updateTransition,
}

function mountEffect(create: () => EffectCallback | void, deps?: EffectDeps) {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  currentlyRenderingFiber!.flags |= PassiveEffect

  hook.memoizedState = pushEffect(
    Passive | HookHasEffect,
    create,
    undefined,
    nextDeps,
  )
}

function updateEffect(create: () => EffectCallback | void, deps?: EffectDeps) {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  let destroy: EffectCallback | void

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState as Effect
    destroy = prevEffect.destroy

    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(Passive, create, destroy, nextDeps)
        return
      }
    }

    currentlyRenderingFiber!.flags |= PassiveEffect
    hook.memoizedState = pushEffect(
      Passive | HookHasEffect,
      create,
      destroy,
      nextDeps,
    )
  }
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
  if (prevDeps === null || nextDeps === null) {
    return false
  }

  if (nextDeps.length !== prevDeps.length) {
    return false
  }

  for (let i = 0; i < prevDeps.length; i++) {
    if (nextDeps[i] !== prevDeps[i]) {
      return false
    }
  }
  return true
}

function pushEffect(
  hookFlags: HookEffectTag,
  create: () => EffectCallback | void,
  destroy: EffectCallback | void,
  deps: EffectDeps,
) {
  const effect: Effect = {
    tag: hookFlags,
    create,
    destroy,
    deps,
    next: null,
  }
  const fiber = currentlyRenderingFiber
  if (fiber === null) {
    throw new Error('Unexpected render phase')
  }
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>
  if (updateQueue === null) {
    const updateQueue = createFCUpdateQueue()
    fiber.updateQueue = updateQueue
    effect.next = effect
    updateQueue.lastEffect = effect
  } else {
    const lastEffect = updateQueue.lastEffect
    if (lastEffect === null) {
      effect.next = effect
      updateQueue.lastEffect = effect
    } else {
      effect.next = lastEffect.next
      lastEffect.next = effect
      updateQueue.lastEffect = effect
    }
  }
  return effect
}

function createFCUpdateQueue<State>() {
  const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>
  updateQueue.lastEffect = null
  return updateQueue
}

function updateState<State>(): [State, Dispatch<State>] {
  const hook = updateWorkInProgressHook()

  const queue = hook.updateQueue
  const baseState = hook.baseState

  const pending = queue.shared.pending
  const current = currentHook!
  let baseQueue = current.baseQueue

  if (pending !== null) {
    // save update to current
    if (baseQueue !== null) {
      const baseFirst = baseQueue.next
      const pendingFirst = pending.next

      baseQueue.next = pendingFirst
      pending.next = baseFirst
    }
    baseQueue = pending
    current.baseQueue = pending
    queue.shared.pending = null
  }

  if (baseQueue !== null) {
    const {
      memoizedState,
      baseQueue: newBaseQueue,
      baseState: newBaseState,
    } = processUpdateQueue(baseState, baseQueue, renderLane)
    hook.memoizedState = memoizedState
    hook.baseState = newBaseState
    hook.baseQueue = newBaseQueue
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
    baseQueue: currentHook.baseQueue,
    baseState: currentHook.baseState,
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
    hook.baseState = hook.memoizedState = initialState()
  } else {
    hook.baseState = hook.memoizedState = initialState
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

function mountTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setIsPending] = mountState(false)
  const hook = mountWorkInProgressHook()

  const start = startTransition.bind(null, setIsPending)
  hook.memoizedState = start

  return [isPending, start]
}

function updateTransition(): [boolean, (callback: () => void) => void] {
  const [isPending] = updateState()
  const hook = updateWorkInProgressHook()
  const start = hook.memoizedState
  return [isPending as boolean, start]
}

function startTransition(
  setIsPending: Dispatch<boolean>,
  callback: () => void,
) {
  setIsPending(true)
  const prevTransition = ReactCurrentBatchConfig.transition
  ReactCurrentBatchConfig.transition = 1

  callback()
  setIsPending(false)

  ReactCurrentBatchConfig.transition = prevTransition
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
    baseQueue: null,
    baseState: null,
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
