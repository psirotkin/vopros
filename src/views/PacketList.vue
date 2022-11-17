<template>
  <q-page>
    <div
      v-if="lastPackets[0]"
      class="row justify-end bg-blue-grey-3"
      >
      <!-- <div class="col">
        <span class="vertical-middle">Последний турнир:</span>
      </div> -->
      <q-btn-dropdown
        no-caps
        label="Вы играли..."
        icon="restore"
        ripple
        class="col"
        size="1.1em"
      >
        <q-list
          separator
        >
          <q-item
            clickable
            v-close-popup
            v-for="packet in lastPackets"
            :key='packet.id'
            :to='"packet/" + packet.id'
            class="bg-blue-grey-3 q-py-md inset-shadow"
            >
            <q-item-section>
              {{ packet.title }}
            </q-item-section>
            <q-item-section side class="text-black">
              {{ packet.lastPlayedAt | formatDate }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
    <q-infinite-scroll
      v-if="packets && packetsLength >= packetBatchSize"
      @load="loadMorePackets" >
      <q-list
        bordered
        separator>
        <q-item
          clickable
          hoverable
          class="inset-shadow"
          v-ripple
          v-for='packet
          in
          packets'
          :key='packet.id'
          :to='"packet/" + packet.id'
          >
          <q-item-section>
            <q-item-label>
              {{ packet.title }}
              <q-icon
                v-if="packet.tourIds"
                name="save_alt"
                outline
                class="float-right text-positive"
                />
              <q-icon
                v-if="finishedPackets.includes(packet.id)"
                name="done_outline"
                outline
                class="float-right text-positive"
                />
            </q-item-label>
            <q-item-label caption v-if="packet.editorIds" class="nowrap">{{ packet.editorIds.join(', ') }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
    <q-footer :class="{ 'bg-warning': footer.type === 'error' }">
      <q-toolbar class="row q-ma-sm text-black text-h5 items-center justify-center">
        <div v-if="footer.id === 'fetching'">
          Загружаю пакеты...
          <q-spinner-hourglass
            color="black"
          />
        </div>
        <div v-else-if="footer.id === 'fetched'">
          Новые пакеты загружены.
        </div>
        <div v-else-if="footer.type === 'error'">
          {{ footer.message }}
        </div>
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script>
import { getRecentPackets } from '@/libraries/dbChgkInfoApi'
import { mapActions, mapGetters, mapState } from 'vuex'
import { getObjectFromDexie, getPacketsFromDexie, getRecentPacketsFromDexie } from '@/libraries/dexie'
import { date } from 'quasar'

export default {
  name: 'PacketList',
  data () {
    return {
      packetBatchSize: 40,
      batchesDisplayed: 0,
      lastPackets: []
    }
  },
  methods: {
    loadMorePackets (offset, done) {
      this.getPackets(this.packetBatchSize, offset)
        .then(response => {
          // this.batchesDisplayed++
          done()
        })
    },
    getPackets (packetsToGet, offset) {
      return new Promise((resolve, reject) => {
        getPacketsFromDexie(packetsToGet, offset * packetsToGet) // Get default number of packets from local DB, sorted by update time
          .then(dexiePackets => {
            let fetchSuccessful = false
            if (dexiePackets.length > 0) {
              dexiePackets.forEach(dexiePacket => this.setPacket(dexiePacket)) // If there are packets in local DB, write them to vuex
              fetchSuccessful = true
            }
            if (offset === 0 & fetchSuccessful) { // If we need to check for updates
              // console.log('Last update in local DB: ', updatedAt)
              this.fetchNextBatchFromApi(packetsToGet, offset)
                .then(importedUntilPreviousImport => {
                  resolve(importedUntilPreviousImport)
                })
                .catch(err => {
                  fetchSuccessful = false
                  reject(err)
                })
            } else if (dexiePackets.length < packetsToGet) { // If not enough packages in local DB
              // console.log('Getting packets from API, offset: ', offset)
              this.getPacketsFromApi(packetsToGet, offset)
                .then(importedUntilPreviousImport => {
                  resolve(importedUntilPreviousImport)
                })
                .catch(err => {
                  fetchSuccessful = false
                  reject(err)
                })
            } else {
              if (fetchSuccessful) {
                resolve(true)
              } else {
                reject(new Error('Could not fetch packets.'))
              }
            }
          })
          .catch(err => {
            reject(err)
          })
      })
    },
    fetchNextBatchFromApi (packetsToGet, offset) {
      return new Promise((resolve, reject) => {
        // console.log('Fetching from API with offset: ', offset)
        this.getPacketsFromApi(packetsToGet, offset)
          .then(importedUntilPreviousImport => {
            // console.log('Imported until previous import: ', importedUntilPreviousImport)
            if (importedUntilPreviousImport === true) resolve(importedUntilPreviousImport) // If we got all the way to the last packet in local storage
            else {
              offset++
              // console.log('Starting next, offset: ', offset)
              this.fetchNextBatchFromApi(packetsToGet, offset)
            }
          })
          .catch(err => {
            reject(err)
          })
      })
    },
    getPacketsFromApi (packetsToGet, offset) {
      this.setFooter({
        id: 'fetching',
        type: 'ok',
        message: ''
      })
      return new Promise((resolve, reject) => {
        getRecentPackets(packetsToGet, offset + 1)
          .then(packets => {
            let importedUntilPreviousImport = false
            if (!Array.isArray(packets)) {
              this.setFooter({
                id: 'failed',
                type: 'error',
                message: 'Не удалось загрузить новые пакеты :('
              })
              reject(new Error(false))
            }
            packets.forEach(packet => {
              if (!this.readPacket(packet.id)) { // If packet is not in vuex memory
                getObjectFromDexie('packets', packet.id)
                  .then(dexiePacket => {
                    if (dexiePacket) this.setPacket(dexiePacket) // If a packet is recieved from local DB, store it into vuex
                    else { // Import packet from db.chgk.info
                      // console.log('Importing packet from db.chgk.ingo: ', packet.id)
                      this.importPacket(packet)
                    }
                  })
              } else {
                importedUntilPreviousImport = true
              }
            })
            this.setFooter({
              id: 'fetched',
              type: 'ok',
              message: 'Новые пакеты загружены.'
            })
            resolve(importedUntilPreviousImport)
          })
          .catch(err => {
            console.error('Error fetching packets: ', err.message)
            if (err.message === 'NetworkError when attempting to fetch resource.') alert('Не могу связаться с базой вопросов.\nВозможно, Вы не в интернете?')
            this.setFooter({
              id: 'failed',
              type: 'error',
              message: 'Не удалось загрузить новые пакеты :('
            })
            reject(err)
          })
      })
    },
    ...mapActions('ui', [
      'setTitle',
      'setFooter'
    ]),
    ...mapActions('packets', [
      'importPacket',
      'setPacket'
    ])
  },
  created () {
    if (this.packetsLength < this.packetBatchSize) {
      this.getPackets(this.packetBatchSize, 0)
        .then(updatedAt => {
          this.batchesDisplayed++
        })
        .catch(err => console.error(err))
    }
    this.setTitle('Пакетики')
    getRecentPacketsFromDexie()
      .then(lastPackets => {
        this.lastPackets = lastPackets
      })
  },
  filters: {
    formatDate: function (timestamp) {
      const dateDiff = date.getDateDiff(Date.now(), timestamp, 'days')
      if (dateDiff === 0) return 'сегодня'
      else if (dateDiff === 1) return 'вчера'
      else return date.formatDate(timestamp, 'D.MM.YYYY')
    }
  },
  computed: {
    ...mapGetters('packets', [
      'packets',
      'readPacket'
    ]),
    ...mapGetters('userPackets', [
      'finishedPackets'
    ]),
    ...mapState('ui', [
      'footer'
    ]),
    packetsLength: function () {
      return (this.packets.length)
    }
  }
}
</script>

<style>
.nowrap {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
