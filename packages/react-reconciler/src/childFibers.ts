import {
  Props,
  REACT_ELEMENT_TYPE,
  ReactElementType,
} from '@xuans-mini-react/shared'
import {
  FiberNode,
  createFiberFromElement,
  createWorkInProgress,
} from './fiber'
import { HostText } from './workTags'
import { ChildDeletion, Placement } from './fiberFlags'

type ExistingChildren = Map<string | number, FiberNode>

function ChildReconciler(shouldTrackSideEffects: boolean) {
  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackSideEffects) {
      return
    }

    const deletions = returnFiber.deletions
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete)
    }
  }

  function deleteRemainingChildren(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
  ) {
    if (!shouldTrackSideEffects) {
      return
    }
    let childToDelete = currentFirstChild
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
  }

  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) {
    const key = element.key
    while (currentFiber !== null) {
      if (currentFiber.key === key) {
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (element.type === currentFiber.type) {
            // can reuse the existing fiber
            const existing = useFiber(currentFiber, element.props)
            existing.return = returnFiber
            // delete the siblings
            deleteRemainingChildren(returnFiber, currentFiber.sibling)
            return existing
          }

          // same key but different type, impossible to reuse
          deleteRemainingChildren(returnFiber, currentFiber)
          break
        } else {
          if (__DEV__) {
            console.warn('Unknown child type', element)
            break
          }
        }
      } else {
        // delete the old child
        deleteChild(returnFiber, currentFiber)
        currentFiber = currentFiber.sibling
      }
    }

    const fiber = createFiberFromElement(element)
    fiber.return = returnFiber
    return fiber
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) {
    while (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        const existing = useFiber(currentFiber, { content })
        existing.return = returnFiber
        deleteRemainingChildren(returnFiber, currentFiber.sibling)
        return existing
      }

      deleteChild(returnFiber, currentFiber)
      currentFiber = currentFiber.sibling
    }
    const fiber = new FiberNode(HostText, { content }, null)
    fiber.return = returnFiber
    return fiber
  }

  function placeSingleChild(newFiber: FiberNode) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags = newFiber.flags | Placement
    }
    return newFiber
  }

  function reconcileChildrenArray(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChild: any[],
  ) {
    // last reusable fiber's index in current
    let lastPlacedIndex = 0
    let lastNewFiber: FiberNode | null = null
    let firstNewFiber: FiberNode | null = null

    // save current to map
    const existingChildren: ExistingChildren = new Map()
    let current = currentFirstChild

    while (current !== null) {
      const keyToUse = current.key !== null ? current.key : current.index
      existingChildren.set(keyToUse, current)
      current = current.sibling
    }

    // iterate newChild to see if we can reuse the existing fiber
    for (let i = 0; i < newChild.length; i++) {
      const after = newChild[i]

      const newFiber = updateFromMap(returnFiber, existingChildren, i, after)

      if (newFiber === null) {
        continue
      }

      // insertions or moves
      newFiber.index = i
      newFiber.return = returnFiber

      if (lastNewFiber === null) {
        firstNewFiber = newFiber
        lastNewFiber = newFiber
      } else {
        lastNewFiber.sibling = newFiber
        lastNewFiber = lastNewFiber.sibling
      }

      if (!shouldTrackSideEffects) {
        continue
      }

      const current = newFiber.alternate
      if (current !== null) {
        const oldIndex = current.index
        if (oldIndex < lastPlacedIndex) {
          // move
          newFiber.flags = newFiber.flags | Placement
          continue
        } else {
          // no move
          lastPlacedIndex = oldIndex
        }
      } else {
        // mount
        newFiber.flags = newFiber.flags | Placement
      }
    }

    // mark leftover children as deletions
    existingChildren.forEach((child) => deleteChild(returnFiber, child))
    return firstNewFiber
  }

  function updateFromMap(
    returnFiber: FiberNode,
    existingChildren: ExistingChildren,
    index: number,
    element: any,
  ): FiberNode | null {
    const keyToUse = element.key !== null ? element.key : index
    const before = existingChildren.get(keyToUse)

    // HostText
    if (typeof element === 'string' || typeof element === 'number') {
      if (before) {
        if (before.tag === HostText) {
          existingChildren.delete(keyToUse)
          return useFiber(before, { content: element + '' })
        }
      }
      return new FiberNode(HostText, { content: element + '' }, null)
    }

    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (before) {
            if (before.type === element.type) {
              existingChildren.delete(keyToUse)
              return useFiber(before, element.props)
            }
          }
          return createFiberFromElement(element)
        default:
          break
      }

      // TODO: array
      if (Array.isArray(element)) {
        if (__DEV__) {
          console.warn('Not support array yet')
        }
      }
    }

    return null
  }

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType,
  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      if (Array.isArray(newChild)) {
        // TODO: multiple children
        return reconcileChildrenArray(returnFiber, currentFiber, newChild)
      } else {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            return placeSingleChild(
              reconcileSingleElement(returnFiber, currentFiber, newChild),
            )
          default:
            if (__DEV__) {
              console.warn('Unknown child type', newChild)
            }
            break
        }
      }
    }

    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild),
      )
    }

    currentFiber && deleteRemainingChildren(returnFiber, currentFiber)

    if (__DEV__) {
      console.warn('Unknown child type', newChild)
    }

    return null
  }
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
  const clone = createWorkInProgress(fiber, pendingProps)
  clone.index = 0
  clone.sibling = null
  return clone
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
