import { Command } from 'commander';
import { runDeploy } from './commands/deploy.js';
import { runInit } from './commands/init.js';
import { runUpdate } from './commands/update.js';
import { runConfig } from './commands/config.js';
import { checkForUpdates } from './lib/version.js';
import type { CliOptions } from './types.js';

export const cli = new Command()
  .name('lp_kamal')
  .description('Interactive Kamal deployment CLI')
  .version('0.4.1')
  .option('--init', 'Setup branch and command configuration')
  .option('--config', 'Manage projects and branches')
  .option('--update', 'Update to latest version')
  .option('-v, --verbose', 'Show command output and errors')
  .action(async (options) => {
    // Check for updates (non-blocking, silent fail)
    await checkForUpdates();

    const cliOptions: CliOptions = { verbose: options.verbose };

    if (options.init) {
      await runInit();
    } else if (options.config) {
      await runConfig();
    } else if (options.update) {
      await runUpdate();
    } else {
      await runDeploy(cliOptions);
    }
  });
