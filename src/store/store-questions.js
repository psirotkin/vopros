import { debug } from '@/libraries/tools'
import { writeStateToDexie } from '@/libraries/dexie'

const baseUrl = 'https://fast-retreat-18229.herokuapp.com/'

const state = {
  questions: {}
}

const mutations = {
  setQuestion (state, payload) {
    state.questions = { ...state.questions, [payload.id]: payload }
  },
  setQuestionAttribute (state, payload) {
    state.questions[payload.id] = { ...state.questions[payload.id], [payload.attribute]: payload.value }
  }
}

const actions = {
/**
 * @summary Puts info from a question in db.chgk.info format into a question object
 * @param {Object} question db.chgk.info question
 * @description Receives a question in db.chgk.ino format.
 * Puts most of the question's child properties into a packet object (leaving out just a few unneeded ones).
 * Ignores authors for the time being (2do)
 */
  importQuestion ({ dispatch }, payload) {
    debug('Processing tour ' + payload.id)
    const question = {
      id: payload.id, // e.g. azov20_u.5-48
      number: payload.number, // In tour or packet!
      type: payload.type, // Ч(ГК), Б(рейн), ?.. Also duplicate to packet info
      question: payload.question,
      answer: payload.answer,
      passCriteria: payload.passCriteria,
      authors: payload.authors,
      sources: payload.sources,
      comments: payload.comments,
      tourId: payload.tourId,
      answered: null
    }

    // Converting br tags in question to \n to be properly displayed later
    const brTags = /<br.*?>/gi
    question.question = question.question.replace(brTags, '\n')

    const questionImage = question.question.match(/(https.+?\.(jpg|jpeg|png|gif))/)
    if (questionImage) {
      question.question = question.question.replace(/([[(\s]?Раздаточный материал:([\s(\\n)])*)?(\(pic:\s*)?[([]?https.+?\.(jpg|jpeg|png|gif)[\s(\\n))\]]*/, '@image@')
      const image = {
        id: payload.id,
        attribute: 'questionImage',
        url: questionImage[1]
      }
      dispatch('processImage', image)
    }

    const commentsImage = question.comments.match(/(https.+?\.(jpg|jpeg|png|gif))/)
    if (commentsImage) {
      question.comments = question.comments.replace(/(\(pic:\s*)?([([]\s)?https.+?\.(jpg|jpeg|png|gif)(\s[)\]])?/, '@image@')
      const image = {
        id: payload.id,
        attribute: 'commentsImage',
        url: commentsImage[1]
      }
      dispatch('processImage', image)
    }

    dispatch('setQuestion', question)
    writeStateToDexie('questions', question)
  },
  setQuestion ({ commit, dispatch }, payload) {
    commit('setQuestion', payload)
    dispatch('userQuestions/createUserQuestion', payload.id, { root: true })
  },
  /**
   * @description Takes question ID, field, and image URL; writes the image blob into corresponding question field.
   * @param {Object} param0 The store context.
   * @param {Object} payload Payload with attributes id, attribute (question property to be set), url
   */
  processImage ({ dispatch }, payload) {
    fetch(baseUrl + payload.url)
      .then(response => {
        if (!response.ok) {
          console.error('Не получается загрузить изображение: ', response)
        }
        return response.blob()
      })
      .then(image => {
        const attribute = {
          id: payload.id,
          attribute: payload.attribute,
          value: image
        }
        dispatch('setQuestionAttribute', attribute)
      })
  },
  setQuestionAttribute ({ commit, getters }, payload) {
    commit('setQuestionAttribute', payload)
    const question = getters.readQuestion(payload.id)
    writeStateToDexie('questions', question)
  }
}

const getters = {
  readQuestion: (state) => (id) => {
    return state.questions[id]
  },
  questionsForTour: (state) => (tourId) => {
    return state.questions.filter(question => question.packetId === tourId)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
