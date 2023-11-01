import { Interfaces } from '@oclif/core';
import {
  writeFile,
  mkdir,
  readdir,
  realpath,
  constants,
  access,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { format } from 'node:util';
import { normalize, join } from 'node:path';

export async function genCompletion(
  config: Interfaces.Config,
): Promise<string> {
  const fzfCompDir = `${config.cacheDir}/autocomplete/fzf-cmp`;

  if (!existsSync(fzfCompDir)) {
    await mkdir(fzfCompDir, { recursive: true });
  }

  const commands = config.commands
    .filter((cmd) => !cmd.hidden)
    .map((cmd) => ({
      id: cmd.id.replace(/:/g, ' '),
      summary: cmd.summary,
    }))
    .sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      }

      if (a.id > b.id) {
        return 1;
      }

      return 0;
    });

  const commandsFile = `${fzfCompDir}/commands.json`;

  await writeFile(commandsFile, JSON.stringify(commands));

  const isExecutable = async (filepath: string): Promise<boolean> => {
    try {
      if (filepath.endsWith('node')) {
        // This checks if the filepath is executable on Mac or Linux, if it is not it errors.
        await access(filepath, constants.X_OK);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const getNodeBinPath = async (root: string): Promise<string | undefined> => {
    const binDirs = [join(root, 'bin'), join(root, 'client', 'bin')].filter(
      (p) => existsSync(p),
    );

    if (binDirs.length > 0) {
      for (const dir of binDirs) {
        const nodeExecutable = (await readdir(dir))
          .map((bin) => `${dir}/${bin}`)
          .filter(isExecutable)[0];
        if (nodeExecutable.length > 0) {
          return realpath(nodeExecutable);
        }
      }
    }
  };

  const nodeBin = config.binPath ? await getNodeBinPath(config.root) : 'node';

  const fzfCompleteFuncTpl = `_fzf_complete_sf() {
  if [[ "$@" == "sf " || "$@" == "sf which " || "$@" == "sf help " ]]; then
    local commands_file preview_command

    commands_file="%s"
    preview_command="jq --arg cmd {} -r '. as \\$commands | map(.id == \\$cmd) | index(true) | \\$commands[.].summary' $commands_file"

    _fzf_complete --reverse --preview "$preview_command" --preview-window wrap,down,1 --prompt="sf> " -- "$@" < <(
      jq -r '.[] | .id' $commands_file
    )
  else
    local comp=$(%s %s "$@")
    _fzf_complete --select-1 --ansi --prompt="sf> " -- "$@" < <(
      echo $comp
    )
  fi
}

_fzf_complete_sf_post() {
  cut -f 1
}${
    config.shell === 'bash'
      ? `\n\ncomplete -F _fzf_complete_sf -o default -o bashdefault sf`
      : ''
  }
`;
  const fzfFuncFile = `${fzfCompDir}/sf.${
    config.shell === 'zsh' ? 'zsh' : 'bash'
  }`;
  await writeFile(
    fzfFuncFile,
    format(
      fzfCompleteFuncTpl,
      commandsFile,
      nodeBin,
      normalize(`${__filename}/../../lib/shell-completion.js`),
    ),
  );

  return fzfFuncFile;
}
