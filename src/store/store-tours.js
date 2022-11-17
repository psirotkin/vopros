import { debug } from '@/libraries/tools'
import { writeStateToDexie } from '@/libraries/dexie'

const state = {
  tours: {}
}

const mutations = {
  setTour (state, payload) {
    state.tours = { ...state.tours, [payload.id]: payload }
  },
  setTourAttribute (state, payload) {
    state.tours[payload.id] = { ...state.tours[payload.id], [payload.attribute]: payload.value }
  }
}

const actions = {
/**
 * @summary Puts info from a tourin db.chgk.info format into a tour object
 * @param {Object} tour db.chgk.info tour
 * @description Receives a tour in db.chgk.ino format.
 * Puts most of the tour's direct properties into a tour object (leaving out just a few unneeded ones).
 */
  importTour ({ dispatch, commit }, payload) {
    debug('Processing tour ' + payload.id)
    debug('Payload: ' + payload)
    const tour = {
      id: payload.id, // e.g. azov20_u.5
      number: payload.number,
      copyright: payload.copyright,
      info: payload.info,
      url: payload.url,
      title: payload.title,
      currentQuestionIndex: payload.currentQuestionIndex, // Might be set if we're reading from local DB and tour has been started
      finished: payload.finished,
      packetId: payload.packetId,
      questionIds: payload.questionIds, // If set in local DB
      editorIds: payload.editorIds // If set in local DB
    }

    if (!tour.questionIds) { // If reading from API, not local DB
      tour.questionIds = []
      debug('Importing questions: ', payload.questions)
      payload.questions.forEach(question => {
        question.tourId = tour.id // So that we can find packet from tour if needed
        dispatch('questions/importQuestion', question, { root: true })
        tour.questionIds.push(question.id)
      })
    }
    commit('setTour', tour)
    writeStateToDexie('tours', tour)
    dispatch('userTours/createUserTour', tour.id, { root: true })

    // And now for the editors (if any set for tour); if we're reading from local DB, we'll have editorIDs instead, and this won't run
    if (payload.editors) {
      const editors = {
        persons: payload.editors,
        authorship: {
          type: 'tours',
          id: tour.id
        }
      }
      dispatch('persons/tokenizePersons', editors, { root: true })
        .then(editorIds => {
          const tourAttribute = {
            id: tour.id,
            attribute: 'editorIds',
            value: editorIds
          }
          dispatch('setTourAttribute', tourAttribute)
          dispatch('packets/checkSetEditor', { packetId: payload.packetId, editorIds: editorIds }, { root: true }) // Also set editors in packet if not already included
        })
    }
  },
  setTour ({ commit, dispatch }, payload) {
    commit('setTour', payload)
    dispatch('userTours/createUserTour', payload.id, { root: true })
  },
  nextQuestion ({ dispatch, getters }, tourId) {
    const tour = getters.readTour(tourId)
    if (!Number.isInteger(tour.currentQuestionIndex)) { // If tour has not been started
      const tourAttribute = {
        id: tour.id,
        attribute: 'currentQuestionIndex',
        value: tour.questionIds.findIndex(question => question)
      }
      debug('tourAttribute: ', tourAttribute)
      dispatch('setTourAttribute', tourAttribute)
      return true
    } else { // If tour was already started
      if (tour.questionIds[tour.currentQuestionIndex + 1]) { // If next question exists, increment index
        const tourAttribute = {
          id: tour.id,
          attribute: 'currentQuestionIndex',
          value: tour.currentQuestionIndex + 1
        }
        dispatch('setTourAttribute', tourAttribute)
        return true
      } else return false
    }
  },
  previousQuestion ({ dispatch, getters }, tourId) {
    const tour = getters.readTour(tourId)
    if (!Number.isInteger(tour.currentQuestionIndex)) { // If tour has not been started
      return false
    } else {
      if (tour.questionIds[tour.currentQuestionIndex - 1]) { // If previous question exists, decrement index
        const tourAttribute = {
          id: tour.id,
          attribute: 'currentQuestionIndex',
          value: tour.currentQuestionIndex - 1
        }
        dispatch('setTourAttribute', tourAttribute)
      } else {
        const tourAttribute = {
          id: tour.id,
          attribute: 'currentQuestionIndex',
          value: null
        }
        dispatch('setTourAttribute', tourAttribute)
      }
      return true
    }
  },
  setTourAttribute ({ commit, getters }, payload) {
    commit('setTourAttribute', payload)
    const tour = getters.readTour(payload.id)
    writeStateToDexie('tours', tour)
  },
  setQuestionIndexToLast ({ dispatch, getters }, tourId) {
    const tour = getters.readTour(tourId)
    const payload = {
      id: tourId,
      attribute: 'currentQuestionIndex',
      value: tour.questionIds.length - 1
    }
    dispatch('setTourAttribute', payload)
  }
}

const getters = {
  readTour: (state, getters, rootState, rootGetters) => (id) => {
    return state.tours[id]
  },
  toursForPacket: (state) => (packetId) => {
    return state.tours.filter(tour => tour.packetId === packetId)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
