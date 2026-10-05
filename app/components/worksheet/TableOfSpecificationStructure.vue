<template>
  <div class="max-w-4xl mx-auto p-8 bg-white text-gray-900 font-sans print:p-0">
    <header class="text-center mb-6">
      <p class="font-bold text-lg tracking-wide">TERM EXAMINATION IN</p>
      <h1 class="font-extrabold text-xl text-blue-600 my-1">GMRC 1</h1>
      <p class="font-bold text-lg tracking-wide">TABLE OF SPECIFICATION</p>
      <p class="font-bold text-lg tracking-wide">TERM 1</p>
    </header>

    <div class="overflow-x-auto print:overflow-visible">
      <table class="w-full border-collapse border-2 border-gray-900 text-sm">
        <thead>
          <tr>
            <th class="border border-gray-900 bg-gray-50 font-bold px-2 py-2 text-left min-w-[260px]">
              Competencies
            </th>
            <th
              v-for="label in ['No. of Items', 'Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating', 'Test Placement', 'Percentage']"
              :key="label"
              class="border border-gray-900 bg-gray-50 font-bold px-2 py-3 text-center whitespace-nowrap [writing-mode:vertical-rl] rotate-180"
            >
              {{ label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td class="border border-gray-900 px-2 py-2 align-top text-left">
              <div class="flex gap-2 items-start leading-relaxed">
                <span class="shrink-0 text-gray-600">&#8226;</span>
                <span>{{ row.description }}</span>
              </div>
            </td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.items }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.remembering }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.understanding }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.applying }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.analyzing }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.evaluating }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.creating }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.placement }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ row.percentage }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-gray-100 font-bold">
            <th class="border border-gray-900 px-2 py-2 text-left">KABUUAN</th>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.items }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.remembering }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.understanding }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.applying }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.analyzing }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.evaluating }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">{{ totals.creating }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">1-{{ totals.items }}</td>
            <td class="border border-gray-900 px-2 py-2 text-center whitespace-nowrap">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <footer class="flex flex-wrap justify-between gap-6 mt-10 text-center">
      <div class="flex-1 min-w-[200px]">
        <p class="text-left mb-7">Prepared by:</p>
        <p class="font-bold underline">LORELY G. GOZO</p>
        <p class="text-gray-600 mt-1">Substitute Teacher</p>
      </div>
      <div class="flex-1 min-w-[200px]">
        <p class="text-left mb-7">Checked by:</p>
        <p class="font-bold underline">SARAH B. ALANDRIA</p>
        <p class="text-gray-600 mt-1">Master Teacher I</p>
      </div>
      <div class="flex-1 min-w-[200px]">
        <p class="text-left mb-7">Approved by:</p>
        <p class="font-bold underline">HARRY P. JABAHAB</p>
        <p class="text-gray-600 mt-1">Principal I</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'TableOfSpecification',
  data() {
    return {
      competencies: [
        {
          description:
            'Naipakikita ang pagiging madasalin sa pamamagitan ng wastong kilos at salita sa pananalangin.',
          remembering: 3,
          understanding: 1,
          applying: 2,
          analyzing: 0,
          evaluating: 0,
          creating: 0,
        },
        {
          description:
            'Naipakikita ang pangangalaga at pagpapahalaga sa kapaligiran bilang biyaya ng Diyos.',
          remembering: 1,
          understanding: 1,
          applying: 4,
          analyzing: 0,
          evaluating: 0,
          creating: 0,
        },
        {
          description:
            'Natutukoy at nagagalang ang mga pangunahing karapatan at pangangailangan ng bawat bata.',
          remembering: 5,
          understanding: 1,
          applying: 2,
          analyzing: 0,
          evaluating: 0,
          creating: 0,
        },
        {
          description:
            'Naisasagawa ang wastong pangangalaga at kalusugan sa kalinisan ng katawan.',
          remembering: 5,
          understanding: 2,
          applying: 3,
          analyzing: 0,
          evaluating: 0,
          creating: 0,
        },
      ],
    }
  },
  computed: {
    rows() {
      let cursor = 1
      const totalItems = this.totals.items
      return this.competencies.map((row) => {
        const items =
          row.remembering +
          row.understanding +
          row.applying +
          row.analyzing +
          row.evaluating +
          row.creating
        const start = cursor
        const end = cursor + items - 1
        cursor = end + 1
        const rawPercent = totalItems > 0 ? (items / totalItems) * 100 : 0
        const rounded = Math.round(rawPercent * 100) / 100
        const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9
        return {
          ...row,
          items,
          placement: `${start}-${end}`,
          percentage: `${isWhole ? Math.round(rounded) : rounded}%`,
        }
      })
    },
    totals() {
      return this.competencies.reduce(
        (acc, row) => ({
          items:
            acc.items +
            row.remembering +
            row.understanding +
            row.applying +
            row.analyzing +
            row.evaluating +
            row.creating,
          remembering: acc.remembering + row.remembering,
          understanding: acc.understanding + row.understanding,
          applying: acc.applying + row.applying,
          analyzing: acc.analyzing + row.analyzing,
          evaluating: acc.evaluating + row.evaluating,
          creating: acc.creating + row.creating,
        }),
        {
          items: 0,
          remembering: 0,
          understanding: 0,
          applying: 0,
          analyzing: 0,
          evaluating: 0,
          creating: 0,
        }
      )
    },
  },
}
</script>