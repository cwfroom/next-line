// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.nextLine', async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const cursorPosition = activeEditor.selection.active;
			let lineOffset = 0;
			for (let i = 1; i < 21; i++) {
				const line = activeEditor.document.lineAt(cursorPosition.line + i);
				if (line && line.text.length !== 0 && line.text[0] !== '/' ) {
					lineOffset = i;
					break;
				}
			}
			if (lineOffset > 0) {
				await vscode.commands.executeCommand('cursorMove', {
					to: 'down',
					by: 'wrappedLine',
					value: lineOffset
				});
				await vscode.commands.executeCommand('cursorMove', {
					to: 'wrappedLineStart',
					by: 'wrappedLine',
				});
				const lineAfterMove = activeEditor.document.lineAt(cursorPosition.line + lineOffset);
				if (lineAfterMove.text[0] === '「') {
					await vscode.commands.executeCommand('cursorMove', {
						to: 'right',
						by: 'character'
					});
				}
				await vscode.commands.executeCommand('editorScroll', {
					to: 'down',
					by: 'wrappedLine',
					value: lineOffset
				});
			}
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
