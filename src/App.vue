<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Загружаю вопросы..."
          icon="menu"
          color="black"
        />

        <q-toolbar-title class="black-text">
          {{ title }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      no-swipe-open
      show-if-above
      bordered
    >
      <q-list>
        <q-item class="bg-primary text-black">
          <q-item-label>вопрос.web.app</q-item-label>
        </q-item>
        <q-item class="text-black" clickable v-ripple to="/">
          <q-item-section avatar>
            <q-icon name="list" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Пакетики</q-item-label>
          </q-item-section>
        </q-item>
        <q-item class="text-black" clickable v-ripple to="/settings">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Настройки</q-item-label>
          </q-item-section>
        </q-item>
        <q-item class="text-black" clickable v-ripple to="/information">
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label>О программе</q-item-label>
          </q-item-section>
        </q-item>
        <!-- <q-item></q-item>
        <q-item class="text-red" clickable v-ripple @click="clearDb()">
          <q-item-section avatar>
            <q-icon name="clear_all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Сбросить все данные</q-item-label>
          </q-item-section>
        </q-item> -->
      </q-list>
    </q-drawer>

    <q-dialog v-model="consentNeeded" persistent seamless position="bottom">
      <q-card bordered class="bg-secondary">
        <q-card-section class="row items-center q-pb-none">
          <!-- <q-avatar icon="info" text-color="black" /> -->
          <span class="q-ml-sm">Этот сайт использует куки. <router-link to="/Information">Информация и настройки</router-link>.</span>
        </q-card-section>
        <q-card-actions align="right" class="q-pt-none">
          <q-btn size="small" outline label="OK" color="primary" text-color="black" class="q-ml-sm" @click="acknowledgeCookies" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>

import { mapState, mapActions } from 'vuex'
import { dexieClearDb } from '@/libraries/dexie'

export default {
  name: 'App',

  components: {
  },

  data () {
    return {
      leftDrawerOpen: false,
      // refresh variables
      refreshing: false,
      registration: null,
      updateExists: false,
      consentNeeded: false
    }
  },
  methods: {
    clearDb () {
      dexieClearDb()
        .then(_ => {
          location.reload(true)
        })
    },

    showAvailableUpdateNotif () {
      this.$q.notify({
        message: 'Доступно обновление!',
        icon: 'new_releases',
        actions: [
          { label: 'обновить', color: 'white', handler: () => { this.refreshApp() } }
        ],
        timeout: 20000,
        closeBtn: 'потом',
        type: 'positive',
        textColor: 'black'
      })
    },

    showSusccessfulUpdateNotif () {
      this.$q.notify({
        message: 'Программа обновлена.',
        icon: 'new_releases',
        actions: [
          { label: 'Что нового?', color: 'white', handler: () => { this.$router.push('Information#releaseNotes') } }
        ],
        timeout: 20000,
        closeBtn: 'X',
        type: 'positive',
        textColor: 'black'
      })
    },

    acknowledgeCookies () {
      const newSetting = {
        attribute: 'cookiesAcknowledged',
        value: true
      }
      this.setSetting(newSetting)
    },

    ...mapActions('ui', [
      'initSettings',
      'setSetting'
    ]),

    // Store the SW registration so we can send it a message
    // We use `updateExists` to control whatever alert, toast, dialog, etc we want to use
    // To alert the user there is an update they need to refresh for
    updateAvailable (event) {
      // console.log('You should know: update is available!')
      this.registration = event.detail
      this.updateExists = true
      this.showAvailableUpdateNotif()
    },

    // Called when the user accepts the update
    refreshApp () {
      // console.log('You should know: refreshing app!')
      this.updateExists = false
      // Make sure we only send a 'skip waiting' message if the SW is waiting
      if (!this.registration || !this.registration.waiting) return
      // send message to SW to skip the waiting and activate the new SW
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    },
    ...mapActions('ui', [
      'checkNewVersion'
    ])
  },
  computed: {
    ...mapState('ui', ['title', 'footer', 'settings'])
  },
  created () {
    this.initSettings()
    setTimeout(() => {
      this.checkNewVersion()
        .then(newVersion => {
          if (newVersion === true) this.showSusccessfulUpdateNotif()
          if (this.settings.cookiesAcknowledged === false) {
            this.consentNeeded = true
          }
        })
    }, 250)

    // Listen for  custom event from the SW registration
    document.addEventListener('swUpdated', this.updateAvailable, { once: true })

    // Prevent multiple refreshes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // console.log('You should know: controller has changed!')
      if (this.refreshing) return
      this.refreshing = true
      // Here the actual reload of the page occurs
      location.reload(true)
    })

    // Tracking through Matomo
    window._paq.push(['trackPageView'])
  }
}
</script>

<style>
.black-text {
  color: black;
}
</style>
