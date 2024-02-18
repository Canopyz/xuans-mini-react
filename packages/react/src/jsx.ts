import {
  REACT_ELEMENT_TYPE,
  Key,
  Props,
  ReactElementType,
  Ref,
  ElementType,
} from '@xuans-mini-react/shared'

const ReactElement = function (
  type: ElementType,
  key: Key,
  ref: Ref,
  props: Props,
): ReactElementType {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  }

  return element
}

export const jsx = function (
  type: ElementType,
  config: {
    [key: string]: any
  },
  ...maybeChildren: any[]
) {
  let key: Key = null
  let ref: Ref = null
  const props: Props = {}

  console.log({ type, config, maybeChildren })

  for (const prop in config) {
    if (prop === 'key') {
      key = config.key
      delete config.key
    } else if (prop === 'ref') {
      ref = config.ref
      delete config.ref
    } else if (Object.hasOwn(config, prop)) {
      props[prop] = config[prop]
    }
  }

  const maybeChildrenLength = maybeChildren.length
  if (maybeChildrenLength === 1) {
    props.children = maybeChildren[0]
  } else if (maybeChildrenLength > 1) {
    props.children = maybeChildren
  }

  return ReactElement(type, key, ref, props)
}

export const jsxDEV = (type: ElementType, config: any) => {
  let key: Key = null
  const props: Props = {}
  let ref: Ref = null

  for (const prop in config) {
    const val = config[prop]
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val
      }
      continue
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val
      }
      continue
    }
    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val
    }
  }

  return ReactElement(type, key, ref, props)
}
