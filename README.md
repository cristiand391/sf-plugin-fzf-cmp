# @cristiand391/oclif-plugin-fzf-cmp

A Salesforce CLI plugin to use fzf's custom fuzzy completion.
https://github.com/junegunn/fzf/#custom-fuzzy-completion

## Required dependencies
 * `fzf` and fuzzy completion for your shell installed.
 * `jq` (used for command completion)

See fzf's install instructions:
https://github.com/junegunn/fzf/#installation

If you already have the `fzf` binary installed and want to install the fuzzy completion for your shell you can clone the fzf repo and `source` the completion script in your bashrc/zshrc:
https://github.com/junegunn/fzf/tree/master/shell

## Installation

`sf plugins install @cristiand391/sf-plugin-fzf-cmp`

Then run `sf fzf-cmp` and follow the instructions to source the completion function for `sf` in your shell.

## Usage

The following completion scenarios are supported:

### Commands
`sf`, `sf help`and `sf which` support command completion:

### Org usernames:
`--target-org | -o`: org username completion
This will suggest all auth'd orgs (even hubs), except in cases where the required org type can be derived from a command name, e.g.
`sf org delete scratch --target-org` will only suggest scratch org usernames ;).

`--target-dev-hub | -v`: devhub username completion

### Configuration variables:
`sf config (set|get|unset)`: config variables completion. 
If trying to set, get or unset `target-org` or `target-dev-hub` it will suggest org usernames.

### Metadata component names:
`sf project deploy (start|validate) (--metadata | -m)`: metadata component names in "type:name" format in your current project.



