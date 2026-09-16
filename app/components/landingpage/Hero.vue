<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  FileDown,
  Clock3,
  LayoutDashboard,
} from '@lucide/vue'

const user = useSupabaseUser()


</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
    <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Brand Logo -->
      <NuxtLink to="/" class="flex items-center gap-2.5 font-bold text-lg tracking-tight group">
        <div class="flex size-9 items-center justify-center transition-transform group-hover:scale-105">
          <GraduationCap class="size-10 text-primary"/>
        </div>
        <div class="flex flex-col leading-none">
          <span class="text-base text-foreground font-bold">Lesson Plan AI</span>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-3">
        <!-- Open Source Badge -->
        <Button variant="ghost" size="sm" as-child class="hidden sm:inline-flex gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer">
          <a href="https://github.com/Siljan123/lesson-planner.git" target="_blank" rel="noopener noreferrer">
            <Icon name="octicon:lockup-github-24" class="size-4" />
            <span>Open Source</span>
          </a>
        </Button>

        <template v-if="user">
          <Button size="sm" as-child class="gap-1.5 shadow-sm cursor-pointer">
            <NuxtLink to="/authenticated/dashboard">
              <LayoutDashboard class="size-4" />
              <span>Dashboard</span>
            </NuxtLink>
          </Button>
        </template>
        <template v-else>
          <Button size="sm" as-child class="gap-1.5 shadow-sm cursor-pointer">
            <NuxtLink to="/login">
              <span>Get Started</span>
              <ArrowRight class="size-3.5" />
            </NuxtLink>
          </Button>
        </template>
      </div>
    </div>
  </header>

  <!-- Hero Main Section -->
  <section class="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
    <!-- Subtle Background Glow -->
    <div class="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
      <div class="h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div class="h-80 w-80 translate-x-40 -translate-y-20 rounded-full bg-emerald-400/10 blur-3xl" />
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
      <!-- Headline -->
      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
        The smart way to build your <br class="hidden sm:inline" />
        <span class="text-primary relative inline-block">
          Daily Lesson Logs
          <svg class="absolute -bottom-2 left-0 w-full text-primary/30 -z-10" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
            <path d="M0,5 Q50,0 100,5" stroke="currentColor" stroke-width="4" fill="none" />
          </svg>
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Automate your teaching workflow. Generate complete, DepEd-standard ILAW lesson plans with differentiated activities, multi-day session pacing, and one-click DOCs exports.
      </p>

      <!-- Key Trust Badges -->
      <div class="pt-8 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
        <div class="flex items-center gap-3 rounded-lg border bg-card/60 p-3 shadow-2xs">
          <div class="flex size-9 shrink-0 items-center justify-center text-primary">
            <FileCheck2 class="size-4" />
          </div>
          <div class="text-xs">
            <p class="font-semibold text-foreground">ILAW Framework</p>
            <p class="text-muted-foreground text-[11px]">DepEd Annex A format</p>
          </div>
        </div>

        <div class="flex items-center gap-3 rounded-lg border bg-card/60 p-3 shadow-2xs">
          <div class="flex size-9 shrink-0 items-center justify-center text-primary">
            <Clock3 class="size-4" />
          </div>
          <div class="text-xs">
            <p class="font-semibold text-foreground">Multi-Day Sessions</p>
            <p class="text-muted-foreground text-[11px]">Day 1 to Day 5 DLL plans</p>
          </div>
        </div>

        <div class="flex items-center gap-3 rounded-lg border bg-card/60 p-3 shadow-2xs">
          <div class="flex size-9 shrink-0 items-center justify-center text-primary">
            <FileDown class="size-4" />
          </div>
          <div class="text-xs">
            <p class="font-semibold text-foreground">Worksheets</p>
            <p class="text-muted-foreground text-[11px]">Ready-to-print .docx</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>