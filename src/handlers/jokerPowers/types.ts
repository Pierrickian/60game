export interface JokerPowerRuntimeCard {
  label: string
  value: number
  theme: string
  icon: string
  id: string
}

export interface JokerPowerContext {
  deck: JokerPowerRuntimeCard[]
  levelConfig: { startingDeck: Record<string, number> }
  makeCardFromLabel: (label: string) => JokerPowerRuntimeCard
}

export interface JokerPowerHandler {
  id: string
  apply: (context: JokerPowerContext, params?: Record<string, unknown>) => JokerPowerRuntimeCard[]
}
