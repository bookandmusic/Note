import { defineNoteConfig } from 'vuepress-theme-plume'

export const linuxNote = defineNoteConfig({
    dir: 'tools/linux/',
    link: '/linux/',
    sidebar: [
        {
            text: '常用命令',
            icon: 'clarity:command-line',
            dir: "01-command",
            items: [
                "01-资源分析",
                "02-压缩和解压缩",
                "03-文本处理",
                "04-网络传输",
                "05-iptables详解",
            ],
        },
        {
            text: '服务管理',
            icon: 'fluent-mdl2:processing-run',
            dir: "02-service",
            items: [
                "01-service",
                "02-systemctl",
                "03-supervisor",
            ],
        },
        {
            text: '资源管理',
            icon: 'clarity:resource-pool-line',
            dir: "03-resource",
            items: [
                "01-内核资源控制之cgroups",
                "02-磁盘管理之quota",
                "03-磁盘管理之LVM",
                "04-磁盘管理之RAID",
            ],
        },
    ],
})


export const gitNote = defineNoteConfig({
    dir: 'tools',
    link: '/git/',
    sidebar: [
        {
            text: 'Git',
            icon: 'teenyicons:git-outline',
            dir: "git",
            items: [
                "01-Git常用操作",
                "02-Git仓库密钥配置",
            ],
        },
    ],
})


export const nginxNote = defineNoteConfig({
    dir: 'tools',
    link: '/nginx/',
    sidebar: [
        {
            text: 'Nginx',
            icon: 'nonicons:nginx-16',
            dir: "nginx",
            items: [
                "01-相关概念",
                "02-Nginx上手",
            ],
        },
    ],
})


export const ansibleNote = defineNoteConfig({
    dir: 'tools',
    link: '/ansible/',
    sidebar: [
        {
            text: 'Ansible',
            icon: 'tabler:brand-ansible',
            dir: "ansible",
            items: [
                "01-Ansible入门",
                "02-Ansible变量",
                "03-Playbook详解",
                "04-Ansible模块",
                "05-stdoutCallback插件",
            ],
        },
    ],
})


export const dockerNote = defineNoteConfig({
    dir: 'tools',
    link: '/docker/',
    sidebar: [
        {
            text: 'Docker',
            icon: 'mdi:docker',
            dir: "docker",
            items: [
                "01-Docker介绍",
                "02-部署环境",
                "03-配置网络代理",
                "04-常用操作",
                "05-镜像介绍",
                "06-镜像构建",
                "07-manifest构建多平台镜像",
                "08-buildx构建多平台镜像",
                "09-Docker网络",
                "10-Docker Compose",
                "11-镜像仓库",
                "12-容器监控",
                "13-管理界面之Portainer",
            ],
        },
    ],
})


export const kubernetesNote = defineNoteConfig({
    dir: 'tools',
    link: '/kubernetes/',
    sidebar: [
        {
            text: 'Kubernetes',
            icon: 'mdi:kubernetes',
            dir: "kubernetes",
            items: [
                "01-Kubernets介绍",
                "02-部署集群之Minikube",
                "03-部署集群之kubeadm",
                "04-资源管理",
                "05-实战入门",
                "06-Pod详解",
                "07-Pod控制器介绍",
                "08-Service详解",
                "09-数据存储",
                "10-安全认证",
                "11-DashBoard",
            ],
        },
    ],
})