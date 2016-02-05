
'use strict';

import { UserMe, UserResult } from './UserMe';
import {
    React,
    ContentComponent,
    DOMElement,
    PageInfo,
	encodeHTML,
    charToHTMLEntity,
    extend,
	CharCode,
    KeyCode,
    autobind
} from '../Library/Index';

interface Props {
}

interface Elements {
    contentEditable: DOMElement;
}

interface Text {
}

export class TextFormatInput extends ContentComponent<Props, Text, Elements> {
    public data: UserMe;
    private inUserInputMode = false;
    private completionList: UserCompletionList.Component;

    public render() {
        return (
            <div class='TextFormatInput'>
                <div ref='contentEditable' class='TextFormatInputContentEditable' contenteditable='true'/>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        let self = this;

        interface LineAndColumn {
            line: number;
            column: number;
        }

        interface SelectionPoint extends LineAndColumn {
            index: number;
            textFormat: DOMElement;
        }

		interface TextSelection {
			start: SelectionPoint;
            end: SelectionPoint;
            isCaret: boolean;
		}

        interface TextLine {
            element: DOMElement;
            textFormats: DOMElement[];
        }

        // '&#8203;' is a zero width space character to create a text node.
        // A text node would not be created with empty text ''.
        const zeroWidthSpaceText = '&#8203;';
        const nonBreakingSpaceText = '&nbsp;';

        const textInput = this.elements.contentEditable;
		let nativeTextInput = textInput.nativeElement as HTMLInputElement;
        let lines: TextLine[] = [];

        textInput.addEventListener('paste', onPaste);
        textInput.addEventListener('keydown', onKeyDown);
        textInput.addEventListener('keypress', onKeyPress);
        textInput.addEventListener('blur', onBlur);

        let selectingUser = false;
        function onBlur() {

            // The blurring must occur after a user selection with mouse click.
            setTimeout(() => {
                if (!selectingUser) {
                    hideUserCompletionListAndUnsetUserInputMode();
                }
            }, 0);
        }

        function readLinesAndFormats() {
            lines = [];
            let textFormatLines = textInput.findAll('.TextFormatLine');
            for (let l of textFormatLines) {
                let foundTextFormats =  l.findAll('.TextFormat, .UsernameTextFormat');
                lines.push({
                    element: l,
                    textFormats: foundTextFormats,
                });
            }
        }

        function isUsernameChar(char: string): boolean {
            return /[a-zA-Z-9_]/.test(char);
        }

		function startAndEndIsOnTheSameColumn(textSelection: TextSelection): boolean {
			if (textSelection.start.line !== textSelection.end.line) {
				return false;
			}
			else if (textSelection.start.column !== textSelection.end.column) {
				return false;
			}
			return true;
		}

        function getTextSelection(): TextSelection {
            const selection = window.getSelection();
            let selectionStartNode: Node;
            let selectionEndNode: Node;
            let selectionStartIndex: number;
            let selectionEndIndex: number;

            let selectionWasInDocumentOrder = false;
            const anchorLineAndColumn = getLineAndColumn(selection.anchorNode);
            const focusLineAndColumn = getLineAndColumn(selection.focusNode);
            if (anchorLineAndColumn.line < focusLineAndColumn.line) {
                selectionWasInDocumentOrder = true;
            }
            else if (anchorLineAndColumn.line === focusLineAndColumn.line) {
                if (anchorLineAndColumn.column < focusLineAndColumn.column) {
                    selectionWasInDocumentOrder = true;
                }
				else if (anchorLineAndColumn.column === focusLineAndColumn.column) {
					if (selection.anchorOffset < selection.focusOffset) {
                    	selectionWasInDocumentOrder = true;
					}
				}
            }

            if (selectionWasInDocumentOrder) {
                selectionStartNode = selection.anchorNode;
                selectionEndNode = selection.focusNode;
                selectionStartIndex = selection.anchorOffset;
                selectionEndIndex = selection.focusOffset;
            }
            else {
                selectionStartNode = selection.focusNode;
                selectionEndNode = selection.anchorNode;
                selectionStartIndex = selection.focusOffset;
                selectionEndIndex = selection.anchorOffset;
            }

            let isCaret = selectionStartNode === selectionEndNode &&
                selectionStartIndex === selectionEndIndex;

            return {
                start: extend(selectionWasInDocumentOrder ? anchorLineAndColumn : focusLineAndColumn, {
                    index: selectionStartIndex,
                    textFormat: new DOMElement(selectionStartNode.parentElement)
                }),
                end: extend(selectionWasInDocumentOrder ? focusLineAndColumn : anchorLineAndColumn, {
                    index: selectionEndIndex,
                    textFormat: new DOMElement(selectionEndNode.parentElement)
                }),
                isCaret,
            }
        }

        function getLineAndColumn(node: Node): LineAndColumn {
            for (let line = 0; line < lines.length; line++) {
                for (let column = 0, formats = lines[line].textFormats; column < formats.length; column++) {
                    if (formats[column].nativeElement === node.parentElement) {
                        return {
                            line,
                            column,
                        }
                    }
                }
            }

            throw new Error('Could not get index of format node.')
        }

        function removeLineBreak() {
            let breakings = textInput.findAll('br');
            for (let b of breakings) {
                b.remove();
            }
        }

        function moveCaretTo(line: number, column: number, index: number) {
            let range = document.createRange();
            if (!lines[line].textFormats[column]) {
                throw new TypeError(`Line '${line}' and column ${column} could not be found in ${JSON.stringify(lines, null, 4)}.` );
            }
            let textNode = getTextNode(lines[line].textFormats[column]);
            range.setStart(textNode, index);
            range.setEnd(textNode, index);
            let selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        function removeTextFormat(textFormat: DOMElement) {
            let lineElement = textFormat.getParentElement();
            if (lineElement.getChildren().length === 1) {
                lineElement.remove();
            }
            else {
                textFormat.remove();
            }

            outer:
            for (let line = lines.length - 1; line >= 0; line--) {
                for (let formats = lines[line].textFormats, column = formats.length - 1; column >= 0; column--) {
                    if (formats[column].nativeElement === textFormat.nativeElement) {
                        formats.splice(column, 1);
                        if (formats.length === 0) {
                            lines.splice(line, 1);
                        }
                        break outer;
                    }
                }
            }
        }

        function getTextFormatBefore(textFormat: DOMElement): DOMElement {
            let foundCurrent = false;
            for (let line = 0; line < lines.length; line++) {
                for (let column = 0, formats = lines[line].textFormats; column < formats.length; column++) {
                    if (textFormat.nativeElement === lines[line].textFormats[column].nativeElement) {
                        if (lines[line].textFormats[column - 1]) {
                            return lines[line].textFormats[column - 1];
                        }
                        let previousLinesTextFormat = lines[line - 1].textFormats;
                        return previousLinesTextFormat[previousLinesTextFormat.length - 1];
                    }
                }
            }

            return undefined;
        }

        function getTextFormatAfter(textFormat: DOMElement): DOMElement {
            let foundCurrent = false;
            for (let line = 0; line < lines.length; line++) {
                for (let column = 0, formats = lines[line].textFormats; column < formats.length; column++) {
                    if (foundCurrent) {
                        return lines[line].textFormats[column];
                    }
                    if (textFormat.nativeElement === lines[line].textFormats[column].nativeElement) {
                        foundCurrent = true;
                    }
                }
            }

            return undefined;
        }

        function getTextNode(textFormat: DOMElement): Node {
            return textFormat.nativeElement.firstChild;
        }

        function createNewLineAfterLine(afterLine: number) {
            const element = new DOMElement('div');
            element.addClass('TextFormatLine');
            if (lines[afterLine]) {
                lines[afterLine].element.insertAfter(element);
            }
            else {
                textInput.append(element);
            }
            lines.splice(afterLine + 1, 0, {
                element,
                textFormats: [],
            });
        }

        function createNormalTextFormat(line: number, column: number, text?: string, index?: number) {
            let { textFormat, textFormatIndex } = createTextFormat(line, column, text, 'TextFormat');
            moveCaretTo(line, column, typeof index === 'number' ? index : text ? text.length : 1);
        }

        function createUsernameTextFormat(line: number, column: number, text?: string, index?: number) {
            let { textFormat, textFormatIndex } = createTextFormat(line, column, text, 'UsernameTextFormat');
            moveCaretTo(line, column, typeof index === 'number' ? index : text ? text.length : 1);
        }

        function createTextFormat(line: number, column: number, text: string, cssClass: string): { textFormat: DOMElement, textFormatIndex: number} {
            let textFormat = new DOMElement('span');
            textFormat.addClass(cssClass);

            if (!lines[line]) {
                throw new TypeError(`Line is not defined yet: '${line}`);
            }

			if (text) {
				text = encodeHTML(text);
				text = text.replace(' ', nonBreakingSpaceText);
			}

            textFormat.setHTML(text || zeroWidthSpaceText);
            if (!lines[line].textFormats[column]) {
                lines[line].element.append(textFormat);
            }
            else {
                lines[line].textFormats[column].insertBefore(textFormat);
            }
            lines[line].textFormats.splice(column, 0, textFormat);

            return { textFormat, textFormatIndex: 0 };
        }

        function getStartSelectionNode(textSelection: TextSelection): DOMElement {
            return lines[textSelection.start.line].textFormats[textSelection.start.column];
        }

        function removeAllTextInTextSelection(textSelection: TextSelection) {
            const startTextFormat = textSelection.start.textFormat;
            const endTextFormat = textSelection.end.textFormat;
            if (textSelection.start.line === textSelection.end.line &&
                textSelection.start.column === textSelection.end.column) {

                const text = startTextFormat.getText();
                const startText = text.slice(0, textSelection.start.index);
                const endText = text.slice(textSelection.end.index, text.length);
                startTextFormat.setHTML(startText + endText);
            }
            else {
                let startLine = textSelection.start.line;
                let startColumn = textSelection.start.column + 1;
                if (!lines[startLine].textFormats[startColumn]) {
                    startLine = startLine + 1;
                    let nextTextFormats = lines[startLine].textFormats;
                    startColumn = 0;
                    nextTextFormats[startColumn];
                }

				let firstColumnInLine = 0;

                for (let line = textSelection.end.line; line >= startLine; line--) {
					firstColumnInLine = line === startLine ? startColumn : 0;
                    for (let column = lines[line].textFormats.length - 1,
						formats = lines[line].textFormats;
						column >= firstColumnInLine; column--) {

                        if (line === textSelection.end.line &&
							column >= textSelection.end.column) {

							continue;
                        }
                        removeTextFormat(formats[column]);
                    }
                }

                rewriteStartTextFormatText();
                const endTextFormat = getTextFormatAfter(startTextFormat);

				// We want to put a space between two username text formatting
				if (startTextFormat.hasClass('UsernameTextFormat') &&
					!startAndEndIsOnTheSameColumn(textSelection)) {

					let endTextFormatText = endTextFormat.getText().slice(textSelection.end.index);
					if (endTextFormatText.charCodeAt(0) !== CharCode.NonBreakingSpace) {
						endTextFormatText = ' ' + endTextFormatText;
					}
					createNormalTextFormat(textSelection.start.line, textSelection.start.column + 1, endTextFormatText);
                	removeTextFormat(endTextFormat);
				}
                else {
                	insertEndNodesTextInstartTextFormatAndRemoveEndNode(endTextFormat);
                }
            }
            textSelection.end.index = textSelection.start.index;
            textSelection.end.column = textSelection.start.column;

            if (startTextFormat.hasClass('UsernameTextFormat') && textSelection.start.index !== 0) {
                showCompletionList(startTextFormat.getText(), startTextFormat, textSelection);
            }

            function rewriteStartTextFormatText() {
                const startTextFormat = textSelection.start.textFormat;
                const text = startTextFormat.getText();
                const newText = text.slice(0, textSelection.start.index);
                startTextFormat.setHTML(newText);
            }

            function insertEndNodesTextInstartTextFormatAndRemoveEndNode(endTextFormat: DOMElement) {
                const startTextFormat = textSelection.start.textFormat;
                const text = endTextFormat.getText();
                const newText = text.slice(textSelection.end.index, text.length);
                startTextFormat.setHTML(startTextFormat.getHTML() + newText);
                removeTextFormat(endTextFormat);
            }
        }

        function showCompletionList(query: string, usernameTextFormat: DOMElement, textSelection: TextSelection) {
            self.inUserInputMode = true;
            self.showUserCompletionList(query, usernameTextFormat);
            self.completionList.on('beforeselect', () => {
                selectingUser = true;
            });
            self.completionList.on('select', (user: UserResult) => {
                hideUserCompletionListAndUnsetUserInputMode();
                usernameTextFormat.setHTML('@' + user.username);
                const nextColumn = textSelection.start.column + 1;
                let nextTextFormat = getTextFormatAfter(usernameTextFormat);
                if (nextTextFormat) {
                    let nextTextFormatText = nextTextFormat.getText();
                    if (nextTextFormatText.charCodeAt(0) !== CharCode.NonBreakingSpace) {
                        nextTextFormat.setHTML(nonBreakingSpaceText + nextTextFormat.getHTML());
                    }
                }
                else {
                    createNormalTextFormat(textSelection.start.line, nextColumn, ' ');
                }
                moveCaretTo(textSelection.start.line, nextColumn, 1);
                self.inUserInputMode = false;
                selectingUser = false;
            });
        }

        function hideUserCompletionListAndUnsetUserInputMode() {
            self.hideUserCompletionList();
            self.inUserInputMode = false;
        }

        function onKeyPress(event: KeyboardEvent) {

            // We do not handle backspace key codes. Firefox executes this handler, whereas Chrome and
            // Safari does not execute. For Firefox we just want to return.
            if (event.keyCode === KeyCode.BackSpace || event.metaKey) {
                return;
            }

			event.preventDefault();

            // Erasing of content is mostly done by the browser. So lines and text formats
            // would be out of sync. We need to read in those lines again.
            readLinesAndFormats();

            let char = String.fromCharCode(event.charCode);
            if (event.keyCode === KeyCode.Return) {
                addNewLine();
                return;
            }

            if (lines.length === 0) {
                createNewLineAfterLine(-1);
            }

			if (lines[0].textFormats.length === 0) {
                if (char === '@') {
                    createUsernameTextFormat(0, 0, char);
                }
                else {
                    createNormalTextFormat(0, 0, char);
                }
				return;
            }

			const textSelection = getTextSelection();
			removeAllTextInTextSelection(textSelection);
            if(char === '@') {
                self.inUserInputMode = true;
                createUsernameTextFormat(textSelection.start.line, textSelection.start.column + 1, char);
                return;
            }
            const startTextFormat = textSelection.start.textFormat;
            let text = startTextFormat.getText();
            if (text.charCodeAt(0) === CharCode.ZeroWidthSpace) {

                // We don't want to hit backspace on a zero width space character. So we will remove
                // the zero width space character as soon it is no longer needed, i.e. as soon as we
                // add a new character.
                text = '';

                addChar();
                moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index);
                return;
            }
            else if (self.inUserInputMode) {
                if (isUsernameChar(char)) {
                    addChar();
                    moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index + 1);
                    showCompletionList(startTextFormat.getText(), startTextFormat, textSelection);
                }
                else {
                    let usernameTextFormat = textSelection.start.textFormat;
                    if (usernameTextFormat.getText() === '@') {
                        removeTextFormat(usernameTextFormat);
                        createNormalTextFormat(textSelection.start.line, textSelection.start.column, char);
                    }
                    else {
                        createNormalTextFormat(textSelection.start.line, textSelection.start.column + 1, char);
                    }
                    self.hideUserCompletionList();
                    self.inUserInputMode = false;
                }
            }
            else {
                addChar();
                moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index + 1);
            }

			return;

            function addNewLine() {

                // If we are in a total empty input we want to be in the second line when
                // we hit enter.
                if (lines.length === 0 || lines[0].textFormats.length === 0) {
                    for (let i = -1; i < 1; i++) {
                        createNewLineAfterLine(i);
                        createNormalTextFormat(i + 1, 0);
                    }
                }
                else {
                    const textSelection = getTextSelection();
                    const startTextFormat = textSelection.start.textFormat;
                    const text = startTextFormat.getText();
                    if (textSelection.start.index === text.length) {
                        createNewLineAfterLine(textSelection.start.line);
                        createNormalTextFormat(textSelection.start.line + 1, 0);
                    }
                    else {
				        const startText = text.slice(0, textSelection.start.index);
                        const endText = text.slice(textSelection.end.index, text.length);
                        startTextFormat.setHTML(startText !== '' ? startText : zeroWidthSpaceText);
                        createNewLineAfterLine(textSelection.start.line);
                        createNormalTextFormat(textSelection.start.line + 1, 0, endText, 0);
                    }
                }
            }

			function addChar() {
				const startText = text.slice(0, textSelection.start.index);
				const endText = text.slice(textSelection.start.index, text.length);
                if (char in charToHTMLEntity) {
                    char = charToHTMLEntity[char];
                }
                if (char === ' ') {
                    char = nonBreakingSpaceText;
                }
				const newText =  startText + char + endText;
				startTextFormat.setHTML(newText);
			}
        }

        function onPaste(event: ClipboardEvent) {
            event.preventDefault();

            let textLines = event.clipboardData.getData('text').split('\n');

            if (lines.length === 0 || lines[0].textFormats.length === 0) {
                createNewLineAfterLine(0);
                createNormalTextFormat(0, 0, textLines[0]);
                return;
            }

			const textSelection = getTextSelection();
			removeAllTextInTextSelection(textSelection);
			const startTextFormat = textSelection.start.textFormat;
            let text = startTextFormat.getText();

            // We want to remove a zero width space character as soon as we can.
            if (text.charCodeAt(0) === CharCode.ZeroWidthSpace) {
                text = '';
                textSelection.start.index--;
                if (textSelection.start.line === textSelection.end.line &&
                    textSelection.start.column === textSelection.end.column) {

                    textSelection.end.index--;
                }
            }

            const startText = text.slice(0, textSelection.start.index);
            const endText = text.slice(textSelection.end.index, text.length);
            insertFirstTextSpanOnstartTextFormat();
            if (textLines.length > 1) {
                insertLines();
            }

            function insertFirstTextSpanOnstartTextFormat() {
                if (textLines.length === 1) {
                    const newText = startText + textLines[0] + endText;
                    startTextFormat.setHTML(newText);
                    moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.end.index + textLines[0].length);
                }
                else {
                    const newText = startText + textLines[0];
                    startTextFormat.setHTML(newText);
                }
            }

            function insertLines() {
                for (let i = 1; i < textLines.length; i++) {
                    let line = textSelection.start.line + i;
                    createNewLineAfterLine(line);
                    if (i === textLines.length - 1) {
                        createNormalTextFormat(line, 0, textLines[i] + endText, textLines[i].length);
                    }
                    else {
                        createNormalTextFormat(line, 0, textLines[i]);
                    }
                }
            }
        }

        function onKeyDown(event: KeyboardEvent) {

            // Erasing of content is done by the browser. So lines and and text formats
            // would be out of sync. We need to read in those lines again.
            readLinesAndFormats();

            // The browser inserts <br> when we empty a text node.
            removeLineBreak();

            if (lines.length === 0 || lines[0].textFormats.length === 0) {
                return;
            }

			const textSelection = getTextSelection();
			const startTextFormat = textSelection.start.textFormat;
			const endTextFormat = textSelection.end.textFormat;
            const text = startTextFormat.getText();
            switch (event.keyCode) {
                case KeyCode.BackSpace:
                    handleBackSpace();
                    return;
                case KeyCode.Delete:
                    handleDelete();
                    return;
                case KeyCode.LeftArrow:
                case KeyCode.RightArrow:
                case KeyCode.UpArrow:
                case KeyCode.DownArrow:
                case KeyCode.Return:
                    handleUserInputModeNavigation();
                    return;
            }

            function handleBackSpace() {
                if ((textSelection.start.index === 1 || textSelection.start.index == 0) && startTextFormat.hasClass('UsernameTextFormat')) {
                    removeAllTextInTextSelection(textSelection);
                    removeTextFormat(startTextFormat);
                    self.hideUserCompletionList();
                    self.inUserInputMode = false;
                    let column: number;
                    if (column = textSelection.start.column - 1, lines[textSelection.start.line].textFormats[column]) {
                        moveCaretTo(
                            textSelection.start.line,
                            column,
                            lines[textSelection.start.line].textFormats[column].getText().length
                        );
                    }
                    else {
                        let previousLine = textSelection.start.line - 1;
                        let previousLineTextFormats = lines[previousLine].textFormats;
                        let lastTextFormatIndex = previousLineTextFormats.length - 1;
                        moveCaretTo(previousLine, lastTextFormatIndex, previousLineTextFormats[lastTextFormatIndex].getText().length);
                    }
                    event.preventDefault();
                    return;
                }

                handleUserInputErasure(/* isDeletion */ false);

                // We want to be on the first column of the current line if we hold down the meta key or
                // if we stand in the second column and hit backspace.
                //
                // And we don't want it to stop being in the current line if the current line is already
                // empty.
                if (((text.length === 1 && textSelection.start.index === 1) || event.metaKey) &&
                    text.charCodeAt(0) !== CharCode.ZeroWidthSpace) {

                    // If we hold down the meta key it should delete the current line's text formats.
                    if (event.metaKey) {
                        const currentLineTextFormats = lines[textSelection.start.line].textFormats;
                        const firstLineTextformatInLine = currentLineTextFormats[0];
                        const length = currentLineTextFormats.length;
                        for(let i = length - 1; i > 0; i--) {
                            removeTextFormat(currentLineTextFormats[i]);
                        }
                        firstLineTextformatInLine.setHTML(zeroWidthSpaceText);
                        moveCaretTo(textSelection.start.line, 0, 1);
                        this.hideUserCompletionList();
                    }
                    else {
                        startTextFormat.setHTML(zeroWidthSpaceText);
                        moveCaretTo(textSelection.start.line, textSelection.start.column, 1);
                    }
                    event.preventDefault();
                    return;
                }

                if (text.charCodeAt(0) === CharCode.ZeroWidthSpace) {
                    let previous = getLineColumnAndPreviousTextFormat();
                    if (!previous) {
                        return;
                    }
                    let { line, column, previousTextFormat } = previous;
                    removeTextFormat(startTextFormat);
                    if (previousTextFormat) {

                        // We want to remove username text format if we hit backspace after an username
                        // text format.
                        if (previousTextFormat.hasClass('UsernameTextFormat')) {
                            removeTextFormat(previousTextFormat);

                            // It always exists at least a text format with zero width character before a username text format.
                            let previousPreviousColumn = column - 1;
                            moveCaretTo(line, previousPreviousColumn, lines[line].textFormats[previousPreviousColumn].getText().length);
                        }
                        else {
                            moveCaretTo(line, column, previousTextFormat.getText().length);
                        }

                        event.preventDefault();
                    }
                    return;
                }

                if (textSelection.start.index === 0 &&
                    text.length > 0 &&

                    // Not in line 0 and column 0
                    !(textSelection.start.line === 0 && textSelection.start.column === 0)) {

                    let { line, column, previousTextFormat } = getLineColumnAndPreviousTextFormat();
                    let previousTextFormatText = previousTextFormat.getText();
                    if (previousTextFormatText.charCodeAt(0) === CharCode.ZeroWidthSpace) {
                        previousTextFormatText = '';
                    }
                    const newText = previousTextFormatText + text;
                    previousTextFormat.setHTML(newText);
                    moveCaretTo(line, column, previousTextFormatText.length);
                    removeTextFormat(startTextFormat);
                    event.preventDefault();
                    return;
                }
            }

            function handleUserInputErasure(isDeletion: boolean) {
                if (self.inUserInputMode) {
                    if (text.length > 2) {
                        let text = startTextFormat.getText();
                        if (isDeletion) {
                            text = text.slice(0, textSelection.start.index) + text.slice(textSelection.start.index + 1);
                        }
                        else {
                            text = text.slice(0, textSelection.start.index - 1) + text.slice(textSelection.start.index);
                        }
                        showCompletionList(text, startTextFormat, textSelection);
                    }
                    else {
                        self.hideUserCompletionList();
                    }
                }
                else if (startTextFormat.hasClass('UsernameTextFormat')) {
                    const text = startTextFormat.getText();
                    if (text.length > 2 && textSelection.start.index !== 0) {
                        showCompletionList(text, startTextFormat, textSelection);
                    }

                    // Add a new line after username text formatting to make it prettier.
					//
					// Handling special case 1 (Empty username text format):
					//
					//     We can some times stand on the last index of username text format's text without being in a user
					//     input mode. E.g. navigating with left/right arrow keys. And when we hit backspace. In those cases
					//     the text selection is a caret. And the start and end text format is the username text format. And
					//     we are cutting en empty part of the text with `textAfterUsernameText.slice(textSelection.end.index)`.
					//     Thus, we get an empty username text with `textSelection.end.textFormat.setHTML(newLineText)`.
					if (!startAndEndIsOnTheSameColumn(textSelection)) {

						removeAllTextInTextSelection(textSelection);
						moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index);
						event.preventDefault();
						return;
					}
                }
				else if (endTextFormat.hasClass('UsernameTextFormat')) {
					if (!startAndEndIsOnTheSameColumn(textSelection)) {
                        self.inUserInputMode = false;
                        removeAllTextInTextSelection(textSelection);
						moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index);
						event.preventDefault();
						return;
					}
				}
            }

            function handleDelete() {

                // If we are in the last column of a text format. And the next text format is a username text
                // format, then we want it to erase the whole username text format.
                const endTextFormat = lines[textSelection.end.line].textFormats[textSelection.end.column];
                const textLength = endTextFormat.getText().length;
                if (textSelection.end.index === textLength) {
                    const nextTextFormat = getTextFormatAfter(endTextFormat);
                    if (nextTextFormat.hasClass('UsernameTextFormat')) {
                        removeTextFormat(nextTextFormat);
                        event.preventDefault();
                    }
                    return;
                }

                // If we hit delete and there is only one character left, we want to insert a zero width character.
                // And we also want to remove the current line if there are lines after the current line.
                if (textSelection.start.index === 0) {

                    if (text.length === 1) {
                        const nextTextFormat = getTextFormatAfter(endTextFormat);
                        if (nextTextFormat && nextTextFormat.hasClass('UsernameTextFormat')) {
                            removeTextFormat(nextTextFormat);
                        }
                        else {
                            const startTextFormat = textSelection.start.textFormat;

                            if (lines[textSelection.start.line + 1]) {
                                removeTextFormat(startTextFormat);
                                moveCaretTo(textSelection.start.line, 0, 0);
                            }
                            else {
                                startTextFormat.setHTML(zeroWidthSpaceText);
                            }
                        }
                        event.preventDefault();
                    }
                }

                handleUserInputErasure(/* isDeletion */ true);
            }

            function handleUserInputModeNavigation() {
                if (self.inUserInputMode) {
                    switch (event.keyCode) {
                        case KeyCode.UpArrow:
                            self.completionList.decrementActiveIndex();
                            event.preventDefault();
                            return;
                        case KeyCode.DownArrow:
                            self.completionList.incrementActiveIndex();
                            event.preventDefault();
                            return;
                        case KeyCode.Return:
                            returnUsername();
                            return;
                        case KeyCode.LeftArrow:
                            if (textSelection.isCaret && textSelection.start.index - 1 <= 0) {
                                self.hideUserCompletionList();
                                self.inUserInputMode = false;
                            }
                            return;
                        case KeyCode.RightArrow:
                            if (textSelection.isCaret && textSelection.end.index + 1 > textSelection.end.textFormat.getText().length) {
                                self.hideUserCompletionList();
                                self.inUserInputMode = false;
                            }
                            return;
                    }
                }
                else {
                    handleNavigationIntoUserInputMode();
                }

                function handleNavigationIntoUserInputMode() {
                    switch(event.keyCode) {
                        case KeyCode.LeftArrow:
                            if (textSelection.isCaret) {

                                // Text selection index 0 cannot be achieved. Then we are practically in the last index
                                // of the previous text format.
                                if (textSelection.start.index === 1) {

                                    let previousTextFormat = getTextFormatBefore(startTextFormat);
                                    if (previousTextFormat.hasClass('UsernameTextFormat')) {
                                        showCompletionList(previousTextFormat.getText(), previousTextFormat, textSelection);
                                    }
                                }

                                else if (startTextFormat.hasClass('UsernameTextFormat')) {
                                    showCompletionList(startTextFormat.getText(), startTextFormat, textSelection);
                                }
                            }
                            break;
                        case KeyCode.RightArrow:
                            if (textSelection.isCaret) {
                                if (textSelection.start.index === startTextFormat.getText().length) {
                                    let previousTextFormat = getTextFormatAfter(startTextFormat);
                                    if (previousTextFormat.hasClass('UsernameTextFormat')) {
                                        self.showUserCompletionList(previousTextFormat.getText(), previousTextFormat);
                                        self.inUserInputMode = true;
                                    }
                                }

                                else if (startTextFormat.hasClass('UsernameTextFormat')) {
                                    showCompletionList(startTextFormat.getText(), startTextFormat, textSelection);
                                }
                            }
                            break;
                    }
                }

                function returnUsername() {
                    startTextFormat.setHTML(self.completionList.getCurrentUsername());
                    self.hideUserCompletionList();
                    self.inUserInputMode = false;
                    const nextColumn = textSelection.start.column + 1;
                    let nextTextFormat = getTextFormatAfter(startTextFormat);
                    if (nextTextFormat) {
                        let nextTextFormatText = nextTextFormat.getText();
                        if (nextTextFormatText.charCodeAt(0) !== CharCode.NonBreakingSpace) {
                            nextTextFormat.setHTML(nonBreakingSpaceText + nextTextFormat.getHTML());
                        }
                    }
                    else {
                        createNormalTextFormat(textSelection.start.line, nextColumn, ' ');
                    }
                    moveCaretTo(textSelection.start.line, nextColumn, 1);
                    event.preventDefault();
                }
            }

            function getLineColumnAndPreviousTextFormat(): { line: number, column: number, previousTextFormat: DOMElement } {
                let { line, column } = textSelection.start;
                column = column - 1;
                let previousTextFormat = lines[line].textFormats[column];
                if (!previousTextFormat) {
                    line = line - 1;
                    if (!lines[line]) {
                        return null;
                    }
                    let previousFormats = lines[line].textFormats;
                    column = previousFormats.length - 1;
                    previousTextFormat = previousFormats[column];
                }

                return { line, column, previousTextFormat };
            }
        };
    }

    private showUserCompletionList(query: string, textFormat: DOMElement, moveCaretTo?: (line: number, column: number, index: number) => void): void {
        let { left, top } = textFormat.getOffset();
        top += textFormat.getHeight();

        if (!this.completionList) {
            this.completionList = new UserCompletionList.Component({
                data: this.data,
                l: this.props.l,
                left,
                top,
            });
            this.root.append(this.completionList.toDOM());
        }
        this.completionList.showCompletionList(query)
            .catch((err) => {
                console.log(err.stack || err);
                this.hideUserCompletionList();
                this.inUserInputMode = false;
            });
    }

    private hideUserCompletionList(): void {
        if (this.completionList) {
            this.completionList.remove();
            this.completionList = null;
        }
    }
}


namespace UserCompletionList {
    interface Props {
        left: number;
        top: number;
    }

    interface Elements {
        list: DOMElement;
        loadingDescription: DOMElement;
    }

    interface Text {
        loadingUsersDescription: string;
        usersNotFoundDescription: string;
    }

    export class Component extends ContentComponent<Props, Text, Elements> {
        public data: UserMe;
        public textFormat: DOMElement;
        private lastQuery: string;
        private activeResultIndex = 0;
        private latestResult: UserResult[];
        private listItems: DOMElement[] = [];

        public showCompletionList(query: string) {
            this.lastQuery = query;
            return new Promise<void>((resolve, reject) => {
                ((query: string) => {
                    this.data.findAll(query, 5)
                        .then((users) => {
                            if (query !== this.lastQuery) {
                                return;
                            }

                            this.activeResultIndex = 0;
                            this.root.setHTML('');
                            this.latestResult = users;
                            let element = this.getUserResultElement(users as UserResult[]);
                            element.setComponent(this);
                            this.root.append(element);

                            this.listItems = this.elements.list.findAll('.UserCompletionListItem');
                            this.listItems.forEach((element) => {
                                element.addEventListener('mousedown', this.onBeforeSelect);
                                element.addEventListener('click', this.selectItem);
                                element.addEventListener('mouseenter', this.setItemActive);
                            });
                            this.root.addEventListener('mouseleave', () => {
                                this.unactivateAllItems();
                                this.listItems[this.activeResultIndex].addClass('Active');
                            });
                        })
                        .catch(reject);
                })(query);
            });
        }

        public remove() {
            super.remove();
        }

        @autobind
        private onBeforeSelect() {
            this.emit('beforeselect', [this.latestResult[(event.currentTarget as any).getAttribute('data-index')]]);
        }

        @autobind
        private selectItem(event: MouseEvent) {
            this.emit('select', [this.latestResult[(event.currentTarget as any).getAttribute('data-index')]]);
        }

        private unactivateAllItems() {
            this.listItems.forEach((element) => element.removeClass('Active'));
        }

        @autobind
        private setItemActive(event: MouseEvent) {
            this.unactivateAllItems();
            new DOMElement(event.target as Node).addClass('Active');
        }

        public getCurrentUsername(): string {
            return '@' + this.latestResult[this.activeResultIndex].username;
        }

        public incrementActiveIndex() {
            if (this.latestResult) {
                if (this.activeResultIndex + 1 < this.latestResult.length) {
                    this.setActiveItem(++this.activeResultIndex);
                }
                else {
                    this.activeResultIndex = 0;
                    this.setActiveItem(this.activeResultIndex);
                }
            }
        }

        public decrementActiveIndex() {
            if (this.latestResult) {
                if (this.activeResultIndex - 1 >= 0) {
                    this.setActiveItem(--this.activeResultIndex);
                }
                else {
                    this.activeResultIndex = this.latestResult.length - 1;
                    this.setActiveItem(this.activeResultIndex);
                }
            }
        }

        private setActiveItem(index: number) {
            this.root.findAll('.UserCompletionListItem').forEach((element) => element.removeClass('Active'));
            this.root.findOne('#UserCompletionListItem' + index).addClass('Active');
        }

        private getUserResultElement(users: UserResult[]): JSX.Element {
            if (users.length > 0) {
                let userListElements: JSX.Element[] = [];
                users.forEach((u, i) => {
                    userListElements.push(
                        <li id={'UserCompletionListItem' + i} class={'UserCompletionListItem' + (i === 0 ? ' Active' : '')} data-index={i}>
                            <img class='UserCompletionListItemImage' src={u.image ? u.image.tiny.url : '/Public/Images/ProfileImagePlaceholder.png'}/>
                            <div class='UserCompletionListItemNameAndUsernameContainer'>
                                <div class='UserCompletionListItemName HeaderBlack4'>{u.name}</div>
                                <div class='UserCompletionListItemUsername UsernameText'>{'@' + u.username}</div>
                            </div>
                        </li>
                    );
                });

                return <ul ref='list' class='UserCompletionList'>{userListElements}</ul>;
            }
            else {
                return (
                    <div class='UserCompletionsListEmptyView'>
                        <div class='UserCompletionListEmptyViewDescription HeaderBlack4'>{this.text.usersNotFoundDescription}</div>
                    </div>
                );
            }
        }

        public render(): JSX.Element {
            return (
                <div class='UserCompletionListContainer' style={`left: ${this.props.left}px; top: ${this.props.top}px`}>
                    <div ref='loadingDescription' class='UserCompletionListLoadingViewDescription HeaderBlack4'>{this.text.loadingUsersDescription}</div>
                </div>
            );
        }

        public setText(l: GetLocalization): void {
            this.text = {
                loadingUsersDescription: l('USERS_COMPLETION_LIST->LOADING_USERS_DESCRIPTION'),
                usersNotFoundDescription: l('USERS_COMPLETION_LIST->USERS_NOT_FOUND_DESCRIPTION')
            }
        }
    }
}