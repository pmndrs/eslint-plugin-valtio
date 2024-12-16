import StateSnapshot from './StateSnapshot'
import AvoidThisInProxy from './AvoidThisInProxy'

const plugin = {
  meta: {
    name: 'eslint-plugin-valtio',
  },
  rules: {
    'state-snapshot-rule': StateSnapshot,
    'avoid-this-in-proxy': AvoidThisInProxy,
  },
  configs: {},
}

Object.assign(plugin, {
  configs: {
    recommended: {
      plugins: ['valtio'],
      rules: {
        'valtio/state-snapshot-rule': 'warn',
        'valtio/avoid-this-in-proxy': 'warn',
      },
    },
    'flat/recommended': {
      plugins: { valtio: plugin },
      rules: {
        'valtio/state-snapshot-rule': 'warn',
        'valtio/avoid-this-in-proxy': 'warn',
      },
    },
  },
})

module.exports = plugin
export const configs = plugin.configs
export const rules = plugin.rules
