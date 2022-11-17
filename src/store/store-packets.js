import { debug } from '@/libraries/tools'
import { writeStateToDexie } from '@/libraries/dexie'
// import { date } from 'quasar'

const state = {
  packets: {}
}

const mutations = {
  setPacket (state, payload) {
    state.packets = { ...state.packets, [payload.id]: payload }
  },
  setPacketAttribute (state, payload) {
    state.packets[payload.id] = { ...state.packets[payload.id], [payload.attribute]: payload.value }
  }
}

const actions = {
/**
 * @summary Puts info from a packet into a packet object
 * @param {String} packet db.chgk.info packet
 * @returns {String} Error message
 * @description Receives a packet in db.chgk.ino format.
 * Puts most of the packet's direct child properties into a packet object (leaving out just a few unneeded ones).
 * Ignores tours and editors for the time being (2do)
 */
  importPacket ({ dispatch, commit }, payload) {
    debug('Processing packet ' + payload.id)
    const excludeGroups = ['ERUDITK', 'EF', 'BESKR', 'SVOYAK', 'INTBES']

    if (excludeGroups.includes(payload.group)) return ('wrong_packet_type')

    const packet = {
      title: payload.title,
      id: payload.id,
      group: payload.group, // at db.chgk.info, not here!
      copyright: payload.copyright,
      info: payload.info,
      createdAt: payload.createdAt, // at db.chgk.info, not here!
      updatedAt: payload.updatedAt, // at db.chgk.info, not here!
      importedAt: (payload.imported || Date.now()), // Imported date, or current timestamp if none
      playedAt: payload.playedAt,
      finishedAt: payload.finishedAt,
      startedAt: payload.startedAt, // Import if available (from local db)
      lastPlayedAt: payload.lastPlayedAt, // Import if available (from local db)
      completed: payload.completed, // Import if available (from local db)
      tourIds: payload.tourIds, // Import if available (from local db)
      editorIds: payload.editorIds, // Import if available (from local db)
      currentTourIndex: payload.currentTourIndex // Import if available (from local db)
    }

    // Remove 'Синхронный турнир "..."' from title name
    const titleSyncRegex = /[СC]инхронный турнир (.*)/i // Russian or Latin C
    const title1 = packet.title.match(titleSyncRegex)
    if (title1) packet.title = title1[1]

    // Remove outside quotes from title name
    const titleQuotRegex = /^["“'«](.*)["”'»]$/i // Russian or Latin C
    const title2 = packet.title.match(titleQuotRegex)
    if (title2) packet.title = title2[1]

    // If the packet data doesn't have processed tours (from local db), but does have unprocessed tours (and thus also questions) from db.chgk.info
    if (!packet.tourIds && payload.tours) {
      packet.tourIds = []
      debug('Importing tours: ', payload.tours)
      payload.tours.forEach(tour => {
        tour.packetId = packet.id // So that we can find packet from tour if needed
        dispatch('tours/importTour', tour, { root: true })
        packet.tourIds.push(tour.id)
      })
    }
    commit('setPacket', packet)
    writeStateToDexie('packets', packet)
    dispatch('userPackets/createUserPacket', packet, { root: true })

    // And now for the editors (if any set for packet and not yet included)
    if (!packet.editorIds && payload.editors) {
      const editors = {
        persons: payload.editors,
        authorship: {
          type: 'packets',
          id: packet.id
        }
      }
      dispatch('persons/tokenizePersons', editors, { root: true })
        .then(editorIds => {
          const packetAttribute = {
            id: packet.id,
            attribute: 'editorIds',
            value: editorIds
          }
          dispatch('setPacketAttribute', packetAttribute)
        })
    }
  },
  setPacket ({ commit, dispatch }, packet) {
    commit('setPacket', packet)
    dispatch('userPackets/createUserPacket', packet, { root: true })
  },
  /**
   * @description Takes packet ID and editor IDs; puts editor IDs into packet.editors if not already included
   * @param {Object} param0 vuex store object
   * @param {Object} payload Object with properties .packetId (string) and .editorId (string)
   */
  checkSetEditor ({ dispatch, getters }, payload) {
    const packet = getters.readPacket(payload.packetId)
    if (!packet.editorIds) packet.editorIds = []
    payload.editorIds.forEach(editorId => {
      if (!packet.editorIds.includes(editorId)) {
        packet.editorIds.push(editorId)
      }
      const packetAttribute = {
        id: packet.id,
        attribute: 'editorIds',
        value: packet.editorIds
      }
      dispatch('setPacketAttribute', packetAttribute)
    })
  },
  /**
   * @description Moves index to the next question. Moves to the next tour if previous question was the last in the current tour.
   * @param {Object} param1 Store context
   * @param {Object} payload Payload with property packetId
   * @return { boolean } false, if last question in packet has been played
   */
  nextQuestion ({ dispatch, getters }, packetId) {
    const packet = getters.readPacket(packetId)
    if (!Number.isInteger(packet.currentTourIndex)) { // If packet has not been started
      const packetAttribute = {
        id: packet.id,
        attribute: 'currentTourIndex',
        value: packet.tourIds.findIndex(tour => tour !== undefined)
      }
      dispatch('setPacketAttribute', packetAttribute)
      return true
    } else {
      dispatch('tours/nextQuestion', packet.tourIds[packet.currentTourIndex], { root: true })
        .then(tourNextQuestion => {
          if (!tourNextQuestion) { // If this tour is over
            if (packet.tourIds[packet.currentTourIndex + 1]) { // If there is a next tour
              const packetAttribute = {
                id: packet.id,
                attribute: 'currentTourIndex',
                value: packet.currentTourIndex + 1
              }
              dispatch('setPacketAttribute', packetAttribute)
              return true
            } else return false
          }
        })
    }
  },
  previousQuestion ({ dispatch, getters }, packetId) {
    const packet = getters.readPacket(packetId)
    if (!Number.isInteger(packet.currentTourIndex)) { // If packet has not been started
      return false
    } else {
      dispatch('tours/previousQuestion', packet.tourIds[packet.currentTourIndex], { root: true })
        .then(tourPreviousQuestion => {
          if (!tourPreviousQuestion) { // If this was the start of the tour
            if (packet.tourIds[packet.currentTourIndex - 1]) { // If there is a previous tour
              const packetAttribute = {
                id: packet.id,
                attribute: 'currentTourIndex',
                value: packet.currentTourIndex - 1
              }
              dispatch('tours/setQuestionIndexToLast', packet.tourIds[packet.currentTourIndex - 1], { root: true })
              dispatch('setPacketAttribute', packetAttribute)
              return true
            } else {
              const packetAttribute = {
                id: packet.id,
                attribute: 'currentTourIndex',
                value: null
              }
              dispatch('setPacketAttribute', packetAttribute)
              return true
            }
          }
        })
    }
  },
  setPacketAttribute ({ commit, getters }, payload) {
    commit('setPacketAttribute', payload)
    const packet = getters.readPacket(payload.id)
    writeStateToDexie('packets', packet)
  }
}

const getters = {
  readPacket: (state) => (id) => {
    return state.packets[id]
  },
  packets: state => {
    const sortedPackets = Object.keys(state.packets).sort((a, b) => {
      const aDate = new Date(state.packets[a].updatedAt)
      const bDate = new Date(state.packets[b].updatedAt)
      return bDate - aDate
    }).map(key => state.packets[key])
    return sortedPackets
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
