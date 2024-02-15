import { Key, Props, Ref, Type } from '@xuans-mini-react/shared'
import { WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'
import { Container } from 'hostConfig'
import { UpdateQueue } from './updateQueue'

export class FiberNode {
  type: Type | null
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
  updateQueue: UpdateQueue<any> | null

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // tag is the type of the fiber node
    this.tag = tag
    this.key = key
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
  }
}

export class FiberRootNode {
  container: Container
  current: FiberNode
  finishedWork: FiberNode | null

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container
    this.current = hostRootFiber
    hostRootFiber.stateNode = this
    this.finishedWork = null
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
  }
  workInProgress.type = current.type
  workInProgress.updateQueue = current.updateQueue
  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState

  return workInProgress
}
