<template>
    <div class="container">
        <!-- 用户头像 -->
        <div class="avatar-box">
            <img class="avatar" src="/avatar.png" alt="User Avatar" />
        </div>

        <!-- 联系方式 -->
        <div class="contact-icons">
            <div v-for="(item, index) in contacts" :key="index" class="icon-wrapper"
                @click="copyToClipboard(item.value)">
                <VPButton  :icon="item.icon" :text="item.label"></VPButton>
                <div class="tooltip">{{ item.value }}</div>
            </div>
        </div>

        <div class="skills">
            <h3>✨ 技能掌握 ✨</h3>
            <ul>
                <li v-for="(skill, index) in skills" :key="index" class="skill-item">
                    <span class="skill-name">{{ skill.name }}：</span>
                    <div class="skill-bar">
                        <div class="skill-fill" :style="{ width: skill.level + '%' }"></div>
                    </div>
                </li>
            </ul>
        </div>

        <!-- 一言滚动 -->
        <div class="hitokoto-container">
            <p class="hitokoto-text">{{ hitokoto.hitokoto }}</p>
            <p class="hitokoto-author"> --- {{ hitokoto.from }}</p>
        </div>

        <!-- 复制成功提示 -->
        <div v-show="showToast" class="toast">
            {{ toastMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted } from 'vue'
import { ThemeHomeConfigBase } from 'vuepress-theme-plume';
import { VPButton } from 'vuepress-theme-plume/client';

const props = defineProps<ThemeHomeConfigBase & {
    // 组件 props, frontmatter 中的属性将会传递给组件
    hitokoto: {
        url: string,
        type: string,
    },
    skills: [
        {
            name: string,
            level: number
        }
    ],
    contacts: [
        {
            icon: string,
            label: string,
            value: string
        }
    ]
}>()

const hitokoto = ref<any>({
    hitokoto: '踮起脚尖，看得更远',
    from: 'Mr.Liu',
})

const changeQuote = () => {
    axios.get(props.hitokoto.url, {
        params: {
            c: props.hitokoto.type
        }
    })
        .then(response => {
            hitokoto.value = response.data
        })
        .catch(err => {
            hitokoto.value = {
                hitokoto: '踮起脚尖，看得更远',
                from: 'Mr.Liu'
            }
        })
}

onMounted(() => {
    changeQuote()
    setInterval(changeQuote, 10000) // 每 10 秒切换一句
})

const showToast = ref(false)
const toastMessage = ref('')

const copyToClipboard = (text: string) => {

    navigator.clipboard.writeText(text).then(() => {
        toastMessage.value = `已复制：${text}`
        showToast.value = true
        setTimeout(() => {
            showToast.value = false
        }, 2000)
    }).catch(err => {
        console.error('复制失败', err)
    })
}
</script>

<style scoped>
/* 容器 */
.container {
    min-height: calc(100vh - var(--vp-nav-height) - var(--vp-footer-height));
    padding: 24px 16px 40px;
    padding-top: 100px;
    font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
    box-sizing: border-box;
    text-align: center;
}

/* 头像 */
.avatar-box {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 36px;
}

.avatar {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ffc66e;
    box-shadow: 0 0 16px rgba(255, 193, 111, 0.5);
    transition: transform 0.3s ease;
}

.avatar:hover {
    transform: scale(1.05);
}

/* 联系方式 */
.contact-icons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 36px;
}

.icon-wrapper {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.icon-wrapper:hover {
    transform: scale(1.15);
}

.icon {
    font-size: 24px;
    color: #ffa94d;
}

.tooltip {
    position: absolute;
    top: -34px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff4e0;
    color: #d9822b;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 13px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    box-shadow: 0 2px 8px rgba(255, 167, 38, 0.25);
}

.icon-wrapper:hover .tooltip {
    opacity: 1;
}

/* 技能 */
.skills {
    margin-bottom: 48px;
}

.skills h3 {
    margin-bottom: 20px;
    font-size: 20px;
    color: #e78c3b;
}

.skills ul {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 500px;
}

.skill-item {
    display: flex;
    align-items: center;
}

.skill-name {
    width: 110px;
    font-size: 15px;
    font-weight: 500;
    text-align: left;
    color: #d87a24;
    margin-right: 14px;
}

.skill-bar {
    flex: 1;
    height: 14px;
    background: #ffe4b3;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: inset 0 0 4px rgba(255, 140, 0, 0.2);
}

.skill-fill {
    height: 100%;
    background: linear-gradient(90deg, #f9a825, #f57f17);
    transition: width 1s ease-in-out;
    border-radius: 8px 0 0 8px;
}

/* 一言样式 */
.hitokoto-container {
    margin-top: 48px;
    padding: 24px 20px;
    background: #fff8ef;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(255, 192, 203, 0.2);
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
    transition: all 0.3s ease-in-out;
}

.hitokoto-text {
    font-size: 18px;
    font-style: italic;
    color: #ff934f;
    margin-bottom: 8px;
    line-height: 1.6;
    word-break: break-word;
}

.hitokoto-author {
    font-size: 14px;
    color: #999;
    text-align: right;
}

/* 复制提示 */
.toast {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: #ffa94d;
    box-shadow: 0 4px 12px rgba(255, 170, 0, 0.3);
    color: white;
    padding: 10px 20px;
    border-radius: 16px;
    font-weight: 500;
    opacity: 1;
    pointer-events: none;
}

/* 响应式优化 */
@media (max-width: 480px) {
    .skill-name {
        width: 90px;
        font-size: 14px;
    }

    .hitokoto-text {
        font-size: 16px;
    }

    .hitokoto-author {
        font-size: 12px;
    }

    .contact-icons {
        gap: 16px;
    }
}
</style>
