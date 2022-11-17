import { debug } from '@/libraries/tools'
import { writeStateToDexie } from '@/libraries/dexie'

const state = {
  persons: {}
}

const mutations = {
  setPerson (state, payload) {
    state.persons = { ...state.persons, [payload.id]: payload }
  },
  setAuthorship (state, payload) {
    state.persons[payload.person.id] = { ...state.persons[payload.person.id], [payload.authorship.type]: payload.authorship.id }
  }
}

const actions = {
/** @function tokenizePersons
 * @description Tokenize editors or authors string separated by ',' or ' и ' into array of objects. Objects have keys name and location.
 * @summary Tokenize persons list
 * @param {string} persons Persons string to be parsed
 * @returns {array} Array of person objects in the form {name, location}
 */
  tokenizePersons ({ dispatch }, payload) {
    try {
      const idList = []
      // Replacing newlines with spaces
      payload.persons = payload.persons.replace(/\n/ig, ' ')
      // Removing and separating by everything in parentheses (location), commas, 'и', special characters...
      const regex = /\([^)]+\)|[,/\\.!?;]| и |топ-редактор| - |при участии|ответственный редактор|редактор-консультант|редакторская группа/gi
      const stringList = payload.persons.split(regex)
      stringList.forEach(string => {
        string = string.normalize('NFD').replace(/[\u0300\u0301\u0308]/g, '') // Removing accents, replacing ё with е
        const person = {
          id: string.trim()
        }
        if (person.id) {
          debug('Person id: ' + person.id)
          idList.push(person.id)
          const authorship = payload.authorship
          debug('Writing person: ', person.id)
          dispatch('setPerson', { person, authorship })
        }
      })
      return idList
    } catch {
      throw new Error('Could not split persons: ' + payload.persons)
    }
  },

  /**
 * @summary Puts info from a person in db.chgk.info format into a person object and a packet, tour or question ID
 * @param {Object} payload: payload.person db.chgk.info person, as well as payload.questionId, payload.tourId or payload.packetId
 * @description Receives a person in db.chgk.ino format.
 * Checks whether person ID is already in storage; if not, puts it there with empty questions, tours and packets lists.
 * Checks whether question/tour/packet relationship is already in storage; if not, puts it there.
 */
  setPerson ({ commit, getters }, payload) {
    let person = getters.readPerson(payload.person.id)
    debug('Person: ', person)
    if (person === undefined) { // person not yet in vuex
      payload.person.questions = []
      payload.person.tours = []
      payload.person.packets = []
      debug('Setting person: ', payload.person.id)
      commit('setPerson', payload.person)
      person = getters.readPerson(payload.person.id)
    }
    if (!person[payload.authorship.type].includes(payload.authorship.id)) {
      // console.log('Writing authorship for person: ', person)
      commit('setAuthorship', payload)
    }
    person = getters.readPerson(payload.person.id)
    writeStateToDexie('persons', person)
  }
}

const getters = {
  readPerson: (state) => (id) => {
    return state.persons[id]
  }
  // packetsForPerson: (state) => (personId) => {
  //   return state.persons.filter(person => person.packetIds.includes(personId))
  // },
  // packetsForPerson: (state) => (personId) => {
  //   return state.persons.filter(person => person.tourIds === personId)
  // },
  // packetsForPerson: (state) => (personId) => {
  //   return state.persons.filter(person => person.questionIds === personId)
  // }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
