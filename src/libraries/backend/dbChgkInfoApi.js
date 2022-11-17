// const request = require('sync-request') // https://www.npmjs.com/package/sync-request
const axios = require('axios').default

// See documentation at http://api.baza-voprosov.ru/
const baseUrl = 'http://api.baza-voprosov.ru/'
const defaultItemsPerRequest = 2
const defaultStartWithPage = 1
const defaultPacketId = 'balt20-4_u'

/**
 * @description Get packets from db.chgk.info sorted by descending uptade time
 * @param {Number} [itemsPerRequest={@link defaultItemsPerRequest}] Number of items to be fetched per request
 * @param {Number} [startWithPage={@link defaultStartWithPage}] Page offset (starts with 0)
 * @param {String} [requestURL='http://api.baza-voprosov.ru/'] Base API URL
 * @returns {Promise} JSON result parsed into an object
 */
function getRecentPackets (itemsPerRequest = defaultItemsPerRequest, startWithPage = defaultStartWithPage, requestURL = baseUrl) {
  return new Promise((resolve, reject) => {
    requestURL += 'packages?order%5BupdatedAt%5D=DESC' + '&itemsPerPage=' + String(itemsPerRequest) + '&page=' + startWithPage
    // console.log('Request URL: ' + requestURL)
    axios({
      method: 'get',
      url: requestURL,
      headers: {
        Accept: 'application/json' // We want to receive JSON
      }
    })
      .then(res => resolve(res.data))
      .catch(err => reject(err))
  })
}

/**
 * @description Gets a specific packet from db.chgk.info
 * @param {String} [PacketId={@link=defaultPacketId}] The db.chgk.info packet ID
 * @param {String} [requestURL={@link baseUrl}] The base URL
 * @returns {Promise} JSON result parsed into an object
 */
function getPacket (PacketId = defaultPacketId, requestURL = baseUrl) {
  requestURL += 'packages/' + PacketId
  // console.log('Request URL: ' + requestURL)
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: requestURL,
      headers: {
        Accept: 'application/json' // We want to receive JSON
      }
    })
      .then(res => resolve(res.data))
      .catch(err => reject(err))
  })
}

// function logJson (response) {
//   console.log(response)
//   // console.log(response.tours[1])
// }

// const response = getRecentPackets(defaultItemsPerRequest, defaultStartWithPage, baseUrl).then(res => console.log(res))
// console.log('done')
// const response = getPacket(defaultPacketId, baseUrl).then(res => console.log(typeof res))

module.exports = { getRecentPackets, getPacket }
