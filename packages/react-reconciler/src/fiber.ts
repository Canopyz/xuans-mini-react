import { Key, Props, Ref, Type } from '@xuans-mini-react/shared'
import { WorkTag } from './workTags'
import { Flags, NoFlags } from './fiberFlags'

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
  alternate: FiberNode | null
  flags: Flags

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

    // alternate points to another fiber node
    this.alternate = null
    // side effect flags
    this.flags = NoFlags
  }
}
