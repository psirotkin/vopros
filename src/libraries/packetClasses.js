/** Class representing a person (editor, author) with name and location */
class Person {
  constructor (name, location) {
    this.name = name
    this.location = location
  }
}

class Question {
  constructor (question) {
    this.id = question.id // e.g. azov20_u.5-48
    this.number = question.number // In tour or packet!
    this.type = question.type // Ч(ГК), Б(рейн), ?.. Also duplicate to packet info
    this.question = question.question
    this.answer = question.answer
    this.passCriteria = question.passCriteria
    this.authors = question.authors
    this.sources = question.sources
    this.comments = question.comments
    this.answered = null

    if (question.questionImage) {
      question.questionImage.then(image => {
        this.questionImage = image
      })
    }
    if (question.comments && question.commentsImage) {
      question.commentsImage.then(image => {
        this.commentsImage = image
      })
    }
  }
}

class Tour {
  constructor (tour, questions) {
    this.id = tour.id // e.g. azov20_u.5
    this.number = tour.number
    this.copyright = tour.copyright
    this.info = tour.info
    this.url = tour.url
    this.editors = null // To be processed later
    this.title = tour.title
    this.questions = questions
    this.currentQuestionIndex = tour.currentQuestionIndex // Might be set if we're reading from local DB and tour has been started
    this.finished = tour.finished

    /**
     * @description Moves index to the next question within the tour
     * @return { boolean } true if staying within the tour, false, if last question in tour has been played
     */
    this.nextQuestion = function () {
      // console.log('Looking for next question in tour.')
      if (!this.currentQuestionIndex) { // If tour has not been started
        // console.log('Tour not started, setting question index to first one.')
        this.currentQuestionIndex = this.questions.findIndex(question => question !== undefined)
        // console.log('New question index: ', this.currentQuestionIndex)
      } else {
        this.currentQuestionIndex++
        // console.log('New question index: ', this.currentQuestionIndex)
        if (this.currentQuestionIndex >= this.questions.length) { // If this takes us over the end of the tour
          // console.log('Tour is completed.')
          this.currentQuestionIndex-- // Roll back to last question
          return false
        }
      }
      return true
    }

    /**
     * @description Moves index to the previous question within the tour
     * @return { boolean } true if staying within the tour, false, if it was already tour info
     */
    this.previousQuestion = function () {
      // console.log('Looking for previous question in tour.')
      if (!this.currentQuestionIndex) { // If tour has not been started
        // console.log('Tour not started, should go to previous.')
        return false
      } else {
        this.currentQuestionIndex--
        // console.log('New question index: ', this.currentQuestionIndex)
        if (!this.questions[this.currentQuestionIndex]) { // If there is no such question
          // console.log('This was first question in tour. Going to tour info.')
          this.currentQuestionIndex = null // Display tour info
        }
      }
      return true
    }
  }

  get listEditors () {
    let editors = []
    this.editors.forEach(editor => {
      editors += editor.name + ', '
    })
    editors = editors.substring(0, editors.length - 2)
    return editors
  }
}

/**
 *
 */
class Packet {
  constructor (packet, editors = null, tours = null) {
    this.title = packet.title
    this.id = packet.id
    this.group = packet.group // ad db.chgk.info, not here!
    this.copyright = packet.copyright
    this.info = packet.info
    this.createdAt = packet.createdAt // ad db.chgk.info, not here!
    this.updatedAt = packet.updatedAt // ad db.chgk.info, not here!
    this.imported = (packet.imported || Date.now) // Imported date, or current timestamp if none
    this.playedAt = packet.playedAt
    this.finishedAt = packet.finishedAt
    this.currentTourIndex = packet.currentTourIndex // Might be set if we're reading from local DB and packet has been started
    this.editors = editors // To be processed later
    this.tours = tours

    /**
     * @description Moves index to the next question. Moves to the next tour if previous question was the last in the current tour.
     * @return { boolean } false, if last question in packet has been played
     */
    this.nextQuestion = function () {
      // console.log('Looking for next question in packet.')
      if (!this.currentTourIndex) { // If packet has not been started
        // console.log('Packet not started, setting tour index to first one.')
        this.currentTourIndex = this.tours.findIndex(tour => tour !== undefined)
      } else {
        // console.log('Current tour id: ', this.currentTourIndex)
        if (!this.tours[this.currentTourIndex].nextQuestion()) this.currentTourIndex++ // Next tour if this one is over
        if (this.currentTourIndex >= this.tours.length) { // If this was the last tour
          this.currentTourIndex-- // Roll back to last tour
          return false
        }
      }
      return true
    }
    this.previousQuestion = function () {
      // console.log('Looking for previous question in packet.')
      if (!this.currentTourIndex) { // If packet has not been started
        // console.log('Packet not started, doing nothing.')
        return false
      } else {
        // console.log('Current tour id: ', this.currentTourIndex)
        if (!this.tours[this.currentTourIndex].previousQuestion()) this.currentTourIndex-- // Previous tour if this one is at the beginning already
        if (this.currentTourIndex < this.tours.findIndex(tour => tour !== undefined)) { // If we are now before the first tour
          this.currentTourIndex = null // Roll back to last tour
        }
      }
      return true
    }

    // if (packet.editors) this.editors = tokenizePersons(packet.editors)
    // else if (tours) {
    //   this.editors = []
    //   data.tours.forEach(tour => { // For the editors of each tour
    //     if (tour.editors) {
    //       const tourEditors = tokenizePersons(tour.editors)
    //       tourEditors.forEach(tourEditor => {
    //         if (!editors.includes(tourEditor)) editors.push(tourEditor)
    //       })
    //     }
    //   })
    // }
  }

  get tour () {
    return this.tours[this.currentTourIndex]
  }

  get question () {
    return this.tours[this.currentTourIndex].questions[this.tours[this.currentTourIndex].currentQuestionIndex]
  }

  get listEditors () {
    let editors = []
    this.editors.forEach(editor => {
      editors += editor.name + ', '
    })
    editors = editors.substring(0, editors.length - 2)
    return editors
  }
}

export { Packet, Tour, Question, Person }
