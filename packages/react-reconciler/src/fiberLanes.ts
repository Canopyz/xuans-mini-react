import {
  unstable_IdlePriority,
  unstable_ImmediatePriority,
  unstable_NormalPriority,
  unstable_UserBlockingPriority,
  unstable_getCurrentPriorityLevel,
} from 'scheduler'
import { internals } from '@xuans-mini-react/shared/src/internals'
import { FiberRootNode } from './fiber'

const { ReactCurrentBatchConfig } = internals

export type Lane = number
export type Lanes = number

export const NoLane = 0b00000
export const SyncLane = 0b0001
export const InputContinuousLane = 0b00010
export const DefaultLane = 0b00100
export const TransitionLane = 0b01000
export const IdleLane = 0b10000

export const NoLanes = 0b00000

export function mergeLanes(a: Lane, b: Lane): Lanes {
  return a | b
}

export function requestUpdateLane() {
  const isTransition = ReactCurrentBatchConfig.transition !== null
  if (isTransition) {
    return TransitionLane
  }

  const currentSchedulerPriority = unstable_getCurrentPriorityLevel()
  const lane = schedulerPriorityToLane(currentSchedulerPriority)

  return lane
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes
}

export function isSubsetOfLanes(set: Lanes, subset: Lane) {
  return (set & subset) === subset
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
  root.pendingLanes &= ~lane

  root.suspendedLanes = NoLanes
  root.pingedLanes = NoLanes
}

export function lanesToSchedulerPriority(lanes: Lanes) {
  const lane = getHighestPriorityLane(lanes)

  if (lane === SyncLane) {
    return unstable_ImmediatePriority
  }

  if (lane === InputContinuousLane) {
    return unstable_UserBlockingPriority
  }

  if (lane === DefaultLane) {
    return unstable_NormalPriority
  }

  return unstable_IdlePriority
}

export function schedulerPriorityToLane(priority: number) {
  if (priority === unstable_ImmediatePriority) {
    return SyncLane
  }
  if (priority === unstable_UserBlockingPriority) {
    return InputContinuousLane
  }
  if (priority === unstable_NormalPriority) {
    return DefaultLane
  }
  return IdleLane
}

export function markRootSuspended(root: FiberRootNode, suspendedLane: Lane) {
  root.suspendedLanes |= suspendedLane
  root.pingedLanes &= ~suspendedLane
}

export function markRootPinged(root: FiberRootNode, pingedLane: Lane) {
  root.pingedLanes |= root.pendingLanes & pingedLane
}

export function getNextLane(root: FiberRootNode): Lane {
  const pendingLanes = root.pendingLanes

  if (pendingLanes === NoLanes) {
    return NoLane
  }

  let nextLane = NoLane
  const notSuspendedLanes = pendingLanes & ~root.suspendedLanes
  if (notSuspendedLanes !== NoLanes) {
    nextLane = getHighestPriorityLane(notSuspendedLanes)
  } else {
    const pingedLanes = pendingLanes & root.pingedLanes
    if (pingedLanes !== NoLanes) {
      nextLane = getHighestPriorityLane(pingedLanes)
    }
  }

  return nextLane
}
