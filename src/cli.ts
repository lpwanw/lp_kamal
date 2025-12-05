import { Command } from 'commander';
import { runDeploy } from './commands/deploy.js';
import { runInit } from './commands/init.js';
import { runUpdate } from './commands/update.js';

export const cli = new Command()
  .name('lp_kamal')
  .description('Interactive Kamal deployment CLI')
  .version('0.2.0')
  .option('--init', 'Setup branch and command configuration')
  .option('--update', 'Update to latest version')
  .action(async (options) => {
    if (options.init) {
      await runInit();
    } else if (options.update) {
      await runUpdate();
    } else {
      await runDeploy();
    }
  });
