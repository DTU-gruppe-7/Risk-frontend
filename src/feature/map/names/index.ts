import type { TerritoryNames } from '../types'
import { namesDa } from './da'
import { namesEn } from './en'

// Adding a language = one new file and one new entry here. No caller changes.
export const territoryNames = {
  da: namesDa,
  en: namesEn,
} satisfies Record<string, TerritoryNames>

export type Language = keyof typeof territoryNames

export const languages = Object.keys(territoryNames) as Language[]
