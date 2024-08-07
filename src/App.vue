<script setup>
import { computed, nextTick, onMounted, reactive, ref, toRaw } from "vue";
import Artplayer from "./components/Artplayer.vue";
import MonacoEditor from "./components/MonacoEditor.vue";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import { layer } from "@layui/layer-vue";
import flvjs from "flv.js";
import Hls from "hls.js";
import { setStore, getStore } from './utils/store'
import { debounce } from './utils/index'

const urlSearchParams = new URLSearchParams(window.location.search);
let art = undefined;
let monaco = undefined;
const labelPosition = ref("right");
const dmFormat = ref(1);
// 表单实例
const layFormRef = ref(null);
const tab = ref('2')
const monacoValue = ref(getStore({name: 'playList'}) ?? '');
const playList = computed(() => {
  try {
    if (!monacoValue.value) {
      return []
    }
    const content = JSON.parse(monacoValue.value);
    debounce(() => {
      setStore({ name: 'playList', content: monacoValue.value})
    }, 1000)();
    return content
  } catch (error) {
    console.error(error)
  }
  return []
})
const playListLabelMap = computed(() => {
  const map = {};
  for (const item of playList.value) {
    map[item.label] = item;
  }
  return map;
})

const model = reactive({
  videoUrl: urlSearchParams.get("vUrl") || localStorage.getItem("videoUrl"),
  dmUrl: urlSearchParams.get("dmUrl") || localStorage.getItem("dmUrl"),
});
const playListModel = ref();

function playFlv(video, url, art) {
  if (flvjs.isSupported()) {
    const flv = flvjs.createPlayer({ type: "flv", url });
    flv.attachMediaElement(video);
    flv.load();

    // optional
    art.flv = flv;
    art.once("url", () => flv.destroy());
    art.once("destroy", () => flv.destroy());
  } else {
    art.notice.show = "Unsupported playback format: flv";
  }
}

function playM3u8(video, url, art) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);

    // optional
    art.hls = hls;
    art.once("url", () => hls.destroy());
    art.once("destroy", () => hls.destroy());
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
  } else {
    art.notice.show = "Unsupported playback format: m3u8";
  }
}

const option = {
  customType: {
    m3u8: playM3u8,
    flv: playFlv,
  },
  plugins: [],
};

const style = reactive({
  height: "550px",
});

function loadDm(danmuku) {
  const plugins = toRaw(art.plugins);
  if (plugins.artplayerPluginDanmuku) {
    plugins.artplayerPluginDanmuku.config({
      danmuku: danmuku,
    });
    plugins.artplayerPluginDanmuku.load();
    return;
  }
  plugins.add(
    artplayerPluginDanmuku({
      // 弹幕数组
      danmuku: danmuku,
      fontSize: 22,
      speed: 7,
      antiOverlap: true,
      synchronousPlayback: true, // 是否同步到播放速度
      margin: [10, "50%"],
      emitter: false, // 是否开启弹幕发射器
    })
  );
}

const play = function () {
  localStorage.setItem("videoUrl", model.videoUrl);
  // 识别视频类型
  if (model.videoUrl.endsWith(".mp4")) {
    art.type = "mp4";
  }
  if (model.videoUrl.endsWith(".flv")) {
    art.type = "flv";
  }
  setTimeout(() => {
    art.switchUrl(model.videoUrl);
    // art.url = model.videoUrl;
  }, 500);
  if (!model.dmUrl) {
    return false;
  }
  localStorage.setItem("dmUrl", model.dmUrl);
  if (model.dmUrl.endsWith(".xml")) {
    loadDm(model.dmUrl);
  } else {
    fetch(model.dmUrl)
      .then((res) => res.json())
      .then((json) => {
        switch (dmFormat.value) {
          case 1:
            loadDm(
              json.danmuku.map((item) => ({
                text: item[4],
                time: Number(item[0]),
                color: "#fff",
                border: false,
                mode: item[1] === "right" ? 0 : 1,
              }))
            );
            break;
        }
        // eval(monaco.getValue())
      })
      .catch((error) => {
        console.error("弹幕加载失败，url:", model.dmUrl, error);
        layer.notifiy({
          title: "弹幕获取失败",
          content: error.message,
          icon: 2,
        });
      });
  }
};

// 重置表单
const reset = function () {
  layFormRef.value.reset();
};

// 初始化播放器实例，绑定事件
function getArtInstance(instance) {
  art = instance;
  art.on("ready", () => {
    console.info(art.url);
    art.play();
  });
  art.on("restart", () => {
    console.info("restart");
    art.play();
  });
  art.on("url", (url) => {
    art.notice.show = "视频加载中......";
  });
  art.on("error", (error, reconnectTime) => {
    console.info(error, reconnectTime);
    art.notice.show = "加载失败：" + error + " 重连ing..." + reconnectTime;
  });
  art.on("artplayerPluginDanmuku:error", (error) => {
    layer.notifiy({
      title: "弹幕加载失败",
      content: error.message,
      icon: 2,
    });
  });
}

function getMonacoInstance(instance) {
  monaco = instance;
}

const handlePlayListChange = value => {
  model.videoUrl = playListLabelMap.value[value].url
  model.dmUrl = playListLabelMap.value[value].dmUrl
  nextTick(() => {
    play()
  })
}
</script>

<template>
  <lay-notice-bar leftIcon="layui-icon-mute" rightIcon="layui-icon-close"
    text="支持在线播放mp4、flv、m3u8等主流格式视频。支持在线弹幕，要求bilibili网站的xml格式" mode="closeable" background="#ecf5ff"></lay-notice-bar>
  <lay-container class="container">
    <lay-row>
      <lay-col md="24">
        <Artplayer @get-instance="getArtInstance" :option="option" :style="style" />
      </lay-col>
    </lay-row>
    <lay-row>
      <lay-col md="24">
        <lay-panel style="padding: 20px">
          <lay-tab v-model="tab">
            <lay-tab-item title="单集" id="1">
              <lay-form :model="model" ref="layFormRef" :pane="true">
                <lay-form-item label="播放链接" :label-position="labelPosition" prop="videoUrl">
                  <lay-input v-model="model.videoUrl" :allow-clear="true"></lay-input>
                </lay-form-item>
                <lay-form-item label="弹幕链接" :label-position="labelPosition" prop="dmUrl">
                  <lay-input v-model="model.dmUrl" :allow-clear="true"></lay-input>
                </lay-form-item>
                <lay-button type="normal" @click="play">播放</lay-button>
                <lay-button @click="reset">重置</lay-button>
              </lay-form>
            </lay-tab-item>
            <lay-tab-item title="专辑" id="2">
              <lay-select style="width: 100%;margin-bottom: 20px;" v-model="playListModel" @change="handlePlayListChange">
                  <lay-select-option v-for="(item, index) in playList" :key="index" :value="item.label"
                    :label="item.label"></lay-select-option>
                </lay-select>
                <MonacoEditor v-model="monacoValue" language="json" />
            </lay-tab-item>
          </lay-tab>
        </lay-panel>
      </lay-col>
    </lay-row>
    <lay-row>
      <lay-col md="24">
        <lay-panel style="padding: 20px">
          <lay-form-item label="弹幕转换" :label-position="labelPosition">
            <lay-select v-model="dmFormat" placeholder="弹幕转换">
              <lay-select-option :value="1" label="jplayer"></lay-select-option>
            </lay-select>
          </lay-form-item>
        </lay-panel>
        <!-- <MonacoEditor @get-instance="getMonacoInstance" /> -->
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
</style>
