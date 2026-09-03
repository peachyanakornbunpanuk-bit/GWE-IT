<template>
  <div class="digital-signature-container">
    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle2 text-weight-bold text-dark flex items-center">
        <q-icon name="draw" class="q-mr-xs text-primary" size="20px" />
        Digital Signature (Sign on screen)
      </div>
      <div class="row q-gutter-xs">
        <q-btn flat dense size="sm" color="grey-7" icon="undo" label="Undo" @click="undoStroke" :disable="strokes.length === 0" />
        <q-btn flat dense size="sm" color="negative" icon="delete" label="Clear" @click="clearCanvas" :disable="strokes.length === 0" />
      </div>
    </div>

    <div class="canvas-wrapper rounded-borders bg-white relative-position" style="border: 2px dashed #cbd5e1; touch-action: none;">
      <canvas 
        ref="canvasRef" 
        class="signature-canvas fit cursor-crosshair"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="stopDrawing"
      ></canvas>
      
      <div v-if="isEmpty" class="canvas-placeholder pointer-events-none absolute-center text-grey-5 text-caption flex flex-center column">
        <q-icon name="edit" size="28px" class="q-mb-xs opacity-40" />
        Sign with finger, Apple Pencil, or stylus here
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const emit = defineEmits<{
  (e: 'update:signature', dataUrl: string | null): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isEmpty = ref(true)
const isDrawing = ref(false)
const strokes = ref<Array<ImageData>>([])

let ctx: CanvasRenderingContext2D | null = null

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.parentElement?.getBoundingClientRect()
  const width = rect ? rect.width : 400
  const height = 160

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a' // deep ink color
  }
}

const getCanvasPos = (e: MouseEvent): { x: number, y: number } => {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

const getTouchPos = (e: TouchEvent): { x: number, y: number } => {
  if (!canvasRef.value || e.touches.length === 0) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: e.touches[0].clientX - rect.left,
    y: e.touches[0].clientY - rect.top
  }
}

const startDrawing = (e: MouseEvent) => {
  if (!ctx || !canvasRef.value) return
  saveState()
  isDrawing.value = true
  isEmpty.value = false
  const pos = getCanvasPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !ctx) return
  const pos = getCanvasPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

const handleTouchStart = (e: TouchEvent) => {
  if (!ctx || !canvasRef.value) return
  saveState()
  isDrawing.value = true
  isEmpty.value = false
  const pos = getTouchPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDrawing.value || !ctx) return
  const pos = getTouchPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (ctx) {
    ctx.closePath()
    emitData()
  }
}

const saveState = () => {
  if (!ctx || !canvasRef.value) return
  const imgData = ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  strokes.value.push(imgData)
}

const undoStroke = () => {
  if (!ctx || !canvasRef.value || strokes.value.length === 0) return
  const lastState = strokes.value.pop()
  if (lastState) {
    ctx.putImageData(lastState, 0, 0)
    if (strokes.value.length === 0) {
      isEmpty.value = true
      emit('update:signature', null)
    } else {
      emitData()
    }
  }
}

const clearCanvas = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  strokes.value = []
  isEmpty.value = true
  emit('update:signature', null)
}

const emitData = () => {
  if (!canvasRef.value || isEmpty.value) {
    emit('update:signature', null)
    return
  }
  const dataUrl = canvasRef.value.toDataURL('image/png')
  emit('update:signature', dataUrl)
}

defineExpose({
  clear: clearCanvas,
  getDataUrl: () => canvasRef.value && !isEmpty.value ? canvasRef.value.toDataURL('image/png') : null,
  isEmpty: () => isEmpty.value
})

onMounted(() => {
  nextTick(() => {
    initCanvas()
    window.addEventListener('resize', initCanvas)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', initCanvas)
})
</script>

<style scoped>
.digital-signature-container {
  width: 100%;
}

.canvas-wrapper {
  height: 160px;
  overflow: hidden;
}

.signature-canvas {
  display: block;
}

.pointer-events-none {
  pointer-events: none;
}
</style>
