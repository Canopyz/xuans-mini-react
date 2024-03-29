import {
  Container,
  Instance,
  appendInitialChild,
  createInstance,
  createTextInstance,
} from 'hostConfig'
import { FiberNode } from './fiber'
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
import { NoFlags, Ref, Update, Visibility } from './fiberFlags'
import { popProvider } from './fiberContext'
import { ReactProviderType } from '@xuans-mini-react/shared'
import { popSuspenseHandler } from './suspenseContext'

function markUpdate(fiber: FiberNode) {
  fiber.flags |= Update
}

export const completeWork = (wip: FiberNode) => {
  const newProps = wip.pendingProps
  const current = wip.alternate

  switch (wip.tag) {
    case HostComponent:
      if (current !== null && wip.stateNode) {
        // update
        // temmporary solution, need to compare newProps and oldProps, mark update if different
        markUpdate(wip)
        if (current.ref !== wip.ref) {
          markRef(wip)
        }
      } else {
        // create DOM and append to parent
        const instance = createInstance(wip.type as string, newProps)
        appendAllChildren(instance, wip)
        wip.stateNode = instance
        if (wip.ref !== null) {
          markRef(wip)
        }
      }
      bubbleProperties(wip)
      return null
    case HostText:
      if (current !== null && wip.stateNode) {
        // update
        const oldText = current.memoizedProps?.content
        const newText = newProps.content
        if (oldText !== newText) {
          markUpdate(wip)
        }
      } else {
        // create DOM and append to parent
        const instance = createTextInstance(newProps.content)
        wip.stateNode = instance
      }
      bubbleProperties(wip)
      return null
    case HostRoot:
      bubbleProperties(wip)
      break
    case FunctionComponent:
      bubbleProperties(wip)
      break
    case Fragment:
      bubbleProperties(wip)
      break
    case OffscreenComponent:
      bubbleProperties(wip)
      break
    case ContextProvider:
      popProvider((wip.type as any as ReactProviderType<any>)._context)
      bubbleProperties(wip)
      break
    case SuspenseComponent:
      popSuspenseHandler()
      const offscreenFiber = wip.child as FiberNode
      const isHidden = offscreenFiber.pendingProps.mode === 'hidden'
      const currentOffscreenFiber = offscreenFiber.alternate

      if (currentOffscreenFiber !== null) {
        const wasHidden = currentOffscreenFiber.pendingProps.mode === 'hidden'
        if (isHidden !== wasHidden) {
          offscreenFiber.flags |= Visibility
          bubbleProperties(offscreenFiber)
        }
      } else if (isHidden) {
        offscreenFiber.flags |= Visibility
        bubbleProperties(offscreenFiber)
      }
      bubbleProperties(wip)
      break
    default:
      if (__DEV__) {
        console.warn('Unknown work tag.')
      }
      break
  }
}

function markRef(fiber: FiberNode) {
  fiber.flags |= Ref
}

function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
  let node = wip.child

  while (node !== null) {
    if (node?.tag === HostComponent || node?.tag === HostText) {
      appendInitialChild(parent, node?.stateNode)
    } else if (node.child !== null) {
      node.child.return = node
      node = node.child
      continue
    }

    if (node === wip) {
      return
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return
      }
      node = node.return
    }
    node.sibling.return = node.return
    node = node.sibling
  }
}

function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags
  let child = wip.child

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags

    child.return = wip
    child = child.sibling
  }

  wip.subtreeFlags |= subtreeFlags
}
