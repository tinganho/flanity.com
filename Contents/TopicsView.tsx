
import { Topics } from './Topics';
import { Topic } from './Topic';
import {
    React,
    ContentComponent,
    DOMElement,
    PageInfo,
    Collection,
    autobind,
    HTTPResponse,
    ErrorResponse,
    TimedCallback } from '../Library/Index';
import {
    SubmitButton,
    FormMessage,
    ImageCrop,
    ConfirmDialog } from '../Components/Index';

interface TopicsProps {
    name: string;
}

interface TopicsElements {
    addButton: DOMElement;
    emptyView: DOMElement;
}

interface TopicsText {
    contentTitle: string;
}

interface TopicsComponents {
    topicsCollectionView: TopicsCollectionView;
    scrollBar: HorizontalScrollBar;
    collection: TopicsCollectionView;
    topicsEmptyView?: TopicsEmptyView;

    [index: string]: Component<any, any, any>;
}

function getAddButton(id: string) {
    return (
        <div ref='addButton' id={id} class='AddButton'>
            <div class='AddButtonVertical'/>
            <div class='AddButtonHorizontal'/>
        </div>
    );
}

interface FileReadResult extends File {
    result: string;
}

interface FileEventTarget extends EventTarget {
    files: FileReadResult[];
}

interface FileChangeEvent extends Event {
    target: FileEventTarget;
}

interface FileReadEventTarget extends EventTarget {
    result: string;
}

interface FileReadOnloadEvent extends Event {
    target: FileReadEventTarget;
}

export class TopicsView extends ContentComponent<TopicsProps, TopicsText, TopicsElements> {
    public components: TopicsComponents;

    public static setPageInfo(data: Topics, l: GetLocalization, pageInfo: PageInfo) {
        let name = data.get('name');
        this.setPageTitle(l('TOPICS->PAGE_TITLE', { user: name }), pageInfo);
        this.setPageDescription(l('TOPICS->PAGE_DESCRIPTION', { user: name }), pageInfo);
        this.setPageImage('/Public/Images/HeroImage.jpg', pageInfo);
    }

    public render() {
        let topics = this.data.get('topics') as Topics;

        return (
            <div>
                <div id='TopicsCollectionViewScrollBarDecratorLeft'/>
                <div id='TopicsCollectionViewScrollBarDecratorRight'/>
                {topics.length > 0 ? [
                    <TopicsCollectionView ref='collection' data={topics}/>,
                    <HorizontalScrollBar ref='scrollBar' scrollBarLeft='TopicsCollectionViewScrollBarDecratorLeft' scrollBarRight='TopicsCollectionViewScrollBarDecratorRight'/>
                ] : <TopicsEmptyView/>}
            </div>
        );
    }

    public bindData() {
        this.data.on('add:topics', () => {
            if (this.components.topicsEmptyView) {
                this.components.topicsEmptyView.root.addClass('Hidden').removeClass('Revealed')
                    .onTransitionEnd(() => {
                        this.components.topicsEmptyView.remove();
                        delete this.components.topicsEmptyView;
                        let collection = this.appendComponent(TopicsCollectionView, { ref:'collection', data: this.data.get('topics') }) as TopicsCollectionView;
                        let scrollBar = this.appendComponent(HorizontalScrollBar, {
                            ref: 'scrollBar',
                            scrollBarLeft: 'TopicsCollectionViewScrollBarDecratorLeft',
                            scrollBarRight: 'TopicsCollectionViewScrollBarDecratorRight'
                        });
                        collection.components.scrollBar = scrollBar as HorizontalScrollBar;
                    });
            }
            else {
            }
        });
        this.data.on('remove:topics', () => {
            if (this.data.get('topics').length === 0) {
                let component = this.stackComponent(TopicsEmptyView, {});
                this.components.topicsEmptyView.elements.addButton.addEventListener('click', this.showCreateTopicForm);
                this.components.collection.remove();
                delete this.components.collection;
                this.components.scrollBar.remove();
                delete this.components.scrollBar;
            }
            else {
            }
        });
    }

    public bindDOM() {
        super.bindDOM();

        if (this.components.topicsEmptyView) {
            this.components.topicsEmptyView.elements.addButton.addEventListener('click', this.showCreateTopicForm);
        }
        else {
            this.components.collection.components.scrollBar = this.components.scrollBar;
        }
    }

    public setText(l: GetLocalization) {
        this.text = {
            contentTitle: l('TOPICS->CONTENT_TITLE'),
        }
    }

    @autobind
    private showCreateTopicForm() {
        let form = new TopicForm({ topics: this.data.get('topics') });
        form.show();
    }
}

interface TopicsEmptyViewProps {
}

interface TopicsEmptyViewText {
    emptyViewTitle: string
    emptyViewDescription: string;
}

interface TopicsEmptyViewElements {
    addButton: DOMElement;
}

class TopicsEmptyView extends ContentComponent<TopicsEmptyViewProps, TopicsEmptyViewText, TopicsEmptyViewElements> {
    public render() {
        return (
            <div ref='emptyView' id='TopicsEmptyView' class={inServer ? 'Revealed' : 'Hidden'}>
                <h1 id='TopicsEmptyViewTitle' class='Title1'>{this.text.emptyViewTitle}</h1>
                <p id='TopicsEmptyViewDescription' class='Description1'>{this.text.emptyViewDescription}</p>
                {getAddButton('TopicsEmptyViewAddButton')}
                <div id='TopicsEmptyViewHeroImageContainer'>
                    <img id='TopicsEmptyViewHeroImage' src='/Public/Images/HeroImage.jpg'></img>
                </div>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
            emptyViewTitle: l('TOPICS->EMPTY_VIEW_TITLE'),
            emptyViewDescription: l('TOPICS->EMPTY_VIEW_DESCRIPTION'),
        }
    }

    public bindDOM() {
        super.bindDOM();

        setTimeout(() => {
            this.root.addClass('Revealed').removeClass('Hidden');
        }, 0);
    }
}

interface TopicsCollectionViewProps {
}

interface TopicsCollectionViewText {
}

interface TopicsCollectionViewElements {
    addButton: DOMElement;
    collection: DOMElement;
}

interface TopicsCollectionViewComponents {
    scrollBar: HorizontalScrollBar;

    [index: string]: Component<any, any, any>;
}

class TopicsCollectionView extends ContentComponent<TopicsCollectionViewProps, TopicsCollectionViewText, TopicsCollectionViewElements> {
    public components: TopicsCollectionViewComponents;
    public data: Topics;

    public render() {
        let topicViews: JSX.Element[] = [];
        for (let i = 0; i < this.data.length; i++) {
            let topic = this.data.at(i);
            topicViews.push(<TopicView id={'Topic' + topic.get('id')} data={topic} isRevealed/>);
        }

        return (
            <div id='TopicsCollectionView' class={inServer ? 'Revealed' : 'Hidden'}>
                <ul ref='collection' id='TopicsCollection'>
                    {topicViews}
                </ul>
                {getAddButton('TopicsCollectionViewAddButton')}
            </div>
        );
    }

    public bindData() {
        this.data.on('add', (topic) => {
            if (this.data.length > 1) {
                this.addTopic(topic);
            }
        });
    }

    private addTopic(topic: Topic) {
        let component = this.appendComponent(TopicView, { id: 'Topic' + topic.get('id'), data: topic }, this.elements.collection) as TopicView;
        component.components.scrollBar = this.components.scrollBar;

        setTimeout(() => {
            component.root.addClass('Revealed').removeClass('ZeroWidth').removeClass('Hidden')
                .onTransitionEnd(() => {
                    this.components.scrollBar.recalculate();
                });
        }, 0);
    }

    public bindDOM() {
        super.bindDOM();

        this.elements.addButton.addEventListener('click', this.showCreateTopicForm);

        setTimeout(() => {
            this.root.addClass('Revealed').removeClass('ZeroWidth').removeClass('Hidden');
        }, 0);

        for (let t in this.components) {
            if (/^topic/.test(t)) {
                ((t: string) => {
                    setTimeout(() => {
                        (this.components[t] as TopicView).components.scrollBar = this.components.scrollBar;
                    }, 0);
                })(t)
            }
        }
    }

    @autobind
    private showCreateTopicForm() {
        let form = new TopicForm({ topics: this.data as Topics });
        form.show();
    }
}

interface TopicProps {
    isRevealed?: boolean;
}

interface TopicElements {
    editButton: DOMElement;
    image: DOMElement;
    mask: DOMElement;
}

interface TopicText {
    editButtonText: string;
    imageURL: string;
    title: string;
    description: string;
    followers: string;
}

interface TopicComponents {
    scrollBar: HorizontalScrollBar;

    [index: string]: Component<any, any, any>;
}

class TopicView extends ContentComponent<TopicProps, TopicText, TopicElements> {
    public components: TopicComponents;
    public data: Topic;

    public render() {
        return (
            <li class={'Topic BgWhite1' + (inServer || this.props.isRevealed ? ' Revealed' : ' Hidden ZeroWidth')}>
                <div class='TopicCoverImageContainer'>
                    <div ref='mask' class='TopicCoverImageMask Hidden'/>
                    <img ref='image' class='TopicCoverImage Hidden' bindText='src:imageURL'/>
                    <hgroup class='TopicHeaders'>
                        <h1 class='TopicTitle HeaderWhite2' bindText='title'></h1>
                        <h2 class='TopicFollowersCount HeaderWhite3' bindText='followers'></h2>
                    </hgroup>
                    <p class='TopicDescription ParagraphWhite1' bindText='description'></p>
                    <button ref='editButton' class='TopicEditButton WhiteTransparentButton TopicButton'>{this.text.editButtonText}</button>
                </div>
            </li>
        );
    }

    public bindData() {
        this.data.on('delete', () => {
            this.components.scrollBar.scrollOneTopicForwardIfNecessary();
            this.root.addClass('Hidden').addClass('ZeroWidth').removeClass('Revealed')
                .onTransitionEnd(() => {
                    this.remove();
                    this.components.scrollBar.recalculate();
                });
        });
    }

    public setText(l: GetLocalization) {
        let coverImage = this.data.get('coverImage') && this.data.get('coverImage').medium.url;
        this.text = {
            editButtonText: l('TOPIC->EDIT_BUTTON_TEXT'),
            imageURL: encodeURI(coverImage || ''),
            title: this.data.get('title'),
            description: this.data.get('description'),
            followers: l('TOPIC->FOLLOWERS_TEXT', { followers: this.data.get('followers') }),
        }
    }

    public bindDOM() {
        super.bindDOM();

        if (this.elements.editButton) {
            this.elements.editButton.addEventListener('click', this.showEditForm);
        }

        let image = this.elements.image;
        let mask = this.elements.mask;
        if ((image.nativeElement as HTMLImageElement).complete) {
            image.addClass('Revealed').removeClass('Hidden')
                .onTransitionEnd(() => {
                    mask.addClass('Revealed').removeClass('Hidden');
                });
        }
        image.addEventListener('load', () => {
            image.addClass('Revealed').removeClass('Hidden')
                .onTransitionEnd(() => {
                    mask.addClass('Revealed').removeClass('Hidden');
                });
        });
    }

    @autobind
    private showEditForm() {
        let form = new TopicForm({ topics: this.data.collection, data: this.data });
        form.show();
    }
}

interface CreateTopicFormProps {
    topics: Topics;
}

interface CreateTopicFormText {
    titleInputPlaceholder: string;
    descriptionInputPlaceholder: string;
    dropImagePromptText: string;
    submitButtonText: string;
    deleteButtonText: string;
    cancelButtonText: string;

    noTitleErrorMessage: string;
    titleTooLongErrorMessage: string;
    descriptionTooLongErrorMessage: string;
    noTopicCoverImageErrorMessage: string;
    unknownErrorErrorMessage: string;
    onDeleteTopic_TopicNotFoundErrorMessage: string;

    confirmDeleteTitle: string;
    confirmDeleteDescription: string;
}

interface CreateTopicFormElements {
    titleInput: DOMElement;
    descriptionInput: DOMElement;
    topicCoverImage: DOMElement;
    topicCoverImageInput: DOMElement;
    submitButton: DOMElement;
    previewImage: DOMElement;
    formMessage: DOMElement;
    deleteButton: DOMElement;
    cancelButton: DOMElement;
}

interface CreateTopicFormComponents {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

const enum DeleteTopicFeedback {
    TopicNotFound,
}

class TopicForm extends ContentComponent<CreateTopicFormProps, CreateTopicFormText, CreateTopicFormElements> {
    public components: CreateTopicFormComponents;

    private overlay: DOMElement;

    private topicCoverImage: Blob;
    private title = '';
    private description = '';

    private topicCoverImageWidth = 350;
    private topicCoverImageHeight = 285;

    private isRequesting = false;

    public data: Topic;

    public render() {
        let DeleteButton = <button ref='deleteButton' id='TopicFormDeleteButton' class='RedButton'>{this.text.deleteButtonText}</button>
        return (
            <form class='Hidden BgWhite1'>
                <div id='TopicFormDropContainer'>
                    <div ref='topicCoverImage' id='TopicFormDropContainerBorder'>
                        <input ref='topicCoverImageInput' type='file' class='FileInput'/>
                        <span id='TopicFormDropText'>{this.text.dropImagePromptText}</span>
                    </div>
                </div>
                <div id='TopicFormInputContainer'>
                    <input ref='titleInput' id='TopicFormTitleInput' placeholder={this.text.titleInputPlaceholder} class='TextInput'/>
                    <textarea ref='descriptionInput' id='TopicFormDescriptionInput' placeholder={this.text.descriptionInputPlaceholder} class='TextAreaInput'/>
                    <FormMessage id='TopicFormMessage' ref='formMessage'/>
                </div>
                {this.data ? DeleteButton : undefined}
                <div id='TopicFormButtonContainer'>
                    <button ref='cancelButton' id='TopicFormCancelButton' class='TextButton'>{this.text.cancelButtonText}</button>
                    <SubmitButton ref='submitButton' id='TopicFormSubmitButton' buttonText={this.text.submitButtonText}/>
                </div>
            </form>
        );
    }

    public bindData() {
        if (!this.data) {
            return;
        }

        let data = this.data;
        let title = data.get('title');
        if (title) {
            this.title = title;
            this.elements.titleInput.setValue(title);
        }
        let description = data.get('description');
        if (description) {
            this.description = description;
            this.elements.descriptionInput.setValue(description);
        }
        let coverImage = data.get('coverImage');
        if (coverImage) {
            this.createPreviewImage(coverImage.medium.url);
        }
    }

    public bindDOM() {
        super.bindDOM();
        this.bindData();

        let input = this.elements.topicCoverImageInput;
        input.addEventListener('change', this.handleFileChange);
        input.addEventListener('dragenter', this.handleDragOver);
        input.addEventListener('dragleave', this.handleDragLeave);
        input.addEventListener('drop', this.handleFileChange);

        this.elements.submitButton = this.components.submitButton.elements.container;
        this.elements.submitButton.removeAttribute('disabled');
        this.elements.submitButton.onClick(this.submit);
        this.elements.cancelButton.onClick(this.cancel);
        if (this.elements.deleteButton) {
            this.elements.deleteButton.onClick(this.delete);
        }

        this.elements.titleInput.addEventListener('change', () => {
            this.title = this.elements.titleInput.getValue();
        });
        this.elements.descriptionInput.addEventListener('change', () => {
            this.description = this.elements.descriptionInput.getValue();
        });
    }

    @autobind
    private delete(event: Event) {
        event.preventDefault();

        if (this.isRequesting) {
            return;
        }

        ConfirmDialog.confirm(
            this.text.confirmDeleteTitle,
            this.text.confirmDeleteDescription,
            (dialog: ConfirmDialog) => {
                let timedCallback = new TimedCallback(2000);
                return new Promise<void>((resolve) => {
                    dialog.isRequesting = true;
                    this.data.delete((emitEvent) => {
                        timedCallback.stop(() => {
                            dialog.stopLoading();
                            dialog.remove();
                            this.remove().then(() => {
                                emitEvent();
                            });
                        });
                    })
                    .catch((err: Error | HTTPResponse<ErrorResponse>) => {
                        timedCallback.stop(() => {
                            dialog.isRequesting = false;
                            if ((err as HTTPResponse<ErrorResponse>).body &&
                                (err as HTTPResponse<ErrorResponse>).body.feedback.current.code === DeleteTopicFeedback.TopicNotFound) {

                                dialog.showErrorMessage(this.text.onDeleteTopic_TopicNotFoundErrorMessage);
                            }
                            else {
                                dialog.showErrorMessage(this.text.unknownErrorErrorMessage);
                                console.log((err as any).stack || err);
                            }
                        });
                    });
                });
            })
            .end();
    }

    @autobind
    private handleDragOver(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        this.elements.topicCoverImageInput.addClass('DragOver');
    }

    @autobind
    private handleDragLeave(event: DragEvent) {
        this.elements.topicCoverImageInput.removeClass('DragOver');
    }

    public setText(l: GetLocalization) {
        let topicTitle = this.data ? this.data.get('title') : undefined
        this.text = {
            deleteButtonText: l('CREATE_TOPIC_FORM->DELETE_BUTTON_TEXT'),
            titleInputPlaceholder: l('CREATE_TOPIC_FORM->TITLE_INPUT_PLACEHOLDER'),
            descriptionInputPlaceholder: l('CREATE_TOPIC_FORM->DESCRIPTION_INPUT_PLACEHOLDER'),
            dropImagePromptText: l('CREATE_TOPIC_FORM->DROP_IMAGE_PROMPT_TEXT'),
            submitButtonText: this.data ? l('CREATE_TOPIC_FORM->EDIT_BUTTON_TEXT') : l('CREATE_TOPIC_FORM->CREATE_BUTTON_TEXT'),
            cancelButtonText: l('DEFAULT->CANCEL_BUTTON_TEXT'),

            noTitleErrorMessage: l('CREATE_TOPIC_FORM->NO_TITLE_ERROR_MESSAGE'),
            titleTooLongErrorMessage: l('CREATE_TOPIC_FORM->TITLE_TOO_LONG_ERROR_MESSAGE'),
            descriptionTooLongErrorMessage: l('CREATE_TOPIC_FORM->DESCRIPTION_TOO_LONG_ERROR_MESSAGE'),
            noTopicCoverImageErrorMessage: l('CREATE_TOPIC_FORM->NO_TOPIC_COVER_IMAGE_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),
            onDeleteTopic_TopicNotFoundErrorMessage: l('CREATE_TOPIC_FORM->ON_DELETE_TOPIC->TOPIC_NOT_FOUND_ERROR_MESSAGE'),

            confirmDeleteTitle: l('CREATE_TOPIC_FORM->CONFIRM_DELETE_TITLE'),
            confirmDeleteDescription: l('CREATE_TOPIC_FORM->CONFIRM_DELETE_DESCRIPTION', { topic: topicTitle }),
        }
    }

    public show() {
        this.appendTo('Overlay');
        this.overlay = ContentComponent.getElement('Overlay');
        this.overlay.show();

        setTimeout(() => {
            this.overlay.addClass('Revealed').removeClass('Hidden');
            this.root.addClass('Revealed').removeClass('Hidden');
        }, 0);
    }

    @autobind
    private cancel(event: Event) {
        event.preventDefault();
        this.remove();
    }

    @autobind
    public remove(event?: Event): Promise<void> {
        return new Promise<void>((resolve) => {
            if (event && (event.target as HTMLElement).id !== 'Overlay') {
                return resolve();
            }

            this.root.addClass('Hidden').removeClass('Revealed')
            this.overlay.addClass('Hidden').removeClass('Revealed')
                .onTransitionEnd(() => {
                    this.overlay.hide().setHTML('');
                    super.remove();
                    resolve();
                });
        });
    }

    @autobind
    private handleFileChange(event: FileChangeEvent) {
        let files = event.target.files;
        for (let i = 0, f: any; f = files[i]; i++) {
            if (!f.type.match('image.*')) {
                continue;
            }

            let reader = new FileReader();
            reader.onload = (e: FileReadOnloadEvent) => {
                let image = new Image();
                image.src = e.target.result;
                image.onload = () => {
                    let imageCrop = new ImageCrop();
                    imageCrop.setDimensions({
                        cropWidth: 400,
                        cropHeight: 325,
                        paddingVertical: 50,
                        paddingHorizontal: 40,
                    })
                    .setImage(image)
                    .onDone((imageBlob, imageURL) => {
                        this.createPreviewImage(imageURL);

                        // Copy and replace input so that we can use the same image.
                        let input = this.elements.topicCoverImageInput;
                        let container = this.elements.topicCoverImage;
                        let clone = input.clone();
                        this.elements.topicCoverImageInput = clone;
                        clone.addEventListener('change', this.handleFileChange);
                        clone.appendTo(this.elements.topicCoverImage);
                        input.remove();

                        this.topicCoverImage = imageBlob;
                    })
                    .end();
                }
            }
            reader.readAsDataURL(f);
        }
    }

    private createPreviewImage(URL: string) {
        if (this.elements.previewImage) {
            this.elements.previewImage.remove();
        }

        let image = new Image();
        image.src = URL;
        image.width = this.topicCoverImageWidth;
        image.height = this.topicCoverImageHeight;
        let previewImage = this.elements.previewImage = new DOMElement(image);
        previewImage.id = 'CreateTopicFormTopicCoverImage';
        previewImage
            .addStyle('position', 'absolute')
            .addStyle('top', '0px')
            .addStyle('left', '0px')
            .prependTo(this.elements.topicCoverImage);
    }

    private showErrorMessage(message: string) {
        this.components.formMessage.showErrorMessage(message);
    }

    private hideErrorMessage() {
        this.components.formMessage.hideMessage();
    }

    private validateTitle() {
        if (this.title.length === 0) {
            this.showErrorMessage(this.text.noTitleErrorMessage);
            return false;
        }
        if (this.title.length > 50) {
            this.showErrorMessage(this.text.titleTooLongErrorMessage);
            return false;
        }
        return true;
    }

    private validateDescription() {
        if (this.description && this.description.length > 200) {
            this.showErrorMessage(this.text.descriptionTooLongErrorMessage);
            return false;
        }
        return true;
    }

    private validateTopicCoverImage() {
        if (!this.topicCoverImage && !this.data.get('coverImage')) {
            this.showErrorMessage(this.text.noTopicCoverImageErrorMessage);
            return false;
        }
        return true;
    }

    @autobind
    private submit(event?: Event) {
        event.preventDefault();

        if (this.isRequesting) {
            return;
        }

        let isValid = this.validateTopicCoverImage()
            && this.validateTitle()
            && this.validateDescription();

        if (!isValid) {
            return;
        }

        this.hideErrorMessage();

        this.components.submitButton.startLoading();
        this.isRequesting = true;

        unmarkLoadFinished();

        let isNew = false;
        if (!this.data) {
            isNew = true;
            this.data = new Topic();
        }
        let data = this.data;

        this.isRequesting = true;


        let callback = new TimedCallback(2000, () => {
            markLoadFinished();
            this.isRequesting = false;
            this.components.submitButton.stopLoading();
        });

        data.save({
                title: this.title,
                description: this.description,
                coverImage: this.topicCoverImage,
                order: isNew ? this.props.topics.length : this.data.get('order'),
            }).then(() => {
                callback.stop(() => {
                    if (isNew) {
                        this.props.topics.add(data);
                    }
                    this.remove();
                });
            })
            .catch(err => {
                callback.stop(() => {
                    this.showErrorMessage(this.text.unknownErrorErrorMessage);
                });
                console.log(err.stack || err);
            })
    }
}


interface Props {
    contentListClass: string;
    scrollBarLeft: string;
    scrollBarRight: string;
}

interface Text {
}

interface Elements {
    cursor: DOMElement;
}

interface ScrollEvent {
    deltaX: number;
}

export class HorizontalScrollBar extends ContentComponent<Props, any, Elements> {
    public parentComponent: TopicsView;
    private container: DOMElement;
    private collection: DOMElement;

    private containerWidth: number;
    private contentWidth: number;
    private cursorWidth: number;
    private cursorPosition = 0;
    public contentPosition = 0;
    private firstContentElement: DOMElement;

    private scrollBarLeft: DOMElement;
    private scrollBarRight: DOMElement;

    public render() {
        return (
            <div class='HorizontalScrollBar' style='display: none;'>
                <div ref='cursor' class='HorizontalScrollBarCursor'/>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.scrollBarLeft = DOMElement.getElement(this.props.scrollBarLeft);
        this.scrollBarRight = DOMElement.getElement(this.props.scrollBarRight);

        this.container = this.parentComponent.root;
        this.collection = this.parentComponent.components.collection.elements.collection;
        this.setScrollBarCursorDimensions();

        window.addEventListener('resize', this.recalculate);
    }

    @autobind
    public recalculate() {
        this.setScrollBarCursorDimensions();
    }

    public scrollOneTopicForwardIfNecessary() {
        if (this.contentWidth < this.containerWidth) {
            this.collection.addStyle('margin-left', '0px');
            this.contentPosition = 0;
            this.container.removeEventListener('wheel', this.scroll);
            return;
        }

        if (this.contentPosition > 0) {
            let duration = 500;
            let start = this.contentPosition;
            let end: number;
            if (this.contentPosition > 420) {
                end = this.contentPosition - 420;
            }
            else {
                end = 0;
            }
            let change = end - start;
            let originalTime = Date.now();
            let elapsedTime: number;

            let self = this;
            function animateScroll() {
                elapsedTime = Date.now() - originalTime;
                self.collection.addStyle('margin-left', -easeInOut(elapsedTime, start, change, duration) + 'px');
                if (elapsedTime < duration) {
                    requestAnimationFrame(animateScroll);
                }
                else {
                    self.contentPosition = end;
                    if (end === 0) {
                        self.container.removeEventListener('wheel', self.scroll);
                    }
                }
            }

            function easeInOut(currentTime: number, start: number, change: number, duration: number) {
                currentTime /= duration / 2;
                if (currentTime < 1) {
                    return change / 2 * currentTime * currentTime + start;
                }
                currentTime -= 1;
                return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
            }
            requestAnimationFrame(animateScroll);
        }
    }

    @autobind
    private scroll(event: MouseWheelEvent) {
        event.stopPropagation();
        event.preventDefault();

        // Positive x direction is the right direction. The native 'wheelDeltaX'
        // is inverted, thus we need to correct it.
        let deltaX = -event.wheelDeltaX;

        this.contentPosition += deltaX;
        if (this.contentPosition < 0) {
            this.contentPosition = 0;
        }
        if (this.contentPosition > this.contentWidth - this.containerWidth) {
            this.contentPosition = this.contentWidth - this.containerWidth;
        }
        let contentPercentagePosition =  this.contentPosition / this.contentWidth
        this.cursorPosition = contentPercentagePosition * this.containerWidth;

        this.collection.addStyle('margin-left', -this.contentPosition + 'px');
        this.elements.cursor.addStyle('margin-left', this.cursorPosition + 'px');

        if (this.contentPosition > 0) {
            this.scrollBarLeft.addClass('Active');
        }
        else {
            this.scrollBarLeft.removeClass('Active');
        }
        if (this.contentPosition !== this.contentWidth - this.containerWidth) {
            this.scrollBarRight.addClass('Active');
        }
        else {
            this.scrollBarRight.removeClass('Active');
        }
    }

    @autobind
    private setScrollBarCursorDimensions(): void {
        this.container.removeEventListener('wheel', this.scroll);

        this.containerWidth = this.container.getWidth();
        let topics = this.collection.getChildren();

        if (topics.length === 0) {
            this.root.hide();
            this.scrollBarLeft.removeClass('Active');
            this.scrollBarRight.removeClass('Active');
            this.contentPosition = 0;
            return;
        }
        this.contentWidth = 0;
        this.firstContentElement = this.collection.getFirstChildElement();
        let width = this.firstContentElement.getWidth();
        let marginRight = this.firstContentElement.getStyleInPixels('marginRight');
        for (let e of topics) {
            this.contentWidth += width + marginRight;
        }
        this.contentWidth += 124;

        if (this.contentWidth <= this.containerWidth) {
            this.root.hide();
            this.scrollBarLeft.removeClass('Active');
            this.scrollBarRight.removeClass('Active');
            this.contentPosition = 0;
            this.collection.addStyle('margin-left', '0px');
            return;
        }
        this.root.show();

        this.container.addEventListener('wheel', this.scroll);

        let cursor = this.elements.cursor;

        let containerWidthPercentageOfContent = this.containerWidth / this.contentWidth;
        this.cursorWidth = containerWidthPercentageOfContent * this.containerWidth;
        cursor.setWidth(this.cursorWidth);

        let contentPercentagePosition =  this.contentPosition / this.contentWidth
        this.cursorPosition = contentPercentagePosition * this.containerWidth;

        this.collection.addStyle('margin-left', -this.contentPosition + 'px');
        this.elements.cursor.addStyle('margin-left', this.cursorPosition + 'px');

        if (this.contentPosition > 0) {
            this.scrollBarLeft.addClass('Active');
        }
        else {
            this.scrollBarLeft.removeClass('Active');
        }
        if (this.contentPosition !== this.contentWidth - this.containerWidth) {
            this.scrollBarRight.removeClass('Active');
        }
        else {
            this.scrollBarRight.removeClass('Active');
        }
    }
}