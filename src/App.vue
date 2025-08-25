<script>
import { createApp } from 'vue';
const app = createApp({});
export default {
  onLaunch: function() {
    uni.getSystemInfo({
      success: function(e) {
        // #ifndef MP
        app.config.globalProperties.StatusBar = e.statusBarHeight;
        if (e.platform == 'android') {
          app.config.globalProperties.CustomBar = e.statusBarHeight + 50;
        } else {
          app.config.globalProperties.CustomBar = e.statusBarHeight + 45;
        };
        // #endif
      }
    })
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/*每个页面公共css */
@import "components/colorui/main.css";
@import "components/colorui/icon.css";
</style>