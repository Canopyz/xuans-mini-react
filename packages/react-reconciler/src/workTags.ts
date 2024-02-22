export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText
  | typeof Fragment

export const FunctionComponent = 0
// HostRoot is the root of a host tree. Could be nested inside another node.
export const HostRoot = 3
// A host component (eg a DOM element)
export const HostComponent = 5
export const HostText = 6
export const Fragment = 7
