import { UpdateCommand } from "./command/update.command.ts";
import { line } from "./deps.ts";

class Main extends line.MainCommand {
  public override signature = 'livingdex';

  public override subcommands = [
    UpdateCommand, //, - UPDATE POKEMON GO MASTER FILE
    // ParseCommand, - PARSE A LOCAL CSV TO MAPPING
    // StateCommand, - DISPLAY THE CURRENT STATE OF THE LIVING DEX STATUS
    // SearchCommand, - SEARCH FOR A SPECIFIC POKEMON IN THE MASTER FILE AND LIVING DEX
    //
  ];
}

const cli = new line.CLI({
  name: 'Living PokeDex CSV Parser',
  description: 'Convert a CSV file what is needed for a LivingDex.',
  version: 'v1.0.0',
  command: Main,
});

cli.run();
