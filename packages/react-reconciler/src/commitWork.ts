import {
  Container,
  appendChildToContainer,
  commitTextUpdate,
  removeChild,
} from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import {
  ChildDeletion,
  MutationMask,
  NoFlags,
  Placement,
  Update,
} from './fiberFlags'
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './workTags'

let nextEffect: FiberNode | null = null

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child

    if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child) {
      nextEffect = child
    } else {
      up: while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect)
        const sibling: FiberNode | null = nextEffect.sibling
        if (sibling !== null) {
          nextEffect = sibling
          break up
        }
        nextEffect = nextEffect.return
      }
    }
  }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const flags = finishedWork.flags

  if ((flags & Placement) !== NoFlags) {
    if (__DEV__) {
      console.warn('Placement')
    }
    commitPlacement(finishedWork)
    finishedWork.flags &= ~Placement
  }

  if ((flags & Update) !== NoFlags) {
    if (__DEV__) {
      console.warn('Update')
    }
    commitUpdate(finishedWork)
    finishedWork.flags &= ~Update
  }

  if ((flags & ChildDeletion) !== NoFlags) {
    if (__DEV__) {
      console.warn('ChildDeletion')
    }
    const deletions = finishedWork.deletions
    if (deletions) {
      deletions.forEach(commitDeletion)
    }
    finishedWork.flags &= ~ChildDeletion
  }
}

function commitDeletion(childToDelete: FiberNode) {
  let rootHostNode: FiberNode | null = null

  commitNestedComponent(childToDelete, (unmountFiber) => {
    switch (unmountFiber.tag) {
      case HostComponent:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber
        }
        // unbind refs
        return
      case HostText:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber
        }
        return
      case FunctionComponent:
        // unmount effects
        return
      default:
        if (__DEV__) {
          console.warn('Unhandled unmount')
        }
    }
  })

  if (rootHostNode !== null) {
    const hostParent = getHostParent(childToDelete)
    hostParent && removeChild((rootHostNode as FiberNode).stateNode, hostParent)
  }
  childToDelete.return = null
  childToDelete.child = null
}

function commitNestedComponent(
  root: FiberNode,
  onCommitUnmount: (fiber: FiberNode) => void,
) {
  let node = root
  while (node) {
    onCommitUnmount(node)

    if (node.child) {
      node.child.return = node
      node = node.child
      continue
    }

    if (node === root) {
      return
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return
      }

      node = node.return
    }
    node.sibling.return = node.return
    node = node.sibling
  }
}

function commitUpdate(finishedWork: FiberNode) {
  switch (finishedWork.tag) {
    case HostText:
      const text = finishedWork.memoizedProps?.content
      return commitTextUpdate(finishedWork.stateNode, text)
    default:
      if (__DEV__) {
        console.warn('Unhandled Update')
      }
      break
  }
}

function commitPlacement(finishedWork: FiberNode) {
  if (__DEV__) {
    console.log('commit Placement')
  }

  const hostParent = getHostParent(finishedWork)
  if (hostParent) {
    appendPlacementNodeIntoContainer(finishedWork, hostParent)
  }
}

function getHostParent(fiber: FiberNode): Container | null {
  let parent = fiber.return

  while (parent) {
    const parentTag = parent.tag
    if (parentTag === HostComponent) {
      return parent.stateNode
    }
    if (parentTag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container
    }
    parent = parent.return
  }

  if (__DEV__) {
    console.warn('No host parent')
  }

  return null
}

function appendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    return appendChildToContainer(hostParent, finishedWork.stateNode)
  }

  const child = finishedWork.child
  if (child) {
    appendPlacementNodeIntoContainer(child, hostParent)

    let sibling = child.sibling
    while (sibling) {
      appendPlacementNodeIntoContainer(sibling, hostParent)
      sibling = sibling.sibling
    }
  }
}
