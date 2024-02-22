import { REACT_FRAGMENT_TYPE } from './ReactSymbols'

export type ElementType =
  | string
  | ((props: any) => any)
  | typeof REACT_FRAGMENT_TYPE
export type Props = { [key: string]: any }
export type Key = string | number | null
export type Ref = any

export interface ReactElementType {
  $$typeof: symbol | number
  type: ElementType
  key: Key
  props: Props
  ref: Ref
}

export type Action<State> = State | ((state: State) => State)
