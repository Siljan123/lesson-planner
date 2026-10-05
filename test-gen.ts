global.createError = (err) => new Error(err.message || err); import { generateILAW } from './server/utils/llm.js'

async function test() {
  try {
    const res = await generateILAW({
      subject: 'Araling Panlipunan',
      grade: 'Grade 3',
      topic: 'Pagkakakilanlan ng Komunidad',
      competency: 'Natutukoy ang mga katangian ng sariling komunidad',
      term: 'Q1',
      session_duration: '4 days',
      medium_of_instruction: 'Filipino', ai_model: 'gpt-5.6-luna'
    })
    console.log(res)
  } catch (err) {
    console.error("ERROR:", err)
  }
}

test()
