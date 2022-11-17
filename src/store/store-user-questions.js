// import { debug } from '@/libraries/tools'
import { writeStateToDexie, getObjectFromDexie } from '@/libraries/dexie'

const state = {
  userQuestions: {}
}

const mutations = {
  setUserQuestion (state, payload) {
    state.userQuestions = { ...state.userQuestions, [payload.id]: payload }
  },
  setUserQuestionAttribute (state, payload) {
    state.userQuestions[payload.id] = { ...state.userQuestions[payload.id], [payload.attribute]: payload.value }
  }
}

const actions = {
  createUserQuestion ({ dispatch, commit }, questionId) {
    getObjectFromDexie('userQuestions', questionId)
      .then(userQuestion => {
        if (userQuestion) { // If userQuestion exists in local DB
          commit('setUserQuestion', userQuestion)
        } else { // if no userQuestion exists in local DB
          const userQuestion = {
            id: questionId
          }
          dispatch('setUserQuestion', userQuestion)
          writeStateToDexie('userQuestions', userQuestion)
        }
      })
  },
  setUserQuestion ({ commit }, payload) {
    commit('setUserQuestion', payload)
  },
  setUserQuestionAttribute ({ commit, getters }, payload) {
    commit('setUserQuestionAttribute', payload)
    const question = getters.readUserQuestion(payload.id)
    writeStateToDexie('userQuestions', question)
  }
}

const getters = {
  readUserQuestion: (state) => (id) => {
    return state.userQuestions[id]
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
