<template>
    <div ref="artRef"></div>
</template>
  
<script>
import Artplayer from "artplayer";

export default {
    data() {
        return {
            instance: null,
        };
    },
    props: {
        option: {
            type: Object,
            required: true,
        },
    },
    mounted() {
        this.instance = new Artplayer({
            ...this.option,
            container: this.$refs.artRef,
            id: "player",
            // url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            flip: true,
            playbackRate: true, // 倍速播放
            aspectRatio: true, // 视频比例
            screenshot: true, // 截图
            setting: true, // 设置齿轮
            pip: true, // 画中画
            fullscreen: true, // 窗口全屏
            fullscreenWeb: true, // 网页全屏
            miniProgressBar: true, // 迷你播放进度条
            moreVideoAttr: {
                'webkit-playsinline': true,
                playsInline: true,
            },
            lock: true,
            autoPlayback: true,
            autoOrientation: true,
            airplay: true,
            type: 'm3u8',
        });

        this.$nextTick(() => {
            this.$emit("get-instance", this.instance);
        });
    },
    beforeDestroy() {
        if (this.instance && this.instance.destroy) {
            this.instance.destroy(false);
        }
    },
};
</script>
  