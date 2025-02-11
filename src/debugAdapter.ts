"use strict";

import * as vscode from "vscode";
import { buildCommand } from "./executable";

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private _context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    console.log(
      "DebugAdapterExecutableFactory called with session",
      session,
      "executable",
      executable
    );
    const command = buildCommand(
      this._context,
      "debugger",
      session.workspaceFolder
    );
    let options: vscode.DebugAdapterExecutableOptions | undefined =
      executable.options;

    if (session.workspaceFolder) {
      const cwd: string = session.workspaceFolder.uri.fsPath;

      if (options) {
        options = { ...options, cwd };
      } else {
        options = { cwd };
      }

      // for some reason env from launch config is not being passed to executable config
      // by default we need to do that manually
      if (session.configuration.env) {
        options = {
          ...options,
          env: {
            ...(options.env ?? {}),
            ...session.configuration.env,
          },
        };
      }
    }

    const resultExecutable = new vscode.DebugAdapterExecutable(
      command,
      executable.args,
      options
    );

    if (session.workspaceFolder) {
      console.log(
        `ElixirLS: starting DAP for ${session.workspaceFolder.uri.fsPath} with executable`,
        resultExecutable
      );
    } else {
      console.log("ElixirLS: starting DAP with executable", resultExecutable);
    }

    return resultExecutable;
  }
}

export function configureDebugger(context: vscode.ExtensionContext) {
  // Use custom DebugAdapterExecutableFactory that launches the debugger with
  // the current working directory set to the workspace root so asdf can load
  // the correct environment properly.
  const factory = new DebugAdapterExecutableFactory(context);
  const disposable = vscode.debug.registerDebugAdapterDescriptorFactory(
    "mix_task",
    factory
  );

  context.subscriptions.push(disposable);
}
