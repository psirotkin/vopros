const { initializeFirebase, writePacket, writeToBeImportedBatch } = require('./firebaseBackendApi')
const dbChgkInfoApi = require('./dbChgkInfoApi')

const debugMessages = true

var done = false

/** @function debug
* @Description Logs message to console if global constant debugMessages is true
* @param {string} message - Message to be logged
*/
function debug (message) {
  if (debugMessages) console.log(message)
}

/** @function tokenizePersons
 * @description Tokenize editors or authors string separated by ',' or ' и ' into array of objects. Objects have keys name and location.
 * @summary Tokenize persons list
 * @param {string} persons Persons string to be parsed
 * @returns {array} Array of strings with individual editors
 */
function tokenizePersons (persons) {
  try {
    const prelimList = persons.split(', ')
    let list = []
    prelimList.forEach(elem => {
      const editors = elem.split(' и ')
      list = list.concat(editors)
    })
    return list
  } catch {
    throw new Error('Could not split "' + persons + '"')
  }
}

/**
 * @description Finds last tour with editors and returns tokenized list. Used in case the current tour has no editors specified
 * @param {Object} packet Packet object as received from db.chgk.info
 * @param {Number} tourNumber Number of the tour currently processed
 * @returns {array} Array of strings with individual editors
 */
function previousEditors (packet, tourNumber) {
  if (packet.tours[tourNumber - 1]) {
    let editors = packet.tours[tourNumber - 1].editors
    if (!editors) {
      editors = previousEditors(packet, tourNumber - 1)
    } else {
      return tokenizePersons(editors)
    }
  }
}

/**
 * @description Gets the update time of the most recent packet in the database (by db.chgk.info updatedBy value)
 * @param {Object} db Firebase instance
 * @returns {Date} Time of latest package in database
 */
function getLastUpdate (db) {
  const packetRef = db.collection('Packets')
  const lastUpdate = packetRef.orderBy('updatedAt').limit(1).get()
    .then(snapshot => {
      if (snapshot.empty) {
        throw new Error('No packets found in database!')
      } else {
        snapshot.forEach(doc => {
          // Check whether order should be asc or desc; return update timestamp
          console.log('Document data: ' + doc.data('title') + ' updated at ' + doc.data('updatedAt'))
        })
      }
    })
    .catch(err => {
      console.log('Error getting last update', err)
    })
}

/**
 * @description Logs the size of the 'To be important' document collection
 * @param {Object} db Firebase instance
 */
function countToBeImported (db) {
  const toBeImportedRef = db.collection('To be imported')
  let toBeImported = toBeImportedRef.get()
    .then(snapshot => {
      console.log('Snapshot length: ', snapshot.size)
    })
    .catch(err => {
      console.log('Error getting documents', err)
    })
}

/**
 * @description Gets 100 packages from db.chgk.info and pushes their IDs into an array if their update time is later then the most recently updated package in database.
 * If no packets are fetched, 'done' is set to true.
 * @param {Number} pageOffset Page to start with (equals results already fetched divided by 100)
 * @param {Date} lastUpdated Timestamp of most recently updated package in database
 * @returns {Promise} Promise of an array of retrieved IDs
 */
function processPackets (pageOffset, lastUpdated) {
  // Groups not to be imported
  const excludeGroups = ['ERUDITK', 'EF', 'BESKR', 'SVOYAK', 'INTBES']
  const ids = []
  return new Promise((resolve, reject) =>
    dbChgkInfoApi.getRecentPackets(100, pageOffset).then(packets => {
      // debug(packets)

      // If no packets fetched, we're through to the end and thus done
      if (packets.length === 0) {
        done = true
        debug('No packets fetched')
        resolve(ids)
      }

      packets.forEach(packet => {
        if (packet.updatedAt < lastUpdated) { // If the current package has been updated before the most recent package in our DB, we already have it
          done = true
          debug('Latest package is before most recent update')
          resolve(ids)
        }
        if (!excludeGroups.includes(packet.group)) {
          ids.push(packet.id)
          resolve(ids)
        }
      })
    })
  )
}

/**
 * @description Gets all new packets from db.chgk.info and writes their IDs into documents in 'To be imported' collection
 * @param {Object} db Firebase instance
 * @returns {Promise} An empty promise
 */
async function addPackets (db) {
  const lastUpdated = 0 // Only for initial run. Later to be set to latest update of own DB
  let pageOffset = 0
  let ids = []

  while (!done) {
    pageOffset++
    const newIds = await processPackets(pageOffset, lastUpdated)
    ids = ids.concat(newIds)
    console.log(ids.length + ' packets processed')
    // if (ids.length > 1000) done = true
    // done = true // Uncomment for testing only 100 packets
  }

  // console.log('IDs: ' + ids)
  console.log('Counter: ' + ids.length)

  let counter = ids.length

  // Split ids array into arrays of max. 400 ids, write each to "To be completed"
  for (let index = 0; index < ids.length; index += 400) {
    const idsBatch = ids.slice(index, index + 400)
    writeToBeImportedBatch(db, idsBatch)
      .catch(error => console.log('Error writing batch of IDs to be imported: ', error))
  }
}

/**
 * @summary Gets a packet with a specified ID from db.chgk.info, puts it into packet object as well as editors, tours and questions arrays and writes all of them into the database
 * @param {Object} db Firebase instance
 * @param {String} packetId db.chgk.info packet ID
 * @returns {Promise} Firebase set operation promise
 * @description Gets a packet with a specified ID from db.chgk.info via {@link dbChgkInfoApi.getPacket}.
 * Puts most of the packet's direct child properties into a packet object (leaving out just a few unneeded ones).
 * Splits the editor list and puts the individual editors into the editors array. If the package has no editors, pools all editors from the individual tours.
 * For each tour, puts the data into an object in a tours array.
 * If a tour has no editors, gets those from the last tour that did have editors. If there is none, copies editors from packet. Editors are tokenized as above.
 * For each question, puts the data into an object in a questions array.
 * Authors are tokenized, image lniks in the question text replaced by '@imageUrl@' (with imageUrl being the URL of the image on db.chgk.info).
 * Then, calls {@link firebaseApi.writePacket} with db connection and packet, editors, tours, questions.
 */
async function addPacket (db, packetId) {
  const data = await dbChgkInfoApi.getPacket(packetId)
  const tours = []
  const questions = []

  const packet = {
    id: data.id,
    updated: Date.now(),
    dbGroup: data.group,
    copyright: data.copyright,
    preamble: data.info,
    dbUrl: data.url,
    dbFilename: data.filename,
    ratingId: data.ratingId,
    dbCreatedAt: data.createdAt,
    dbEnteredBy: data.enteredBy,
    dbUpdatedAt: data.updatedAt,
    playedAt: data.playedAt,
    finishedAt: data.finishedAt,
    kandId: data.kandId,
    title: data.title
  }

  let editors = []
  // If there are no package editors, get all editors of individual tours
  if (!data.editors) {
    data.editors = []
    data.tours.forEach(tour => { // For the editors of each tour
      if (tour.editors) {
        const tourEditors = tokenizePersons(tour.editors)
        tourEditors.forEach(tourEditor => {
          if (!editors.includes(tourEditor)) editors.push(tourEditor)
        })
      }
    })
  } else {
    editors = tokenizePersons(data.editors)
  }

  data.tours.forEach(tour => {
    tours[tour.number] = {
      id: tour.number,
      copyright: tour.copyright,
      preamble: tour.info,
      dbId: tour.id,
      title: tour.title
    }
    if (tour.editors) { // If the tour has specified editors, assign them
      tours[tour.number].editors = tokenizePersons(tour.editors)
    } else {
      tours[tour.number].editors = previousEditors(data, tour.number)
    }
    if (!tours[tour.number].editors && editors) { // If still none, but there are packet editors, take packet editors
      tours[tour.number].editors = editors
    }

    // Questions in db.chgk.info are instide tours
    tour.questions.forEach(question => {
      questions[question.number] = {
        id: question.number,
        dbId: question.id,
        type: question.type,
        answer: question.answer,
        passCriteria: question.passCriteria,
        comments: question.comments,
        sources: question.sources
      }
      if (question.authors) {
        questions[question.number].authors = tokenizePersons(question.authors)
      }
      const imageQuestion = question.question.match(/\(pic: (https.+?)\)/)
      if (imageQuestion) {
        questions[question.number].imageUrl = imageQuestion[1]
        questions[question.number].text = question.question.replace(/\(pic: https.+?\)/, '@imageUrl@')
      } else {
        questions[question.number].text = question.question
      }
      const imageComment = question.comments.match(/\(pic: (https.+?)\)/)
      if (imageComment) {
        questions[question.number].imageUrl = imageComment[1]
        questions[question.number].comments = question.comments.replace(/\(pic: https.+?\)/, '@imageUrl@')
      } else {
        questions[question.number].comments = question.comments
      }
    })
  })

  return writePacket(db, packet, editors, tours, questions)
}

/**
 * @description Gets one packet id at a time from the "To be imported" collection.
 * Gets the corresopnding packet from db.chgk.info API and writes it into database via {@link addPacket}.
 * Repeats until no packet ids are left in the "To be imported" collection.
 * @param {Object} db Firebase instance
 */
function addQueuedPackets (db) {
  const toBeImportedRef = db.collection('To be imported')
  // let done = false
  // while (!done) {
  const loop = setInterval(_ => {
    return new Promise((resolve, reject) => {
      toBeImportedRef.limit(1).get()
        .then(snapshot => {
          if (snapshot.empty) {
            clearInterval(loop)
            resolve('done')
          } else {
            snapshot.forEach((doc) => {
              debug('Packet ID to be imported: ' + doc.data().id)
              addPacket(db, doc.data().id)
                .then(_ => {
                  doc.ref.delete()
                  resolve(true)
                })
                .catch(err => debug('Error adding packet ' + doc.data().id + ': ' + err))
            })
          }
        })
        .catch(err => {
          debug('Error receiving packets: ', err)
        })
    })
  }, 2000)
  // done = true
}

// debug(tokenizePersons('Вася (Мюнхен), Миша и Петя Иванов'))

const db = initializeFirebase()
// addPackets(db).then(_ => {
//   countToBeImported(db)
// })

countToBeImported(db)
// addPacket(db, '120br')

// getLastUpdate(db)
// addQueuedPackets(db)
// firebaseApi.writePacket(db, { id: 'test' })

// processPackets([], 0, 1, 0).then(result => debug(result.ids.length))
// dbChgkInfoApi.getRecentPackets(100, 1).then(packets => debug(packets.length))
