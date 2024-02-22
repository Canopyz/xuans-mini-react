import { ReactElementType } from '@xuans-mini-react/shared'
import { FiberNode } from './fiber'
import { UpdateQueue, processUpdateQueue } from './updateQueue'
import {
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './workTags'
import { mountChildFibers, reconcileChildFibers } from './childFibers'
import { renderWithHooks } from './fiberHooks'

export const beginWork = (wip: FiberNode) => {
  // return child fiber
  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip)
    case HostComponent:
      return updateHostComponent(wip)
    case HostText:
      return null
    case FunctionComponent:
      return updateFunctionComponent(wip)
    case Fragment:
      return updateFragmentComponent(wip)
    default:
      if (__DEV__) {
        console.warn('Unknown fiber tag', wip.tag)
      }
      return null
  }
}

function updateFragmentComponent(wip: FiberNode) {
  const nextChildren = wip.pendingProps as ReactElementType
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateFunctionComponent(wip: FiberNode) {
  const nextChildren = renderWithHooks(wip)
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateHostRoot(wip: FiberNode) {
  const baseState = wip.memoizedState
  const updateQueue = wip.updateQueue as UpdateQueue<Element>
  const pending = updateQueue.shared.pending
  updateQueue.shared.pending = null
  const { memoizedState } = processUpdateQueue(baseState, pending)
  wip.memoizedState = memoizedState

  const nextChildren = wip.memoizedState
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps
  const nextChildren = nextProps.children
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
  const current = wip.alternate

  if (current !== null) {
    // update
    wip.child = reconcileChildFibers(wip, current.child, children)
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children)
  }
}
