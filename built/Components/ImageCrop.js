"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../Library/Index');
function dataUriToBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
}
var ImageCrop = (function (_super) {
    __extends(ImageCrop, _super);
    function ImageCrop() {
        _super.call(this);
        this.borderBullsEyeWidth = 2;
        this.maxZoomHeight = 10000;
        this.maxZoomWidth = 10000;
        this.drag = this.drag.bind(this);
        this.zoom = this.zoom.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.done = this.done.bind(this);
    }
    ImageCrop.prototype.render = function () {
        var l = window.localizations;
        return (Index_1.React.createElement("form", {class: 'BgWhite Hidden'}, Index_1.React.createElement("canvas", {id: 'ImageCropCanvasHelper', ref: 'imageCropCanvasHelper', width: this.canvasWidth, height: this.canvasHeight}), Index_1.React.createElement("section", {id: 'ImageCropCropSection', ref: 'imageCropSection', style: this.cropContainerStyle}, Index_1.React.createElement("div", {id: 'ImageCropOverlayTop', class: 'ImageCropOverlay', style: this.imageCropOverlayTopStyle}), Index_1.React.createElement("div", {id: 'ImageCropOverlayLeft', class: 'ImageCropOverlay', style: this.imageCropOverlayLeftStyle}), Index_1.React.createElement("div", {id: 'ImageCropOverlayRight', class: 'ImageCropOverlay', style: this.imageCropOverlayRightStyle}), Index_1.React.createElement("div", {id: 'ImageCropOverlayBottom', class: 'ImageCropOverlay', style: this.imageCropOverlayBottomStyle}), Index_1.React.createElement("div", {id: 'ImageCropBullsEye', ref: 'bullsEye', style: this.bullsEyeStyle}, Index_1.React.createElement("div", {id: 'ImageCropZoomHelpTextContainer', ref: 'zoomHelpTextContainer', class: 'Revealed'}, Index_1.React.createElement("span", {id: 'ImageCropZoomHelpText'}, l('IMAGE_CROP->ZOOM_HELP_TEXT')))), Index_1.React.createElement("img", {ref: 'imagePreview', id: 'ImageCropImagePreview', class: 'ZoomIn', src: this.props.image.src, style: this.imagePreviewStyle})), Index_1.React.createElement("section", {id: 'ImageCropActionSection', style: this.imageCropActionSectionStyle}, Index_1.React.createElement("a", {ref: 'doneButton', id: 'ImageCropDoneButton', class: 'PurpleButton2'}, l('DEFAULT->DONE')))));
    };
    ImageCrop.prototype.setDimensions = function (d) {
        this.canvasHeight = d.cropHeight * 3;
        this.canvasWidth = d.cropWidth * 3;
        var cropContainerHeight = d.cropHeight + d.paddingVertical * 2;
        var cropContainerWidth = d.cropWidth + d.paddingHorizontal * 2;
        this.cropContainerStyle = "height: " + cropContainerHeight + "px; width: " + cropContainerWidth + "px;";
        this.imageCropOverlayTopStyle = "height: " + d.paddingVertical + "px;";
        this.imageCropOverlayLeftStyle = "height: " + d.cropHeight + "px; width: " + d.paddingHorizontal + "px; top: " + d.paddingVertical + "px;";
        this.imageCropOverlayRightStyle = "height: " + d.cropHeight + "px; width: " + d.paddingHorizontal + "px; top: " + d.paddingVertical + "px;";
        this.imageCropOverlayBottomStyle = "height: " + d.paddingVertical + "px;";
        this.bullsEyeStyle = "height: " + (d.cropHeight - this.borderBullsEyeWidth * 2) + "px; width: " + (d.cropWidth - 4) + "px; top: " + d.paddingVertical + "px; left: " + d.paddingHorizontal + "px;";
        this.imageCropActionSectionStyle = "width: " + cropContainerWidth + "px;";
        this.imageCropDimensions = d;
        return this;
    };
    ImageCrop.prototype.setImage = function (image) {
        this.originalImageHeight = image.height;
        this.originalImageWidth = image.width;
        if (image.height > image.width) {
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
        this.imagePreviewStyle = "height: " + this.height + "px; width: " + this.width + "px; top: " + this.top + "px; left: " + this.left + "px;";
        this.props.image = image;
        return this;
    };
    ImageCrop.prototype.bindInteractions = function () {
        var bullsEye = this.elements.bullsEye;
        bullsEye.addEventListener('wheel', this.zoom);
        bullsEye.addEventListener('mousedown', this.startDrag);
        this.elements.imageCropSection.addEventListener('mousemove', function (event) { return event.preventDefault(); });
        this.elements.doneButton.onClick(this.done);
    };
    ImageCrop.prototype.startDrag = function (event) {
        var bullsEye = this.elements.bullsEye;
        bullsEye.addEventListener('mousemove', this.drag);
        bullsEye.addEventListener('mouseleave', this.stopDrag);
        bullsEye.addEventListener('mouseup', this.stopDrag);
        this.startTop = this.top;
        this.startLeft = this.left;
        this.startPageX = event.pageX;
        this.startPageY = event.pageY;
    };
    ImageCrop.prototype.drag = function (event) {
        event.preventDefault();
        var deltaX = event.pageX - this.startPageX;
        var deltaY = event.pageY - this.startPageY;
        var left = this.startLeft + deltaX;
        var top = this.startTop + deltaY;
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
        this.elements.imagePreview.setAttribute('style', "height: " + this.height + "px; width: " + this.width + "px; top: " + this.top + "px; left: " + this.left + "px;");
    };
    ImageCrop.prototype.stopDrag = function () {
        this.elements.bullsEye.removeEventListener('mousemove', this.drag);
    };
    ImageCrop.prototype.zoom = function (event) {
        event.preventDefault();
        var ratio;
        if (event.deltaY > 0) {
            ratio = 1 + (event.deltaY / 2) / (this.imageCropDimensions.cropHeight);
        }
        else {
            ratio = 1 - Math.abs((event.deltaY / 2)) / (this.imageCropDimensions.cropHeight);
        }
        var outerWidth = this.imageCropDimensions.paddingHorizontal - this.left;
        var outerHeight = this.imageCropDimensions.paddingVertical - this.top;
        var topScaleRatio = (event.offsetY + outerHeight) / this.height;
        var leftScaleRatio = (event.offsetX + outerWidth) / this.width;
        var newHeight = this.height * ratio;
        var newWidth = this.width * ratio;
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
        var top = this.top - (newHeight - this.height) * topScaleRatio;
        var left = this.left - (newWidth - this.width) * leftScaleRatio;
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
        this.elements.imagePreview.setAttribute('style', "height: " + this.height + "px; width: " + this.width + "px; top: " + this.top + "px; left: " + this.left + "px;");
    };
    ImageCrop.prototype.whenDone = function (done) {
        this.doneHandler = done;
        return this;
    };
    ImageCrop.prototype.done = function () {
        var _this = this;
        var canvas = this.elements.imageCropCanvasHelper.nativeElement;
        var context = canvas.getContext('2d');
        var ratio = this.originalImageWidth / this.width;
        var bullsEyeLeft = (this.imageCropDimensions.paddingHorizontal - this.left) * ratio;
        var bullsEyeTop = (this.imageCropDimensions.paddingVertical - this.top) * ratio;
        var bullsEyeWidth = this.imageCropDimensions.cropWidth * ratio;
        var bullsEyeHeight = this.imageCropDimensions.cropHeight * ratio;
        context.drawImage(this.elements.imagePreview.nativeElement, bullsEyeLeft, bullsEyeTop, bullsEyeWidth, bullsEyeHeight, 0, 0, this.canvasWidth, this.canvasHeight);
        context.scale(2, 2);
        this.overlay.removeClass('Revealed').addClass('Hidden');
        this.root.removeClass('Revealed').addClass('Hidden')
            .whenTransitionEnd(function () {
            _this.root.remove();
            _this.overlay.hide();
        });
        var dataURL = canvas.toDataURL('image/jpeg', 1);
        this.doneHandler(dataUriToBlob(dataURL), dataURL);
    };
    ImageCrop.prototype.end = function () {
        var _this = this;
        this.appendTo('Overlay');
        setTimeout(function () {
            _this.root.addClass('Revealed').removeClass('Hidden');
            _this.elements.imagePreview.addClass('ZoomOut').removeClass('ZoomIn')
                .whenTransitionEnd(function () {
                _this.elements.zoomHelpTextContainer.addClass('Hidden').removeClass('Revealed')
                    .whenTransitionEnd(function () {
                    _this.elements.zoomHelpTextContainer.remove();
                });
            });
        }, 0);
        this.overlay = Index_1.ContentComponent.getElement('Overlay');
        this.overlay.show().addClass('Revealed').removeClass('Hidden');
        this.bindInteractions();
    };
    return ImageCrop;
}(Index_1.ContentComponent));
exports.ImageCrop = ImageCrop;
//# sourceMappingURL=ImageCrop.js.map