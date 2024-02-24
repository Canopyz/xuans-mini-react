import { Props } from '@xuans-mini-react/shared'

export interface Container {
  rootId: number
  children: (Instance | TextInstance)[]
}
export interface Instance {
  id: number
  type: string
  children: (Instance | TextInstance)[]
  parent: number
  props: Props
}
export interface TextInstance {
  text: string
  id: number
  parent: number
}

let instanceCounter = 0
export const createInstance = (type: string, props: any): Instance => {
  const instance = {
    id: instanceCounter++,
    type,
    children: [],
    parent: -1,
    props,
  }
  return instance
}

export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance,
) => {
  const prevParentId = child.parent
  const parentId = 'rootId' in parent ? parent.rootId : parent.id

  if (prevParentId !== -1 && prevParentId !== parentId) {
    throw new Error('Child already has a different parent')
  }

  child.parent = parentId
  parent.children.push(child)
}

export const createTextInstance = (text: string) => {
  const instance = {
    text,
    id: instanceCounter++,
    parent: -1,
  }
  return instance
}

export const appendChildToContainer = (parent: Container, child: Instance) => {
  const prevParentId = child.parent
  const parentId = parent.rootId

  if (prevParentId !== -1 && prevParentId !== parentId) {
    throw new Error('Child already has a different parent')
  }

  child.parent = parentId
  parent.children.push(child)
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
  textInstance.text = content
}

export function removeChild(
  child: Instance | TextInstance,
  container: Container | Instance,
) {
  const index = container.children.indexOf(child)

  if (index < 0) {
    throw new Error('Child not found')
  }

  container.children.splice(index, 1)
}

export function commitPropsUpdate(instance: Instance, props: Props | null) {
  instance.props = props || {}
}

export function insertChildToContainer(
  child: Instance | TextInstance,
  container: Container | Instance,
  before: Instance | TextInstance,
) {
  const beforeIndex = container.children.indexOf(before)
  if (beforeIndex < 0) {
    throw new Error('Before node not found')
  }

  const index = container.children.indexOf(child)
  if (index >= 0) {
    container.children.splice(index, 1)
  }
  container.children.splice(beforeIndex, 0, child)
}

export const scheduleMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise === 'function'
      ? (callback: (...args: any) => void) => Promise.resolve().then(callback)
      : setTimeout
