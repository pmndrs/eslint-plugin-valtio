import { RuleTester } from 'eslint'
import rule, {
  COMPUTED_DECLARATION_ORDER,
  PROXY_RENDER_PHASE_MESSAGE,
  SNAPSHOT_CALLBACK_MESSAGE,
  UNEXPECTED_STATE_MUTATING,
} from '../src/StateSnapshot'
import { getParserConfig } from './parser-config'

const ruleTester = new RuleTester({
  ...getParserConfig(),
})

ruleTester.run('state-snapshot-rule', rule, {
  valid: [
    `
      const foo = proxy({ foo: 123 });
      function Test() {
        const state = useSnapshot(foo);
        const x = [1];
        return (
          <div>
            {x.map((_) => {
              return <div>{state.foo ? <div /> : <div />}</div>;
            })}
          </div>
        );
      }
      `,
    `
  const state = proxy({ array: [1,2,3]})
  export const Component = () => {
    const snapshot = useSnapshot(state)
    const filtered = snapshot.array.filter((item) => item !== 1)
    return (
      <CustomComponent data={filtered} />
    )
  }
  `,
    `
    export const Test = () => {
    const snap = useSnapshot(state)
    if(!snap) return null;
    return(
      <></>
    )
  }
  `,
    `
  export function Test2(){
    const snap = useSnapshot(state)
    if(!snap) return null;
    return(
      <></>
    )
  }`,
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
                 const snapshot = useSnapshot(state)
                 const { count } = snapshot
                 return (
                   <div>{count} {snapshot.count}</div>
                 )
               }
               `,
    `
               function Counter() {
                 const { count } = useSnapshot(state)
                 return <div>{count}</div>
               }
               `,
    `
               function Counter() {
                 const snap = useSnapshot(state)
                 useEffect(() => {
                   state.count += 1
                 }, [])
                 return <div>{snap.foo}</div>
               }
               `,
    `
             function useExample2(s) {
               const {b: {c} } = useSnapshot(s.a1);

               useEffect(() => {
                 if (c === 'a1c') {
                   state.a1.b.c = 'example';
                 }
               }, [c]);
             }`,

    `
             function useProxyStateExample(a) {
               const s = useSnapshot(a);

               useEffect(() => {
                   a.a = 'example';
               }, [s.a]);
             }`,
    `const state = proxy({ count: 0 });
             function App() {
               const snap = useSnapshot(state);
               const handleClick = useCallback(() => {
                 console.log(snap.count);
               }, [snap.count]);
               return (
                 <div>
                   {snap.count} <button onClick={handleClick}>click</button>
                 </div>
               );
             }
             `,
    `const state = proxyWithHistory({ count: 0 });
             function App() {

              const obj = new MyObject();
              obj.scale = 0;

              const [fakeObj, setFakeObj] = useState<MyObject>(obj)

              const {count} = useSnapshot(state.value)

              return <div></div>;
             }
             `,
    `const state = proxy({ someObj: { count: 0 } });
             function App() {
               const snap = useSnapshot(state);
               const handleClick = useCallback(() => {
                 console.log(snap.someObj.count);
               }, [snap.someObj.count]);
               return (
                 <div>
                   {snap.someObj.count} <button onClick={handleClick}>click</button>
                 </div>
               );
             }
             `,
    `const state = proxy({ count: 0 });
             function App() {
               const snap = useSnapshot(state);
               const handleClick = useCallback(() => {
                 console.log(state.count);
               }, []);
               return (
                 <div>
                   {snap.count} <button onClick={handleClick}>click</button>
                 </div>
               );
             }
             `,
    `
             const DirectReadComponent = () => {
               const debounceSnap = useSnapshot(state);
               return <div>{debounceSnap}</div>;
             };
             `,
    `
             const ObjectPatternReadOne = () => {
               const {b: {c} } = useSnapshot(state);
               return <div>{c}</div>;
             };`,
    `
             const ObjectPatternReadTwo = () => {
               const {c} = useSnapshot(state);
               return <div>{c}</div>;
             };`,
    `
           const state = proxy({ count: 1 })
           const useDoubled = () => {
             const snap = useSnapshot(state)
             return snap.count * 2
           }
           const Component = ()=> {
             const doubled = useDoubled()
             return <>{doubled}</>
           }
            `,
    `
          const Component = ()=>{
            const { index } = useSnapshot(idxStore);
          React.useEffect(() => {
           const getUsers = async (id) => {
             setUsers()
           };
           getUsers(index);
        }, [index])
        return <></>
          }
      `,
    `
        const state = proxy({count:1});
        const useDoubled = () => {
          const snap = useSnapshot(state)
          const doubled = snap.count*2;
          return doubled
        }
        `,
    `
        const state = proxy({count:1});
        const useDoubled = () => {
          const snap = useSnapshot(state)
          const {doubled} = {doubled:snap.count*2};
          return doubled
        }
        `,
    `
      const state = proxy({ count: 0 });
      const App=()=>{
        const {count} = useSnapshot(state);
        const doubled = count*2;
        return (
          <div>
            {count} <button onClick={handleClick}>click</button>
          </div>
        );
      }
      `,
    `
      const useDoubled = ({ state }) => {
        const snap = useSnapshot(state)
        const {doubled} = {doubled:snap.count*2};
        return doubled
      }
      `,
    `
      export const Workspace = () => {
        const [loading, setLoading] = useState(false);

        const snap = useSnapshot(eventsStore);

        return (
          <>
            {(loading || !snap.initialized) && <Loader text="Loading..." />}
            {snap.saving && <Loader text="Saving..." />}
            {snap.packing && <Loader text="Packing..." />}
            {snap.exporting && <Loader text="Exporting..." />}
          </>
        );
      };
      `,
    `
      export function Workspace(){
        const [loading, setLoading] = useState(false);

        const snap = useSnapshot(eventsStore);

        return (
          <>
            {(loading || !snap.initialized) && <Loader text="Loading..." />}
            {snap.saving && <Loader text="Saving..." />}
            {snap.packing && <Loader text="Packing..." />}
            {snap.exporting && <Loader text="Exporting..." />}
          </>
        );
      };
      `,
    `
  const Component = React.memo(({props})=>{
    const [loading, setLoading] = useState(false);

    const snap = useSnapshot(eventsStore);

    return (
      <>
        {(loading || !snap.initialized) && <Loader text="Loading..." />}
        {snap.saving && <Loader text="Saving..." />}
        {snap.packing && <Loader text="Packing..." />}
        {snap.exporting && <Loader text="Exporting..." />}
      </>
    );
  })`,
    `const Component = React.forwardRef((props,ref)=>{
    const [loading, setLoading] = useState(false);

    const snap = useSnapshot(eventsStore);

    return (
      <>
        {(loading || !snap.initialized) && <Loader text="Loading..." />}
        {snap.saving && <Loader text="Saving..." />}
        {snap.packing && <Loader text="Packing..." />}
        {snap.exporting && <Loader text="Exporting..." />}
      </>
    );
  })`,
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
          const state = proxy({ height: 0})
          export const Component = () => {
            return (
              <div>
                <button style={{ height: state.height }}>abc</button>
              </div>
            )
          }
          `,
      errors: [PROXY_RENDER_PHASE_MESSAGE],
    },
    {
      code: `
          const state = proxy({ array: [1,2,3]})
          export const Component = () => {
            return (
              <div>
                <CustomComponent options={state.array}>abc</CustomComponent>
              </div>
            )
          }
          `,
      errors: [PROXY_RENDER_PHASE_MESSAGE],
    },
    {
      code: `
          const state = proxy({ show: false })
          export const Component = () => {
            return (
              <div>
              {
                state.show && <CustomComponent>abc</CustomComponent>
              }
              </div>
            )
          }
          `,
      errors: [PROXY_RENDER_PHASE_MESSAGE],
    },
    {
      code: `
          const state = proxy({ array: [1,2,3]})
          const state2 = proxy({ values: {1:"1", 2:"2", 3:"3"}})
          
          export const Component = () => {
            const snapshot = useSnapshot(state)
            const snapshot2 = useSnapshot(state2)
            
            const filtered = () => {
              const temp = snapshot.array.filter((item) => item !== 1)
              const collection = []
              for (const item of temp) {
                collection.push({value: snapshot2.values[item]})
              }
              return collection
            }
            
            return (
              <CustomComponent data={filtered} />
            )
          }
          `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE, SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
     function Counter() {
       const snapshot = useSnapshot(state)
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
       const { count } = useSnapshot(state)
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
       const snap = useSnapshot(state)
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
    {
      code: `
       function Counter() {
         const snap = useSnapshot(state.r.b)
         const snap1 = useSnapshot(state)
         const handleClick = () => {
           state.r.b = ['hello', 'ss']
           state = ['hello']
         }
        return <div></div>
       }
       `,
      errors: [UNEXPECTED_STATE_MUTATING, UNEXPECTED_STATE_MUTATING],
    },
    {
      code: `
           function Counter() {
             const snap = useSnapshot(state)
             const handleClick = () => {
               state = ['hello']
             }
            return <div></div>
           }
           `,
      errors: [UNEXPECTED_STATE_MUTATING],
    },
    {
      code: `
           function Counter() {
             const snap = useSnapshot(state.a)
             const handleClick = () => {
               state.a = ['hello']
             }
            return <div></div>
           }
           `,
      errors: [UNEXPECTED_STATE_MUTATING],
    },
    {
      code: `
           function Counter() {
             const snap = useSnapshot(state[0])
             return <div>{snap}<button onClick={() => ++state[0]}>inc</button></div>
           }
           `,
      errors: [UNEXPECTED_STATE_MUTATING],
    },
    {
      code: `const state = proxyWithComputed({
       count: 0,
     }, {
       quadrupled: (snap) => snap.doubled * 2,
       doubled: (snap) => snap.count * 2,
     })
       `,
      errors: [COMPUTED_DECLARATION_ORDER],
    },
    {
      code: `const state = proxyWithComputed({
       count: 0,
     }, {
       quadrupled: ({ doubled }) => doubled * 2,
       doubled: (snap) => snap.count * 2,
     })
       `,
      errors: [COMPUTED_DECLARATION_ORDER],
    },
    {
      code: `function Counter() {
       const snapshot = useSnapshot(state)
       useEffect(() => {
         snapshot.count = randomValue + 1;
       })
       return (
         <></>
       )
     }`,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
           function useProxyStateExample(a) {
             const s = useSnapshot(a);
             useEffect(() => {
               if(s.a==="1"){
                 s.a = 'example';
               }
             }, [s.a]);
           }`,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
     function App() {
       const snap = useSnapshot(state)
       const handleClick = () => {
         console.log(snap.count) // This is not recommended as it can be stale.
       }
       return (
         <div>
            <button onClick={handleClick}>click</button>
         </div>
       )
     }
           `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
           const state = proxy({ count: 0 })
           function App() {
             const snap = useSnapshot(state)
             const handleClick = useCallback(() => {
               console.log(snap.count) // This is not recommended as it can be stale.
             },[])
             return (
               <div>
                 {snap.count} <button onClick={handleClick}>click</button>
               </div>
             )
           }
           `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `const state = proxy({ count: 0 })
           function App() {
             const snap = useSnapshot(state)
             const handleClick = useCallback(() => {
               console.log(snap.count) // This is not recommended as it can be stale.
             },[])
             return (
               <div>
                 {snap.count} <button onClick={handleClick}>click</button>
               </div>
             )
           }
     `,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
           function useExample2(s) {
             const {b: {c} } = useSnapshot(s.a1);
             useEffect(() => {
               if (c === 'a1c') {
                 s.a1.b.c = 'example';
               }
             }, []);
           }`,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
    {
      code: `
          function useExample2(s) {
            const {b: {c} } = useSnapshot(s.a1);
            useEffect(() => {
              if (c === 'a1c') {
                state.a1.b.c = 'example';
              }
            });
          }`,
      errors: [SNAPSHOT_CALLBACK_MESSAGE],
    },
  ],
})
