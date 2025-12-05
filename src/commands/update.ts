import * as p from '@clack/prompts';

const INSTALL_URL = 'https://raw.githubusercontent.com/lpwanw/lp_kamal/main/install.sh';

export async function runUpdate(): Promise<void> {
  p.intro('lp_kamal Update');

  const confirmed = await p.confirm({
    message: 'Download and install latest version?',
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Update cancelled');
    process.exit(0);
  }

  const s = p.spinner();
  s.start('Downloading latest version...');

  try {
    const proc = Bun.spawn(['bash', '-c', `curl -fsSL ${INSTALL_URL} | bash`], {
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      s.stop('Update complete!');
      p.outro('Restart your terminal to use the new version');
    } else {
      s.stop('Update failed');
      process.exit(1);
    }
  } catch (error) {
    s.stop('Update failed');
    p.log.error(String(error));
    process.exit(1);
  }
}
