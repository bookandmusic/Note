import { defineNotesConfig } from 'vuepress-theme-plume'
import {
  linuxNote,
  gitNote,
  nginxNote,
  ansibleNote,
  dockerNote,
  kubernetesNote
} from "./note/tools"


export const notes = defineNotesConfig({
  dir: 'notes',
  link: '/',
  notes: [
    linuxNote,
    gitNote,
    nginxNote,
    ansibleNote,
    dockerNote,
    kubernetesNote],
})
