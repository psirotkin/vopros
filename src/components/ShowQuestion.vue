<template>
  <div>
    <q-list
      v-if="!showAnswer"
      >
      <q-item>
        <q-item-label class="q-mt-sm q-ml-none">{{ tour.title }}, вопрос {{ question.number }}</q-item-label>
      </q-item>
      <q-item>
        <q-item-section v-if="question.questionImage">
          <q-item-label>{{ beforeQuestionImage }}</q-item-label>
          <q-item-label><img :src="questionImageUrl" draggable="false" contain /></q-item-label>
          <q-item-label>{{ afterQuestionImage }}</q-item-label>
        </q-item-section>
        <q-item-section v-else>
          <q-item>{{ question.question }}</q-item>
        </q-item-section>
      </q-item>
      <!-- <q-item class="row">
        <div class="col"></div>
        <q-btn @click="startOrStopTimer()" class="col-6 bg-primary">время</q-btn>
        <div class="col"></div>
      </q-item> -->
    </q-list>
    <q-list
      v-else>
      <q-item-label class="q-pa-sm">{{ tour.title }}, вопрос {{ question.number }}</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label overline>Ответ:</q-item-label>
          <q-item-label>{{ question.answer }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="question.passCriteria">
        <q-item-section>
          <q-item-label overline>Зачёт:</q-item-label>
          <q-item-label>{{ question.passCriteria }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="question.comments">
        <q-item-section>
          <q-item-label overline>Комментарий:</q-item-label>
          <q-item-label v-if="question.commentsImage">{{ beforeCommentsImage }}
            <img :src="commentsImageUrl" draggable="false" />
            {{ afterCommentsImage }}
          </q-item-label>
          <q-item-label v-else>{{ question.comments }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="question.sources">
        <q-item-section>
          <q-item-label overline>Источники:</q-item-label>
          <q-item-label v-html="sourcesParsed"></q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="question.authors">
        <q-item-section>
          <q-item-label overline>Автор(ы):</q-item-label>
          <q-item-label>{{ question.authors }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <q-footer>
      <q-toolbar class="row q-ma-sm">
        <div class="col"></div>
        <div class="col-2" v-if="!showAnswer && !timerOn && (timer === 60)">
          <q-btn round :color="outlineColor" :text-color="backgroundColor" size="lg" icon="timer" @click="startOrStopTimer()" />
        </div>
        <div
          v-else-if="!showAnswer && (timerOn || (timer < 60))"
          class="col-2">
          <q-btn
            round
            @click="startOrStopTimer()"
            >
            <q-circular-progress
              v-touch-hold.mouse.stop="clearTimer"
              show-value
              class="text-black hoverable"
              to=""
              :value="timer"
              :min="0"
              :max="60"
              size="57px"
              :thickness="0.1"
              font-size="30px"
              :center-color="(timerOn || (timer <= 0)) ? timerColor : 'blue-grey-3'"
              color="black"
              reverse
            />
          </q-btn>
        </div>
        <div
          v-else
          class="col-md-2 col-xs-6">
          <q-btn
            round
            color="green"
            :outline="userQuestion.solved !=='right'"
            size="lg"
            icon="check"
            class="q-mr-xs"
            @click="toggleRightAnswer()" />
          <q-btn
            round
            color="red"
            :outline="userQuestion.solved !=='wrong'"
            size="lg"
            icon="cancel"
            class="q-ml-xs"
            @click="toggleWrongAnswer()" />
        </div>
        <div class="col-2"></div>
        <div class="col-2" v-if="!showAnswer">
          <q-btn
            round
            color="black"
            outline
            size="lg"
            icon="announcement"
            @click="changeShowAnswer()" />
        </div>
        <div class="col-2" v-else>
          <q-btn
            round
            color="black"
            outline
            size="lg"
            icon="contact_support"
            @click="changeShowAnswer()" />
        </div>
        <div class="col"></div>
      </q-toolbar>
    </q-footer>
  </div>
</template>

<script>

import storeMixins from '@/mixins/storeMixins'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'ShowQuestion',
  mixins: [storeMixins],
  data: function () {
    return {
      packetId: this.$route.params.packet,
      timerColor: 'primary',
      outlineColor: 'primary',
      backgroundColor: 'black',
      urlRegex: /(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#](?:\S*[^\s!"'()*,-.:;<>?[\]_`{|}~]|))?/ig // https://gist.github.com/dperini/729294#gistcomment-2617741
    }
  },
  methods: {
    startOrStopTimer () {
      if (this.timerOn) {
        clearInterval(this.interval) // If timer is on, stop it
        this.changeTimerStatus()
      } else {
        if (this.timer > 0) {
          this.changeTimerStatus()
          this.interval = setInterval(() => {
            this.decrementTimer()
            if (this.timer <= 0) {
              this.timerColor = 'red'
              clearInterval(this.interval) // If timer is on, stop it
              navigator.vibrate(500)
              if (this.settings.soundOn) this.beep(10, 520, 500)
              this.changeTimerStatus()
            } else if (this.timer === 10) {
              this.timerColor = 'yellow'
              if (this.settings.soundOn) this.beep(10, 520, 200)
              navigator.vibrate(200)
            }
          }, 1000)
        }
      }
    },
    changeShowAnswer () {
      this.setShowAnswer(!this.showAnswer)
      if (this.showAnswer) {
        this.setUserPacketPlayed(this.packet.id)
        if ((this.tour.id === this.packet.tourIds[this.packet.tourIds.length - 1]) &&
        (this.question.id === this.tour.questionIds[this.tour.questionIds.length - 1])) {
          const userPacketAttribute = {
            id: this.packet.id,
            attribute: 'finishedAt',
            value: Date.now()
          }
          this.setUserPacketAttribute(userPacketAttribute)
        }
      }
      this.clearTimer()
    },
    toggleRightAnswer () {
      let attribute = {}
      if (this.userQuestion.solved === 'right') {
        attribute = {
          id: this.question.id,
          attribute: 'solved',
          value: null
        }
      } else {
        attribute = {
          id: this.question.id,
          attribute: 'solved',
          value: 'right'
        }
      }
      this.setUserQuestionAttribute(attribute)
    },
    toggleWrongAnswer () {
      let attribute = {}
      if (this.userQuestion.solved === 'wrong') {
        attribute = {
          id: this.question.id,
          attribute: 'solved',
          value: null
        }
      } else {
        attribute = {
          id: this.question.id,
          attribute: 'solved',
          value: 'wrong'
        }
      }
      this.setUserQuestionAttribute(attribute)
    },
    clearTimer () {
      clearInterval(this.interval)
      this.timerColor = 'primary'
      this.resetTimer()
    },
    beep (vol, freq, duration) {
      const audio = new AudioContext()
      const v = audio.createOscillator()
      const u = audio.createGain()
      v.connect(u)
      v.frequency.value = freq
      v.type = 'square'
      u.connect(audio.destination)
      u.gain.value = vol * 0.01
      v.start(audio.currentTime)
      v.stop(audio.currentTime + duration * 0.001)
    },
    ...mapActions('ui', [
      'setShowAnswer',
      'changeTimerStatus',
      'decrementTimer',
      'resetTimer'
    ]),
    ...mapActions('userPackets', [
      'setUserPacketPlayed',
      'setUserPacketAttribute'
    ]),
    ...mapActions('userQuestions', [
      'setUserQuestionAttribute'
    ])
  },
  computed: {
    beforeQuestionImage () {
      return this.question.question.split('@image@')[0]
    },
    afterQuestionImage () {
      return this.question.question.split('@image@')[1]
    },
    questionImageUrl () {
      return URL.createObjectURL(this.question.questionImage)
    },
    sourcesParsed () {
      return this.question.sources.replace(this.urlRegex, '<a href="$&" rel="external" target="_system">$&</a>')
    },
    beforeCommentsImage () {
      return this.question.comments.split('@image@')[0]
    },
    afterCommentsImage () {
      return this.question.comments.split('@image@')[1]
    },
    commentsImageUrl () {
      return URL.createObjectURL(this.question.commentsImage)
    },
    ...mapState('ui', ['showAnswer', 'timer', 'timerOn', 'settings'])
  },
  watch: {
    question: function () {
      this.clearTimer()
    }
  },
  created () {
    setInterval(() => {
      if (this.outlineColor === 'primary') {
        this.outlineColor = 'black'
        this.backgroundColor = 'primary'
      } else {
        this.outlineColor = 'primary'
        this.backgroundColor = 'black'
      }
    }, 2000)
  },
  beforeDestroy: function () {
    clearInterval(this.interval)
    this.setShowAnswer(false)
  }
}
</script>

<style>
img {
  max-width: 100%;
}

.overlay {
  position: fixed; /* Sit on top of the page content */
  /* display: none; Hidden by default */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.9;
  /* background-color: rgba(0,0,0,0.0); Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
}
</style>
