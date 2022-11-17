// See documentation at http://api.baza-voprosov.ru/

import { debug } from './tools'

// const baseUrl = 'http://api.baza-voprosov.ru/'
const baseUrl = 'https://fast-retreat-18229.herokuapp.com/http://api.baza-voprosov.ru/'
// const baseUrl = 'https://cors-anywhere.herokuapp.com/http://api.baza-voprosov.ru/'
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
function getRecentPackets (itemsPerRequest = defaultItemsPerRequest, startWithPage = defaultStartWithPage) {
  let requestURL = baseUrl
  requestURL += 'packages?order%5BupdatedAt%5D=DESC' + '&itemsPerPage=' + String(itemsPerRequest) + '&page=' + startWithPage
  // console.log('Getting package list for: ', requestURL)

  const myRequest = new Request(requestURL, {
    method: 'GET',
    headers: {
      Accept: 'application/json' // We want to receive JSON
    }
  })

  return new Promise((resolve, reject) => {
    fetch(myRequest)
      .then(response => {
        // console.log('Resonse: ', response)
        if (response.ok) {
          // console.log('Response OK')
          return (response.json())
        } else {
          console.error('Response not OK')
          reject(new Error('Unable to access db.chgk.info'))
        }
      })
      .then(packets => {
        // console.log('Contents received: ', packets)
        resolve(packets)
      })
      .catch(err => {
        console.error('Can’t access ' + requestURL + ' response.')
        reject(err)
      })
  })
}

/**
 * @description Gets a specific packet from db.chgk.info
 * @param {String} [packetId={@link=defaultPacketId}] The db.chgk.info packet ID
 * @param {String} [requestURL={@link baseUrl}] The base URL
 * @returns {Promise} JSON result parsed into an object
 */
function getPacketFromDbChgkInfo (packetId = defaultPacketId) {
  let requestURL = baseUrl
  requestURL += 'packages/' + packetId
  // console.log('Request URL: ' + requestURL)

  const myRequest = new Request(requestURL, {
    method: 'GET',
    headers: {
      Accept: 'application/json' // We want to receive JSON
    }
  })

  return new Promise((resolve, reject) => {
    fetch(myRequest)
      .then(response => {
        // console.log('Response received: ', response)
        return response.json()
      })
      .then(contents => {
        if (contents.detail === 'Not Found') {
          const err = new Error('none')
          debug(err)
          reject(err)
        }
        // console.log('Response contents: ', contents)
        resolve(contents)
      })
      .catch((err) => {
        console.error('Can’t access ' + requestURL + ' response: ' + err)
        reject(err)
      })
  })
}

export { getRecentPackets, getPacketFromDbChgkInfo }
