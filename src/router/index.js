import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'PacketList',
    component: () => import(/* webpackChunkName: "PacketList" */ '../views/PacketList.vue')
  },
  {
    path: '/packet/:packet',
    name: 'Packet',
    component: () => import(/* webpackChunkName: "Packet" */ '../views/Packet.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "Settings" */ '../views/Settings.vue')
  },
  {
    path: '/information',
    name: 'Information',
    component: () => import(/* webpackChunkName: "Settings" */ '../views/Information.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
