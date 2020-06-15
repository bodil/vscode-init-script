import * as vscode from "vscode";
import * as Path from "path";
import * as Home from "user-home";

import * as compiler from "./compiler";

const Fs = vscode.workspace.fs;

function present(path: string): Promise<boolean> {
    return new Promise((resolve, _reject) => {
        Fs.stat(vscode.Uri.file(path)).then(
            (stat) => resolve(!!stat),
            (_err) => resolve(false)
        );
    });
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

function getInitScriptPath(storagePath: string): string {
    const config = vscode.workspace.getConfiguration("init-script");
    let scriptSetting: string = config.get("path") || "init";
    if (scriptSetting.startsWith("~")) {
        scriptSetting = Home + scriptSetting.slice(1);
    }
    return Path.resolve(storagePath, scriptSetting);
}

async function runInitFile(context: vscode.ExtensionContext, storagePath: string) {
    const [modulePath, moduleName] = await resolveModule(getInitScriptPath(storagePath));
    try {
        const init = require(modulePath);
        init.init(context);
    } catch (err) {
        vscode.window.showErrorMessage(`\`${moduleName}\` failed to load: ${err}`);
        throw err;
    }
}

async function openInitScript(context: vscode.ExtensionContext) {
    const storagePath = Path.resolve(context.globalStoragePath, "../..");
    const path = getInitScriptPath(storagePath);
    const tsPath = Path.resolve(path, `${path}.ts`);
    let scriptPath;
    if (await present(tsPath)) {
        scriptPath = tsPath;
    } else {
        scriptPath = Path.resolve(path, `${path}.js`);
    }
    const doc = await vscode.workspace.openTextDocument(scriptPath);
    await vscode.window.showTextDocument(doc);
}

export function activate(context: vscode.ExtensionContext): void {
    const storagePath = Path.resolve(context.globalStoragePath, "../..");
    context.subscriptions.push(
        vscode.commands.registerCommand("init-script.openInitScript", () => openInitScript(context))
    );
    runInitFile(context, storagePath);
}

export function deactivate(): void {}
