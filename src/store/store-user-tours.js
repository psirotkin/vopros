import { debug } from '@/libraries/tools'
import { writeStateToDexie, getObjectFromDexie } from '@/libraries/dexie'

const state = {
  userTours: {}
}

const mutations = {
  setUserTour (state, payload) {
    state.userTours = { ...state.userTours, [payload.id]: payload }
  },
  setUserTourAttribute (state, payload) {
    state.userTours[payload.id] = { ...state.userTours[payload.id], [payload.attribute]: payload.value }
  }
}

const actions = {
  createUserTour ({ dispatch, commit }, tourId) {
    getObjectFromDexie('userTours', tourId)
      .then(userTour => {
        if (userTour) { // If userTour exists in local DB
          commit('setUserTour', userTour)
        } else { // if no userTour exists in local DB
          const userTour = {
            id: tourId
          }
          dispatch('setUserTour', userTour)
          writeStateToDexie('userTours', userTour)
        }
      })
  },
  setUserTour ({ commit }, payload) {
    commit('setUserTour', payload)
  },
  nextQuestion ({ dispatch, getters, rootGetters }, tourId) {
    const tour = rootGetters['tours/readTour'](tourId)
    const userTour = getters.readUserTour(tourId)
    if (!Number.isInteger(userTour.currentQuestionIndex)) { // If tour has not been started
      const userTourAttribute = {
        id: tourId,
        attribute: 'currentQuestionIndex',
        value: tour.questionIds.findIndex(question => question)
      }
      debug('userTourAttribute: ', userTourAttribute)
      dispatch('setUserTourAttribute', userTourAttribute)
      return true
    } else { // If tour was already started
      if (tour.questionIds[userTour.currentQuestionIndex + 1]) { // If next question exists, increment index
        const userTourAttribute = {
          id: tourId,
          attribute: 'currentQuestionIndex',
          value: userTour.currentQuestionIndex + 1
        }
        dispatch('setUserTourAttribute', userTourAttribute)
        return true
      } else return false
    }
  },
  previousQuestion ({ dispatch, getters, rootGetters }, tourId) {
    const tour = rootGetters['tours/readTour'](tourId)
    const userTour = getters.readUserTour(tourId)
    if (!Number.isInteger(userTour.currentQuestionIndex)) { // If tour has not been started
      return false
    } else {
      if (tour.questionIds[userTour.currentQuestionIndex - 1]) { // If previous question exists, decrement index
        const userTourAttribute = {
          id: tourId,
          attribute: 'currentQuestionIndex',
          value: userTour.currentQuestionIndex - 1
        }
        dispatch('setUserTourAttribute', userTourAttribute)
      } else {
        const userTourAttribute = {
          id: tourId,
          attribute: 'currentQuestionIndex',
          value: null
        }
        dispatch('setUserTourAttribute', userTourAttribute)
      }
      return true
    }
  },
  setUserTourAttribute ({ commit, getters }, payload) {
    commit('setUserTourAttribute', payload)
    const userTour = getters.readUserTour(payload.id)
    writeStateToDexie('userTours', userTour)
  },
  setQuestionIndexToNone ({ dispatch, rootGetters }, tourId) {
    const payload = {
      id: tourId,
      attribute: 'currentQuestionIndex',
      value: null
    }
    dispatch('setUserTourAttribute', payload)
  },
  setQuestionIndexToLast ({ dispatch, rootGetters }, tourId) {
    const tour = rootGetters['tours/readTour'](tourId)
    const payload = {
      id: tourId,
      attribute: 'currentQuestionIndex',
      value: tour.questionIds.length - 1
    }
    dispatch('setUserTourAttribute', payload)
  }
}

const getters = {
  readUserTour: (state) => (id) => {
    return state.userTours[id]
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
