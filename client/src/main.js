import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import moment from 'moment'
require('./assets/main.scss')

Vue.config.productionTip = false

// filters
Vue.filter('formatDate', function (value) {
  return moment(value, 'DD/MMM/YYYY:HH:mm:ss Z').format("YYYY-MM-DD HH:mm:ss A")
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
