# vscode-init-script

Because sometimes you just want to configure your text editor with a script.

## About

This extension looks for a file called `init.js` or `init.ts` in your `<code-config-path>/User`
folder, compiles it if it's a TypeScript file, and then loads it.

It expects your init script to export a function `init(context: vscode.ExtensionContext)`, which it
will then invoke. From here, you're free to interact with your Code instance through the extension
API.

You can configure the location of your init script with the `init-script.path` setting. It will be
relative to your user config folder (`~/.config/Code/User` or something similar but platform
dependent), unless you give an absolute path, which can start with `~` to refer to your home
directory. It should be the path to a CommonJS/ES6 module, which means it should _not_ have a file
extension. The default is, simply, `init`. It will prefer `.ts` to `.js` if it finds both.

## Example

Here is a minimal example of what your `init.ts` script might look like:

```typescript
import * as vscode from "vscode";

export function init(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration();
    config.update("workbench.editor.showTabs", false, vscode.ConfigurationTarget.Global);
    config.update("editor.minimap.enabled", false, vscode.ConfigurationTarget.Global);
}
```

## Licence

Copyright 2019 Bodil Stokke

This program is free software: you can redistribute it and/or modify it under the terms of the GNU
Lesser General Public License as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program. If
not, see https://www.gnu.org/licenses/.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct][coc]. By
participating in this project you agree to abide by its terms.

[coc]: https://github.com/bodil/vscode-init-script/blob/master/CODE_OF_CONDUCT.md
