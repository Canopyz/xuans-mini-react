export type Container = Element
export type Instance = Element
export type TextInstance = Text

export const createInstance = (type: string, props: any): Instance => {
  const element = document.createElement(type)
  // TODO: props
  console.log(props)
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
