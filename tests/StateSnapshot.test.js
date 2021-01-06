import { RuleTester } from 'eslint'
import rule, {
  PROXY_RENDER_PHASE_MESSAGE,
  SNAPSHOT_CALLBACK_MESSAGE,
} from '../src/StateSnapshot'

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 6 },
  parser: require.resolve('babel-eslint'),
})

ruleTester.run('state-snapshot-rule', rule, {
  valid: [
    `
  const state = proxy({ count: 0 })
  state.count += 1
  `,
    `
  const state = proxy({ count: 0})
  function Counter() {
    return (
      <div>
        <button onClick={() => ++state.count}>+1</button>
      </div>
    )
  }
  `,
    `
  function Counter() {
    const snapshot = useProxy(state)
    const { count } = snapshot
    return (
      <div>{count} {snapshot.count}</div>
    )
  }
  `,
    `
  function Counter() {
    const { count } = useProxy(state)
    return <div>{count}</div>
  }
  `,
    `
  function Counter() {
    const snap = useProxy(state)
    useEffect(() => {
      state.count += 1
    }, [])
    return <div>{snap.foo}</div>
  }
  `,
  ],
  invalid: [
    {
      code: `
  const state = proxy({ count: 0})
  function Counter() {
    const { count } = state 
    return (
      <div>
        {state.count} {count}
        <button onClick={() => ++state.count}>+1</button>
      </div>
    )
  }
  `,
      errors: [PROXY_RENDER_PHASE_MESSAGE, PROXY_RENDER_PHASE_MESSAGE],
    },
    {
      code: `
  function Counter() {
    const snapshot = useProxy(state)
    useEffect(() => {
      ++snapshot.count 
    })
    return (
      <div>{snapshot.count}</div>
    )
  }
  `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
  function Counter() {
    const { count } = useProxy(state)
    useEffect(() => {
      ++count 
    })
    return (
      <div>{snapshot.count}</div>
    )
  }
  `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
  const state = proxy({ count: 0})
  function Counter() {
    const snap = useProxy(state)
    return (
      <div>
        {snap.count}
        <button onClick={() => ++snap.count}>+1</button>
      </div>
    )
  }
  `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
  ],
})
