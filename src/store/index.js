import Vue from 'vue'
import Vuex from 'vuex'

import ui from './store-ui'
import packets from './store-packets'
import userPackets from './store-user-packets'
import tours from './store-tours'
import userTours from './store-user-tours'
import questions from './store-questions'
import userQuestions from './store-user-questions'
import persons from './store-persons'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    ui,
    packets,
    userPackets,
    tours,
    userTours,
    questions,
    userQuestions,
    persons
  }
})
