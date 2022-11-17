import { mapGetters } from 'vuex'

export default {
  data () {
    return {

    }
  },
  computed: {
    ...mapGetters('userPackets', [
      'readUserPacket'
    ]),
    ...mapGetters('userTours', [
      'readUserTour'
    ]),
    ...mapGetters('userQuestions', [
      'readUserQuestion'
    ]),
    ...mapGetters('packets', [
      'readPacket'
    ]),
    ...mapGetters('tours', [
      'readTour'
    ]),
    ...mapGetters('questions', [
      'readQuestion'
    ]),
    userPacket () {
      return (this.readUserPacket(this.packetId) || {})
    },
    userTour () {
      return this.readUserTour((this.packet.tourIds || {})[this.userPacket.currentTourIndex])
    },
    userQuestion () {
      return this.readUserQuestion((this.tour.questionIds || {})[this.userTour.currentQuestionIndex])
    },
    packet () {
      return (this.readPacket(this.packetId) || {})
    },
    tour () {
      return this.readTour((this.packet.tourIds || {})[this.userPacket.currentTourIndex])
    },
    question () {
      return this.userTour && this.readQuestion((this.tour.questionIds || {})[this.userTour.currentQuestionIndex])
    }
  }
}
