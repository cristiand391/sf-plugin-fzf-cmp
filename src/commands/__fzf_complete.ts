import { Command, Args } from '@oclif/core';

export default class __FzfComplete extends Command {
  public static hidden = true;
  public static args = {
    comp: Args.string({
      required: true,
    }),
  };
  async run(): Promise<void> {
    const { args } = await this.parse(__FzfComplete);

    let output = '';

    switch (args.comp) {
      case 'all-plugins':
        for (const plugin of this.config.plugins) {
          output += `${plugin.name}\t(${plugin.type})\n`;
        }
        break;
      case 'user-plugins':
        for (const plugin of this.config.plugins) {
          if (plugin.type !== 'core') {
            output += `${plugin.name}\t(${plugin.type})\n`;
          }
        }
        break;
    }

    this.log(output.slice(0, -1));
  }
}
