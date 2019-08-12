import * as vscode from "vscode";
import * as Path from "path";
import * as Home from "user-home";
import * as Fs from "fs";

import * as compiler from "./compiler";

function present(path: string): Promise<boolean> {
    return new Promise((resolve, reject) =>
        Fs.access(path, Fs.constants.R_OK, (err) => resolve(!err))
    );
}

async function resolveModule(path: string): Promise<[string, string]> {
    const tsPath = Path.resolve(path, `${path}.ts`);
    const moduleName = Path.basename(path);
    if (!(await present(tsPath))) {
        return [path, `${moduleName}.js`];
    }
    const tsTarget = Path.resolve(Path.dirname(path), "ts_compiled");
    compiler.compile(tsPath, tsTarget);
    return [Path.resolve(tsTarget, moduleName), `${moduleName}.ts`];
}

async function runInitFile(context: vscode.ExtensionContext, storagePath: string) {
    const config = vscode.workspace.getConfiguration("init-script");
    let scriptSetting: string = config.get("path") || "init";
    if (scriptSetting.startsWith("~")) {
        scriptSetting = Home + scriptSetting.slice(1);
    }
    const scriptPath = Path.resolve(storagePath, scriptSetting);
    const [modulePath, moduleName] = await resolveModule(scriptPath);
    try {
        const init = require(modulePath);
        init.init(context);
    } catch (err) {
        vscode.window.showErrorMessage(`\`${moduleName}\` failed to load: ${err}`);
        throw err;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const storagePath = Path.resolve(context.globalStoragePath, "../..");
    runInitFile(context, storagePath);
}

export function deactivate() {}
