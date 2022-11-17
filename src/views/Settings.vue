<template>
  <q-page class="column">
    <q-card
      bordered
      class="col q-ma-sm">
      <q-list class="q-ma-sm">
        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              <q-icon name="volume_up" />
              Включить звук
            </q-item-label>
          </q-item-section>
          <q-item-section avatar>
            <q-toggle
              id="soundOn"
              name="soundOn"
              v-model="settings.soundOn"
              @input="updateSettings"
            />
          </q-item-section>
        </q-item>
        <q-item tag="label" v-ripple @click="confirm_clear_downloads = true">
          <q-item-section>
            <q-item-label>
              <q-icon name="clear_all" />
              Стереть скачанные вопросы
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

 <q-dialog v-model="clear_downloads_successful">
      <q-card>
        <q-card-section class="q-pt-sm">
          Всё, без интернета у Вас больше ничего не выйдет. Скачивайте всё заново.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="А что делать" color="primary" text-color="black" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="confirm_clear_downloads" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="clear_all" color="primary" />
          <span class="q-ml-sm">Вы собираетесь стереть все скачанные пакеты (Ваши статистики останутся). Вы уверены?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Да, стереть" color="primary" text-color="red" v-close-popup @click="clearDownloaded()" />
          <q-btn label="Всё-таки не хочу" color="primary" text-color="black" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { dexieClearDownloaded } from '@/libraries/dexie'

export default {
  name: 'Settings',
  data () {
    return {
      confirm_clear_downloads: false,
      clear_downloads_successful: false
    }
  },
  methods: {
    updateSettings (value, event) {
      const newSetting = {
        attribute: event.target.id,
        value: value
      }
      this.setSetting(newSetting)
    },
    clearDownloaded () {
      dexieClearDownloaded()
        .then(_ => {
          this.clear_downloads_successful = true
        })
    },
    ...mapActions('ui', ['setSetting', 'setTitle'])
  },
  computed: {
    ...mapState('ui', {
      getSettings: 'settings'
    }),
    settings () {
      return this.getSettings
    }
  },
  created () {
    this.setTitle('Настройки')
  }
}
</script>

<style>

</style>
