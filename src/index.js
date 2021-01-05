'use strict'

import StateSnapshot from './StateSnapshot'

export const rules = {
  'state-snapshot-rule': StateSnapshot,
}

export const configs = {
  recommended: {
    plugins: ['valtio'],
    rules: {
      'valtio/state-snapshot-rule': 'warn',
    },
  },
}
