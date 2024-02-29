import { ReactElementType, ReactProviderType } from '@xuans-mini-react/shared'
import {
  FiberNode,
  OffscreenProps,
  createFiberFromFragment,
  createFiberFromOffscreen,
  createWorkInProgress,
} from './fiber'
import { UpdateQueue, processUpdateQueue } from './updateQueue'
import {
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  OffscreenComponent,
  SuspenseComponent,
} from './workTags'
import { mountChildFibers, reconcileChildFibers } from './childFibers'
import { renderWithHooks } from './fiberHooks'
import { Lane } from './fiberLanes'
import {
  ChildDeletion,
  DidCapture,
  NoFlags,
  Placement,
  Ref,
} from './fiberFlags'
import { pushProvider } from './fiberContext'
import { pushSuspenseHandler } from './suspenseContext'

export const beginWork = (wip: FiberNode, renderLane: Lane) => {
  // return child fiber
  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip, renderLane)
    case HostComponent:
      return updateHostComponent(wip)
    case HostText:
      return null
    case FunctionComponent:
      return updateFunctionComponent(wip, renderLane)
    case Fragment:
      return updateFragmentComponent(wip)
    case ContextProvider:
      return updateContextProvider(wip)
    case SuspenseComponent:
      return updateSuspenseComponent(wip)
    case OffscreenComponent:
      return updateOffscreenComponent(wip)
    default:
      if (__DEV__) {
        console.warn('Unknown fiber tag', wip.tag)
      }
      return null
  }
}

function updateSuspenseComponent(wip: FiberNode) {
  const current = wip.alternate
  const nextProps = wip.pendingProps

  let showFallback = false
  const didSuspend = (wip.flags & DidCapture) !== NoFlags
  if (didSuspend) {
    showFallback = true
    wip.flags &= ~DidCapture
  }

  const nextPrimaryChildren = nextProps.children
  const nextFallbackChildren = nextProps.fallback

  pushSuspenseHandler(wip)

  if (current === null) {
    if (showFallback) {
      return mountSuspenseFallbackChildren(
        wip,
        nextPrimaryChildren,
        nextFallbackChildren,
      )
    } else {
      return mountSuspensePrimaryChildren(wip, nextPrimaryChildren)
    }
  } else {
    if (showFallback) {
      return updateSuspenseFallbackChildren(
        wip,
        nextPrimaryChildren,
        nextFallbackChildren,
      )
    } else {
      return updateSuspensePrimaryChildren(wip, nextPrimaryChildren)
    }
  }
}
function updateSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
  const current = wip.alternate!
  const currentPrimaryChildFragment = current.child!
  const currentFallbackChildFragment: FiberNode | null =
    currentPrimaryChildFragment.sibling

  const primaryChildProps: OffscreenProps = {
    mode: 'visible',
    children: primaryChildren,
  }

  const primaryChildFragment = createWorkInProgress(
    currentPrimaryChildFragment,
    primaryChildProps,
  )
  wip.child = primaryChildFragment
  primaryChildFragment.return = wip
  primaryChildFragment.sibling = null

  if (currentFallbackChildFragment !== null) {
    let deletions = wip.deletions
    if (deletions === null) {
      deletions = wip.deletions = []
      wip.flags |= ChildDeletion
    }
    deletions.push(currentFallbackChildFragment)
  }

  return primaryChildFragment
}

function updateSuspenseFallbackChildren(
  wip: FiberNode,
  primaryChildren: any,
  fallbackChildren: any,
) {
  const current = wip.alternate!
  const currentPrimaryChildFragment = current.child!
  const currentFallbackChildFragment: FiberNode | null =
    currentPrimaryChildFragment.sibling

  const primaryChildProps: OffscreenProps = {
    mode: 'hidden',
    children: primaryChildren,
  }

  const primaryChildFragment = createWorkInProgress(
    currentPrimaryChildFragment,
    primaryChildProps,
  )

  let fallbackChildFragment = null
  if (currentFallbackChildFragment !== null) {
    fallbackChildFragment = createWorkInProgress(
      currentFallbackChildFragment,
      fallbackChildren,
    )
  } else {
    fallbackChildFragment = createFiberFromFragment(fallbackChildren, null)
  }

  fallbackChildFragment.return = wip
  primaryChildFragment.sibling = fallbackChildFragment
  primaryChildFragment.return = wip
  wip.child = primaryChildFragment

  return fallbackChildFragment
}

function mountSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
  const primaryChildProps: OffscreenProps = {
    mode: 'visible',
    children: primaryChildren,
  }
  const primaryChildFragment = createFiberFromOffscreen(primaryChildProps)
  wip.child = primaryChildFragment
  primaryChildFragment.return = wip
  return primaryChildFragment
}

function mountSuspenseFallbackChildren(
  wip: FiberNode,
  primaryChildren: any,
  fallbackChildren: any,
) {
  const primaryChildProps: OffscreenProps = {
    mode: 'hidden',
    children: primaryChildren,
  }
  const primaryChildFragment = createFiberFromOffscreen(primaryChildProps)
  const fallbackChildFragment = createFiberFromFragment(fallbackChildren, null)

  fallbackChildFragment.flags |= Placement

  primaryChildFragment.sibling = fallbackChildFragment
  primaryChildFragment.return = wip
  fallbackChildFragment.return = wip
  wip.child = primaryChildFragment

  return fallbackChildFragment
}

function updateOffscreenComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps
  const nextChildren = nextProps.children
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateContextProvider(wip: FiberNode) {
  const providerType = wip.type as any as ReactProviderType<any>
  const context = providerType._context
  const nextProps = wip.pendingProps
  pushProvider(context, nextProps.value)

  const nextChildren = nextProps.children
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateFragmentComponent(wip: FiberNode) {
  const nextChildren = wip.pendingProps as ReactElementType
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
  const nextChildren = renderWithHooks(wip, renderLane)
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
  const baseState = wip.memoizedState
  const updateQueue = wip.updateQueue as UpdateQueue<Element>
  const pending = updateQueue.shared.pending
  updateQueue.shared.pending = null
  const { memoizedState } = processUpdateQueue(baseState, pending, renderLane)

  const current = wip.alternate
  if (current !== null) {
    current.memoizedState = memoizedState
  }

  wip.memoizedState = memoizedState

  const nextChildren = wip.memoizedState
  reconcileChildren(wip, nextChildren)
  return wip.child
}

function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps
  const nextChildren = nextProps.children
  markRef(wip.alternate, wip)
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

function markRef(current: FiberNode | null, wip: FiberNode) {
  const ref = wip.ref

  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    wip.flags |= Ref
  }
}
