export type ElementType = string | ((props: any) => any)
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
