// @ts-nocheck

export interface Event {
  id: string
  date: string
  name: string
  importance: number
  content: string
  theoryCompleted: number
  theoryTotal: number
  practiceCompleted: number
  practiceTotal: number
  daysRemaining: number
  isEditing: boolean
}

export let events: Event[] = []

