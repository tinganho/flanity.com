
import { ContentComponent, React, DOMElement } from '../Library/Index';

interface Props {
    image: HTMLImageElement;
}

interface ImageCropElements {
    imagePreview: DOMElement;
    bullsEye: DOMElement;
    imageCropCanvasHelper: DOMElement;
    imageCropSection: DOMElement;
    doneButton: DOMElement;
    zoomHelpTextContainer: DOMElement;
}

interface ImageCropDimensions {
    cropWidth: number;
    cropHeight: number;
    paddingVertical: number;
    paddingHorizontal: number;
}

function dataURIToBlob(dataURI: string) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
}

export class ImageCrop extends ContentComponent<Props, {}, ImageCropElements> {
    public imageCropDimensions: ImageCropDimensions;
    public borderBullsEyeWidth = 2;
    public l: any;
    private doneHandler: (imageBlob: Blob, imageUrl: string) => void;
    private cropContainerStyle: string;
    private imageCropOverlayTopStyle: string;
    private imageCropOverlayLeftStyle: string;
    private imageCropOverlayRightStyle: string;
    private imageCropOverlayBottomStyle: string;
    private imagePreviewStyle: string;
    private bullsEyeStyle: string;
    private imageCropActionSectionStyle: string;

    private left: number;
    private top: number;
    private width: number;
    private height: number;

    private startPageX: number;
    private startPageY: number;
    private startTop: number;
    private startLeft: number;

    private originalImageWidth: number;
    private originalImageHeight: number;

    private canvasWidth: number;
    private canvasHeight: number;

    private overlay: DOMElement;
    private removeOverlay: boolean;

    private maxZoomHeight = 10000;
    private maxZoomWidth = 10000;

    constructor() {
        super();

        this.drag = this.drag.bind(this);
        this.zoom = this.zoom.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.done = this.done.bind(this);
    }

    public render() {
        let l = (window as any).localizations;

        return (
            <form class='BgWhite2 Hidden'>
                <canvas id='ImageCropCanvasHelper' ref='imageCropCanvasHelper' width={this.canvasWidth} height={this.canvasHeight}/>
                <section id='ImageCropCropSection' ref='imageCropSection' style={this.cropContainerStyle}>
                    <div id='ImageCropOverlayTop' class='ImageCropOverlay' style={this.imageCropOverlayTopStyle}></div>
                    <div id='ImageCropOverlayLeft' class='ImageCropOverlay' style={this.imageCropOverlayLeftStyle}></div>
                    <div id='ImageCropOverlayRight' class='ImageCropOverlay' style={this.imageCropOverlayRightStyle}></div>
                    <div id='ImageCropOverlayBottom' class='ImageCropOverlay' style={this.imageCropOverlayBottomStyle}></div>
                    <div id='ImageCropBullsEye' ref='bullsEye' style={this.bullsEyeStyle}>
                        <div id='ImageCropZoomHelpTextContainer' ref='zoomHelpTextContainer' class='Revealed'>
                            <span id='ImageCropZoomHelpText'>{l('IMAGE_CROP->ZOOM_HELP_TEXT')}</span>
                        </div>
                    </div>
                    <img ref='imagePreview' id='ImageCropImagePreview' class='ZoomIn' src={this.props.image.src} style={this.imagePreviewStyle}/>
                </section>
                <section id='ImageCropActionSection' style={this.imageCropActionSectionStyle}>
                    <a ref='doneButton' id='ImageCropDoneButton' class='PurpleButton2'>{l('DEFAULT->DONE')}</a>
                </section>
            </form>
        );
    }

    public setDimensions(d: ImageCropDimensions): this {
        this.canvasHeight = d.cropHeight * 3;
        this.canvasWidth = d.cropWidth * 3;
        let cropContainerHeight = d.cropHeight + d.paddingVertical * 2;
        let cropContainerWidth = d.cropWidth + d.paddingHorizontal * 2;

        this.cropContainerStyle = `height: ${cropContainerHeight}px; width: ${cropContainerWidth}px;`;
        this.imageCropOverlayTopStyle = `height: ${d.paddingVertical}px;`;
        this.imageCropOverlayLeftStyle = `height: ${d.cropHeight}px; width: ${d.paddingHorizontal}px; top: ${d.paddingVertical}px;`;
        this.imageCropOverlayRightStyle = `height: ${d.cropHeight}px; width: ${d.paddingHorizontal}px; top: ${d.paddingVertical}px;`;
        this.imageCropOverlayBottomStyle = `height: ${d.paddingVertical}px;`;
        this.bullsEyeStyle = `height: ${d.cropHeight - this.borderBullsEyeWidth * 2}px; width: ${d.cropWidth - 4}px; top: ${d.paddingVertical}px; left: ${d.paddingHorizontal}px;`;
        this.imageCropActionSectionStyle = `width: ${cropContainerWidth}px;`;

        this.imageCropDimensions = d;

        return this;
    }

    public setImage(image: HTMLImageElement): this {
        this.originalImageHeight = image.height;
        this.originalImageWidth = image.width;
        let imageAspectRatio = image.width / image.height;
        let cropAspectRatio = this.imageCropDimensions.cropWidth / this.imageCropDimensions.cropHeight;

        if (imageAspectRatio < cropAspectRatio) {
            this.left = this.imageCropDimensions.paddingHorizontal;
            this.width = this.imageCropDimensions.cropWidth;
            this.height = this.imageCropDimensions.cropWidth / image.width * image.height;
            this.top = this.imageCropDimensions.paddingVertical - (this.height - this.imageCropDimensions.cropHeight) / 2;
        }
        else {
            this.top = this.imageCropDimensions.paddingVertical;
            this.height = this.imageCropDimensions.cropHeight;
            this.width = this.imageCropDimensions.cropHeight / image.height * image.width;
            this.left = this.imageCropDimensions.paddingHorizontal - (this.width - this.imageCropDimensions.cropWidth) / 2;
        }
        this.imagePreviewStyle = `height: ${this.height}px; width: ${this.width}px; top: ${this.top}px; left: ${this.left}px;`;
        this.props.image = image;

        return this;
    }

    public bindInteractions() {
        let bullsEye = this.elements.bullsEye;
        bullsEye.addEventListener('wheel', this.zoom);
        bullsEye.addEventListener('mousedown', this.startDrag);
        this.elements.imageCropSection.addEventListener('mousemove', (event) => event.preventDefault());
        this.elements.doneButton.onClick(this.done);
    }

    public startDrag(event: MouseEvent) {
        let bullsEye = this.elements.bullsEye;
        bullsEye.addEventListener('mousemove', this.drag);
        bullsEye.addEventListener('mouseleave', this.stopDrag);
        bullsEye.addEventListener('mouseup', this.stopDrag);

        this.startTop = this.top;
        this.startLeft = this.left;
        this.startPageX = event.pageX;
        this.startPageY = event.pageY;
    }

    public drag(event: MouseEvent) {
        event.preventDefault();

        let deltaX = event.pageX - this.startPageX;
        let deltaY = event.pageY - this.startPageY;
        let left = this.startLeft + deltaX;
        let top = this.startTop + deltaY;

        if (top >= this.imageCropDimensions.paddingVertical) {
            top = this.imageCropDimensions.paddingVertical;
        }
        if (left >= this.imageCropDimensions.paddingHorizontal) {
            left = this.imageCropDimensions.paddingHorizontal;
        }
        if (top + this.height <= this.imageCropDimensions.cropHeight + this.imageCropDimensions.paddingVertical) {
            top = this.imageCropDimensions.cropHeight + this.imageCropDimensions.paddingVertical - this.height;
        }
        if (left + this.width <= this.imageCropDimensions.cropWidth + this.imageCropDimensions.paddingHorizontal) {
            left = this.imageCropDimensions.cropWidth + this.imageCropDimensions.paddingHorizontal - this.width;
        }

        this.left = left;
        this.top = top;

        this.elements.imagePreview.setAttribute('style', `height: ${this.height}px; width: ${this.width}px; top: ${this.top}px; left: ${this.left}px;`);
    }

    public stopDrag() {
        this.elements.bullsEye.removeEventListener('mousemove', this.drag);
    }

    public zoom(event: WheelEvent) {
        event.preventDefault();

        let ratio: number;

        if (event.deltaY > 0) {
            ratio = 1 + (event.deltaY / 2) / (this.imageCropDimensions.cropHeight);
        }
        else {
            ratio = 1 - Math.abs((event.deltaY / 2)) / (this.imageCropDimensions.cropHeight);
        }

        let outerWidth = this.imageCropDimensions.paddingHorizontal - this.left;
        let outerHeight = this.imageCropDimensions.paddingVertical - this.top;
        let topScaleRatio = (event.offsetY + outerHeight) / this.height;
        let leftScaleRatio = (event.offsetX + outerWidth) / this.width;

        let newHeight = this.height * ratio;
        let newWidth = this.width * ratio;

        if (newWidth <= this.imageCropDimensions.cropWidth) {
            ratio = this.imageCropDimensions.cropWidth / this.width;
            newWidth = this.imageCropDimensions.cropWidth;
            newHeight = ratio * this.height;
        }
        if (newHeight <= this.imageCropDimensions.cropHeight) {
            ratio = this.imageCropDimensions.cropHeight / this.height;
            newHeight = this.imageCropDimensions.cropHeight;
            newWidth = ratio * this.width;
        }
        if (newWidth >= this.maxZoomWidth) {
            ratio = this.maxZoomWidth / this.width;
            newWidth = this.maxZoomWidth;
            newHeight = ratio * this.height;
        }
        if (newHeight > this.maxZoomHeight) {
            ratio = this.maxZoomHeight / this.height;
            newHeight = this.maxZoomHeight;
            newWidth = ratio * this.width;
        }

        let top = this.top - (newHeight - this.height) * topScaleRatio;
        let left = this.left - (newWidth - this.width) * leftScaleRatio;

        if (top >= this.imageCropDimensions.paddingVertical) {
            top = this.imageCropDimensions.paddingVertical;
        }
        if (left >= this.imageCropDimensions.paddingHorizontal) {
            left = this.imageCropDimensions.paddingHorizontal;
        }
        if (top + newHeight <= this.imageCropDimensions.cropHeight + this.imageCropDimensions.paddingVertical) {
            top = this.imageCropDimensions.cropHeight + this.imageCropDimensions.paddingVertical - newHeight;
        }
        if (left + newWidth <= this.imageCropDimensions.cropWidth + this.imageCropDimensions.paddingHorizontal) {
            left = this.imageCropDimensions.cropWidth + this.imageCropDimensions.paddingHorizontal - newWidth;
        }

        this.width = newWidth;
        this.height = newHeight;
        this.left = left;
        this.top = top;
        this.elements.imagePreview.setAttribute('style', `height: ${this.height}px; width: ${this.width}px; top: ${this.top}px; left: ${this.left}px;`);
    }

    public onDone(done: (imageBlob: Blob, imageUrl: string) => void): this {
        this.doneHandler = done;
        return this;
    }

    public done() {
        let canvas = (this.elements.imageCropCanvasHelper.nativeElement as HTMLCanvasElement);
        let context = canvas.getContext('2d');
        let ratio = this.originalImageWidth / this.width;
        let bullsEyeLeft = (this.imageCropDimensions.paddingHorizontal - this.left) * ratio;
        let bullsEyeTop = (this.imageCropDimensions.paddingVertical - this.top) * ratio;
        let bullsEyeWidth = this.imageCropDimensions.cropWidth * ratio;
        let bullsEyeHeight = this.imageCropDimensions.cropHeight * ratio;
        context.drawImage(
            this.elements.imagePreview.nativeElement as HTMLImageElement,
            bullsEyeLeft,
            bullsEyeTop,
            bullsEyeWidth,
            bullsEyeHeight, 0, 0, this.canvasWidth, this.canvasHeight);
        context.scale(2, 2);

        if (this.removeOverlay) {
            this.overlay.removeClass('Revealed').addClass('Hidden');
        }
        this.root.removeClass('Revealed').addClass('Hidden')
            .onTransitionEnd(() => {
                this.root.remove();
                if (this.removeOverlay) {
                    this.overlay.hide();
                }
            });

        let dataURL = canvas.toDataURL('image/jpeg', 1);
        this.doneHandler(dataURIToBlob(dataURL), dataURL);
    }

    public end() {
        this.appendTo('Overlay');
        this.root.addStyle('margin-left', '-' + (this.imageCropDimensions.cropWidth / 2 + this.imageCropDimensions.paddingHorizontal) + 'px');
        setTimeout(() => {
            this.root.addClass('Revealed').removeClass('Hidden');
            this.elements.imagePreview.addClass('ZoomOut').removeClass('ZoomIn')
                .onTransitionEnd(() => {
                    this.elements.zoomHelpTextContainer.addClass('Hidden').removeClass('Revealed')
                        .onTransitionEnd(() => {
                            this.elements.zoomHelpTextContainer.remove();
                        });
                });
        }, 0);
        this.overlay = ContentComponent.getElement('Overlay');
        if (this.overlay.hasClass('Hidden')) {
            this.overlay.show().addClass('Revealed').removeClass('Hidden');
            this.removeOverlay = true;
        }
        this.bindInteractions();
    }
}
