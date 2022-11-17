<template>
  <div>
    <q-list v-if="!tour" key="packet-info">
      <q-item v-if="packet.editorIds">{{ packet.editorIds.length > 1 ? 'Редакторы' : 'Редактор' }}: {{ packet.editorIds.join(', ') }}</q-item>
      <q-item v-if="packet.copyright">{{ packet.copyright }}</q-item>
      <q-item v-if="packet.playedAt">Отыгрывался {{ packet.playedAt | formatDate }}</q-item>
      <q-item v-if="packetPlayed">
        {{ packetPlayed }}
      </q-item>
      <q-item v-if="packet.info">{{ packet.info }}</q-item>
    </q-list>
    <q-list v-else key="tour-info">
      <q-item v-if="tour.title">{{ tour.title }}</q-item>
      <q-item v-else>Тур {{ tour.number }}</q-item>
      <q-item v-if="tour.editorIds">{{ tour.editorIds.length > 1 ? 'Редакторы' : 'Редактор' }}: {{ tour.editorIds.join(', ') }}</q-item>
      <q-item v-if="tour.copyright">{{ tour.copyright }}</q-item>
      <q-item v-if="tour.info">{{ tour.info }}</q-item>
    </q-list>
    <q-footer :class="{ 'bg-warning': footer.type === 'error' }">
      <q-toolbar class="row q-ma-sm text-black text-h5 items-center justify-center">
        <div v-if="footer.type === 'error'">
          {{ footer.message }}
        </div>
        <div v-else-if="!packet.tourIds">
          Загружаю пакет...
          <q-spinner-hourglass
            color="black"
          />
        </div>
        <div v-else-if="!tour">
          <div v-if="touch" class="vertical-middle">
            свайпните налево
            <q-linear-progress query reverse />
          </div>
          <div v-else>
            нажмите кнопку "направо"
            <q-icon name="keyboard_arrow_right" class="text-black border">
              <q-tooltip>Да не здесь, а на клавиатуре!</q-tooltip>
            </q-icon>
            <span class="small q-mb-none q-ml-sm">или потяните мышкой налево</span>
          </div>
        </div>
      </q-toolbar>
    </q-footer>
  </div>
</template>

<script>
import { date } from 'quasar'
import storeMixins from '@/mixins/storeMixins'
import { mapState } from 'vuex'

export default {
  name: 'ShowInfo',
  mixins: [storeMixins],
  data: function () {
    return {
      packetId: this.$route.params.packet,
      touch: window.matchMedia('(any-pointer: coarse)').matches // true if device has touchscreen
    }
  },
  filters: {
    formatDate: function (timestamp) {
      return date.formatDate(timestamp, 'D.MM.YYYY')
    }
  },
  computed: {
    ...mapState('ui', [
      'footer',
      'lastSwipe'
    ]),
    packetPlayed: function () {
      if (this.userPacket.startedAt) { // If we already splayed the packet
        let message = 'Вы играли этот пакет '
        if (date.isSameDate(this.userPacket.startedAt, this.userPacket.lastPlayedAt, 'day')) {
          message += date.formatDate(this.userPacket.lastPlayedAt, 'D.MM.YYYY')
        } else {
          message += 'с ' + date.formatDate(this.userPacket.startedAt, 'D.MM.YYYY') + ' до ' + date.formatDate(this.userPacket.lastPlayedAt, 'D.MM.YYYY')
        }
        message += '.'
        return message
      }
      return false
    }
  }
}
</script>

<style>
.border {
  border: 2px solid black;
  border-radius: 5px;
}
.left-enter-active, .left-leave-active {
  transition: all 0.8s ease;
}
.left-enter {
  transform: translateX(1000px);
}
.left-leave-to {
  transform: translateX(-1000px);
}
.right-enter-active, .right-leave-active {
  transition: all 0.8s ease;
}
.right-enter {
  transform: translateX(-1000px);
}
.right-leave-to {
  transform: translateX(1000px);
}
.small {
  font-size: 0.6em;
  white-space: nowrap;
}
</style>
