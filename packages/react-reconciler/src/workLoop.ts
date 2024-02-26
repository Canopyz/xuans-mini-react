import { scheduleMicrotask } from 'hostConfig'
import { beginWork } from './beginWork'
import {
  commitHookEffectListCreate,
  commitHookEffectListDestroy,
  commitHookEffectListUnmount,
  commitMutationEffects,
} from './commitWork'
import { completeWork } from './completeWork'
import {
  FiberNode,
  FiberRootNode,
  PendingPassiveEffects,
  createWorkInProgress,
} from './fiber'
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags'
import {
  Lane,
  NoLane,
  SyncLane,
  getHighestPriorityLane,
  lanesToSchedulerPriority,
  markRootFinished,
  mergeLanes,
} from './fiberLanes'
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue'
import { HostRoot } from './workTags'
import {
  unstable_scheduleCallback as scheduleCallBack,
  unstable_NormalPriority as NormalPriority,
  unstable_shouldYield,
  unstable_cancelCallback,
} from 'scheduler'
import { HookHasEffect, Passive } from './hookEffectTags'

let workInProgress: FiberNode | null = null
let wipRootRenderLane: Lane = NoLane
let rootDoesHavePassiveEffects: boolean = false

const RootIncomplete = 1
const RootCompleted = 2

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
  root.finishedLane = NoLane
  root.finishedWork = null
  workInProgress = createWorkInProgress(root.current, {})
  wipRootRenderLane = lane
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  const root = markUpdateFromFiberToRoot(fiber)!
  markRootUpdated(root, lane)
  ensureRootIsScheduled(root)
}

function ensureRootIsScheduled(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes)
  const existingCallback = root.callbackNode

  if (updateLane === NoLane) {
    if (existingCallback !== null) {
      unstable_cancelCallback(existingCallback)
      root.callbackNode = null
      root.callbackPriority = NoLane
    }
    return
  }

  const curPriority = updateLane
  const prevPriority = root.callbackPriority

  if (prevPriority === curPriority) {
    return
  }

  if (existingCallback !== null) {
    unstable_cancelCallback(existingCallback)
  }

  let newCallbackNode = null

  if (updateLane === SyncLane) {
    // use microtasks
    if (__DEV__) {
      console.log('schedule microtask, lane: ', updateLane)
    }
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    scheduleMicrotask(flushSyncCallbacks)
  } else {
    // use macrotasks
    const schedulerPriority = lanesToSchedulerPriority(updateLane)
    newCallbackNode = scheduleCallBack(
      schedulerPriority,
      performConcurrentWorkOnRoot.bind(null, root),
    )
  }

  root.callbackNode = newCallbackNode
  root.callbackPriority = updateLane
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane)
}

function markUpdateFromFiberToRoot(fiber: FiberNode): FiberRootNode | null {
  let node = fiber
  let parent = node.return

  while (parent !== null) {
    node = parent
    parent = node.return
  }

  if (node.tag === HostRoot) {
    return node.stateNode
  }
  return null
}

function performConcurrentWorkOnRoot(
  root: FiberRootNode,
  didTimeout?: boolean,
): any {
  const curCallback = root.callbackNode
  const didFlushPassiveEffect = flushPassiveEffects(root.pendingPassiveEffects)
  if (didFlushPassiveEffect) {
    if (root.callbackNode !== curCallback) {
      return null
    }
  }

  const lane = getHighestPriorityLane(root.pendingLanes)
  const curCallbackNode = root.callbackNode
  if (lane === NoLane) {
    return
  }

  const needSync = lane === SyncLane || didTimeout
  const exitStatus = renderRoot(root, lane, !needSync)

  ensureRootIsScheduled(root)

  if (exitStatus === RootIncomplete) {
    if (root.callbackNode !== curCallbackNode) {
      return null
    }
    return performConcurrentWorkOnRoot.bind(null, root)
  }

  if (exitStatus === RootCompleted) {
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    root.finishedLane = lane
    wipRootRenderLane = NoLane
    commitRoot(root)
  }
}

function performSyncWorkOnRoot(root: FiberRootNode) {
  const nextLane = getHighestPriorityLane(root.pendingLanes)
  if (nextLane !== SyncLane) {
    ensureRootIsScheduled(root)
    return
  }

  const exitStatus = renderRoot(root, nextLane, false)

  if (exitStatus === RootCompleted) {
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    root.finishedLane = nextLane
    wipRootRenderLane = NoLane

    commitRoot(root)
  }
}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
  if (__DEV__) {
    console.log(
      `render root in ${shouldTimeSlice ? 'concurrent mode' : 'sync mode'}`,
    )
  }

  if (wipRootRenderLane !== lane) {
    prepareFreshStack(root, lane)
  }

  do {
    try {
      shouldTimeSlice ? workLoopConcurrent() : workLoopSync()
      break
    } catch (err) {
      if (__DEV__) {
        console.warn('workLoop error', err)
      }
      workInProgress = null
    }
  } while (true)

  if (workInProgress !== null && shouldTimeSlice) {
    return RootIncomplete
  }

  if (!shouldTimeSlice && workInProgress !== null) {
    if (__DEV__) {
      console.error('wip should be null after sync render')
    }
  }

  return RootCompleted
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork
  if (finishedWork === null) {
    return
  }

  if (__DEV__) {
    console.log('commit phase')
  }
  const lane = root.finishedLane

  if (lane === NoLane && __DEV__) {
    console.error('No lane to commit')
  }

  // reset
  root.finishedWork = null
  root.finishedLane = NoLane
  markRootFinished(root, lane)

  if (
    (finishedWork.flags & PassiveMask) !== NoFlags ||
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true
      scheduleCallBack(NormalPriority, () => {
        flushPassiveEffects(root.pendingPassiveEffects)
        return
      })
    }
  }

  // check if there are effects
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags
  const rootHasEffect =
    (finishedWork.flags & (MutationMask | PassiveMask)) !== NoFlags

  if (subtreeHasEffect || rootHasEffect) {
    // beforeMutation
    // mutation
    commitMutationEffects(finishedWork, root)
    root.current = finishedWork
    // layout
  } else {
    root.current = finishedWork
  }

  rootDoesHavePassiveEffects = false
  ensureRootIsScheduled(root)
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
  let disdFlushPassiveEffect = false
  pendingPassiveEffects.unmount.forEach((effect) => {
    disdFlushPassiveEffect = true
    commitHookEffectListUnmount(Passive, effect)
  })
  pendingPassiveEffects.unmount = []

  pendingPassiveEffects.update.forEach((effect) => {
    disdFlushPassiveEffect = true
    commitHookEffectListDestroy(Passive | HookHasEffect, effect)
  })
  pendingPassiveEffects.update.forEach((effect) => {
    disdFlushPassiveEffect = true
    commitHookEffectListCreate(Passive | HookHasEffect, effect)
  })
  pendingPassiveEffects.update = []

  flushSyncCallbacks()
  return disdFlushPassiveEffect
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

function workLoopConcurrent() {
  while (workInProgress !== null && !unstable_shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber, wipRootRenderLane)
  fiber.memoizedProps = fiber.pendingProps

  if (next === null) {
    completeUnitOfWork(fiber)
  } else {
    workInProgress = next
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber

  do {
    completeWork(node)
    const sibling = node.sibling

    if (sibling !== null) {
      workInProgress = sibling
      return
    }

    node = node.return
    workInProgress = node
  } while (node !== null)
}
