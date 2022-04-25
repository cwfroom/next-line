// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const terminateSymbols = [
	"」",
	"』",
	"。",
	"？",
	"！",
	"…",
	"～",
	"♪",
	"）"
];

function deleteUntil () {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const cursorPosition = activeEditor.selection.active;
		const activeLine = activeEditor.document.lineAt(cursorPosition.line);
		if (activeLine.text.length === 0) {return; };
		let endChar = activeLine.text.length - 1;
		// Iterate until passing one of the terminate symbols
		for (endChar; endChar > cursorPosition.character; endChar--) {
			if (!terminateSymbols.includes(activeLine.text.charAt(endChar))) {
				endChar++;
				break;
			}
		}
		var endPosition = cursorPosition.with(cursorPosition.line, endChar);
		var removeSelection = new vscode.Selection(cursorPosition,endPosition);
		activeEditor.edit( builder => {
		builder.delete(removeSelection);
		});
	}
}

async function nextLine() {
	deleteUntil();
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const cursorPosition = activeEditor.selection.active;
		let lineOffset = 0;
		for (let i = 1; i < 21; i++) {
			const line = activeEditor.document.lineAt(cursorPosition.line + i);
			if (line && line.text.length !== 0 && line.text[0] !== '/' && line.text[0] !== '@') {
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
}

async function searchThesaurus () {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const selectedText = activeEditor.document.getText(activeEditor.selection);
		if (selectedText.length > 0) {
			await vscode.env.openExternal(vscode.Uri.parse(`https://google.com/search?q=${selectedText} 類語`));
		}
	}
}

async function searchChinese () {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const selectedText = activeEditor.document.getText(activeEditor.selection);
		if (selectedText.length > 0) {
			await vscode.env.openExternal(vscode.Uri.parse(`https://google.com/search?q=${selectedText} 中文`));
		}
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let deleteUntilDisposable = vscode.commands.registerCommand('extension.deleteUntil', deleteUntil);
	let nextLineDisposable = vscode.commands.registerCommand('extension.nextLine', nextLine);
	let searchThesaurusDisposable = vscode.commands.registerCommand('extension.searchThesaurus', searchThesaurus);
	let searchChineseDisposable = vscode.commands.registerCommand('extension.searchChinese', searchChinese);
	context.subscriptions.push(deleteUntilDisposable);
	context.subscriptions.push(nextLineDisposable);
	context.subscriptions.push(searchThesaurusDisposable);
	context.subscriptions.push(searchChineseDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
