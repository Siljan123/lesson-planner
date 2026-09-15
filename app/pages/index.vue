<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Hero from '@/components/landingpage/Hero.vue'
import GenerationProcessPreview from '@/components/landingpage/GenerationProcessPreview.vue'
import Footer from '@/components/landingpage/Footer.vue'
import {
  Sparkles,
  BookOpen,
  Layers,
  FileCheck2,
  FileDown,
  Clock,
  ShieldCheck,
  CheckCircle,
  ArrowRight
} from '@lucide/vue'

definePageMeta({
  layout: 'guest'
})

const router = useRouter()
const route = useRoute()

onMounted(() => {
  // immediately redirect them to the confirm page to process the tokens.
  if (route.query.code || route.query.token_hash || route.hash.includes('access_token=')) {
    router.push({
      path: '/auth/confirm',
      query: route.query,
      hash: route.hash
    })
  }
})

const features = [
  {
    icon: BookOpen,
    title: 'MATATAG Curriculum Aligned',
    description: 'Directly maps to official DepEd learning competencies, content standards, and performance standards across all grade levels.'
  },
  {
    icon: Layers,
    title: 'Authentic ILAW Framework',
    description: 'Systematically structures Intentions, Learning Experience, Assessment, and Ways Forward in standard Annex A table format.'
  },
  {
    icon: Clock,
    title: 'Multi-Day Session Pacing',
    description: 'Effortlessly plan Day 1 to Day 5 sessions with coordinated pedagogical continuity, scaffolding, and mastery checks.'
  },
  {
    icon: FileCheck2,
    title: '3-Domain Learning Objectives',
    description: 'Automatically drafts Bloom-aligned Cognitive, Psychomotor, and Affective objectives customized to your learners.'
  },
  {
    icon: FileDown,
    title: 'Instant DOCX & PPTX Export',
    description: 'Export cleanly formatted Word documents and classroom slide decks with official DepEd headers, borders, and signatories.'
  },
  {
    icon: ShieldCheck,
    title: 'DepEd DO 3, s. 2026 Compliant',
    description: 'Built-in Annex A AI transparency declarations ensuring full ethical compliance with DepEd AI guidelines.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
    <!-- Hero Section with Top Navigation -->
    <Hero />

    <!-- Interactive Generation Process Preview (Live Simulation) -->
    <GenerationProcessPreview />
    <!-- Landing Page Footer -->
    <Footer />
  </div>
</template>