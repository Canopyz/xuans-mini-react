import { Props } from '@xuans-mini-react/shared'
import { DOMElement, updateFiberProps } from './SyntheticEvents'

export type Container = Element
export type Instance = Element
export type TextInstance = Text

export const createInstance = (type: string, props: any): Instance => {
  const element = document.createElement(type) as unknown as DOMElement
  updateFiberProps(element, props)
  return element
}

export const appendInitialChild = (parent: Instance, child: Instance) => {
  parent.appendChild(child)
}

export const createTextInstance = (text: string) => {
  return document.createTextNode(text)
}

export const appendChildToContainer = appendInitialChild

export function commitTextUpdate(textInstance: TextInstance, content: string) {
  textInstance.nodeValue = content
}

export function removeChild(
  child: Instance | TextInstance,
  container: Container,
) {
  container.removeChild(child)
}

export function insertChildToContainer(
  child: Instance,
  container: Container,
  before: Instance,
) {
  container.insertBefore(child, before)
}

export function commitPropsUpdate(instance: Instance, props: Props | null) {
  updateFiberProps(instance as DOMElement, props)
}

export const scheduleMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise === 'function'
      ? (callback: (...args: any) => void) => Promise.resolve().then(callback)
      : setTimeout
