
import { React, ContentComponent, DOMElement, PageInfo, Collection, autobind } from '../Library/Index';
import { Topics } from './Topics';
import { Topic } from './Topic';
import { SubmitButton, FormMessage, ImageCrop } from '../Components/Index';

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
        let data = this.props.data;
        let topics = data.get('topics') as Topics;

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
                {topics.length > 10000 ? <TopicsCollectionView l={this.props.l} data={this.props.data.get('topics')}/> : emptyView}
            </div>
        );
    }

    public bindData() {
        this.props.data.on('add:topics', () => {
            if (this.elements.emptyView) {
                this.elements.emptyView.addClass('Hidden').removeClass('Revealed');
                let component = this.appendRelationComponent(TopicsCollectionView, 'topics');
            }
        });
    }

    public bindDOM() {
        super.bindDOM();
        this.bindData();
        if (this.elements.emptyView) {
            this.elements.addButton.addEventListener('click', this.showCreateTopicForm);
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
        let form = new CreateTopicForm({ l: this.props.l, data: this.props.data });
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

    public render() {
        let topicViews: JSX.Element[] = [];
        for (let i = 0; i < this.props.data.length; i++) {
            topicViews.push(<TopicView l={this.props.l} data={this.props.data.at(i)}/>);
        }

        return (
            <div id='TopicsCollectionView' class='Hidden'>
                {topicViews}
            </div>
        );
    }

    public show() {
    }
}

interface TopicProps {
}

interface TopicElements {
}

interface TopicText {
    imageURL: string;
    title: string;
    description: string;
    followers: string;
}

class TopicView extends ContentComponent<TopicProps, TopicText, TopicElements> {
    public render() {
        return (
            <div class='Topic BgWhite1'>
                <div class='TopiceCoverImageContainer'>
                    <img class='TopicCoverImage' src={this.text.imageURL}/>
                    <h1 class='TopicTitle' bindText='title'></h1>
                    <p bindText='description'></p>
                </div>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        let data = this.props.data;
        this.text = {
            imageURL: data.get('coverImage').medium.url,
            title: data.get('title'),
            description: data.get('description'),
            followers: l('TOPIC->FOLLOWERS_TEXT', { followers: data.get('followers') }),
        }
    }
}

interface CreateTopicFormProps {
}

interface CreateTopicFormText {
    titleInputPlaceholder: string;
    descriptionInputPlaceholder: string;
    dropImagePromptText: string;
    submitButtonText: string;

    noTitleErrorMessage: string;
    titleTooLongErrorMessage: string;
    noTopicCoverImageErrorMessage: string;
}

interface CreateTopicFormElements {
    titleInput: DOMElement;
    descriptionInput: DOMElement;
    topicCoverImage: DOMElement;
    topicCoverImageInput: DOMElement;
    submitButton: DOMElement;
    previewImage: DOMElement;
    formMessage: DOMElement;
}

interface Components {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

class CreateTopicForm extends ContentComponent<CreateTopicFormProps, CreateTopicFormText, CreateTopicFormElements> {
    public components: Components;

    private overlay: DOMElement;

    private topicCoverImage: Blob;
    private title = '';
    private description = '';

    private topicCoverImageWidth = 350;
    private topicCoverImageHeight = 285;

    private isRequesting = false;

    public render() {
        return (
            <form class='Hidden BgWhite1'>
                <div id='CreateTopicFormDropContainer'>
                    <div ref='topicCoverImage' id='CreateTopicFormDropContainerBorder'>
                        <input ref='topicCoverImageInput' type='file' class='FileInput'/>
                        <span id='CreateTopicFormDropText'>{this.text.dropImagePromptText}</span>
                    </div>
                </div>
                <div id='CreateTopicFormInputContainer'>
                    <input ref='titleInput' id='CreateTopicFormTitleInput' placeholder={this.text.titleInputPlaceholder} class='TextInput'/>
                    <textarea ref='descriptionInput' id='CreateTopicFormDescriptionInput' placeholder={this.text.descriptionInputPlaceholder} class='TextAreaInput'/>
                    <FormMessage id='CreateTopicFormMessage' ref='formMessage'/>
                </div>
                <SubmitButton ref='submitButton' id='CreateTopicFormSubmitButton' buttonText={this.text.submitButtonText}/>
            </form>
        );
    }

    public bindDOM() {
        super.bindDOM();

        let input = this.elements.topicCoverImageInput;
        input.addEventListener('change', this.handleFileChange);
        input.addEventListener('dragenter', this.handleDragOver);
        input.addEventListener('dragleave', this.handleDragLeave);
        input.addEventListener('drop', this.handleFileChange);

        this.elements.submitButton = this.components.submitButton.elements.container;
        this.elements.submitButton.removeAttribute('disabled');
        this.elements.submitButton.onClick(this.submit);

        this.elements.titleInput.addEventListener('change', () => {
            this.title = this.elements.titleInput.getValue();
        });
        this.elements.descriptionInput.addEventListener('change', () => {
            this.description = this.elements.descriptionInput.getValue();
        });
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
            titleInputPlaceholder: l('CREATE_TOPIC_FORM->TITLE_INPUT_PLACEHOLDER'),
            descriptionInputPlaceholder: l('CREATE_TOPIC_FORM->DESCRIPTION_INPUT_PLACEHOLDER'),
            dropImagePromptText: l('CREATE_TOPIC_FORM->DROP_IMAGE_PROMPT_TEXT'),
            submitButtonText: l('CREATE_TOPIC_FORM->SUBMIT_BUTTON_TEXT'),

            noTitleErrorMessage: l('CREATE_TOPIC_FORM->NO_TITLE_ERROR_MESSAGE'),
            titleTooLongErrorMessage: l('CREATE_TOPIC_FORM->TITLE_TOO_LONG_ERROR_MESSAGE'),
            noTopicCoverImageErrorMessage: l('CREATE_TOPIC_FORM->NO_TOPIC_COVER_IMAGE_ERROR_MESSAGE'),
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
                    .onDone((imageBlob, imageUrl) => {

                        if (this.elements.previewImage) {
                            this.elements.previewImage.remove();
                        }

                        let image = new Image();
                        image.src = imageUrl;
                        image.width = this.topicCoverImageWidth;
                        image.height = this.topicCoverImageHeight;
                        this.elements.previewImage = new DOMElement(image);
                        this.elements.previewImage.id = 'CreateTopicFormTopicCoverImage';
                        this.elements.previewImage.appendTo(this.elements.topicCoverImage);

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
        if (this.title.length > 100) {
            this.showErrorMessage(this.text.titleTooLongErrorMessage);
            return false;
        }
        return true;
    }

    private validateTopicCoverImage() {
        if (!this.topicCoverImage) {
            this.showErrorMessage(this.text.noTopicCoverImageErrorMessage);
            return false;
        }
        return true;
    }

    @autobind
    private submit() {
        let isValid = this.validateTopicCoverImage() && this.validateTitle();

        if (!isValid) {
            return;
        }

        this.hideErrorMessage();

        this.components.submitButton.startLoading();
        this.isRequesting = true;

        unmarkLoadFinished();

        let topic = new Topic({
                title: this.title,
                description: this.description,
                coverImage: this.topicCoverImage,
                order: this.props.data.get('topics').length,
            })
            .save()
            .then(() => {

                this.components.submitButton.stopLoading();
                markLoadFinished();

                setTimeout(() => {
                    this.remove();
                    this.props.data.add('topics', topic);
                }, 500);
            });
    }
}
