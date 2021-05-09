import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: () => import('@/views/home.vue'),
    redirect: '/compress',
    children: [
      {
        path: 'compress',
        name: 'Compress',
        component: () => import('@/views/compress.vue'),
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue')
  },
  {
    path: '/404',
    component: () => import('@/views/404.vue')
  },
  {
    path: '*',
    redirect: '/404',
  }
]

const router = new VueRouter({
  routes
})

export default router
