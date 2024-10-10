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

const leadingSymbols = [
	"（",
	"「",
	"…",
	"—"
];

let progressStatusBarItem : vscode.StatusBarItem;

function deleteUntil () {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const cursorPosition = activeEditor.selection.active;
		const activeLine = activeEditor.document.lineAt(cursorPosition.line);
		if (activeLine.text.length === 0) {return; };
		// Don't delete when cursor is at line end
		if (cursorPosition.character === activeLine.text.length) {return; };

		let endCharPos = activeLine.text.length - 1;
		// Iterate backwards until passing one of the terminate symbols
		for (endCharPos; endCharPos > cursorPosition.character; endCharPos--) {
			if (!terminateSymbols.includes(activeLine.text.charAt(endCharPos))) {
				endCharPos++;
				break;
			}
		}
		var endPosition = cursorPosition.with(cursorPosition.line, endCharPos);
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
			// Ignore certain leading symbols
			let leadingIndex = 0;
			for (leadingIndex; leadingIndex < lineAfterMove.text.length; leadingIndex++) {
				if (!leadingSymbols.includes(lineAfterMove.text[leadingIndex])) {
					break;
				}
			}
			if (leadingIndex > 0) {
				await vscode.commands.executeCommand('cursorMove', {
					to: 'right',
					by: 'character',
					value: leadingIndex
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

async function launchSearch (mode: string) {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const selectedText = activeEditor.document.getText(activeEditor.selection);
		let searchURL = '';
		switch (mode) {
			case 'vanilla':
			case 'default':
				searchURL = `https://google.com/search?q=${selectedText}`;
				break;
			case 'thesaurus':
				searchURL = `https://google.com/search?q=${selectedText} 類語`;
				break;
			case 'chinese':
				searchURL = `https://google.com/search?q=${selectedText} 中文`;
				break;
		}
		if (selectedText.length > 0) {
			await vscode.env.openExternal(vscode.Uri.parse(searchURL));
		}
	}
}

async function searchThesaurus () {
	launchSearch('thesaurus');
}

async function searchChinese () {
	launchSearch('chinese');
}

async function searchVanilla () {
	launchSearch('vanilla');
}

function ignoreCommented (countUntil: number) {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		let lineCount = 0;
		let charCount = 0;
		const allLines = activeEditor.document.getText().split(/\r?\n/g);
		for (let i = 0; i < countUntil; i++) {
			if (allLines[i].length > 0 && allLines[i][0] !== '/' && allLines[i][0] !== '@' && allLines[i][0] !== ';') {
				lineCount++;
				charCount += allLines[i].length;
			}
		}
		return {
				'lineCount': lineCount,
				'charCount': charCount
			};
	}else {
		return {
			'lineCount': 0,
			'charCount': 0
		};
	}
}

function updateProgressStatusBar () {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const cursorPosition = activeEditor.selection.active;
		const currentCount = ignoreCommented(cursorPosition.line + 1);
		const currentLineCount = currentCount['lineCount'];
		const currentCharCount = currentCount['charCount'];
		const totalCount = ignoreCommented(activeEditor.document.lineCount);
		const totalLineCount = totalCount['lineCount'];
		const totalCharCount = totalCount['charCount'];

		let percentage = 0;
		if (currentLineCount !== 0 && totalLineCount !== 0) {
			percentage = (currentLineCount / totalLineCount) * 100;
		}
		progressStatusBarItem.text = `${currentLineCount}/${totalLineCount} ${currentCharCount}/${totalCharCount} ${percentage.toFixed(2)}%`;
		progressStatusBarItem.show();
	}else{
		progressStatusBarItem.hide();
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
	let searchVanillaDisposable = vscode.commands.registerCommand('extension.searchVanilla', searchVanilla);
	context.subscriptions.push(deleteUntilDisposable);
	context.subscriptions.push(nextLineDisposable);
	context.subscriptions.push(searchThesaurusDisposable);
	context.subscriptions.push(searchChineseDisposable);
	context.subscriptions.push(searchVanillaDisposable);

	progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateProgressStatusBar));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateProgressStatusBar));
	updateProgressStatusBar();
}

// this method is called when your extension is deactivated
export function deactivate() {}
