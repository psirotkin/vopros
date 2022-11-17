import { getSettingsFromDexie, writeSettingsToDexie } from '@/libraries/dexie'

const timerStart = 60

const state = {
  title: 'Вопросики',
  footer: {
    id: '',
    type: '',
    message: ''
  },
  showAnswer: false,
  timer: timerStart,
  timerOn: false,
  lastSwipe: 'right',
  showOverview: false,
  settings: {}
}

const mutations = {
  setTitle (state, value) {
    state.title = value
  },
  setFooter (state, value) {
    state.footer = value
  },
  setShowAnswer (state, value) {
    state.showAnswer = value
  },
  setLastSwipe (state, value) {
    state.lastSwipe = value
  },
  changeTimerStatus (state) {
    state.timerOn = !state.timerOn
  },
  toggleOverview (state) {
    state.showOverview = !state.showOverview
  },
  decrementTimer (state) {
    state.timer--
  },
  resetTimer (state) {
    state.timerOn = false
    state.timer = timerStart
  },
  initSettings (state, payload) {
    state.settings = payload
  },
  setSetting (state, payload) {
    state.settings = { ...state.settings, [payload.attribute]: payload.value }
  }
}

const actions = {
  setTitle ({ commit }, value) {
    commit('setTitle', value)
  },
  setFooter ({ commit }, value) {
    commit('setFooter', value)
  },
  setShowAnswer ({ commit, dispatch }, value) {
    commit('setShowAnswer', value)
    dispatch('resetTimer')
  },
  setLastSwipe ({ commit }, value) {
    commit('setLastSwipe', value)
  },
  changeTimerStatus ({ commit }) {
    commit('changeTimerStatus')
  },
  toggleOverview ({ commit }) {
    commit('toggleOverview')
  },
  decrementTimer ({ commit }) {
    commit('decrementTimer')
  },
  resetTimer ({ commit }) {
    commit('resetTimer')
  },
  initSettings ({ commit }) {
    getSettingsFromDexie()
      .then(newSettings => {
        if (!newSettings) { // If no settings in local DB
          newSettings = {
            id: 'default',
            soundOn: true,
            hideQuestion: false,
            cookiesAcknowledged: false,
            appVersion: process.env.VUE_APP_VERSION || null
          }
          writeSettingsToDexie(newSettings)
        }
        commit('initSettings', newSettings)
      })
  },
  checkNewVersion ({ dispatch, state }) {
    console.log(process.env.VUE_APP_VERSION)
    console.log(state.settings.appVersion)
    console.log(process.env.VUE_APP_VERSION === state.settings.appVersion)
    if (process.env.VUE_APP_VERSION !== state.settings.appVersion) { // New version
    // if (process.env.VUE_APP_VERSION !== '1') { // New version
      // console.log('New version!')
      const newSetting = {
        attribute: 'appVersion',
        value: process.env.VUE_APP_VERSION
      }
      dispatch('setSetting', newSetting)
      return true
    } else return false // No new version
  },
  setSetting ({ commit, state }, payload) {
    commit('setSetting', payload)
    const settings = state.settings
    writeSettingsToDexie(settings)
  }
}

const getters = {
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
