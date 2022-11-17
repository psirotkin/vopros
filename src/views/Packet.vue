<template>
  <q-page
    class="column"
    v-touch-swipe.mouse.right="swipeRight"
    v-touch-swipe.mouse.left="swipeLeft">
    <q-card
      bordered
      class="col q-ma-sm linebreaks">
      <show-overview
        v-if="showOverview" />
      <show-question
        ref="showQuestion"
        v-else-if="packet && tour && question" />
      <show-info
        v-else />
    </q-card>
    <q-page-sticky position="top-right" :offset="[12, 12]" v-if="packet.tourIds">
      <q-btn v-if="!showOverview" fab-mini icon="list" color="primary" class="q-btn-fab-mini" @click="toggleOverview" />
      <q-btn v-else fab-mini icon="close" color="primary" class="q-btn-fab-mini" @click="toggleOverview" />
    </q-page-sticky>
  </q-page>
</template>

<script>
import { date } from 'quasar'
import { getPacketFromDbChgkInfo } from '@/libraries/dbChgkInfoApi'
import { mapActions, mapState } from 'vuex'
import storeMixins from '@/mixins/storeMixins'
import { debug } from '@/libraries/tools'
import { getObjectFromDexie } from '@/libraries/dexie'

export default {
  name: 'Packet',
  mixins: [storeMixins],
  data () {
    return {
      packetId: this.$route.params.packet,
      lastPacket: this.$q.cookies.get('last_packet')
    }
  },
  components: {
    'show-info': require('@/components/ShowInfo.vue').default,
    'show-question': require('@/components/ShowQuestion.vue').default,
    'show-overview': require('@/components/ShowOverview.vue').default
  },
  methods: {
    getPacket (packetId) {
      if (this.packet) this.setTitle(this.packet.title)
      getObjectFromDexie('packets', packetId)
        .then(dexiePacket => {
          this.setTitle(dexiePacket.title)
          this.setPacket(dexiePacket)
          dexiePacket.tourIds.forEach(tourId => {
            getObjectFromDexie('tours', tourId)
              .then(tour => {
                this.setTour(tour)
                tour.questionIds.forEach(questionId => {
                  getObjectFromDexie('questions', questionId)
                    .then(question => {
                      this.setQuestion(question)
                    })
                    .catch(() => {
                      this.getPacketFromDb(packetId)
                    })
                })
              })
              .catch(() => {
                this.getPacketFromDb(packetId)
              })
          })
        })
        .catch(() => {
          this.getPacketFromDb(packetId)
        })
    },
    getPacketFromDb (packetId) {
      debug('Packet ' + this.packetId + ' not in memory, getting from db.chgk.info')
      if (Object.keys(this.packet).length) { // Resetting the packet tourIds in order to show "packet loading" footer, if the packet is non-empty
        const noTours = {
          id: packetId,
          attribute: 'tourIds',
          value: null
        }
        this.setPacketAttribute(noTours)
      }
      getPacketFromDbChgkInfo(packetId)
        .then(packet => {
          this.setTitle(packet.title)
          debug('Packet: ', packet)
          this.importPacket(packet)
        })
        .catch(err => {
          debug('Error encountered: ', err)
          if (err === 'none') {
            this.setFooter({
              id: 'not_found',
              type: 'error',
              message: 'Не удалось найти такой пакет :('
            })
          } else {
            this.setFooter({
              id: 'get_packet_error',
              type: 'error',
              message: 'Не удалось загрузить пакет :('
            })
          }
        })
    },
    swipeRight () {
      this.setShowAnswer(false)
      this.setLastSwipe('right')
      this.previousQuestion(this.packet.id)
      this.resetTimer()
    },
    swipeLeft () {
      if (this.packet.tourIds) {
        this.setShowAnswer(false)
        this.resetTimer()
        this.setLastSwipe('left')
        if (!this.nextQuestion(this.packet.id)) {
          // 2do: Packet completed. Make a nice summary here.
        }
      }
    },
    keyboardNavigation () {
      if (event.key === 'ArrowRight') {
        this.swipeLeft()
      } else if (event.key === 'ArrowLeft') {
        this.swipeRight()
      }
    },
    ...mapActions('ui', [
      'setTitle',
      'setShowAnswer',
      'resetTimer',
      'setFooter',
      'setLastSwipe',
      'toggleOverview'
    ]),
    ...mapActions('packets', [
      'setPacket',
      'importPacket',
      'setPacketAttribute'
    ]),
    ...mapActions('userPackets', [
      'nextQuestion',
      'previousQuestion'
    ]),
    ...mapActions('tours', [
      'setTourAttribute',
      'setTour'
    ]),
    ...mapActions('questions', [
      'setQuestion'
    ])
  },
  computed: {
    ...mapState('ui', [
      'showOverview'
    ])
  },
  filters: {
    formatDate: function (timestamp) {
      return date.formatDate(timestamp, 'D.MM.YYYY')
    },
    listEditors (editorsList) {
      let editors = ''
      editorsList.forEach(editor => {
        editors += editor.name + ', '
      })
      editors = editors.substring(0, editors.length - 2)
      return editors
    }
  },
  mounted: function () {
    this.getPacket(this.packetId)
    document.addEventListener('keyup', this.keyboardNavigation)
  },
  destroyed: function () {
    this.setFooter({
      id: '',
      type: '',
      message: ''
    })
    document.removeEventListener('keyup', this.keyboardNavigation)
  }
}
</script>

<style>
.linebreaks {
  overflow-wrap: break-word; /* For browsers that don't support 'anywhere' */
  overflow-wrap: anywhere;
  white-space: pre-line;
}
</style>
