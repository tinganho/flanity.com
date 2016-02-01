
'use strict';

import { React, ContentComponent, DOMElement, PageInfo, charToHTMLEntity, extend } from '../Library/Index';

interface Props {
}

interface Elements {
}

interface Text {
}

export class TextFormatInput extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div class='TextFormatInput' contenteditable='true'/>
        );
    }

    public bindDOM() {
        super.bindDOM();

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
            formats: DOMElement[];
        }

        const ZeroWidthSpaceCode = 8203;
        const zeroWidthSpaceText = '&#8203;';

        const enum KeyCode {
            Return = 13,
            BackSpace = 8,
            Delete = 46,
        }

        const textInput = this.root;
		let nativeTextInput = textInput.nativeElement as HTMLInputElement;
        let lines: TextLine[] = [];

        function readLinesAndFormats() {
            lines = [];
            let textFormatLines = textInput.findAll('.TextFormatLine');
            for (let l of textFormatLines) {
                let foundTextFormats =  l.findAll('.TextFormat, .UsernameTextFormat');
                lines.push({
                    element: l,
                    formats: foundTextFormats,
                });
            }
        }

        function isUsernameCharCode(char: string): boolean {
            return /[a-zA-Z-9_]/.test(char);
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
                if (selection.anchorOffset < selection.focusOffset) {
                    selectionWasInDocumentOrder = true;
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
                for (let column = 0, formats = lines[line].formats; column < formats.length; column++) {
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
            if (!lines[line].formats[column]) {
                throw new TypeError(`Line '${line}' and column ${column} could not be found in ${JSON.stringify(lines, null, 4)}.` );
            }
            let textNode = getTextNode(lines[line].formats[column]);
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
            for (let line = 0; line < lines.length; line++) {
                for (let column = 0, formats = lines[line].formats; column < formats.length; column++) {
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

        function getTextFormatAfter(node: DOMElement) {
            let foundCurrent = false;
            for (let line = 0; line < lines.length; line++) {
                for (let column = 0, formats = lines[line].formats; column < formats.length; column++) {
                    if (foundCurrent) {
                        return lines[line].formats[column];
                    }
                    if (node.nativeElement === lines[line].formats[column].nativeElement) {
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
                formats: [],
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
            // '&#8203;' is a zero width space character to create a text node.
            // A text node would not be created with empty text ''.
            textFormat.setHTML(text || zeroWidthSpaceText);
            if (!lines[line].formats[column]) {
                lines[line].element.append(textFormat);
            }
            else {
                lines[line].formats[column].insertAfter(textFormat);
            }
            lines[line].formats.splice(column, 0, textFormat);

            let index = 0;

            return { textFormat, textFormatIndex: index };
        }

        function getStartSelectionNode(textSelection: TextSelection): DOMElement {
            return lines[textSelection.start.line].formats[textSelection.start.column];
        }

        function removeTextInSelection(textSelection: TextSelection) {

            if (textSelection.start.line === textSelection.end.line &&
                textSelection.start.column === textSelection.end.column) {

                const startTextFormat = textSelection.start.textFormat;
                const text = startTextFormat.getText();
                const startText = text.slice(0, textSelection.start.index);
                const endText = text.slice(textSelection.end.index, text.length);
                startTextFormat.setHTML(startText + endText);
            }
            else {
                let startLine = textSelection.start.line;
                let startColumn = textSelection.start.column + 1;
                if (!lines[startLine].formats[startColumn]) {
                    startLine = startLine + 1;
                    let nextTextFormats = lines[startLine].formats;
                    startColumn = 0;
                    nextTextFormats[startColumn];
                }

                outer:
                for (let line = startLine; line < lines.length; line++) {
                    for (let column = startColumn, formats = lines[line].formats; column < formats.length; column++) {
                        if (line === textSelection.end.line && column === textSelection.end.column) {
                            break outer;
                        }
                        const intermediateTextFormats = formats[column];
                        removeTextFormat(intermediateTextFormats);
                    }
                }

                rewriteStartTextFormatText();
                insertEndNodesTextInstartTextFormatAndRemoveEndNode();
            }
            textSelection.end.index = textSelection.start.index;
            textSelection.end.column = textSelection.start.column;

            function rewriteStartTextFormatText() {
                const startTextFormat = textSelection.start.textFormat;
                const text = startTextFormat.getText();
                const newText = text.slice(0, textSelection.start.index);
                startTextFormat.setHTML(newText);
            }

            function insertEndNodesTextInstartTextFormatAndRemoveEndNode() {
                const startTextFormat = textSelection.start.textFormat;

                // We have removed intermediate nodes so end node is just one after start node.
                const endTextFormat = getTextFormatAfter(startTextFormat);
                const text = endTextFormat.getText();
                const newText = text.slice(textSelection.end.index, text.length);
                startTextFormat.setHTML(startTextFormat.getText() + newText);
                removeTextFormat(endTextFormat);
            }
        }

        let inUsernameInputMode = false;
        textInput.addEventListener('keypress', (event: KeyboardEvent) => {

            // We do not handle backspace key codes. Firefox executes this handler, whereas Chrome and
            // Safari does not execute. For Firefox we just want to return.
            if (event.keyCode === KeyCode.BackSpace || event.metaKey) {
                return;
            }

			event.preventDefault();

            // Erasing of content is mostly done by the browser. So lines and text Formats
            // would be out of sync. We need to read in those lines again.
            readLinesAndFormats();

            let char = String.fromCharCode(event.charCode);
            if (char in charToHTMLEntity) {
                char = charToHTMLEntity[char];
            }
            else if (event.keyCode === KeyCode.Return) {
                addNewLine();
                return;
            }

            if (lines.length === 0) {
                createNewLineAfterLine(-1);
            }

			if (lines[0].formats.length === 0) {
                if (char === '@') {
                    createUsernameTextFormat(0, 0, char);
                }
                else {
                    createNormalTextFormat(0, 0, char);
                }
				return;
            }

			const textSelection = getTextSelection();
			removeTextInSelection(textSelection);
            if(char === '@') {
                inUsernameInputMode = true;
                createUsernameTextFormat(textSelection.start.line, textSelection.start.column + 1, char);
                return;
            }
            const startTextFormat = textSelection.start.textFormat;
            let text = startTextFormat.getText();
            if (text.charCodeAt(0) === ZeroWidthSpaceCode) {

                // We don't want to hit backspace on a zero width space character. So we will remove
                // the zero width space character as soon it is no longer needed, i.e. as soon as we
                // add a new character.
                text = '';

                addChar();
                moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index);
            }
            else {
                addChar();
                moveCaretTo(textSelection.start.line, textSelection.start.column, textSelection.start.index + 1);
            }

			return;

            function addNewLine() {

                // If we are in a total empty input we want to be in the second line when
                // we hit enter.
                if (lines.length === 0 || lines[0].formats.length === 0) {
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
				const newText =  startText + char + endText;
				startTextFormat.setHTML(newText);
			}
        });

        textInput.addEventListener('paste', (event: ClipboardEvent) => {
            event.preventDefault();

            let textLines = event.clipboardData.getData('text').split('\n');

            if (lines.length === 0 || lines[0].formats.length === 0) {
                createNewLineAfterLine(0);
                createNormalTextFormat(0, 0, textLines[0]);
                return;
            }

			const textSelection = getTextSelection();
			removeTextInSelection(textSelection);
			const startTextFormat = textSelection.start.textFormat;
            let text = startTextFormat.getText();

            // We want to remove a zero width space character as soon as we can.
            if (text.charCodeAt(0) === ZeroWidthSpaceCode) {
                text = '';
                textSelection.start.index--;
                if (textSelection.start.line === textSelection.end.line
                && textSelection.start.column === textSelection.end.column) {
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
        });

        textInput.addEventListener('keydown', (event: KeyboardEvent) => {

            // Erasing of content is done by the browser. So lines and and text formats
            // would be out of sync. We need to read in those lines again.
            readLinesAndFormats();

            // The browser inserts <br> when we empty a text node.
            removeLineBreak();

            if (lines.length === 0 || lines[0].formats.length === 0) {
                return;
            }

			const textSelection = getTextSelection();
			const startTextFormat = textSelection.start.textFormat;
            const text = startTextFormat.getText();
            if (event.keyCode === KeyCode.BackSpace) {

                // We want to be on the first column of the current line if we hold down the meta key or
                // if we stand in the second column and hit backspace.
                //
                // And we don't want it to stop being in the current line if the current line is already
                // empty.
                if (((text.length === 1 && textSelection.start.index === 1) || event.metaKey) &&
                    text.charCodeAt(0) !== ZeroWidthSpaceCode) {

                    startTextFormat.setHTML(zeroWidthSpaceText);
                    moveCaretTo(textSelection.start.line, textSelection.start.column, 1);
                    event.preventDefault();
                    return;
                }

                if (text.charCodeAt(0) === ZeroWidthSpaceCode || text.length === 0) {
                    let { line, column, previousFormat } = getLineColumnAndPreviousTextFormat();
                    removeTextFormat(startTextFormat);
                    if (previousFormat) {
                        event.preventDefault();
                        moveCaretTo(line, column, previousFormat.getText().length);
                    }
                    return;
                }

                if (textSelection.start.index === 0 &&
                    text.length > 0 &&
                    !(textSelection.start.line === 0 && textSelection.start.column === 0)) {

                    let { line, column, previousFormat } = getLineColumnAndPreviousTextFormat();
                    let previousFormatText = previousFormat.getText();
                    if (previousFormatText.charCodeAt(0) === ZeroWidthSpaceCode) {
                        previousFormatText = '';
                    }
                    const newText = previousFormatText + text;
                    previousFormat.setHTML(newText);
                    moveCaretTo(line, column, previousFormatText.length);
                    removeTextFormat(startTextFormat);
                    event.preventDefault();
                }
            }
            else if (event.keyCode === KeyCode.Delete) {

                // If we hit delete and there is only one character left, we want to insert a zero width character.
                if (textSelection.start.index === 0 && text.length === 1) {
                    const startTextFormat = textSelection.start.textFormat;
                    startTextFormat.setHTML(zeroWidthSpaceText);
                    event.preventDefault();
                }
            }

            function getLineColumnAndPreviousTextFormat(): { line: number, column: number, previousFormat: DOMElement } {
                let { line, column } = textSelection.start;
                column = column - 1;
                let previousFormat = lines[line].formats[column];
                if (!previousFormat) {
                    line = line - 1;
                    let previousFormats = lines[line].formats;
                    column = previousFormats.length - 1;
                    previousFormat = previousFormats[column];
                }

                return { line, column, previousFormat };
            }
        });
    }
}