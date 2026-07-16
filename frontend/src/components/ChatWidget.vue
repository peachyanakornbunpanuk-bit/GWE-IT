<template>
  <div>
    <!-- Floating Button -->
    <q-btn
      v-if="!isOpen"
      round
      color="primary"
      icon="smart_toy"
      size="lg"
      class="shadow-10"
      v-touch-pan.prevent.mouse="handlePan"
      :style="{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        margin: '24px',
        zIndex: 2000,
        transform: `translate(${panX}px, ${panY}px) scale(1)`,
        transition: isPanning ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }"
      @mouseenter="!isPanning && ($event.currentTarget.style.transform=`translate(${panX}px, ${panY}px) scale(1.1)`)"
      @mouseleave="!isPanning && ($event.currentTarget.style.transform=`translate(${panX}px, ${panY}px) scale(1)`)"
      @click="openChat"
    >
      <q-badge color="red" floating rounded v-if="unread" class="text-bold shadow-2">1</q-badge>
    </q-btn>

    <!-- Chat Window -->
    <q-card
      v-else
      class="shadow-24 flex column"
      :style="{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '380px',
        height: '550px',
        zIndex: 2000,
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        transform: `translate(${panX}px, ${panY}px)`,
        transition: isPanning ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }"
    >
      <!-- Modern Header -->
      <q-card-section 
        v-touch-pan.prevent.mouse="handlePan"
        class="text-white row items-center justify-between q-py-md q-px-lg cursor-pointer" 
        style="background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%);"
      >
        <div class="text-h6 flex items-center text-weight-bold" style="letter-spacing: 0.5px;">
          <q-icon name="smart_toy" size="sm" class="q-mr-sm" /> IT Assistant
        </div>
        <q-btn icon="close" flat round dense @click="isOpen = false; panX = 0; panY = 0;" style="background: rgba(255,255,255,0.2); border-radius: 50%;" />
      </q-card-section>

      <q-card-section class="col overflow-auto q-pa-md bg-transparent" ref="chatScroll">
        <div v-for="(msg, index) in messages" :key="index" class="q-mb-md">
          <!-- AI Message -->
          <div v-if="msg.role === 'ai'" class="row items-start no-wrap q-mr-xl">
            <q-avatar size="sm" color="blue-1" text-color="primary" class="q-mr-sm shadow-1 q-mt-xs" icon="smart_toy" />
            <div class="q-pa-sm text-dark shadow-1" style="background: #F0F4F8; border-radius: 4px 16px 16px 16px; word-break: break-word; font-size: 14px; line-height: 1.4;">
              {{ msg.text }}
            </div>
          </div>
          <!-- User Message -->
          <div v-else class="row items-start justify-end no-wrap q-ml-xl">
            <div class="bg-primary text-white q-pa-sm shadow-2" style="border-radius: 16px 4px 16px 16px; word-break: break-word; font-size: 14px; line-height: 1.4;">
              {{ msg.text }}
            </div>
          </div>
        </div>
        
        <div v-if="isLoading" class="row items-center q-mt-sm">
          <q-spinner-dots color="primary" size="2em" />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Bottom Input Area -->
      <div class="q-pa-md" style="background: rgba(255,255,255,0.8); border-top: 1px solid rgba(0,0,0,0.05);">
        <!-- Quick Replies -->
        <div v-if="messages.length === 1" class="row q-mb-sm q-gutter-x-sm no-wrap" style="overflow-x: auto; padding-bottom: 8px; scrollbar-width: none;">
          <q-chip 
            v-for="reply in quickReplies" 
            :key="reply"
            clickable 
            @click="sendQuickReply(reply)"
            color="white" 
            text-color="primary"
            size="sm"
            class="cursor-pointer shadow-1 text-weight-medium"
            style="border: 1px solid #E0E0E0; transition: all 0.2s ease;"
            @mouseenter="$event.currentTarget.style.background='#F5F5F5'"
            @mouseleave="$event.currentTarget.style.background='white'"
          >
            {{ reply }}
          </q-chip>
        </div>
        
        <form @submit.prevent="sendMessage" class="row items-center no-wrap">
          <q-input
            v-model="inputText"
            dense
            outlined
            rounded
            placeholder="สอบถามข้อมูลทรัพย์สิน..."
            class="col q-mr-sm"
            :disable="isLoading"
            bg-color="grey-1"
            style="border-radius: 20px;"
          />
          <q-btn type="submit" round dense color="primary" icon="send" class="shadow-2" style="transition: transform 0.2s ease;" :disable="!inputText || isLoading" @mousedown="$event.currentTarget.style.transform='scale(0.9)'" @mouseup="$event.currentTarget.style.transform='scale(1)'" @mouseleave="$event.currentTarget.style.transform='scale(1)'" />
        </form>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const isOpen = ref(false)
const unread = ref(false)
const inputText = ref('')
const isLoading = ref(false)
const chatScroll = ref<any>(null)
const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL || '/api'

const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
let draggedDistance = 0

const handlePan = (ev: any) => {
  if (ev.isFirst) {
    isPanning.value = true
    draggedDistance = 0
  }
  
  draggedDistance += Math.abs(ev.delta.x) + Math.abs(ev.delta.y)
  
  panX.value += ev.delta.x
  panY.value += ev.delta.y
  
  if (ev.isFinal) {
    // Small delay to prevent click event if it was a drag
    setTimeout(() => {
      isPanning.value = false
    }, 50)
  }
}

const openChat = () => {
  // If we dragged more than 10 pixels, it was a drag, not a click
  if (draggedDistance > 10) return
  isOpen.value = true
  unread.value = false
}

interface Message {
  role: 'user' | 'ai'
  text: string
}

const messages = ref<Message[]>([
  { role: 'ai', text: 'สวัสดีครับ! ผมคือผู้ช่วย IT AI ต้องการสอบถามข้อมูลทรัพย์สินอะไรไหมครับ?' }
])

const quickReplies = [
  'อุปกรณ์ทั้งหมดมีกี่ชิ้น?',
  'มีของเสียกี่ชิ้น?',
  'มีของถูกยืมกี่ชิ้น?'
]

const sendQuickReply = (text: string) => {
  inputText.value = text
  sendMessage()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatScroll.value && chatScroll.value.$el) {
      chatScroll.value.$el.scrollTop = chatScroll.value.$el.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!inputText.value.trim() || !authStore.token) return
  
  const userText = inputText.value
  messages.value.push({ role: 'user', text: userText })
  inputText.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const history = messages.value.slice(0, -1) // exclude current msg
    const response = await axios.post(`${API_URL}/chat`, {
      message: userText,
      history: history
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    
    messages.value.push({ role: 'ai', text: response.data.text })
  } catch (error) {
    console.error('Chat error:', error)
    messages.value.push({ role: 'ai', text: 'ขออภัยครับ ตอนนี้ผมไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>
