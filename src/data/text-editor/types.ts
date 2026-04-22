export interface TextEditorDocument {
  content: string
  downloadFileName: string
}

export type TextEditorVariant = 'notes' | 'resume' | 'skills'