import StateSnapshot from './StateSnapshot'
import AvoidThisInProxy from './AvoidThisInProxy'

export const rules = {
  'state-snapshot-rule': StateSnapshot,
  'avoid-this-in-proxy': AvoidThisInProxy,
}

export const configs = {
  recommended: {
    plugins: ['valtio'],
    rules: {
      'valtio/state-snapshot-rule': 'warn',
      'valtio/avoid-this-in-proxy': 'warn',
    },
  },
}
