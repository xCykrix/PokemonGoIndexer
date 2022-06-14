import { Fuse, imagemagick } from "../deps.ts";
import { Pokedex, PokedexPage, PokemonInfo } from "../interface/pokedex.iface.ts";
import { recognize } from "./recognize.ts";

export class PokemonParser {
  private static fuse: Fuse<PokedexPage>;

  public static initialize(pokedex: Pokedex): void {
    this.fuse = new Fuse(pokedex, {
      keys: ['id', 'name'],
    });
  }

  public static getPokemon(path: string): Promise<PokedexPage & PokemonInfo | undefined> {
    // deno-lint-ignore no-async-promise-executor
    return new Promise<PokedexPage & PokemonInfo | undefined>(async (resolve) => {
      const content = Deno.readFileSync(path);
      let pokedex: PokedexPage | undefined;
      const info: PokemonInfo = {
        cp: 0,
        iv: 0,
        health: 0,
      }
      await new Promise((done) => {
        imagemagick.ImageMagick.read(content, (i: imagemagick.IMagickImage) => {
          i.crop(new imagemagick.MagickGeometry(220, 870, 770, 120));
          i.write((v) => {
            Deno.writeFileSync(`${path.replace('.png', '-NAME.png')}`, v);
            recognize(`${path.replace('.png', '-NAME.png')}`, 'pgo').then((text) => {
              const pokemon = this.fuse.search(text.trim().split(' ')[0]!).at(0)?.item;
              if (pokemon === undefined) {
                pokedex = undefined;
                done(null);
                return;
              }
              pokedex = pokemon;
              done(null);
            });
          }, imagemagick.MagickFormat.Png);
        });
      });

      await new Promise((done) => {
        imagemagick.ImageMagick.read(content, (i: imagemagick.IMagickImage) => {
          i.crop(new imagemagick.MagickGeometry(435, 1033, 200, 35));
          i.write((v) => {
            Deno.writeFileSync(`${path.replace('.png', '-HP.png')}`, v);
            recognize(`${path.replace('.png', '-HP.png')}`, 'pgo').then((text) => {
              info.health = parseInt(text.trim().split('/')[1]!.trim().split('HP')[0]!.trim());
              done(null);
            });
          });
        });
      });

      await new Promise((done) => {
        imagemagick.ImageMagick.read(content, (i: imagemagick.IMagickImage) => {
          i.crop(new imagemagick.MagickGeometry(5, 880, 200, 35));
          i.write((v) => {
            Deno.writeFileSync(`${path.replace('.png', '-CP.png')}`, v);
            recognize(`${path.replace('.png', '-CP.png')}`, 'eng').then((text) => {
              info.cp = parseInt(text.trim().split(/CP/)[0]!.trim());
              done(null);
            });
          });
        });
      });

      await new Promise((done) => {
        imagemagick.ImageMagick.read(content, (i: imagemagick.IMagickImage) => {
          i.crop(new imagemagick.MagickGeometry(5, 915, 200, 40));
          i.write((v) => {
            Deno.writeFileSync(`${path.replace('.png', '-IV.png')}`, v);
            recognize(`${path.replace('.png', '-IV.png')}`, 'eng').then((text) => {
              info.iv = parseInt(text.trim().split(/%\ /)[0]!.trim());
              done(null);
            });
          });
        });
      });

      if (pokedex === undefined) {
        resolve(undefined);
        return;
      }
      resolve({ ...pokedex, ...info })
    });
  }
}

