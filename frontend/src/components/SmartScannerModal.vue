<template>
  <q-dialog v-model="isOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="column no-wrap bg-dark text-white" style="min-height: 100vh;">
      
      <!-- Top Bar -->
      <div class="row items-center justify-between q-px-md q-py-sm bg-black shadow-3" style="z-index: 10;">
        <div class="row items-center">
          <q-btn icon="arrow_back" flat round dense color="white" @click="closeScanner" class="q-mr-sm" />
          <div>
            <div class="text-subtitle1 text-weight-bold row items-center">
              <q-icon name="qr_code_scanner" class="q-mr-xs text-primary" size="22px" />
              Smart Scanner Suite
            </div>
            <div class="text-caption text-grey-4">
              {{ activeModeTitle }}
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-xs">
          <!-- Torch Toggle (Hardware Mode) -->
          <q-btn 
            flat round 
            :icon="torchOn ? 'flashlight_on' : 'flashlight_off'" 
            :color="torchOn ? 'warning' : 'white'" 
            @click="toggleTorch"
            :disable="!hasTorch"
          >
            <q-tooltip>{{ torchOn ? 'Turn Flash Off' : 'Turn Flash On' }}</q-tooltip>
          </q-btn>

          <!-- Mode Switch Menu -->
          <q-btn flat round icon="tune" color="white">
            <q-menu fit anchor="bottom right" self="top right" class="bg-grey-9 text-white">
              <q-list style="min-width: 200px">
                <q-item clickable v-close-popup @click="switchMode('continuous')" :active="scanMode === 'continuous'" active-class="text-primary bg-grey-8">
                  <q-item-section avatar><q-icon name="speed" color="primary" /></q-item-section>
                  <q-item-section>High-Speed Continuous</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="switchMode('single')" :active="scanMode === 'single'" active-class="text-primary bg-grey-8">
                  <q-item-section avatar><q-icon name="crop_free" color="secondary" /></q-item-section>
                  <q-item-section>Single Item Scan</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="triggerFileUpload">
                  <q-item-section avatar><q-icon name="upload_file" color="info" /></q-item-section>
                  <q-item-section>Image Upload Scanner</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <q-btn icon="close" flat round dense color="white" @click="closeScanner" />
        </div>
      </div>

      <!-- Main Viewfinder Area -->
      <div class="col relative-position flex flex-center overflow-hidden bg-black">
        
        <!-- Video element container for html5-qrcode -->
        <div id="smart-reader-container" style="width: 100%; height: 100%; max-height: 75vh; position: relative;"></div>

        <!-- Laser Scanner Overlay & Reticle -->
        <div class="scanner-laser-overlay" v-if="cameraActive">
          <div class="scanner-aim-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="scanner-laser-line"></div>
          </div>
          <div class="text-caption text-center q-mt-md text-weight-medium text-white shadow-text">
            Align barcode or QR code within the frame
          </div>
        </div>

        <!-- Camera Off / Uploading fallback display -->
        <div v-if="!cameraActive && !cameraLoading" class="column items-center q-pa-lg text-center">
          <q-icon name="no_photography" size="64px" color="grey-6" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">Camera Paused or Unavailable</div>
          <div class="text-caption text-grey-5 q-mb-lg" style="max-width: 320px;">
            You can use Mode 3: Image Upload Scanner to take a photo or select an image from your device.
          </div>
          <div class="row q-gutter-sm">
            <q-btn color="primary" icon="refresh" label="Retry Camera" unelevated @click="startScanner" style="border-radius: 8px;" />
            <q-btn color="secondary" icon="photo_camera" label="Upload Barcode Photo" unelevated @click="triggerFileUpload" style="border-radius: 8px;" />
          </div>
        </div>

        <!-- Loading spinner -->
        <div v-if="cameraLoading" class="absolute-center column items-center">
          <q-spinner-tail color="primary" size="60px" />
          <div class="text-caption text-grey-4 q-mt-md">Initializing high-speed camera engine...</div>
        </div>

        <!-- Hidden input for Image Upload Scanner (Mode 3) -->
        <input 
          type="file" 
          ref="fileInputRef" 
          accept="image/*" 
          capture="environment" 
          style="display: none;" 
          @change="handleImageFileSelected" 
        />
      </div>

      <!-- Hardware Zoom Controls (Mode 2) -->
      <div v-if="cameraActive" class="q-px-lg q-py-sm bg-grey-10 row items-center justify-between" style="border-top: 1px solid rgba(255,255,255,0.1);">
        <div class="row items-center q-gutter-xs">
          <q-icon name="zoom_in" color="grey-4" size="20px" />
          <span class="text-caption text-grey-4">Zoom</span>
        </div>
        <div class="row items-center q-gutter-sm col-grow q-px-md" style="max-width: 400px;">
          <q-slider
            v-model="zoomLevel"
            :min="1"
            :max="5"
            :step="0.1"
            color="primary"
            track-color="grey-8"
            @update:model-value="applyZoom"
            class="col"
          />
          <span class="text-caption text-weight-bold text-primary">{{ zoomLevel.toFixed(1) }}x</span>
        </div>
        <div class="row q-gutter-xs">
          <q-btn dense size="sm" outline color="grey-4" label="1x" @click="setZoomPreset(1)" />
          <q-btn dense size="sm" outline color="grey-4" label="2x" @click="setZoomPreset(2)" />
          <q-btn dense size="sm" outline color="grey-4" label="3x" @click="setZoomPreset(3)" />
        </div>
      </div>

      <!-- Scanned Batch Live Feed (Mode 1 Continuous Scan Drawer) -->
      <div class="bg-black q-pa-md" style="border-top: 2px solid var(--q-primary); max-height: 220px; overflow-y: auto;">
        <div class="row items-center justify-between q-mb-sm">
          <div class="row items-center">
            <q-badge color="primary" class="q-mr-sm text-weight-bold">{{ scannedBatch.length }}</q-badge>
            <span class="text-subtitle2 text-weight-bold">Recently Scanned Items</span>
          </div>
          <div class="row q-gutter-xs">
            <q-btn size="sm" flat color="grey-4" label="Clear List" @click="scannedBatch = []" v-if="scannedBatch.length > 0" />
            <q-btn size="sm" color="primary" label="Done" unelevated @click="completeBatch" v-if="scannedBatch.length > 0" />
          </div>
        </div>

        <div v-if="scannedBatch.length === 0" class="text-caption text-grey-5 text-center q-py-sm">
          Awaiting scans... Point camera at serial barcodes or QR codes.
        </div>

        <div v-else class="row q-col-gutter-xs">
          <div v-for="(item, idx) in scannedBatch.slice().reverse()" :key="idx" class="col-12 col-sm-6 col-md-4">
            <div class="q-pa-sm rounded-borders bg-grey-9 row items-center justify-between shadow-1">
              <div class="ellipsis">
                <span class="text-weight-bold text-primary">{{ item.code }}</span>
                <div class="text-caption text-grey-4" v-if="item.name">{{ item.name }} ({{ item.category }})</div>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-badge :color="item.status === 'Available' ? 'positive' : item.status === 'Borrowed' ? 'warning' : 'negative'" text-color="white" v-if="item.status">
                  {{ item.status }}
                </q-badge>
                <q-icon name="check_circle" color="positive" size="18px" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useAssetStore } from '../stores/assetStore'
import { useQuasar } from 'quasar'

const props = defineProps<{
  modelValue: boolean
  mode?: 'continuous' | 'single'
  targetField?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scan', code: string, asset?: any): void
  (e: 'batch-complete', items: Array<{ code: string, asset?: any }>): void
}>()

const $q = useQuasar()
const assetStore = useAssetStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const scanMode = ref<'continuous' | 'single'>(props.mode || 'continuous')
const cameraActive = ref(false)
const cameraLoading = ref(false)
const torchOn = ref(false)
const hasTorch = ref(false)
const zoomLevel = ref(1.0)
const hasZoom = ref(false)
const videoTrack = ref<MediaStreamTrack | null>(null)
const scannedBatch = ref<Array<{ code: string, name?: string, category?: string, status?: string, timestamp: string }>>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

let html5QrCode: Html5Qrcode | null = null
let lastScannedCode = ''
let lastScanTime = 0
const COOLDOWN_MS = 500 // 0.5s cooldown debounce

const activeModeTitle = computed(() => {
  if (scanMode.value === 'continuous') {
    return 'Mode 1: High-Speed Continuous Scan (0.5s Auto-Beep)'
  }
  return 'Mode 2: Single Target Scan'
})

// Web Audio API Beep Synthesizer
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime) // 880 Hz standard scanner tone
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.12)
  } catch (err) {
    console.warn('Audio beep error:', err)
  }
}

const startScanner = async () => {
  await nextTick()
  cameraLoading.value = true
  cameraActive.value = false

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("smart-reader-container", {
        verbose: false,
        formatsToSupport: undefined // supports all QR, 1D (Code 128, Code 39, EAN, UPC), 2D
      })
    }

    const config = {
      fps: 20, // 20 frames per second for ultra responsive laser-like detection
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        return { width: Math.floor(minEdge * 0.75), height: Math.floor(minEdge * 0.55) }
      },
      aspectRatio: 1.777778
    }

    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      onCodeDetected,
      () => { /* frame analyzed with no barcode, ignore */ }
    )

    cameraActive.value = true
    detectHardwareCapabilities()
  } catch (err: any) {
    console.error("Camera scanner start error:", err)
    cameraActive.value = false
    $q.notify({
      type: 'warning',
      message: 'Camera stream unavailable. You can use Mode 3: Image Upload Scanner.',
      position: 'top'
    })
  } finally {
    cameraLoading.value = false
  }
}

const stopScanner = async () => {
  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop()
    } catch (e) {
      console.warn("Scanner stop warning:", e)
    }
  }
  cameraActive.value = false
  torchOn.value = false
  videoTrack.value = null
}

const detectHardwareCapabilities = () => {
  try {
    const videoElem = document.querySelector("#smart-reader-container video") as HTMLVideoElement
    if (videoElem && videoElem.srcObject) {
      const stream = videoElem.srcObject as MediaStream
      const track = stream.getVideoTracks()[0]
      if (track) {
        videoTrack.value = track
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {}
        hasTorch.value = !!capabilities.torch
        hasZoom.value = !!capabilities.zoom
      }
    }
  } catch (e) {
    console.warn("Hardware capability query error:", e)
  }
}

const toggleTorch = async () => {
  if (!videoTrack.value || !hasTorch.value) {
    $q.notify({ type: 'info', message: 'Torch is not supported on this device/browser', position: 'top' })
    return
  }
  try {
    torchOn.value = !torchOn.value
    await videoTrack.value.applyConstraints({
      // @ts-ignore
      advanced: [{ torch: torchOn.value }]
    })
  } catch (err) {
    console.error("Torch toggle error:", err)
    torchOn.value = false
  }
}

const applyZoom = async (val: number | null) => {
  if (!videoTrack.value || !val) return
  try {
    // @ts-ignore
    await videoTrack.value.applyConstraints({
      // @ts-ignore
      advanced: [{ zoom: val }]
    })
  } catch (err) {
    // Fallback: apply CSS transform zoom on video container
    const videoElem = document.querySelector("#smart-reader-container video") as HTMLVideoElement
    if (videoElem) {
      videoElem.style.transform = `scale(${val})`
    }
  }
}

const setZoomPreset = (level: number) => {
  zoomLevel.value = level
  applyZoom(level)
}

const onCodeDetected = (decodedText: string) => {
  const now = Date.now()
  // 0.5s Cooldown debounce on same item
  if (decodedText === lastScannedCode && (now - lastScanTime < COOLDOWN_MS)) {
    return
  }

  lastScannedCode = decodedText
  lastScanTime = now

  // Audio Beep
  playBeep()

  // Clean decoded text: extract ID if URL format (e.g. .../asset/AST-0001/scan -> AST-0001)
  let cleanCode = decodedText.trim()
  if (cleanCode.includes('/asset/') && cleanCode.includes('/scan')) {
    const parts = cleanCode.split('/asset/')
    if (parts[1]) {
      cleanCode = parts[1].split('/scan')[0]
    }
  }

  // Lookup in asset inventory
  const asset = assetStore.assets.find(a => a.id.toLowerCase() === cleanCode.toLowerCase() || a.name.toLowerCase() === cleanCode.toLowerCase())

  scannedBatch.value.push({
    code: cleanCode,
    name: asset?.name,
    category: asset?.category,
    status: asset?.status,
    timestamp: new Date().toLocaleTimeString()
  })

  // Emit event
  emit('scan', cleanCode, asset)

  if (scanMode.value === 'single') {
    closeScanner()
  }
}

// Mode 3: Image Upload Scanner
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleImageFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  try {
    $q.loading.show({ message: 'Analyzing uploaded barcode image...' })
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("smart-reader-container", { verbose: false })
    }
    const decodedText = await html5QrCode.scanFile(file, true)
    $q.loading.hide()
    $q.notify({ type: 'positive', message: `Decoded: ${decodedText}`, position: 'top' })
    onCodeDetected(decodedText)
  } catch (err) {
    $q.loading.hide()
    $q.notify({ type: 'negative', message: 'Could not detect a clear barcode in this photo. Please try a clearer picture.', position: 'top' })
  } finally {
    input.value = ''
  }
}

const switchMode = (mode: 'continuous' | 'single') => {
  scanMode.value = mode
}

const completeBatch = () => {
  emit('batch-complete', scannedBatch.value)
  closeScanner()
}

const closeScanner = async () => {
  await stopScanner()
  isOpen.value = false
}

// Watch dialog open
import { watch } from 'vue'
watch(isOpen, (open) => {
  if (open) {
    setTimeout(startScanner, 150)
  } else {
    stopScanner()
  }
})

onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
.scanner-laser-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.scanner-aim-frame {
  position: relative;
  width: 260px;
  height: 190px;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #22c55e;
  border-style: solid;
}

.top-left { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-top-left-radius: 12px; }
.top-right { top: -2px; right: -2px; border-width: 4px 4px 0 0; border-top-right-radius: 12px; }
.bottom-left { bottom: -2px; left: -2px; border-width: 0 0 4px 4px; border-bottom-left-radius: 12px; }
.bottom-right { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-bottom-right-radius: 12px; }

.scanner-laser-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #22c55e, #10b981, transparent);
  box-shadow: 0 0 8px #22c55e;
  animation: laserScan 2s ease-in-out infinite alternate;
}

@keyframes laserScan {
  0% { top: 5%; }
  100% { top: 95%; }
}

.shadow-text {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}
</style>
