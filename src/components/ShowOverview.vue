<template>
  <div>
    <div
      v-for="(tour, tourIndex) in tours"
      :key="tourIndex"
      class="q-ma-md"
      >
      {{ tour.title }}: {{ tour.right }} из {{ tour.right + tour.wrong }}
      <div class="q-mr-md">
        <q-btn
          v-for="(question, questionIndex) in tour.questions"
          :key="questionIndex"
          @click="goTo(tourIndex, tour.id, questionIndex)"
          round
          :outline="!question.solved"
          :color="(question.solved === 'right') ? 'positive' : 'negative' "
          :label="question.number"
          text-color="black"
          class="q-ma-xs"
          >
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script>

import storeMixins from '@/mixins/storeMixins'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ShowInfo',
  mixins: [storeMixins],
  data: function () {
    return {
      packetId: this.$route.params.packet
    }
  },
  methods: {
    goTo (tourIndex, tourId, questionIndex) {
      let attribute = {
        id: this.packetId,
        attribute: 'currentTourIndex',
        value: tourIndex
      }
      this.setUserPacketAttribute(attribute)
      attribute = {
        id: tourId,
        attribute: 'currentQuestionIndex',
        value: questionIndex
      }
      this.setUserTourAttribute(attribute)
      this.toggleOverview()
    },
    ...mapActions('ui', [
      'toggleOverview'
    ]),
    ...mapActions('userPackets', [
      'setUserPacketAttribute'
    ]),
    ...mapActions('userTours', [
      'setUserTourAttribute'
    ])
  },
  computed: {
    tours () {
      const tours = []
      this.packet.tourIds.forEach(tourId => {
        const tour = this.readTour(tourId)
        tour.questions = []
        tour.right = 0
        tour.wrong = 0
        tour.questionIds.forEach(questionId => {
          const question = this.readQuestion(questionId)
          const userQuestion = this.readUserQuestion(questionId)
          if (userQuestion.solved === 'right') {
            // question = { ...question, solved: 'right' }
            question.solved = 'right'
            tour.right++
          } else if (userQuestion.solved === 'wrong') {
            question.solved = 'wrong'
            tour.wrong++
          } else {
            question.solved = null
          }
          tour.questions.push(question)
        })
        tours.push(tour)
      })
      return tours
    },
    ...mapGetters('tours', ['readTour']),
    ...mapGetters('questions', ['readQuestion']),
    ...mapGetters('userQuestions', ['readUserQuestion'])
  },
  created () {
    // setInterval(() => {
    //   if (this.outlineColor === 'primary') {
    //     this.outlineColor = 'black'
    //     this.backgroundColor = 'primary'
    //   } else {
    //     this.outlineColor = 'primary'
    //     this.backgroundColor = 'black'
    //   }
    // }, 2000)
  }
}
</script>

<style>
</style>
