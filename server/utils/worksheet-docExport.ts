import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'
import type { Worksheet, WorksheetContent } from '~~/app/types/worksheet'

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF'
}

const cellBordersNone = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder
}

export async function buildWorksheetDocx(worksheet: Worksheet, options: { includeAnswerKey?: boolean, exportType?: 'worksheet' | 'tos' | 'both' } = {}): Promise<Buffer> {
  const content = worksheet.content as WorksheetContent
  const subjectName = worksheet.subject?.name || 'Subject Area'
  const gradeLabel = worksheet.grade?.label || 'Grade Level'
  const isEnglish = worksheet.medium_of_instruction === 'English'

  const children: any[] = []

  // 1. Header Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: isEnglish ? 'LEARNING ACTIVITY SHEET' : 'GAWAING PAGKATUTO',
          bold: true,
          size: 32, // 16pt
          color: '1E3A8A'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${subjectName} • ${gradeLabel} • ${worksheet.topic}`,
          italics: true,
          size: 22, // 11pt
          color: '4B5563'
        })
      ]
    })
  )

  // 2. Student Info Header Table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: isEnglish ? 'Learner Name: ' : 'Pangalan ng Mag-aaral: ', bold: true, size: 20 }),
                  new TextRun({ text: '____________________________________', size: 20 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: isEnglish ? 'Date: ' : 'Petsa: ', bold: true, size: 20 }),
                  new TextRun({ text: '___________________', size: 20 })
                ]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: isEnglish ? 'Grade & Section: ' : 'Baitang at Seksiyon: ', bold: true, size: 20 }),
                  new TextRun({ text: '_______________________________', size: 20 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: isEnglish ? 'Score: ' : 'Iskor: ', bold: true, size: 20 }),
                  new TextRun({ text: '_______ / _______', size: 20 })
                ]
              })
            ]
          })
        ]
      })
    ]
  })

  children.push(headerTable)

  // Divider
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: '_________________________________________________________________________________',
          color: '9CA3AF'
        })
      ]
    })
  )

  // 3. General Instructions
  if (content.instructions) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({ text: isEnglish ? 'General Instructions: ' : 'Pangkalahatang Panuto: ', bold: true, size: 22 }),
          new TextRun({ text: content.instructions, size: 22 })
        ]
      })
    )
  }

  // 4. Sections
  if (content.sections && content.sections.length > 0) {
    for (const section of content.sections) {
      children.push(
        new Paragraph({
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 24, // 12pt
              color: '1E3A8A'
            })
          ]
        })
      )

      if (section.instructions) {
        children.push(
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `${isEnglish ? 'Directions: ' : 'Panuto: '}${section.instructions}`,
                italics: true,
                size: 20,
                color: '374151'
              })
            ]
          })
        )
      }

      if (section.items && section.items.length > 0) {
        for (const item of section.items) {
          const itemNum = item.item_number || ''
          const pointsSuffix = item.points ? ` (${item.points} ${item.points === 1 ? 'pt' : 'pts'})` : ''

          children.push(
            new Paragraph({
              spacing: { before: 120, after: 80 },
              children: [
                new TextRun({ text: `${itemNum}. `, bold: true, size: 20 }),
                new TextRun({ text: item.question, size: 20 }),
                new TextRun({ text: pointsSuffix, italics: true, size: 18, color: '6B7280' })
              ]
            })
          )

          // Options for multiple choice
          if (item.type === 'multiple_choice' && item.options && item.options.length > 0) {
            for (const opt of item.options) {
              children.push(
                new Paragraph({
                  indent: { left: 400 },
                  spacing: { after: 40 },
                  children: [new TextRun({ text: opt, size: 20 })]
                })
              )
            }
          }

          // Blanks for fill in the blanks or identification
          if (item.type === 'fill_in_blank' || item.type === 'identification') {
            children.push(
              new Paragraph({
                indent: { left: 400 },
                spacing: { before: 40, after: 80 },
                children: [
                  new TextRun({ text: isEnglish ? 'Answer: ____________________________________________________' : 'Sagot: ____________________________________________________', size: 18, color: '4B5563' })
                ]
              })
            )
          }

          // Writing lines for short answer / essay
          if (item.type === 'short_answer' || item.type === 'essay') {
            children.push(
              new Paragraph({
                indent: { left: 400 },
                spacing: { before: 80, after: 40 },
                children: [new TextRun({ text: '_________________________________________________________________________________', color: 'D1D5DB' })]
              }),
              new Paragraph({
                indent: { left: 400 },
                spacing: { after: 40 },
                children: [new TextRun({ text: '_________________________________________________________________________________', color: 'D1D5DB' })]
              }),
              new Paragraph({
                indent: { left: 400 },
                spacing: { after: 80 },
                children: [new TextRun({ text: '_________________________________________________________________________________', color: 'D1D5DB' })]
              })
            )
          }
        }
      }
    }
  }

  // Worksheet Content Children
  const worksheetChildren: any[] = [...children]

  const tosChildren: any[] = []
  // Table of Specification (TOS)
  if (content.table_of_specification) {
    const tos = content.table_of_specification
    
    tosChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: isEnglish ? 'TERM EXAMINATION IN' : 'PAGSUSULIT SA',
            bold: true,
            size: 24,
            color: '000000'
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: subjectName.toUpperCase(),
            bold: true,
            size: 24,
            color: '1E40AF' // Blue color
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: isEnglish ? 'TABLE OF SPECIFICATION' : 'TALAAN NG ESPESIPIKASYON',
            bold: true,
            size: 24,
            color: '000000'
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: worksheet.term ? worksheet.term.replace('_', ' ').toUpperCase() : 'TERM 1',
            bold: true,
            size: 24,
            color: '000000'
          })
        ]
      })
    )

    const tableRows = []
    
    // Helper to create vertical text cell
    const verticalCell = (text: string) => {
      return new TableCell({
        textDirection: 'btLr', // Bottom to top, left to right
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, size: 18 })]
          })
        ]
      })
    }

    // Header row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Competencies', bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No.\nof\nItems', bold: true, size: 18 })] })] }),
          verticalCell('Remembering'),
          verticalCell('Understanding'),
          verticalCell('Applying'),
          verticalCell('Analyzing'),
          verticalCell('Evaluating'),
          verticalCell('Creating'),
          verticalCell('Test Placement'),
          verticalCell('Percentage')
        ]
      })
    )

    // Data rows
    for (const row of (tos.competencies || [])) {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.competency, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.no_of_items), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.remembering || 0), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.understanding || 0), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.applying || 0), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.analyzing || 0), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.evaluating || 0), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.creating || 0), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: row.test_placement, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: row.percentage, size: 18 })] })] }),
          ]
        })
      )
    }

    // Footer row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: isEnglish ? 'TOTAL' : 'KABUUAN', bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_items), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_remembering || 0), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_understanding || 0), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_applying || 0), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_analyzing || 0), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_evaluating || 0), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: String(tos.total_creating || 0), bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ textAlignment: AlignmentType.CENTER, children: [new TextRun({ text: '100%', bold: true, size: 18 })] })] }),
        ]
      })
    )

    tosChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      })
    )

    // Signatures block (Borderless Table)
    tosChildren.push(
      new Paragraph({ spacing: { before: 480 } }), // Spacing before signatures
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBordersNone,
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ children: [new TextRun({ text: 'Prepared by:', size: 20 })] })] }),
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ children: [new TextRun({ text: 'Checked by:', size: 20 })] })] }),
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ children: [new TextRun({ text: 'Approved by:', size: 20 })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: '                                    ', bold: true, size: 20, underline: { type: 'single', color: '000000' } })] })] }),
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: '                                    ', bold: true, size: 20, underline: { type: 'single', color: '000000' } })] })] }),
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: '                                    ', bold: true, size: 20, underline: { type: 'single', color: '000000' } })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Teacher / Substitute Teacher', size: 18 })] })] }),
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Master Teacher', size: 18 })] })] }),
              new TableCell({ borders: cellBordersNone, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Principal', size: 18 })] })] })
            ]
          })
        ]
      })
    )
  }

  const answerKeyChildren: any[] = []
  // 5. Answer Key (Separate Page for Teacher)
  if (options.includeAnswerKey !== false && content.answer_key && content.answer_key.length > 0) {
    answerKeyChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: isEnglish ? 'ANSWER KEY & TEACHER GUIDE' : 'GABAY SA PAGWAWASTO AT SAGUTAN',
            bold: true,
            size: 28,
            color: '1E3A8A'
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: isEnglish ? '(For Teacher Use Only)' : '(Para sa Guro Lamang)',
            italics: true,
            size: 20,
            color: 'EF4444'
          })
        ]
      })
    )

    for (const keySec of content.answer_key) {
      answerKeyChildren.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({ text: keySec.section_title, bold: true, size: 22, color: '1F2937' })
          ]
        })
      )

      if (keySec.items) {
        for (const ans of keySec.items) {
          answerKeyChildren.push(
            new Paragraph({
              indent: { left: 300 },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `Item ${ans.item_number}: `, bold: true, size: 20 }),
                new TextRun({ text: ans.answer, size: 20, color: '047857' }),
                ans.explanation ? new TextRun({ text: ` — ${ans.explanation}`, italics: true, size: 18, color: '6B7280' }) : new TextRun({ text: '' })
              ]
            })
          )
        }
      }
    }

    // Rubric
    if (content.rubric && content.rubric.length > 0) {
      answerKeyChildren.push(
        new Paragraph({
          spacing: { before: 280, after: 80 },
          children: [
            new TextRun({
              text: isEnglish ? 'Scoring Rubric for Open-Ended Tasks:' : 'Rubrik sa Pagmamarka ng Malikhaing Sagot:',
              bold: true,
              size: 22,
              color: '1F2937'
            })
          ]
        })
      )

      for (const crit of content.rubric) {
        answerKeyChildren.push(
          new Paragraph({
            indent: { left: 300 },
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `• ${crit.criteria} (${crit.max_points} pts): `, bold: true, size: 20 }),
              new TextRun({ text: crit.description, size: 20, color: '374151' })
            ]
          })
        )
      }
    }
  }

  const sections = []

  const exportType = options.exportType || 'both'

  // Section 1: Worksheet (Portrait)
  if (exportType === 'worksheet' || exportType === 'both') {
    sections.push({
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: worksheetChildren
    })
  }

  // Section 2: Answer Key (Portrait)
  if ((exportType === 'worksheet' || exportType === 'both') && answerKeyChildren.length > 0) {
    sections.push({
      properties: {
        page: {
          size: { orientation: "portrait" },
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: answerKeyChildren
    })
  }

  // Section 3: TOS (Landscape) - Put at the very last page
  if ((exportType === 'tos' || exportType === 'both') && tosChildren.length > 0) {
    sections.push({
      properties: {
        page: {
          size: { orientation: "landscape" },
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: tosChildren
    })
  }

  const doc = new Document({ sections })

  return await Packer.toBuffer(doc)
}
