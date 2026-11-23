import { describe, expect, it } from 'vitest'
import { playerName } from './playerName'
import type { PlayerDto } from './types'

describe('playerName', () => {
  it('uses the user name', () => {
    expect(playerName({ userName: 'alice', turnOrder: 1 } as PlayerDto)).toBe('alice')
  })

  it('falls back to the turn order when the user name is missing', () => {
    expect(playerName({ userName: '', turnOrder: 3 } as PlayerDto)).toBe('Spiller 3')
  })
})
