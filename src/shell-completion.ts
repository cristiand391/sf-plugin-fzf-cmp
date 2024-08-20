import type { AuthFields } from '@salesforce/core';
import { promisify } from 'node:util';
import { exec as nodeExec } from 'node:child_process';

const exec = promisify(nodeExec);

const args = process.argv[2].split(' ');

const wordToComplete = args.at(-2);

async function getOrgs(
  type: 'all' | 'scratch' | 'devhub' | 'sandbox',
): Promise<string> {
  const { StateAggregator } = await import(
    '@salesforce/core/stateAggregator'
  );
  const stateAgg = await StateAggregator.getInstance();

  let output = '';

  const filterByType = (org: AuthFields): boolean => {
    switch (type) {
      case 'scratch':
        return org.expirationDate ? true : false;
      case 'devhub':
        return org.isDevHub ?? false;
      case 'sandbox':
        return org.isSandbox ?? false;
      default:
        return true;
    }
  };

  (await stateAgg.orgs.readAll()).filter(filterByType).forEach((org) => {
    const alias = stateAgg.aliases.get(org.username || '');
    output += alias ? `${org.username}\t(${alias})\n` : `${org.username}\n`;
  });

  return output.slice(0, -1);
}

async function getMetadataComponents(): Promise<string | undefined> {
  const { SfProject } = await import('@salesforce/core/project');
  try {
    await SfProject.resolve();
  } catch {
    return;
  }
  const { MetadataResolver } = await import(
    '@salesforce/source-deploy-retrieve/lib/src/resolve'
  );
  const componets = new MetadataResolver().getComponentsFromPath(process.cwd());
  let output = '';

  componets.forEach((cmp) => {
    output += `${cmp.type.name}:${cmp.fullName}\n`;
  });

  return output.slice(0, -1);
}

async function completeCommand(
  currentLine: string,
): Promise<string | undefined> {
  let output: string | undefined;

  if (/^sf config (s|g|uns)et/.test(process.argv[2])) {
    if (wordToComplete == 'target-org') {
      output = await getOrgs('all');
    } else if (wordToComplete == 'target-dev-hub') {
      output = await getOrgs('devhub');
    } else {
      output =
        'org-instance-url\norg-api-version\ntarget-dev-hub\ntarget-org\norg-isv-debugger-sid\norg-isv-debugger-url\norg-custom-metadata-templates\norg-max-query-limit';
    }
  } else if (
    /^sf project deploy (start|validate)/.test(process.argv[2]) &&
    (wordToComplete == '-m' || wordToComplete == '--metadata')
  ) {
    output = await getMetadataComponents();
  } else if (
    currentLine.startsWith('sf org delete scratch') &&
    (wordToComplete == '-o' || wordToComplete == '--target-org')
  ) {
    output = await getOrgs('scratch');
  } else if (/^sf plugins inspect/.test(process.argv[2])) {
    output = (await exec('sf __fzf_complete all-plugins')).stdout;
  } else if (/^sf plugins (uninstall|unlink|remove)/.test(process.argv[2])) {
    output = (await exec('sf __fzf_complete user-plugins')).stdout;
  }

  return output;
}

(async () => {
  // first check if we have command-specific completions
  let output = await completeCommand(process.argv[2]);

  if (!output) {
    if (wordToComplete == '-v' || wordToComplete == '--target-dev-hub') {
      output = await getOrgs('devhub');
    } else if (wordToComplete == '-o' || wordToComplete == '--target-org') {
      output = await getOrgs('all');
    } else {
      output = '';
    }
  }

  process.stdout.write(output);
})();
