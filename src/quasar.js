import Vue from 'vue'

import './styles/quasar.sass'
import lang from 'quasar/lang/ru.js'
import '@quasar/extras/material-icons/material-icons.css'
import { Quasar, Cookies, Notify } from 'quasar'

Vue.use(Quasar, {
  config: {
  },
  // importStrategy: 'autoas',
  // animations: 'all',
  components: { /* not needed if importStrategy is not 'manual' */ },
  directives: { /* not needed if importStrategy is not 'manual' */ },
  plugins: [
    Cookies,
    Notify
  ],
  lang: lang
})
