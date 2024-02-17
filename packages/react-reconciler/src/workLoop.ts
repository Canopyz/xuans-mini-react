import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {})
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber)
  root && renderRoot(root)
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

function renderRoot(root: FiberRootNode) {
  prepareFreshStack(root)

  do {
    try {
      workLoop()
      break
    } catch (err) {
      if (__DEV__) {
        console.warn('workLoop error', err)
      }
      workInProgress = null
    }
  } while (true)

  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork

  // commitRoot(root)
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber)
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
