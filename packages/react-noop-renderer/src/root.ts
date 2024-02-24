import {
  createContainer,
  updateContainer,
} from '@xuans-mini-react/react-reconciler'
import { Container, Instance } from './hostConfig'
import {
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  ReactElementType,
} from '@xuans-mini-react/shared'
import * as Scheduler from 'scheduler'

let idCounter = 0
export function createRoot() {
  const container: Container = {
    rootId: idCounter++,
    children: [],
  }

  // @ts-ignore
  const root = createContainer(container)

  function getChildren(parent: Container | Instance) {
    if (parent) {
      return parent.children
    }
    return null
  }

  function getChildrenAsJSX(root: Container) {
    const children = childToJSX(getChildren(root))
    if (Array.isArray(children)) {
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: REACT_FRAGMENT_TYPE,
        key: null,
        ref: null,
        props: { children },
      }
    }

    return children
  }

  function childToJSX(child: any) {
    if (typeof child === 'string' || typeof child === 'number') {
      return child
    }

    if (Array.isArray(child)) {
      if (child.length === 0) {
        return null
      }
      if (child.length === 1) {
        return childToJSX(child[0])
      }

      const children: any = child.map(childToJSX)
      if (
        children.every(
          (child: any) =>
            typeof child === 'string' || typeof child === 'number',
        )
      ) {
        return children.join('')
      }

      return children
    }

    if (Array.isArray(child.children)) {
      const instance = child as Instance
      const children = childToJSX(instance.children)

      const props = instance.props

      if (children) {
        props.children = children
      }

      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type: instance.type,
        key: null,
        ref: null,
        props,
      }
    }

    return child.text
  }

  return {
    render(element: ReactElementType) {
      return updateContainer(element, root)
    },
    getChildren() {
      return getChildren(container)
    },
    getChildrenAsJSX() {
      return getChildrenAsJSX(container)
    },
    _Scheduler: Scheduler,
  }
}
