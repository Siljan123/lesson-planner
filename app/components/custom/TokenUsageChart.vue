<script setup lang="ts">
import { computed } from 'vue'

interface DailyEntry {
  date: string
  tokens: number
  plans: number
}

const props = defineProps<{
  history: DailyEntry[]
  dailyLimit: number
}>()

// Chart dimensions
const chartWidth = 560
const chartHeight = 200
const barGap = 12
const paddingLeft = 50
const paddingRight = 16
const paddingTop = 20
const paddingBottom = 40
const drawWidth = chartWidth - paddingLeft - paddingRight
const drawHeight = chartHeight - paddingTop - paddingBottom

const maxValue = computed(() => {
  const maxTokens = Math.max(...props.history.map(d => d.tokens), 0)
  // Ensure we show at least up to the daily limit
  return Math.max(maxTokens * 1.1, props.dailyLimit * 1.05)
})

const barWidth = computed(() => {
  const count = props.history.length || 1
  return Math.max(20, (drawWidth - barGap * (count - 1)) / count)
})

const bars = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return props.history.map((entry, i) => {
    const height = maxValue.value > 0
      ? (entry.tokens / maxValue.value) * drawHeight
      : 0
    const x = paddingLeft + i * (barWidth.value + barGap)
    const y = paddingTop + drawHeight - height

    const pct = (entry.tokens / props.dailyLimit) * 100
    let fill = '#22c55e' // green
    if (pct >= 90) fill = '#ef4444' // red
    else if (pct >= 70) fill = '#f59e0b' // amber

    const isToday = entry.date === today

    // Format date as "Mon 12" etc.
    const d = new Date(entry.date + 'T00:00:00')
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateNum = d.getDate()

    return {
      ...entry,
      x,
      y,
      height,
      width: barWidth.value,
      fill,
      isToday,
      dayLabel,
      dateNum,
      pct,
    }
  })
})

// Limit line Y position
const limitLineY = computed(() => {
  return paddingTop + drawHeight - (props.dailyLimit / maxValue.value) * drawHeight
})

// Y-axis tick values
const yTicks = computed(() => {
  const max = maxValue.value
  const step = Math.ceil(max / 4 / 5000) * 5000 // round to nearest 5K
  const ticks = []
  for (let v = 0; v <= max; v += step) {
    ticks.push({
      value: v,
      y: paddingTop + drawHeight - (v / max) * drawHeight,
      label: v >= 1000 ? `${Math.round(v / 1000)}K` : String(v),
    })
  }
  return ticks
})

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <svg
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      class="w-full h-auto min-w-[300px]"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Y-axis grid lines and labels -->
      <g v-for="tick in yTicks" :key="tick.value">
        <line
          :x1="paddingLeft"
          :y1="tick.y"
          :x2="chartWidth - paddingRight"
          :y2="tick.y"
          stroke="currentColor"
          class="text-border"
          stroke-width="0.5"
          stroke-dasharray="4,3"
        />
        <text
          :x="paddingLeft - 6"
          :y="tick.y + 4"
          text-anchor="end"
          class="fill-muted-foreground"
          font-size="10"
        >
          {{ tick.label }}
        </text>
      </g>

      <!-- Daily limit line -->
      <line
        :x1="paddingLeft"
        :y1="limitLineY"
        :x2="chartWidth - paddingRight"
        :y2="limitLineY"
        stroke="#ef4444"
        stroke-width="1.5"
        stroke-dasharray="6,4"
        opacity="0.7"
      />
      <text
        :x="chartWidth - paddingRight"
        :y="limitLineY - 5"
        text-anchor="end"
        fill="#ef4444"
        font-size="9"
        font-weight="600"
      >
        Daily Limit ({{ formatTokens(dailyLimit) }})
      </text>

      <!-- Bars -->
      <g v-for="bar in bars" :key="bar.date">
        <!-- Bar background (subtle) -->
        <rect
          :x="bar.x"
          :y="paddingTop"
          :width="bar.width"
          :height="drawHeight"
          rx="4"
          class="fill-muted/30"
        />
        <!-- Actual bar -->
        <rect
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="Math.max(bar.height, 0)"
          rx="4"
          :fill="bar.fill"
          :opacity="bar.isToday ? 1 : 0.7"
          :stroke="bar.isToday ? bar.fill : 'none'"
          :stroke-width="bar.isToday ? 2 : 0"
          class="transition-all duration-300"
        >
          <title>{{ bar.date }}&#10;Tokens: {{ bar.tokens.toLocaleString() }}&#10;Plans: {{ bar.plans }}&#10;{{ bar.pct.toFixed(0) }}% of daily limit</title>
        </rect>

        <!-- Token count above bar -->
        <text
          v-if="bar.tokens > 0"
          :x="bar.x + bar.width / 2"
          :y="bar.y - 5"
          text-anchor="middle"
          class="fill-foreground"
          :font-size="bar.isToday ? '10' : '9'"
          :font-weight="bar.isToday ? '600' : '400'"
        >
          {{ formatTokens(bar.tokens) }}
        </text>

        <!-- Date label below bar -->
        <text
          :x="bar.x + bar.width / 2"
          :y="paddingTop + drawHeight + 14"
          text-anchor="middle"
          :class="bar.isToday ? 'fill-foreground' : 'fill-muted-foreground'"
          :font-size="bar.isToday ? '10' : '9'"
          :font-weight="bar.isToday ? '700' : '400'"
        >
          {{ bar.dayLabel }}
        </text>
        <text
          :x="bar.x + bar.width / 2"
          :y="paddingTop + drawHeight + 26"
          text-anchor="middle"
          :class="bar.isToday ? 'fill-foreground' : 'fill-muted-foreground'"
          :font-size="bar.isToday ? '10' : '9'"
          :font-weight="bar.isToday ? '700' : '400'"
        >
          {{ bar.dateNum }}
        </text>

        <!-- Today indicator dot -->
        <circle
          v-if="bar.isToday"
          :cx="bar.x + bar.width / 2"
          :cy="paddingTop + drawHeight + 34"
          r="2.5"
          fill="#3b82f6"
        />
      </g>
    </svg>
  </div>
</template>
