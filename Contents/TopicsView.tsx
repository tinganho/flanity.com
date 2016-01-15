
import { React, ContentComponent, DOMElement, PageInfo, Collection, autobind } from '../Library/Index';
import { Topics } from './Topics';
import { Topic } from './Topic';
import { SubmitButton, FormMessage, ImageCrop, HorizontalScrollBar } from '../Components/Index';

interface TopicsProps {
    name: string;
}

interface TopicsElements {
    addButton: DOMElement;
    emptyView: DOMElement;
}

interface TopicsText {
    contentTitle: string;
    emptyViewTitle: string
    emptyViewDescription: string;
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

    public static setPageInfo(data: Topics, l: GetLocalization, pageInfo: PageInfo) {
        let name = data.get('name');
        this.setPageTitle(l('TOPICS->PAGE_TITLE', { user: name }), pageInfo);
        this.setPageDescription(l('TOPICS->PAGE_DESCRIPTION', { user: name }), pageInfo);
        this.setPageImage('/Public/Images/HeroImage.jpg', pageInfo);
    }

    public render() {
        let topics = this.data.get('topics') as Topics;

        let emptyView = (
            <div ref='emptyView' id='TopicsEmptyView' class='Revealed'>
                <h1 id='TopicsEmptyViewTitle' class='Title1'>{this.text.emptyViewTitle}</h1>
                <p id='TopicsEmptyViewDescription' class='Description1'>{this.text.emptyViewDescription}</p>
                {getAddButton('TopicsEmptyViewAddButton')}
                <div id='TopicsEmptyViewHeroImageContainer'>
                    <img id='TopicsEmptyViewHeroImage' src='/Public/Images/HeroImage.jpg'></img>
                </div>
            </div>
        );

        return (
            <div>
                {topics.length > 0 ? [<TopicsCollectionView data={this.data.get('topics')}/>, <HorizontalScrollBar contentListClass='Topic'/>] : emptyView}
            </div>
        );
    }

    public bindData() {
        this.data.on('add:topics', () => {
            if (this.elements.emptyView) {
                this.elements.emptyView.addClass('Hidden').removeClass('Revealed');
                let component = this.appendRelationComponent(TopicsCollectionView, 'topics');
            }
        });
    }

    public bindDOM() {
        super.bindDOM();
        if (this.elements.emptyView) {
            this.elements.addButton.addEventListener('click', this.showCreateTopicForm);
        }
        else {
        }
    }

    public setText(l: GetLocalization) {
        this.text = {
            contentTitle: l('TOPICS->CONTENT_TITLE'),
            emptyViewTitle: l('TOPICS->EMPTY_VIEW_TITLE'),
            emptyViewDescription: l('TOPICS->EMPTY_VIEW_DESCRIPTION'),
        }
    }

    @autobind
    private showCreateTopicForm() {
        let form = new TopicForm({ topics: this.data.get('topics') });
        form.show();
    }
}

interface TopicsCollectionViewProps {
}

interface TopicsCollectionViewText {
}

interface TopicsCollectionViewElements {
}

class TopicsCollectionView extends ContentComponent<TopicsCollectionViewProps, TopicsCollectionViewText, TopicsCollectionViewElements> {
    public data: Topics;

    public render() {
        let topicViews: JSX.Element[] = [];
        for (let i = 0; i < this.data.length; i++) {
            topicViews.push(<TopicView id={'Topic' + i} data={this.data.at(i)}/>);
        }

        return (
            <div id='TopicsCollectionView' class={inServer ? 'Revealed' : 'Hidden'}>
                {topicViews}
            </div>
        );
    }
}

interface TopicProps {
}

interface TopicElements {
    editButton: DOMElement;
}

interface TopicText {
    editButtonText: string;
    imageURL: string;
    title: string;
    description: string;
    followers: string;
}

class TopicView extends ContentComponent<TopicProps, TopicText, TopicElements> {
    public data: Topic;

    public render() {
        return (
            <div class='Topic BgWhite1'>
                <div class='TopicCoverImageContainer'>
                    <div class='TopicCoverImageMask'/>
                    <img class='TopicCoverImage' bindText='src:imageURL'/>
                    <hgroup class='TopicHeaders'>
                        <h1 class='TopicTitle HeaderWhite2' bindText='title'></h1>
                        <h2 class='TopicFollowersCount HeaderWhite3' bindText='followers'></h2>
                    </hgroup>
                    <p class='TopicDescription ParagraphWhite1' bindText='description'></p>
                    <button ref='editButton' class='TopicEditButton WhiteTransparentButton TopicButton'>{this.text.editButtonText}</button>
                </div>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
            editButtonText: l('TOPIC->EDIT_BUTTON_TEXT'),
            imageURL: encodeURI(this.data.get('coverImage').medium.url),
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

    noTitleErrorMessage: string;
    titleTooLongErrorMessage: string;
    descriptionTooLongErrorMessage: string;
    noTopicCoverImageErrorMessage: string;
    unknownErrorErrorMessage: string;
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
}

interface Components {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

class TopicForm extends ContentComponent<CreateTopicFormProps, CreateTopicFormText, CreateTopicFormElements> {
    public components: Components;

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
                {this.data.isNew ? undefined : DeleteButton}
                <SubmitButton ref='submitButton' id='TopicFormSubmitButton' buttonText={this.text.submitButtonText}/>
            </form>
        );
    }

    public bindData() {
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
        this.text = {
            deleteButtonText: l('CREATE_TOPIC_FORM->DELETE_BUTTON_TEXT'),
            titleInputPlaceholder: l('CREATE_TOPIC_FORM->TITLE_INPUT_PLACEHOLDER'),
            descriptionInputPlaceholder: l('CREATE_TOPIC_FORM->DESCRIPTION_INPUT_PLACEHOLDER'),
            dropImagePromptText: l('CREATE_TOPIC_FORM->DROP_IMAGE_PROMPT_TEXT'),
            submitButtonText: this.data && this.data.isNew ? l('CREATE_TOPIC_FORM->CREATE_BUTTON_TEXT') : l('CREATE_TOPIC_FORM->EDIT_BUTTON_TEXT'),

            noTitleErrorMessage: l('CREATE_TOPIC_FORM->NO_TITLE_ERROR_MESSAGE'),
            titleTooLongErrorMessage: l('CREATE_TOPIC_FORM->TITLE_TOO_LONG_ERROR_MESSAGE'),
            descriptionTooLongErrorMessage: l('CREATE_TOPIC_FORM->DESCRIPTION_TOO_LONG_ERROR_MESSAGE'),
            noTopicCoverImageErrorMessage: l('CREATE_TOPIC_FORM->NO_TOPIC_COVER_IMAGE_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),
        }
    }

    public show() {
        this.appendTo('Overlay');
        this.overlay = ContentComponent.getElement('Overlay');
        this.overlay.show();
        this.overlay.addEventListener('click', this.remove);
        this.bindDOM();

        setTimeout(() => {
            this.overlay.addClass('Revealed').removeClass('Hidden');
            this.root.addClass('Revealed').removeClass('Hidden');
        }, 0);
    }

    @autobind
    private remove(event?: Event) {
        if (event && (event.target as HTMLElement).id !== 'Overlay') {
            return;
        }
        this.overlay.removeEventListener('click', this.remove);
        this.overlay.addClass('Hidden').removeClass('Revealed');
        this.root.addClass('Hidden').removeClass('Revealed')
            .onTransitionEnd(() => {
                this.overlay.hide().setHTML('');
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
    private submit() {
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

        data.save({
                title: this.title,
                description: this.description,
                coverImage: this.topicCoverImage,
                order: isNew ? this.props.topics.length : this.data.get('order'),
            }).then(() => {
                this.components.submitButton.stopLoading();
                markLoadFinished();
                this.isRequesting = false;

                setTimeout(() => {
                    if (isNew) {
                        this.props.topics.add(data);
                    }
                    this.remove();
                }, 500);
            })
            .catch(err => {
                this.components.submitButton.stopLoading();
                this.showErrorMessage(this.text.unknownErrorErrorMessage);
                this.isRequesting = false;
                console.log(err.stack || err);
            })
    }
}
