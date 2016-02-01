
'use strict';

import { React, ContentComponent, DOMElement, PageInfo, charToHTMLEntity } from '../Library/Index';

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

		interface TextSelection {
			startTextFormatNodeIndex: number;
			startTextFormatIndex: number;
			endTextFormatNodeIndex: number;
			endTextFormatIndex: number;
            line: number;
            column: number;
            isCaret: boolean;
		}

        interface TextLine {
            element: DOMElement;
            formats: DOMElement[];
        }

        const ZeroWidthSpaceCode = 8203;
        const ZeroWidthSpaceText = '&#8203;';

        const enum KeyCode {
            Return = 13,
            BackSpace = 8,
        }

        const textInput = this.root;
		let nativeTextInput = textInput.nativeElement as HTMLInputElement;
        let lines: TextLine[] = [];
        let textFormats: DOMElement[] = [];

        function readLinesAndFormats() {
            lines = [];
            textFormats = [];
            let textFormatLines = textInput.findAll('.TextFormatLine');
            for (let l of textFormatLines) {
                let foundTextFormats =  l.findAll('.TextFormat, .UsernameTextFormat');
                lines.push({
                    element: l,
                    formats: foundTextFormats,
                });
                textFormats = textFormats.concat(foundTextFormats);
            }
        }

        function isUsernameCharCode(char: string): boolean {
            return /[a-zA-Z-9_]/.test(char);
        }

        function getTextSelection(): TextSelection {
            const selection = window.getSelection();
            let startTextFormatNodeIndex: number;
            let startTextFormatIndex: number;
            let endTextFormatNodeIndex: number;
            let endTextFormatIndex: number;

            if (selection.focusOffset < selection.anchorOffset) {
                startTextFormatNodeIndex = getTextFormatNodeIndex(selection.focusNode);
                startTextFormatIndex = selection.focusOffset;
                endTextFormatNodeIndex = getTextFormatNodeIndex(selection.anchorNode);
                endTextFormatIndex = selection.anchorOffset;
            }
            else {
                startTextFormatNodeIndex = getTextFormatNodeIndex(selection.anchorNode);
                startTextFormatIndex = selection.anchorOffset;
                endTextFormatNodeIndex = getTextFormatNodeIndex(selection.focusNode);
                endTextFormatIndex = selection.focusOffset;
            }

            let isCaret = startTextFormatNodeIndex === endTextFormatNodeIndex &&
                startTextFormatIndex === endTextFormatIndex;

            let currentTextFormat = textFormats[startTextFormatNodeIndex];
            let line = getLine(textFormats[startTextFormatNodeIndex]);

            let column: number;
            for (let i = 0, formats = lines[line].formats; i < formats.length; i++) {
                if (formats[i] === currentTextFormat) {
                    column = i;
                }
            }

            return {
                startTextFormatNodeIndex,
                startTextFormatIndex,
                endTextFormatNodeIndex,
                endTextFormatIndex,
                line,
                column,
                isCaret,
            }
        }

        function getTextFormatNodeIndex(node: Node) {
            for (let i = 0; i < textFormats.length; i++) {
                if (textFormats[i].nativeElement === node.parentElement) {
                    return i;
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

        function moveCaretTo(nodeIndex: number, position: number) {
            let range = document.createRange();
            let textNodes = getTextNodes(nativeTextInput);
            if (!textNodes[nodeIndex]) {
                throw new TypeError(`Text node index '${nodeIndex}' not found in ${JSON.stringify(textNodes)}.` );
            }
            range.setStart(textNodes[nodeIndex], position);
            range.setEnd(textNodes[nodeIndex], position);
            let selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        function getTextNodes(node: Node) {
            let textNodes: Node[] = [];
            if (node.nodeType == 3) {
                textNodes.push(node);
            }
            else {
                const children = node.childNodes;
                for (let i = 0, len = children.length; i < len; ++i) {
                    textNodes.push.apply(textNodes, getTextNodes(children[i]));
                }
            }
            return textNodes;
        }

        function removeFormat(format: DOMElement) {
            let lineElement = format.getParentElement();
            if (lineElement.getChildren().length === 1) {
                lineElement.remove();
            }
            else {
                format.remove();
            }
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

        function createNormalTextFormat(line: number, column: number, text?: string, position?: number) {
            let { textFormat, textFormatIndex } = createTextFormat(line, column, text, 'TextFormat');
            moveCaretTo(textFormatIndex, typeof position === 'number' ? position : text ? text.length : 1);
        }

        function createUsernameTextFormat(line: number, column: number, text?: string, position?: number) {
            let { textFormat, textFormatIndex } = createTextFormat(line, column, text, 'UsernameTextFormat');
            moveCaretTo(textFormatIndex, typeof position === 'number' ? position : text ? text.length : 1);
        }

        function createTextFormat(line: number, column: number, text: string, cssClass: string): { textFormat: DOMElement, textFormatIndex: number} {
            let textFormat = new DOMElement('span');
            textFormat.addClass(cssClass);

            if (!lines[line]) {
                throw new TypeError(`Line is not defined yet: '${line}`);
            }
            // '&#8203;' is a zero width space character to create a text node.
            // A text node would not be created with empty text ''.
            textFormat.setHTML(text || ZeroWidthSpaceText);
            if (!lines[line].formats[column]) {
                lines[line].element.append(textFormat);
            }
            else {
                lines[line].formats[column].insertAfter(textFormat);
            }
            lines[line].formats.splice(column, 0, textFormat);

            let index = 0;

            outer:
            for (let lI = 0; lI < lines.length; lI++) {
                if (lines[lI].formats.length === 0 && column === 0) {
                    textFormats.splice(index, 0, textFormat);
                    break;
                }
                for (let fI = 0; fI < lines[lI].formats.length; fI++) {
                    if (line === lI && fI === column) {
                        textFormats.splice(index + 1, 0, textFormat);
                        break outer;
                    }
                    index++;
                }
            }

            return { textFormat, textFormatIndex: index };
        }

        function removeTextInSelection(textSelection: TextSelection) {
            if (textSelection.startTextFormatNodeIndex === textSelection.endTextFormatNodeIndex) {
                const textFormat = textFormats[textSelection.startTextFormatNodeIndex];
                const text = textFormat.getText();
                const startText = text.slice(0, textSelection.startTextFormatIndex);
                const endText = text.slice(textSelection.endTextFormatIndex, text.length);
                textFormat.setHTML(startText + endText);
            }
            else {
                for (let i = textSelection.startTextFormatNodeIndex + 1; i < textSelection.endTextFormatNodeIndex; i++) {
                    const textFormat = textFormats[i];
                    removeFormat(textFormat);
                    textFormats.splice(i, 1);

                    const lineIndex = getLine(textFormat);
                    let line = lines[lineIndex];
                    for (let fI = 0; fI < line.formats.length; fI++) {
                        if (line.formats[fI] === textFormat) {
                            line.formats.splice(fI, 1);
                            break;
                        }
                    }
                    if (line.formats.length === 0) {
                        lines.splice(lineIndex, 1);
                    }
                }

                removeStartNodesText();
                insertEndNodesTextInStartNodeAndRemoveEndNode();
            }
            textSelection.endTextFormatIndex = textSelection.startTextFormatIndex;
            textSelection.endTextFormatNodeIndex = textSelection.startTextFormatNodeIndex;

            function removeStartNodesText() {
                const textFormat = textFormats[textSelection.startTextFormatNodeIndex];
                const text = textFormat.getText();
                const newText = text.slice(0, textSelection.startTextFormatIndex);
                textFormat.setHTML(newText);
            }

            function insertEndNodesTextInStartNodeAndRemoveEndNode() {
                const startTextFormat = textFormats[textSelection.startTextFormatNodeIndex];

                // We have removed intermediate nodes so end node is just one after start node
                const endTextFormat = textFormats[textSelection.startTextFormatNodeIndex + 1];
                const text = endTextFormat.getText();
                const newText = text.slice(textSelection.endTextFormatIndex, text.length);
                startTextFormat.setHTML(startTextFormat.getText() + newText);
                removeFormat(endTextFormat);
                textFormats.splice(textSelection.endTextFormatNodeIndex, 1);


                let lineIndex = getLine(endTextFormat);
                let line = lines[lineIndex];
                for (let fI = 0; fI < line.formats.length; fI++) {
                    if (line.formats[fI] === endTextFormat) {
                        line.formats.splice(fI, 1);
                        break;
                    }
                }
                if (line.formats.length === 0) {
                    lines.splice(lineIndex, 1);
                }
            }
        }

        function getLine(textFormat: DOMElement): number {
            for (let lI = 0; lI < lines.length; lI++) {
                for (let fI = 0; fI < lines[lI].formats.length; fI++) {
                    if (lines[lI].formats[fI] === textFormat) {
                        return lI;
                    }
                }
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

			if (textFormats.length === 0) {
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
                createUsernameTextFormat(textSelection.line, textSelection.column + 1, char);
                return;
            }
            const currentTextFormat = textFormats[textSelection.startTextFormatNodeIndex];
            let text = currentTextFormat.getText();
            if (text.charCodeAt(0) === ZeroWidthSpaceCode) {

                // We don't want to hit backspace on a zero width space character. So we will remove
                // the zero width space character as soon it is no longer needed, i.e. as soon as we
                // add a new character.
                text = '';

                addChar();
                moveCaretTo(textSelection.startTextFormatNodeIndex, textSelection.startTextFormatIndex);
            }
            else {
                addChar();
                moveCaretTo(textSelection.startTextFormatNodeIndex, textSelection.startTextFormatIndex + 1);
            }

			return;

            function addNewLine() {

                // If we are in a total empty input we want to be in the second line when
                // we hit enter.
                if (textFormats.length === 0) {
                    for (let i = -1; i < 2; i++) {
                        createNewLineAfterLine(i);
                        createNormalTextFormat(i + 1, -1);
                    }
                }
                else {
                    const textSelection = getTextSelection();
                    const startNode = textFormats[textSelection.startTextFormatNodeIndex];
                    const text = startNode.getText();
                    if (textSelection.startTextFormatIndex === text.length) {
                        createNewLineAfterLine(textSelection.line);
                        createNormalTextFormat(textSelection.line + 1, 0);
                    }
                    else {
				        const startText = text.slice(0, textSelection.startTextFormatIndex);
                        const endText = text.slice(textSelection.endTextFormatIndex, text.length);
                        startNode.setHTML(startText !== '' ? startText : ZeroWidthSpaceText);
                        createNewLineAfterLine(textSelection.line);
                        createNormalTextFormat(textSelection.line + 1, 0, endText, 0);
                    }
                }
            }

			function addChar() {
				const startText = text.slice(0, textSelection.startTextFormatIndex);
				const endText = text.slice(textSelection.startTextFormatIndex, text.length);
				const newText =  startText + char + endText;
                if (newText.length === 0) {
				    currentTextFormat.remove();
                    let lineElement = currentTextFormat.getParentElement();
                    if (lineElement.getChildren().length === 0) {
                        lineElement.remove();
                    }
                }
                else {
				    currentTextFormat.setHTML(newText);
                }
			}
        });

        textInput.addEventListener('paste', (event: ClipboardEvent) => {
            event.preventDefault();

            let textLines = event.clipboardData.getData('text').split('\n');

            if (textFormats.length === 0) {
                createNewLineAfterLine(0);
                createNormalTextFormat(0, 0, textLines[0]);
                return;
            }

			const textSelection = getTextSelection();
			removeTextInSelection(textSelection);
			const startNode = textFormats[textSelection.startTextFormatNodeIndex];
            let text = startNode.getText();

            // We want to remove a zero width space character as soon as we can.
            if (text.charCodeAt(0) === ZeroWidthSpaceCode) {
                text = '';
                textSelection.startTextFormatIndex--;
                if (textSelection.startTextFormatNodeIndex === textSelection.endTextFormatNodeIndex) {
                    textSelection.endTextFormatIndex--;
                }
            }

            const startText = text.slice(0, textSelection.startTextFormatIndex);
            const endText = text.slice(textSelection.endTextFormatIndex, text.length);
            insertFirstTextSpanOnStartNode();
            if (textLines.length > 1) {
                insertLines();
            }

            function insertFirstTextSpanOnStartNode() {
                if (textLines.length === 1) {
                    const newText = startText + textLines[0] + endText;
                    startNode.setHTML(newText);
                    moveCaretTo(textSelection.startTextFormatNodeIndex, textSelection.endTextFormatIndex + textLines[0].length);
                }
                else {
                    const newText = startText + textLines[0];
                    startNode.setHTML(newText);
                }
            }

            function insertLines() {
                for (let i = 1; i < textLines.length; i++) {
                    let line = textSelection.line + i;
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

            if (textFormats.length === 0) {
                return;
            }

			const textSelection = getTextSelection();
            if (event.keyCode === KeyCode.BackSpace) {
				let currentTextFormat = textFormats[textSelection.startTextFormatNodeIndex];
                const text = currentTextFormat.getText();

                // We want to be on the first column of the current line if we hold down the meta key or
                // if we stand in the second column and hit backspace.
                //
                // And we don't want it to stop being in the current line if the current line is already
                // empty.
                if (((text.length === 1 && textSelection.startTextFormatIndex === 1) || event.metaKey)
                && text.charCodeAt(0) !== ZeroWidthSpaceCode) {
                    currentTextFormat.setHTML(ZeroWidthSpaceText);
                    moveCaretTo(textSelection.startTextFormatNodeIndex, 1);
                    event.preventDefault();
                    return;
                }

                if (text.charCodeAt(0) === ZeroWidthSpaceCode || text.length === 0) {
                    removeFormat(currentTextFormat);
                    const nextTextFormatNodeIndex = textSelection.startTextFormatNodeIndex - 1;
                    if (nextTextFormatNodeIndex >= 0) {
                        event.preventDefault();
                        const nextTextFormat = textFormats[nextTextFormatNodeIndex];
                        moveCaretTo(nextTextFormatNodeIndex, nextTextFormat.getText().length);
                    }
                    return;
                }

                if (textSelection.startTextFormatIndex === 0 && text.length > 0 && textSelection.startTextFormatNodeIndex > 0) {
                    const previousFormatNodeIndex = textSelection.startTextFormatNodeIndex - 1;
                    const previousFormat = textFormats[previousFormatNodeIndex];
                    let previousFormatText = previousFormat.getText();
                    if (previousFormatText.charCodeAt(0) === ZeroWidthSpaceCode) {
                        previousFormatText = '';
                    }
                    const newText = previousFormatText + text;
                    previousFormat.setHTML(newText);
                    moveCaretTo(previousFormatNodeIndex, previousFormatText.length);
                    removeFormat(currentTextFormat);
                    event.preventDefault();
                }
            }
        });
    }
}