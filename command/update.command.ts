// deno-lint-ignore-file no-await-in-loop
import ADB from "https://deno.land/x/adb@1.7/index.ts";
import { csv, imagemagick, line } from "../deps.ts";
import { Pokedex, PokedexPage } from "../interface/pokedex.iface.ts";
import { PokemonParser } from "../util/getPokemon.ts";

export class UpdateCommand extends line.Subcommand {
  public override signature = 'update';
  public override description = 'Update the gamefile.json used to calculate the LivingDex.';

  public override async handle(): Promise<void> {
    const json = await (await fetch("https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json")).json();

    // Parse the gamefile.json to a more usable format.
    const pokedex: Set<PokedexPage> = new Set();
    for (const pokemon of json) {
      if (pokemon?.data?.pokemonSettings !== undefined) {
        pokedex.add({
          id: parseInt(pokemon.data.templateId.split('_')[0]!.replace('V', '')),
          name: pokemon.data.pokemonSettings.pokemonId,
        });
      }
    }
    PokemonParser.initialize([...pokedex]);

    // Generate a template gamefile.csv based on the raw gamefile.json.
    // TODO

    // Prepare the collection processing.
    await Deno.remove('./pokemon/', { recursive: true });
    await Deno.mkdir('./pokemon/', { recursive: true });
    const adb = new ADB();
    await adb.waitForConnection();
    await imagemagick.initializeImageMagick();

    // State Control.
    let iter = 0;
    let duplicated = 0;
    const storage: Array<Array<string>> = [];
    storage.push(['id', 'name', 'cp', 'iv', 'health']);

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 2200));
      let src = (await adb.getScreenshot(Deno.cwd() + '/pokemon'));
      await Deno.rename(src, `${src.replace('screen.png', `${iter}.png`)}`);
      src = src.replace('screen.png', `${iter}.png`);
      await adb.shell(`input touchscreen swipe 900 1400 300 1400 250`);

      // Load the file to ImageMagick.
      const dex = await PokemonParser.getPokemon(src);
      if (dex === undefined) {
        console.error(`Failed to get the pokemon for ${iter}.`);
        continue;
      }
      console.info(dex.id, dex.name, dex.health, dex.cp, dex.iv)
      const last = storage.at(storage.length - 1)!;
      if (last[0] === dex.id.toString() && last[1] === dex.name && last[2] === dex.cp.toString() && last[3] === dex.iv.toString() && last[4] === dex.health.toString()) {
        console.info('Duplicate Detected at', iter);
        if (duplicated > 5) {
          console.info('5 duplicates. done?');
          break;
        }
        duplicated++;
        continue;
      }
      storage.push([dex.id.toString(), dex.name, dex.cp.toString(), dex.iv.toString(), dex.health.toString()]);
      duplicated = 0;
      iter++;
    }

    const csvStorage = await Deno.open('./pokemon/pokemon.csv', { write: true, create: true, truncate: true });
    await csv.writeCSV(csvStorage, storage);
    csvStorage.close();
  }
}
