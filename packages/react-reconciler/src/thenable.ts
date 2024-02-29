import {
  FulfilledThenable,
  PendingThenable,
  RejectedThenable,
  Thenable,
} from '@xuans-mini-react/shared'

export const SuspenseException = new Error('This is a special snowflake')

let suspendedThenable: Thenable<any> | null = null

export function getSuspendedThenable() {
  if (suspendedThenable === null) {
    throw new Error('There is no suspended thenable. This is a bug in React.')
  }

  const thenable = suspendedThenable
  suspendedThenable = null
  return thenable
}

function noop() {}

export function trackUsedThenable<T>(thenable: Thenable<T>) {
  switch (thenable.status) {
    case 'fulfilled':
      return thenable.value
    case 'rejected':
      throw thenable.reason
    default:
      if (typeof thenable.status === 'string') {
        thenable.then(noop, noop)
      } else {
        // This is an untracked thenable.
        const pending = thenable as any as PendingThenable<T, void, any>
        pending.status = 'pending'

        pending.then(
          (val) => {
            if (pending.status === 'pending') {
              const fulfilled = pending as any as FulfilledThenable<
                T,
                void,
                any
              >
              fulfilled.status = 'fulfilled'
              fulfilled.value = val
            }
          },
          (err) => {
            if (pending.status === 'pending') {
              const rejected = pending as any as RejectedThenable<T, void, any>
              rejected.status = 'rejected'
              rejected.reason = err
            }
          },
        )
      }
  }

  suspendedThenable = thenable
  throw SuspenseException
}
