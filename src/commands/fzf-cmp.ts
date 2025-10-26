import { Command, Flags } from '@oclif/core';
import { genCompletion } from '../comp-gen';
import { styleText } from 'node:util';

export default class FzfCmp extends Command {
  static summary = 'Fuzzy completion';

  static flags = {
    'refresh-cache': Flags.boolean({
      description: 'Refresh cache (ignores displaying instructions)',
      char: 'r',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(FzfCmp);

    const fzfFuncFile = await genCompletion(this.config);

    if (!flags['refresh-cache']) {
      this.log(
        `${styleText('bold', 'Setup Instructions')}

1) Add this line to your \`${
          this.config.shell === 'zsh' ? '.zshrc' : '.bashrc'
        }\` file to load the fuzzy completion function for sf:

${styleText('cyan', `source "${fzfFuncFile}"`)}

2) Test it out, e.g.:
${styleText('cyan', `$ sf ${process.env.FZF_COMPLETION_TRIGGER || '**'}<TAB>`)}

Enjoy!
`,
      );
    }
  }
}
