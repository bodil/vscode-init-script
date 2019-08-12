import * as vscode from "vscode";
import * as Path from "path";
import * as TypeScript from "typescript";

function readConfig(
    path: string,
    defaultOpts: TypeScript.CompilerOptions
): TypeScript.CompilerOptions {
    let basePath = Path.dirname(path);

    const configPath = TypeScript.findConfigFile(
        basePath,
        TypeScript.sys.fileExists,
        "tsconfig.json"
    );
    if (!configPath || !TypeScript.sys.fileExists(configPath)) {
        return defaultOpts;
    }
    basePath = Path.dirname(configPath);
    const configFile = TypeScript.readConfigFile(configPath, TypeScript.sys.readFile);
    if (configFile.error) {
        throw new Error(configFile.error.toString());
    }
    const { options, errors } = TypeScript.convertCompilerOptionsFromJson(
        configFile.config.compilerOptions,
        basePath
    );
    if (errors && errors.length) {
        console.log(errors);
        throw new Error(errors.map((e) => e.messageText).join("\n"));
    }
    return Object.assign(defaultOpts, options);
}

export function compile(entry: string, output: string) {
    const options = readConfig(entry, {
        module: TypeScript.ModuleKind.CommonJS,
        target: TypeScript.ScriptTarget.ES2015,
        lib: ["lib.es2015.d.ts"],
        sourceMap: true,
        declaration: true,
        noEmitOnError: true,
        noImplicitAny: true,
    });
    options.outDir = output; // must always override this!

    const program = TypeScript.createProgram([entry], options);
    const emitResult = program.emit();

    let allDiagnostics = TypeScript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach((diagnostic) => {
        let error;
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start!
            );
            let message = TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            error = `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
        } else {
            error = `${TypeScript.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
        }
        vscode.window.showErrorMessage(error);
        console.log(error);
    });

    if (emitResult.emitSkipped) {
        const message = `TypeScript compiler failed on "${entry}"`;
        vscode.window.showErrorMessage(message);
        throw new Error(message);
    }
}
