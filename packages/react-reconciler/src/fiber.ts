import {
  Key,
  Props,
  ReactElementType,
  Ref,
  ElementType,
} from '@xuans-mini-react/shared'
import { Fragment, FunctionComponent, HostComponent, WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'
import { Container } from 'hostConfig'
import { UpdateQueue } from './updateQueue'
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes'
import { Effect } from './fiberHooks'
import { CallbackNode } from 'scheduler'

export class FiberNode {
  type: ElementType | null
  tag: WorkTag
  pendingProps: Props
  key: Key
  stateNode: any
  ref: Ref

  return: FiberNode | null
  sibling: FiberNode | null
  child: FiberNode | null
  index: number

  memoizedProps: Props | null
  memoizedState: any
  alternate: FiberNode | null
  flags: Flags
  subtreeFlags: Flags
  updateQueue: UpdateQueue<any> | null
  deletions: Array<FiberNode> | null

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // tag is the type of the fiber node
    this.tag = tag
    this.key = key || null
    // stateNode is the instance of the component
    this.stateNode = null
    // type is the function component or host component
    this.type = null

    // these form a tree structure
    // return is the pointer to the parent node
    this.return = null
    this.sibling = null
    this.child = null
    this.index = 0

    this.ref = null

    // work unit
    this.pendingProps = pendingProps
    this.memoizedProps = null
    this.updateQueue = null
    this.memoizedState = null

    // alternate points to another fiber node
    this.alternate = null
    // side effect flags
    this.flags = NoFlags
    this.subtreeFlags = NoFlags
    this.deletions = null
  }
}

export interface PendingPassiveEffects {
  unmount: Effect[]
  update: Effect[]
}
export class FiberRootNode {
  container: Container
  current: FiberNode
  finishedWork: FiberNode | null

  pendingLanes: Lanes
  finishedLane: Lane
  pendingPassiveEffects: PendingPassiveEffects

  callbackNode: CallbackNode | null
  callbackPriority: Lane

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container
    this.current = hostRootFiber
    hostRootFiber.stateNode = this
    this.finishedWork = null

    this.pendingLanes = NoLanes
    this.finishedLane = NoLane

    this.callbackNode = null
    this.callbackPriority = NoLane

    this.pendingPassiveEffects = {
      unmount: [],
      update: [],
    }
  }
}

export function createWorkInProgress(
  current: FiberNode,
  pendingProps: Props,
): FiberNode {
  let workInProgress = current.alternate

  if (workInProgress === null) {
    workInProgress = new FiberNode(current.tag, pendingProps, current.key)
    workInProgress.stateNode = current.stateNode

    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    workInProgress.pendingProps = pendingProps
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
    workInProgress.deletions = null
  }
  workInProgress.type = current.type
  workInProgress.updateQueue = current.updateQueue
  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState

  return workInProgress
}

export function createFiberFromElement(element: ReactElementType) {
  const { type, key, props } = element

  let fiberTag: WorkTag = FunctionComponent
  if (typeof type === 'string') {
    fiberTag = HostComponent
  } else if (typeof type !== 'function') {
    if (__DEV__) {
      console.warn('Unknown fiber tag', type)
    }
  }

  const fiber = new FiberNode(fiberTag, props, key)
  fiber.type = type
  return fiber
}

export function createFiberFromFragment(element: ReactElementType, key: Key) {
  const fiber = new FiberNode(Fragment, element, key)
  return fiber
}
