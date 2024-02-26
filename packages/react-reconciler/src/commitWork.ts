import {
  Container,
  Instance,
  appendChildToContainer,
  commitTextUpdate,
  insertChildToContainer,
  removeChild,
  commitPropsUpdate,
} from 'hostConfig'
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber'
import {
  ChildDeletion,
  MutationMask,
  NoFlags,
  PassiveEffect,
  PassiveMask,
  Placement,
  Update,
} from './fiberFlags'
import {
  Fragment,
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './workTags'
import { Effect, FCUpdateQueue } from './fiberHooks'
import { HookEffectTag, HookHasEffect } from './hookEffectTags'

let nextEffect: FiberNode | null = null

export const commitMutationEffects = (
  finishedWork: FiberNode,
  root: FiberRootNode,
) => {
  nextEffect = finishedWork

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child

    if (
      (nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags &&
      child
    ) {
      nextEffect = child
    } else {
      up: while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect, root)
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

function commitMutationEffectsOnFiber(
  finishedWork: FiberNode,
  root: FiberRootNode,
) {
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
      deletions.forEach((deletion) => commitDeletion(deletion, root))
    }
    finishedWork.flags &= ~ChildDeletion
  }

  if ((flags & PassiveEffect) !== NoFlags) {
    commitPassiveEffect(finishedWork, root, 'update')
    finishedWork.flags &= ~PassiveEffect
  }
}

function commitPassiveEffect(
  fiber: FiberNode,
  root: FiberRootNode,
  type: keyof PendingPassiveEffects,
) {
  if (
    fiber.tag !== FunctionComponent ||
    (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
  ) {
    return
  }

  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>
  if (updateQueue !== null) {
    if (updateQueue.lastEffect === null) {
      if (__DEV__) {
        console.error('Passive effect without pending effect')
      }
      return
    }
    root.pendingPassiveEffects[type].push(updateQueue.lastEffect)
  }
}

function commitHookEffectList(
  flags: HookEffectTag,
  lastEffect: Effect,
  callback: (effect: Effect) => void,
) {
  let effect = lastEffect.next!

  do {
    if ((effect.tag & flags) === flags) {
      callback(effect)
    }
    effect = effect.next!
  } while (effect !== lastEffect.next)
}

export function commitHookEffectListUnmount(
  flags: HookEffectTag,
  lastEffect: Effect,
) {
  commitHookEffectList(flags, lastEffect, (effect) => {
    const destroy = effect.destroy
    if (typeof destroy === 'function') {
      destroy()
    }
    effect.tag &= ~HookHasEffect
  })
}

export function commitHookEffectListDestroy(
  flags: HookEffectTag,
  lastEffect: Effect,
) {
  commitHookEffectList(flags, lastEffect, (effect) => {
    const destroy = effect.destroy
    if (typeof destroy === 'function') {
      destroy()
    }
  })
}

export function commitHookEffectListCreate(
  flags: HookEffectTag,
  lastEffect: Effect,
) {
  commitHookEffectList(flags, lastEffect, (effect) => {
    const create = effect.create
    if (typeof create === 'function') {
      const destroy = create()
      effect.destroy = destroy
    }
  })
}

function recordHostChildrenToDelete(
  childrenToDelete: FiberNode[],
  unmountFiber: FiberNode,
) {
  const lastOne = childrenToDelete[childrenToDelete.length - 1]

  if (!lastOne) {
    childrenToDelete.push(unmountFiber)
  } else {
    let node = lastOne.sibling
    while (node) {
      if (unmountFiber === node) {
        childrenToDelete.push(unmountFiber)
      } else {
        let parent = unmountFiber.return
        while (parent?.tag === Fragment) {
          if (parent === node) {
            childrenToDelete.push(unmountFiber)
            return
          }
          parent = parent.return
        }
      }
      node = node.sibling
    }
  }
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
  const rootChildrenToDelete: FiberNode[] = []

  commitNestedComponent(childToDelete, (unmountFiber) => {
    switch (unmountFiber.tag) {
      case HostComponent:
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
        // unbind refs
        return
      case HostText:
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
        return
      case FunctionComponent:
        // unmount effects
        commitPassiveEffect(unmountFiber, root, 'unmount')
        return
      case Fragment:
        return
      default:
        if (__DEV__) {
          console.warn('Unhandled unmount')
        }
    }
  })

  if (rootChildrenToDelete.length) {
    const hostParent = getHostParent(childToDelete)
    if (hostParent) {
      rootChildrenToDelete.forEach((child) => {
        removeChild(child.stateNode, hostParent)
      })
    }
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
    case HostComponent:
      return commitPropsUpdate(
        finishedWork.stateNode,
        finishedWork.memoizedProps,
      )
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
  const sibling = getHostSibling(finishedWork)

  if (hostParent) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling)
  }
}

function getHostSibling(fiber: FiberNode) {
  let node: FiberNode = fiber

  findSibling: while (true) {
    while (node.sibling === null) {
      const parent = node.return

      if (
        parent === null ||
        parent.tag === HostComponent ||
        parent.tag === HostRoot
      ) {
        return null
      }
      node = parent
    }

    node.sibling.return = node.return
    node = node.sibling

    while (node.tag !== HostComponent && node.tag !== HostText) {
      if ((node.flags & (Placement | ChildDeletion)) !== NoFlags) {
        continue findSibling
      }
      if (node.child === null) {
        continue findSibling
      }
      node.child.return = node
      node = node.child
    }

    if ((node.flags & (Placement | ChildDeletion)) === NoFlags) {
      return node.stateNode
    }
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

function insertOrAppendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Instance | null,
) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      return insertChildToContainer(finishedWork.stateNode, hostParent, before)
    } else {
      return appendChildToContainer(hostParent, finishedWork.stateNode)
    }
  }

  const child = finishedWork.child
  if (child) {
    insertOrAppendPlacementNodeIntoContainer(child, hostParent)

    let sibling = child.sibling
    while (sibling) {
      insertOrAppendPlacementNodeIntoContainer(sibling, hostParent)
      sibling = sibling.sibling
    }
  }
}
