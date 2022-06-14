export type Pokedex = Array<PokedexPage>;

export interface PokedexPage {
  id: number;
  name: string;
}

export interface PokemonInfo {
  cp: number;
  iv: number;
  health: number;
}
