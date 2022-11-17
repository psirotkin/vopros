import Dexie from 'dexie'

const db = new Dexie('voprosiki')
db.version(4).stores({
  packets: '&id, title, group, updatedAt, playedAt, importedAt, editorIds, tourIds, lastPlayedAt, completed',
  userPackets: '&id, playedAt, importedAt, lastPlayedAt, completedAt, questionsSolved',
  tours: '&id, editorIds, packetId, questionIds',
  userTours: '&id, completed',
  questions: '&id, question, passCriteria, answer, authors, comments',
  userQuestions: '&id, solved',
  persons: '&id, questions, tours, packets',
  settings: '&id'
})

function dexieClearDb () {
  return db.delete().then(db.open())
}

function dexieClearDownloaded () {
  db.packets.clear()
  db.tours.clear()
  db.questions.clear()
  return db.persons.clear()
}

/**
 * @description Returns object with ID from table
 * @param {String} table The name of the table to be read from
 * @param {String} id ID of the object to be read
 */
function getObjectFromDexie (table, id) {
  // console.log('Reading data for ' + table + ' ' + id)
  return db.table(table).get(id)
}

/**
 * @description Fetches specified quantity of packets with specified offset (defaulting to 0), sorted by update time.
 * @param {Number} quantity Number of packets to be fetched
 * @param {Number} offset The offset
 */
function getPacketsFromDexie (quantity, offset) {
  const packets = db.table('packets')
    .orderBy('updatedAt')
    .offset(offset)
    .limit(quantity)
    .reverse()
    .toArray()
  // packets.then(result => console.log('packets: ', result))
  return packets
}

/**
 * @description Fetches the update time of the most recently updated packet
 */
function getUpdateTime () {
  const packets = db.table('packets')
    .orderBy('updatedAt')
    .offset(0)
    .limit(1)
    .reverse()
    .toArray()
  packets.then(result => {
    console.log('Last update: ', result[0].updatedAt)
    return result[0].updatedAt
  })
}

/**
 * @description Fetches specified quantity of packets with specified offset (defaulting to 0), sorted by update time.
 * @param {Number} quantity Number of packets to be fetched
 * @param {Number} offset The offset
 */
function getRecentPacketsFromDexie () {
  const userPackets = db.table('userPackets')
    .orderBy('lastPlayedAt')
    .limit(5)
    .reverse()
    .toArray()
  return userPackets
}

/**
 * @description Fetches the user's settings.
 */
function getSettingsFromDexie () {
  const settings = db.table('settings').get('default')
  return settings
}

/**
 * @description Takes a settings object and writes it into the 'settings' table, overwriting any existing versions.
 * @param {Object} data The settings object to be written
 */
function writeSettingsToDexie (settings) {
  // settings = { id: 'test' }
  db.table('settings').put(settings, 'default')
}

/**
 * @description Takes a table name and object and writes the object into the table, overwriting any existing versions.
 * @param {String} table The name of the table to be written into
 * @param {Object} data The object to be written, with data.id to be used as ID
 */
function writeStateToDexie (table, data) {
  db.table(table).put(data, data.id)
}

export {
  getObjectFromDexie, getPacketsFromDexie, writeStateToDexie, getSettingsFromDexie, writeSettingsToDexie, dexieClearDb, dexieClearDownloaded,
  getRecentPacketsFromDexie, getUpdateTime
}
