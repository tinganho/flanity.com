
'use strict';

import { React, ContentComponent, DOMElement, PageInfo, charToHTMLEntity } from '../Library/Index';

interface Props {
}

interface Elements {
    textInput: DOMElement;
}

interface Text {
}

export class PostForm extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div>
                <img id='PostFormProfileImage' bindText='src:image'/>
                <form id='PostFormForm'>
                    <div id='PostFormInputContainer'>
                        <div ref='textInput' id='PostFormTextInput' contenteditable='true'/>
                    </div>
                </form>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        let user = this.data;
        this.text = {
            image: user.get('image') ? user.get('image').tiny.url : '/Public/Images/ProfileImagePlaceholder.png',
        }
    }

    public bindDOM() {
        super.bindDOM();

		interface TextSelection {
			startTextFormattingNodeIndex: number;
			startTextFormattingIndex: number;
			endTextFormattingNodeIndex: number;
			endTextFormattingIndex: number;
		}

        interface TextLine {
            element: DOMElement;
            formattings: DOMElement[];
        }

        const ZeroWidthSpaceCode = 8203;
        const ZeroWidthSpaceText = '&#8203;';

        const enum KeyCode {
            Return = 13,
            BackSpace = 8,
        }

        const textInput = this.elements.textInput;
		let nativeTextInput = textInput.nativeElement as HTMLInputElement;
        let lines: TextLine[] = [];
        let textFormattings: DOMElement[] = [];

        function readLinesAndFormattings() {
            lines = [];
            textFormattings = [];
            let textFormattingLines = textInput.findAll('.TextFormattingLine');
            for (let l of textFormattingLines) {
                let foundTextFormattings =  l.findAll('.TextFormatting')
                lines.push({
                    element: l,
                    formattings: foundTextFormattings,
                });
                textFormattings = textFormattings.concat(foundTextFormattings);
            }
        }

        function getTextSelection() {
            const selection = window.getSelection();
            let startTextFormattingNodeIndex: number;
            let startTextFormattingIndex: number;
            let endTextFormattingNodeIndex: number;
            let endTextFormattingIndex: number;

            if (selection.focusOffset < selection.anchorOffset) {
                startTextFormattingNodeIndex = getTextFormattingNodeIndex(selection.focusNode);
                startTextFormattingIndex = selection.focusOffset;
                endTextFormattingNodeIndex = getTextFormattingNodeIndex(selection.anchorNode);
                endTextFormattingIndex = selection.anchorOffset;
            }
            else {
                startTextFormattingNodeIndex = getTextFormattingNodeIndex(selection.anchorNode);
                startTextFormattingIndex = selection.anchorOffset;
                endTextFormattingNodeIndex = getTextFormattingNodeIndex(selection.focusNode);
                endTextFormattingIndex = selection.focusOffset;
            }

            let isCaret = startTextFormattingNodeIndex === endTextFormattingNodeIndex &&
                startTextFormattingIndex === endTextFormattingIndex;

            return {
                startTextFormattingNodeIndex,
                startTextFormattingIndex,
                endTextFormattingNodeIndex,
                endTextFormattingIndex,
                currentLine: getLine(textFormattings[startTextFormattingNodeIndex]),
                isCaret,
            }
        }

        function getTextFormattingNodeIndex(node: Node) {
            for (let i = 0; i < textFormattings.length; i++) {
                if (textFormattings[i].nativeElement === node.parentElement) {
                    return i;
                }
            }

            throw new Error('Could not get index of formatting node.')
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

        function removeFormatting(formatting: DOMElement) {
            let lineElement = formatting.getParentElement();
            if (lineElement.getChildren().length === 1) {
                lineElement.remove();
            }
            else {
                formatting.remove();
            }
        }

        function createNewLine(line: number) {
            const element = new DOMElement('div');
            element.addClass('TextFormattingLine');
            if (lines[line]) {
                lines[line].element.insertAfter(element);
            }
            else {
                textInput.append(element);
            }
            lines.splice(line + 1, 0, {
                element,
                formattings: [],
            });
        }

        function createFormatting(line: number, column: number, text?: string, position?: number) {
            let textFormatting = new DOMElement('span');
            textFormatting.addClass('TextFormatting');

            // '&#8203;' is a zero width space character to create a text node.
            // A text node would not be created with empty text ''.
            if (!lines[line]) {
                throw new TypeError(`Line is not defined yet: '${line}`);
            }
            textFormatting.setHTML(text || ZeroWidthSpaceText);
            if (!lines[line].formattings[column]) {
                lines[line].element.append(textFormatting);
            }
            else {
                lines[line].formattings[column].insertAfter(textFormatting);
            }
            lines[line].formattings.splice(column, 0, textFormatting);

            let index = 0;

            outer:
            for (let lI = 0; lI < lines.length; lI++) {
                for (let fI = 0; fI < lines[lI].formattings.length; fI++) {
                    if (line === lI && fI === column) {
                        textFormattings.splice(index, 0, textFormatting);
                        break outer;
                    }
                    index++;
                }
            }
            moveCaretTo(index, typeof position === 'number' ? position : text ? text.length : 1);
        }

        function removeTextInSelection(textSelection: TextSelection) {
            if (textSelection.startTextFormattingNodeIndex === textSelection.endTextFormattingNodeIndex) {
                const textFormatting = textFormattings[textSelection.startTextFormattingNodeIndex];
                const text = textFormatting.getText();
                const startText = text.slice(0, textSelection.startTextFormattingIndex);
                const endText = text.slice(textSelection.endTextFormattingIndex, text.length);
                textFormatting.setHTML(startText + endText);
            }
            else {
                for (let i = textSelection.startTextFormattingNodeIndex + 1; i < textSelection.endTextFormattingNodeIndex; i++) {
                    const textFormatting = textFormattings[i];
                    removeFormatting(textFormatting);
                    textFormattings.splice(i, 1);

                    let lineIndex = getLine(textFormatting);
                    let line = lines[lineIndex];
                    for (let fI = 0; fI < line.formattings.length; fI++) {
                        if (line.formattings[fI] === textFormatting) {
                            line.formattings.splice(fI, 1);
                            break;
                        }
                    }
                    if (line.formattings.length === 0) {
                        lines.splice(lineIndex, 1);
                    }
                }

                removeStartNodesText();
                insertEndNodesTextInStartNodeAndRemoveEndNode();
            }
            textSelection.endTextFormattingIndex = textSelection.startTextFormattingIndex;
            textSelection.endTextFormattingNodeIndex = textSelection.startTextFormattingNodeIndex;

            function removeStartNodesText() {
                const textFormatting = textFormattings[textSelection.startTextFormattingNodeIndex];
                const text = textFormatting.getText();
                const newText = text.slice(0, textSelection.startTextFormattingIndex);
                textFormatting.setHTML(newText);
            }

            function insertEndNodesTextInStartNodeAndRemoveEndNode() {
                const startTextFormatting = textFormattings[textSelection.startTextFormattingNodeIndex];

                // We have removed intermediate nodes so end node is just one after start node
                const endTextFormatting = textFormattings[textSelection.startTextFormattingNodeIndex + 1];
                const text = endTextFormatting.getText();
                const newText = text.slice(textSelection.endTextFormattingIndex, text.length);
                startTextFormatting.setHTML(startTextFormatting.getText() + newText);
                removeFormatting(endTextFormatting);
                textFormattings.splice(textSelection.endTextFormattingNodeIndex, 1);


                let lineIndex = getLine(endTextFormatting);
                let line = lines[lineIndex];
                for (let fI = 0; fI < line.formattings.length; fI++) {
                    if (line.formattings[fI] === endTextFormatting) {
                        line.formattings.splice(fI, 1);
                        break;
                    }
                }
                if (line.formattings.length === 0) {
                    lines.splice(lineIndex, 1);
                }
            }
        }

        function getLine(textFormatting: DOMElement): number {
            for (let lI = 0; lI < lines.length; lI++) {
                for (let fI = 0; fI < lines[lI].formattings.length; fI++) {
                    if (lines[lI].formattings[fI] === textFormatting) {
                        return lI;
                    }
                }
            }
        }

        textInput.addEventListener('keypress', (event: KeyboardEvent) => {

            // We do not handle backspace key codes. Firefox executes this handler, whereas Chrome and
            // Safari does not execute.
            if (event.keyCode === KeyCode.BackSpace || event.metaKey) {
                return;
            }

			event.preventDefault();

            // Erasing of content is done by the browser. So lines and and text formattings
            // would be out of sync. We need to read in those lines again.
            readLinesAndFormattings();

            let char = String.fromCharCode(event.charCode);
            if (char in charToHTMLEntity) {
                char = charToHTMLEntity[char];
            }
            else if (event.keyCode === KeyCode.Return) {
                addNewLine();
                return;
            }

            if (lines.length === 0) {
                createNewLine(0);
            }

			if (textFormattings.length === 0) {
                createFormatting(0, 0, char);
				return;
            }

			const textSelection = getTextSelection();
			removeTextInSelection(textSelection);

            const currentTextFormatting = textFormattings[textSelection.startTextFormattingNodeIndex];
            let text = currentTextFormatting.getText();

            if (text.charCodeAt(0) === ZeroWidthSpaceCode) {
                addChar();
                moveCaretTo(textSelection.startTextFormattingNodeIndex, textSelection.startTextFormattingIndex);
            }
            else {
                addChar();
                moveCaretTo(textSelection.startTextFormattingNodeIndex, textSelection.startTextFormattingIndex + 1);
            }

			return;

            function addNewLine() {

                // If we are in a total empty input we want to be in the second line when
                // we hit enter.
                if (textFormattings.length === 0) {
                    for (let i = 0; i < 2; i++) {
                        createNewLine(i);
                        createFormatting(i, 0);
                    }
                }
                else {
                    const textSelection = getTextSelection();
                    const startNode = textFormattings[textSelection.startTextFormattingNodeIndex];
                    const text = startNode.getText();
                    if (textSelection.startTextFormattingIndex === text.length) {
                        createNewLine(textSelection.currentLine);
                        createFormatting(textSelection.currentLine + 1, 0);
                    }
                    else {
				        const startText = text.slice(0, textSelection.startTextFormattingIndex);
                        const endText = text.slice(textSelection.endTextFormattingIndex, text.length);
                        startNode.setHTML(startText);
                        createNewLine(textSelection.currentLine);
                        createFormatting(textSelection.currentLine + 1, 0, endText, 0);
                    }
                }
            }

			function addChar() {

                // We don't want to hit backspace on a zero width space character. So we will remove
                // the zero width space character as soon it is no longer needed, i.e. as soon as we
                // add a new character.
                if (text.charCodeAt(0) === ZeroWidthSpaceCode) {
                    text = '';
                }
				const startText = text.slice(0, textSelection.startTextFormattingIndex);
				const endText = text.slice(textSelection.startTextFormattingIndex, text.length);
				const newText =  startText + char + endText;
                if (newText.length === 0) {
				    currentTextFormatting.remove();
                    let lineElement = currentTextFormatting.getParentElement();
                    if (lineElement.getChildren().length === 0) {
                        lineElement.remove();
                    }
                }
                else {
				    currentTextFormatting.setHTML(newText);
                }
			}
        });

        textInput.addEventListener('paste', (event: ClipboardEvent) => {
            event.preventDefault();

            let textLines = event.clipboardData.getData('text').split('\n');

            if (textFormattings.length === 0) {
                createNewLine(0);
                createFormatting(0, 0, textLines[0]);
                return;
            }

			const textSelection = getTextSelection();
			removeTextInSelection(textSelection);
			const startNode = textFormattings[textSelection.startTextFormattingNodeIndex];
            let text = startNode.getText();

            // We want to remove a zero width space character as soon as we can.
            if (text.charCodeAt(0) === ZeroWidthSpaceCode) {
                text = '';
                textSelection.startTextFormattingIndex--;
                if (textSelection.startTextFormattingNodeIndex === textSelection.endTextFormattingNodeIndex) {
                    textSelection.endTextFormattingIndex--;
                }
            }

            const startText = text.slice(0, textSelection.startTextFormattingIndex);
            const endText = text.slice(textSelection.endTextFormattingIndex, text.length);
            insertFirstTextSpanOnStartNode();
            if (textLines.length > 1) {
                insertLines();
            }

            function insertFirstTextSpanOnStartNode() {
                if (textLines.length === 1) {
                    const newText = startText + textLines[0] + endText;
                    startNode.setHTML(newText);
                    moveCaretTo(textSelection.startTextFormattingNodeIndex, textSelection.endTextFormattingIndex + textLines[0].length);
                }
                else {
                    const newText = startText + textLines[0];
                    startNode.setHTML(newText);
                }
            }

            function insertLines() {
                for (let i = 1; i < textLines.length; i++) {
                    let line = textSelection.currentLine + i;
                    createNewLine(line);
                    if (i === textLines.length - 1) {
                        createFormatting(line, 0, textLines[i] + endText, textLines[i].length);
                    }
                    else {
                        createFormatting(line, 0, textLines[i]);
                    }
                }
            }
        });

        textInput.addEventListener('keydown', (event: KeyboardEvent) => {

            // Erasing of content is done by the browser. So lines and and text formattings
            // would be out of sync. We need to read in those lines again.
            readLinesAndFormattings();

            // The browser inserts <br> when we empty a text node.
            removeLineBreak();

            if (textFormattings.length === 0) {
                return;
            }

			const textSelection = getTextSelection();
            if (event.keyCode === KeyCode.BackSpace) {
				let currentTextFormatting = textFormattings[textSelection.startTextFormattingNodeIndex];
                const text = currentTextFormatting.getText();

                // We want to be on the first column of the current line if we hold down the meta key.
                // And we don't want it to stop being in the current line if the current line is already
                // empty.
                if (((text.length === 1 && textSelection.startTextFormattingIndex === 1) || event.metaKey)
                && text.charCodeAt(0) !== ZeroWidthSpaceCode) {
                    currentTextFormatting.setHTML(ZeroWidthSpaceText);
                    moveCaretTo(textSelection.startTextFormattingNodeIndex, 1);
                    event.preventDefault();
                    return;
                }

                if (text.charCodeAt(0) === ZeroWidthSpaceCode || text.length === 0) {
                    removeFormatting(currentTextFormatting);
                    const nextTextFormattingNodeIndex = textSelection.startTextFormattingNodeIndex - 1;
                    if (nextTextFormattingNodeIndex >= 0) {
                        event.preventDefault();
                        const nextTextFormatting = textFormattings[nextTextFormattingNodeIndex];
                        moveCaretTo(nextTextFormattingNodeIndex, nextTextFormatting.getText().length);
                    }
                    return;
                }

                if (textSelection.startTextFormattingIndex === 0 && text.length > 0 && textSelection.startTextFormattingNodeIndex > 0) {
                    const previousFormattingNodeIndex = textSelection.startTextFormattingNodeIndex - 1;
                    const previousFormatting = textFormattings[previousFormattingNodeIndex];
                    const previousFormattingText = previousFormatting.getText();
                    const newText = previousFormattingText + text;
                    previousFormatting.setHTML(newText);
                    moveCaretTo(previousFormattingNodeIndex, previousFormattingText.length);
                    removeFormatting(currentTextFormatting);
                    event.preventDefault();
                }
            }
        });
    }
}