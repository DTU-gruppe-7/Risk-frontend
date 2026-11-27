# Backend task: live territory selection on the game hub

## Goal

While a player is taking their turn, the other players in the game should see live which
territories that player has picked (e.g. "attacking from Alaska into Kamchatka"), drawn on the
board in the player's colour.

The frontend part is already implemented and waits for the backend. Until the backend has the
method below, the frontend's calls fail quietly and nothing is shown.

## Summary of what to add

| Direction       | Name                | Where                                        |
| --------------- | ------------------- | -------------------------------------------- |
| Client → server | `SelectTerritories` | New method on the game hub (`GameHub`)       |
| Server → client | `SelectionChanged`  | New method on the typed client `IGameClient` |

No database changes, no migrations, no REST endpoints and no change to `GameUpdated`.

## Contract (must match exactly — the frontend is already built against it)

Names are case-sensitive on the wire. The JSON uses camelCase (the default SignalR JSON protocol).

### Client → server: `SelectTerritories`

```csharp
Task SelectTerritories(Guid gameId, SelectTerritoriesRequest request);
```

```csharp
public record SelectTerritoriesRequest(
    Guid? SourceTerritoryId,   // null = nothing picked
    Guid? TargetTerritoryId);  // null = no target picked
```

JSON the frontend sends as the second argument:

```json
{ "sourceTerritoryId": "3f6c…", "targetTerritoryId": null }
```

- The ids are **territory state ids** (`TerritoryDto.Id`, the per-game territory row), **not** map
  slugs like `"alaska"`. This is the same convention as `AttackRequest`, `FortifyRequest` etc.
- If the territory state id type is not `Guid` in the backend, use whatever type `TerritoryDto.Id` has.
- Both null means "selection cleared". The frontend sends this at the start of each of its turns
  and when the player deselects.
- The frontend sends a new call on every change of selection (one per click), plus once after a
  reconnect. Expect at most a few calls per second from one player.

### Server → client: `SelectionChanged`

Add to `IGameClient`:

```csharp
Task SelectionChanged(TerritorySelectionDto selection);
```

```csharp
public record TerritorySelectionDto(
    Guid GameId,
    Guid PlayerId,             // the game's player id (PlayerDto.Id), NOT the user id
    Guid? SourceTerritoryId,
    Guid? TargetTerritoryId);
```

JSON the frontend expects:

```json
{
  "gameId": "…",
  "playerId": "…",
  "sourceTerritoryId": "3f6c…",
  "targetTerritoryId": null
}
```

## Server-side rules for `SelectTerritories`

1. **Authorization.** The caller must be authenticated (as the other hub methods) and be a
   non-eliminated player in `gameId`. Otherwise throw `HubException`.
2. **Only the current player.** The game must be `InProgress` and `CurrentPlayerId` must be the
   caller's player. Otherwise throw `HubException`. (A late call from a turn that just ended is
   expected now and then; the frontend ignores the error.)
3. **Validate ids.** Each non-null territory id must belong to this game. Otherwise throw
   `HubException`. Do **not** validate game rules (adjacency, ownership, phase) — the selection is
   only a visual hint, and the real actions are still validated by the existing endpoints.
4. **Do not persist anything** and do not bump `Game.Version`. It is a fire-and-forget relay.
5. **Recipients.** Send `SelectionChanged` to everyone in the game's hub group **except the
   caller's connections** (the same group that receives `GameUpdated`). Using the user id
   (e.g. `Clients.GroupExcept(...)` with the caller's connection ids, or
   `OthersInGroup`) is fine — the frontend also ignores its own selections.
6. **Fog of war.** If the game has fog of war, the selection must be filtered per recipient with
   **the same visibility logic that already filters `GameUpdated`**: for each recipient, replace a
   territory id the recipient cannot see with `null`. Reuse the existing visibility code; do not
   write a second implementation. The message may still be sent when both ids end up null (it
   simply clears that recipient's view). Without fog of war, all recipients get the same message.
7. **Return** normally (`Task`, no value) on success.

## Suggested structure (SOLID / reuse)

- Keep the hub method thin: resolve the caller, then delegate to a service, as the existing hub
  methods do (e.g. an `ISelectionBroadcaster` / a method on the existing game service).
- Put the authorization and "is current player" checks in the same place/helpers the existing
  game actions use, rather than duplicating them.
- Reuse the existing fog-of-war visibility service for rule 6.
- Add `SelectTerritoriesRequest` and `TerritorySelectionDto` next to the other game DTOs.

## Tests to add

- Current player calls it → other players in the group receive `SelectionChanged` with the same ids;
  the caller does not receive it.
- A player who is not the current player → `HubException`, nothing is sent.
- A user who is not in the game → `HubException`.
- A territory id from another game → `HubException`.
- Fog of war: a recipient who cannot see the target territory receives `targetTerritoryId: null`,
  while a recipient who can see it receives the id.
- Both ids null → relayed as a clear.
- Nothing is written to the database and `Game.Version` is unchanged.

## How the frontend uses it (for reference)

- `src/realtime/gameHub.ts` — the typed hub contract (`SelectTerritories`, `SelectionChanged`).
- `src/feature/game/types.ts` — `SelectTerritoriesRequest`, `TerritorySelectionDto`.
- `src/feature/game/useLiveSelection.ts` — sends the current player's selection and receives the
  opponent's. It shows a received selection only while `playerId` is the game's current player,
  and clears it when the turn changes, so the backend does not need to send a "clear" at turn end.
