const debugMessages = false

/** @function debug
* @Description Logs message to console if global constant debugMessages is true
* @param {string} message - Message to be logged
*/
function debug (...message) {
  if (debugMessages) console.log(...message)
}

export { debug }
