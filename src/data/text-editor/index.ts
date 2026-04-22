export type { TextEditorDocument, TextEditorVariant } from './types'
export { notesDocument } from './notes'
export { resumeDocument } from './resume'
export { skillsDocument } from './skills'

import { notesDocument } from './notes'
import { resumeDocument } from './resume'
import { skillsDocument } from './skills'
import type { TextEditorVariant } from './types'

export const TEXT_EDITOR_DOCUMENTS = {
  notes: notesDocument,
  resume: resumeDocument,
  skills: skillsDocument,
} as const satisfies Record<TextEditorVariant, { content: string; downloadFileName: string }>