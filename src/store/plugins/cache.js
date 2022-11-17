const cachePlugin = (store) => {
  store.subscribe((mutation, state) => {
    const storeName = mutation.type.split('/')[0]
    const mutatedStore = state[storeName][storeName]
    if (mutatedStore) { // Doesn't fire for UI since it doesn't have "UI" object
      // console.log('Mutation: ', mutation)
      // console.log('Mutated store: ', mutatedStore)
    }
  })
}

export { cachePlugin }
