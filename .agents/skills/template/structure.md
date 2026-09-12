lesson-planner/
├── app/
│   ├── assets/css/tailwind.css
│   ├── components/
│   │   ├── ui/                    # shadcn-vue — CLI-generated only, see §5
│   │   ├── custom/           # feature components, like add side sheet, edit side sheed, show preview actual file during generated components
│   │   └── layout/                # AppHeader, AppSidebar, using shadcn
│   ├── composables/                # reusable stats
│   ├── layouts/
│   │   └── default.vue
│   ├── middleware/
│   │   └── auth.global.ts
│   ├── pages/                      # file-based routing, see
│   ├── stores/
│   │   └── auth.ts                 # Pinia
│   ├── types/
│   │   └── lesson-plan.ts          # client-only types
│   ├── utils/
│   │   └── format.ts               # pure client-side helpers, auto-imported
│   └── app.vue
├── server/
│   ├── api/                        # see §2
│   ├── schemas/                    # Zod schemas, see §2.3
│   └── utils/
│       ├── supabase.ts             # service-role client, server-only
│       ├── llm.ts                  # Gemeni API wrapper 
│       └── docExport.ts            # docx/pptx rendering
├── shared/                         # Nuxt 4 native — isomorphic, used by BOTH client and server
│   └── types/
│       └── ilaw.ts                 # ILAW content shape, imported on both sides
├── public/
├── nuxt.config.ts
└── package.json