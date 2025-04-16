<script setup lang="ts">
import type { ThemeHomeConfigBase } from 'vuepress-theme-plume'
import { VPHomeBox } from 'vuepress-theme-plume/client'
import axios from 'axios'
import { onMounted, ref } from 'vue';

const props = defineProps<ThemeHomeConfigBase & {
  // 组件 props, frontmatter 中的属性将会传递给组件
  hitokoto: {
    url: string,
    type: string,
  }
}>()
const hitokoto = ref<any>({
  hitokoto: '踮起脚尖，看得更远',
  from: 'Mr.Liu',
  type: '',
  from_who: '',
  creator: '',
  creator_uid: 0,
  reviewer: 0,
  commit_from: '',
  created_at: '',
  length: 0,
  id: 0,
  uuid: '',
  server_time: 0
})
const loading = ref(true)
const error = ref<Error | null>(null)

onMounted(() => {
  // 获取一言数据，拼接参数
  axios.get(props.hitokoto.url, {
    params: {
      c: props.hitokoto.type
    }
  })
    .then(response => {
      hitokoto.value = response.data
    })
    .catch(err => {
      error.value = err
    })
    .finally(() => {
      loading.value = false
    })
})
</script>

<template>
  <VPHomeBox :type="type" :background-image="backgroundImage" :background-attachment="backgroundAttachment"
    :full="false">
      <div class="hitokoto-container">
        <p class="hitokoto-text">{{ hitokoto.hitokoto }}</p>
        <p class="hitokoto-author"> --- {{ hitokoto.from }}</p>
      </div>
    <!-- 自定义你的内容 -->

  </VPHomeBox>
</template>

<style scoped>
.vp-home-box {
  height: calc(100vh - var(--vp-nav-height) - var(--vp-footer-height));
}

/* 一言容器 */
.hitokoto-container {
  /* 水平左对齐 */
  height: calc(100vh - var(--vp-nav-height) - var(--vp-footer-height) - 100px);
  padding: 20px;
  /* 适当的内边距 */
  box-sizing: border-box;
  /* 确保内边距不影响布局 */
}

/* 一言文本 */
.hitokoto-text {
  font-size: 1.5rem;
  line-height: normal;
  font-weight: bold;
  color: #ec9d09;
  /* 设置字体颜色 */
  padding: 20px;
  /* 与作者之间的间距 */
  height: auto;
}

/* 作者 */
.hitokoto-author {
  height: auto;
  line-height: normal;
  font-size: 1rem;
  color: #b98a32;
  /* 设置作者文字颜色 */
}
</style>