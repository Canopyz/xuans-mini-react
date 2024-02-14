import {
  REACT_ELEMENT_TYPE,
  Key,
  Props,
  ReactElementType,
  Ref,
  Type,
} from '@xuans-mini-react/shared'

const ReactElement = function (
  type: Type,
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
  type: Type,
  config: {
    [key: string]: any
  },
  ...maybeChildren: any[]
) {
  let key: Key = null
  let ref: Ref = null
  const props: Props = {}

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

export const jsxDEV = jsx
