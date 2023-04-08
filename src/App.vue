<script setup>
import { onMounted, reactive, ref } from "vue";
import Artplayer from "./components/Artplayer.vue";
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'


let art = undefined;
const visible = ref(true);
const labelPosition = ref('right');

const model = reactive({
  videoUrl: "http://vjs.zencdn.net/v/oceans.mp4",
  dmUrl: "https://comment.bilibili.com/1077805228.xml",
});

function playFlv(video, url, art) {
  if (flvjs.isSupported()) {
    const flv = flvjs.createPlayer({ type: 'flv', url });
    flv.attachMediaElement(video);
    flv.load();

    // optional
    art.flv = flv;
    art.once('url', () => flv.destroy());
    art.once('destroy', () => flv.destroy());
  } else {
    art.notice.show = 'Unsupported playback format: flv';
  }
}

function playM3u8(video, url, art) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);

    // optional
    art.hls = hls;
    art.once('url', () => hls.destroy());
    art.once('destroy', () => hls.destroy());
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  } else {
    art.notice.show = 'Unsupported playback format: m3u8';
  }
}

const option = reactive({
  customType: {
    m3u8: playM3u8,
    flv: playFlv,
  },
  plugins: [],
})

const style = reactive({
  height: '550px'
})

function loadDm(danmuku) {
  if (art.plugins.artplayerPluginDanmuku) {
    art.plugins.artplayerPluginDanmuku.config({
      danmuku: danmuku,
    });
    art.plugins.artplayerPluginDanmuku.load();
    return;
  }
  art.plugins.add(artplayerPluginDanmuku({
    // 弹幕数组
    danmuku: danmuku,
    speed: 3,
    antiOverlap: true,
    useWorker: true, // 是否使用 web worker
    synchronousPlayback: true, // 是否同步到播放速度
    margin: [0, "0%"],
  }))
}

const play = function () {
  // 识别视频类型
  if (model.videoUrl.endsWith('.mp4')) {
    art.type = 'mp4';
  }
  if (model.videoUrl.endsWith('.flv')) {
    art.type = 'flv';
  }
  art.url = model.videoUrl;
  if (!model.dmUrl) {
    return false;
  }
  if (model.dmUrl.endsWith('.xml')) {
    loadDm(model.dmUrl);
  } else {
    fetch(model.dmUrl, {
      method: 'GET',
      mode: 'no-cors'
    })
      .then(res => res.json())
      .then(json => {
        loadDm(window.transformDm(json));
      })
  }
};

function getArtInstance(instance) {
  art = instance;
  art.on('ready', () => {
    console.info(art.hls);
    art.play();
  });
  art.on('restart', () => {
    art.seek = 0;
    art.play();
  });
  art.on('url', (url) => {
    art.notice.show = '视频加载中......';
});
}

</script>

<template>
  <lay-notice-bar leftIcon="layui-icon-mute" rightIcon="layui-icon-close" text="事情总是会自动变化。顺其自然就好。" mode="closeable"
    background="#ecf5ff"></lay-notice-bar>
  <lay-container class="container">
    <lay-row>
      <lay-col md="24">
        <lay-panel>
          <Artplayer @get-instance="getArtInstance" :option="option" :style="style" />
        </lay-panel>
      </lay-col>
    </lay-row>
    <lay-row>
      <lay-col md="24">
        <lay-panel style="padding: 20px;">
          <lay-form :model="model">
            <lay-form-item label="播放链接" :label-position="labelPosition" prop="videoUrl">
              <lay-input v-model="model.videoUrl"></lay-input>
            </lay-form-item>
            <lay-form-item label="弹幕链接" :label-position="labelPosition" prop="dmUrl">
              <lay-input v-model="model.dmUrl"></lay-input>
            </lay-form-item>
            <lay-form-item>
              <lay-button type="normal" @click="play">播放</lay-button>
              <lay-button @click="reset">重置</lay-button>
            </lay-form-item>
          </lay-form>
        </lay-panel>
      </lay-col>
    </lay-row>
  </lay-container>
</template>

<style scoped>
.container {
  padding: 20px;
  margin-top: 20px;
  background-color: #fafafa !important;
  color: #5f5f5f !important;
}

.artplayer-app {
  /* width: 400px; */
  height: 550px;
  /* position: absolute; */
  /* top: 50px; */
  /* margin: auto; */
}

header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>