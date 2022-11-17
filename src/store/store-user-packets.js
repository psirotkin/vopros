// import { debug } from '@/libraries/tools'
import { writeStateToDexie, getObjectFromDexie } from '@/libraries/dexie'

const state = {
  userPackets: {}
}

const mutations = {
  setUserPacket (state, payload) {
    state.userPackets = { ...state.userPackets, [payload.id]: payload }
  },
  setUserPacketAttribute (state, payload) {
    state.userPackets[payload.id] = { ...state.userPackets[payload.id], [payload.attribute]: payload.value }
  }
}

const actions = {
  createUserPacket ({ dispatch, commit }, packet) {
    getObjectFromDexie('userPackets', packet.id)
      .then(userPacket => {
        if (userPacket) { // If userPacket exists in local DB
          commit('setUserPacket', userPacket)
        } else { // if no userPacket exists in local DB
          const userPacket = {
            id: packet.id,
            title: packet.title,
            importedAt: Date.now()
          }
          dispatch('setUserPacket', userPacket)
          writeStateToDexie('userPackets', userPacket)
        }
      })
  },
  setUserPacket ({ commit }, userPacket) {
    commit('setUserPacket', userPacket)
  },
  /**
   * @description Moves index to the next question. Moves to the next tour if previous question was the last in the current tour.
   * @param {Object} param1 Store context
   * @param {Object} payload Payload with property packetId
   * @return { boolean } false, if last question in packet has been played
   */
  nextQuestion ({ dispatch, getters, rootGetters }, packetId) {
    const packet = rootGetters['packets/readPacket'](packetId)
    const userPacket = getters.readUserPacket(packetId)
    if (!Number.isInteger(userPacket.currentTourIndex)) { // If packet has not been started
      const userPacketAttribute = {
        id: packetId,
        attribute: 'currentTourIndex',
        value: packet.tourIds.findIndex(tour => tour !== undefined)
      }
      dispatch('setUserPacketAttribute', userPacketAttribute)
      return true
    } else {
      dispatch('userTours/nextQuestion', packet.tourIds[userPacket.currentTourIndex], { root: true })
        .then(tourNextQuestion => {
          if (!tourNextQuestion) { // If this tour is over
            if (packet.tourIds[userPacket.currentTourIndex + 1]) { // If there is a next tour
              const userPacketAttribute = {
                id: packetId,
                attribute: 'currentTourIndex',
                value: userPacket.currentTourIndex + 1
              }
              dispatch('setUserPacketAttribute', userPacketAttribute)
              dispatch('userTours/setQuestionIndexToNone', packet.tourIds[userPacket.currentTourIndex + 1], { root: true })
              return true
            } else return false
          }
        })
    }
  },
  previousQuestion ({ dispatch, getters, rootGetters }, packetId) {
    const packet = rootGetters['packets/readPacket'](packetId)
    const userPacket = getters.readUserPacket(packetId)
    if (!Number.isInteger(userPacket.currentTourIndex)) { // If packet has not been started
      return false
    } else {
      dispatch('userTours/previousQuestion', packet.tourIds[userPacket.currentTourIndex], { root: true })
        .then(tourPreviousQuestion => {
          if (!tourPreviousQuestion) { // If this was the start of the tour
            if (packet.tourIds[userPacket.currentTourIndex - 1]) { // If there is a previous tour
              const userPacketAttribute = {
                id: packetId,
                attribute: 'currentTourIndex',
                value: userPacket.currentTourIndex - 1
              }
              dispatch('userTours/setQuestionIndexToLast', packet.tourIds[userPacket.currentTourIndex - 1], { root: true })
              dispatch('setUserPacketAttribute', userPacketAttribute)
              return true
            } else {
              const userPacketAttribute = {
                id: packetId,
                attribute: 'currentTourIndex',
                value: null
              }
              dispatch('setUserPacketAttribute', userPacketAttribute)
              return true
            }
          }
        })
    }
  },
  setUserPacketPlayed ({ dispatch, getters }, packetId) {
    const userPacketAttribute = {
      id: packetId,
      attribute: 'lastPlayedAt',
      value: Date.now()
    }
    dispatch('setUserPacketAttribute', userPacketAttribute)
    const userPacket = getters.readUserPacket(packetId)
    if (!userPacket.startedAt) {
      const userPacketAttribute = {
        id: packetId,
        attribute: 'startedAt',
        value: Date.now()
      }
      dispatch('setUserPacketAttribute', userPacketAttribute)
    }
  },
  setUserPacketAttribute ({ commit, getters }, payload) {
    commit('setUserPacketAttribute', payload)
    const userPacket = getters.readUserPacket(payload.id)
    writeStateToDexie('userPackets', userPacket)
  }
}

const getters = {
  readUserPacket: (state) => (id) => {
    return state.userPackets[id]
  },
  finishedPackets: (state) => {
    const finishedPackets = []
    for (const userPacket in state.userPackets) {
      if (state.userPackets[userPacket].finishedAt) finishedPackets.push(userPacket)
    }
    return finishedPackets
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
