import { defineNavbarConfig } from 'vuepress-theme-plume'

export const navbar = defineNavbarConfig([
  { text: '首页', link: '/', icon: "meteor-icons:home" },
  { text: '博客', link: '/blog/', icon: "meteor-icons:blogger" },
  { text: '标签', link: '/blog/tags/', icon: "meteor-icons:tag" },
  { text: '分类', link: '/blog/categories/', icon: "meteor-icons:folder" },
  { text: '归档', link: '/blog/archives/', icon: "clarity:timeline-line" },
  { text: '笔记', link: '/notes/', icon: "meteor-icons:book" },
])
