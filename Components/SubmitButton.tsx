
import { Gaussian, ContentComponent, DOMElement, React } from '../Library/Index';

interface Props {
    buttonText: string;
}

interface SubmitButtonElements {
    loadingCanvas: DOMElement;
    container: DOMElement;
}

interface Point {
    x: number;
    y: number;
}

interface SineWaveOptions {
    width: number;
    height: number;
}

export class SineWave {
    public startPoint: Point;
    public offset: Point;
    public period = 50;
    public amplitude = 30;
    public speed = 1.8;
    public guassianMultiplier = 50;
    public gaussian: Gaussian;
    public context: CanvasRenderingContext2D;
    public animation: any;

    constructor(public canvas: HTMLCanvasElement, options: SineWaveOptions) {
        this.startPoint = { x: 0, y: 0 };
        canvas.width = options.width * 2;
        canvas.height = options.height * 2;
        this.gaussian = new Gaussian(canvas.width / 2, canvas.width / 6);
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.context.lineWidth = 3;
        this.offset = { x: 0, y: options.height };
    }

    /**
     * Get y coordinate based on x
     */
    private getYCoordinate(x: number, line: number): number {
        let period: number;
        let xWithOffset = (x + this.offset.x);
        let y = this.amplitude * Math.sin(2 * Math.PI / this.period * xWithOffset);
        return ((y * (this.gaussian.pdf(x) * this.guassianMultiplier) * (line + 1) / 2.5) + this.offset.y);
    }

    /**
    * Start animate the sinus wave
    */
    start() {
        let lastAnimation = new Date().getTime()
        let gradient1 = this.context.createLinearGradient(0, 0, this.canvas.width, 0);


        gradient1.addColorStop(0, 'rgba(124, 128, 157, 0)');
        gradient1.addColorStop(0.2, 'rgba(124, 128, 157, 0.7)');
        gradient1.addColorStop(0.8, 'rgba(124, 128, 157, 0.7)');
        gradient1.addColorStop(1, 'rgba(124, 128, 157, 0)');

        let _this = this;
        function animate() {
            _this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);

            _this.offset.x += _this.speed * (new Date().getTime() - lastAnimation) / 16;
            if(_this.offset.x >= _this.canvas.width) {
                _this.offset.x = _this.offset.x - 2 * Math.PI/_this.period;
            }

            for(var line = 1; line <= 3; line++) {
                _this.context.beginPath();
                _this.context.strokeStyle = gradient1;

                _this.context.moveTo(_this.startPoint.x, _this.startPoint.y);
                for(var index = 1; index <= _this.canvas.width; index++) {
                    let newX = _this.startPoint.x + index;
                    _this.context.lineTo(newX, _this.getYCoordinate(newX, line));
                }
                _this.context.stroke();
            }

            lastAnimation = new Date().getTime();


            _this.animation = requestAnimationFrame.call(window, animate);
        }
        this.animation = requestAnimationFrame.call(window, animate);
    };

    /**
     * Stop canvas rendering.
     */
    stop() {
        cancelAnimationFrame(this.animation);
    };
}

export class SubmitButton extends ContentComponent<Props, {}, SubmitButtonElements> {
    private sineWave: SineWave;
    render() {
        return (
            <div ref='container' class='SubmitButtonContainer Idle'>
                <input class='SubmitButtonButton TextButton' type='submit' ref='button' value={this.props.buttonText} disabled/>
                <canvas ref='loadingCanvas' class='SubmitButtonLoadingCanvas'/>
            </div>
        );
    }

    bindDOM() {
        super.bindDOM();
        let container = this.elements.container;
        let height = container.getHeight();
        let width = container.getWidth();
        this.elements.loadingCanvas.setAttribute('style', `height: ${height}px; width: ${width}px; display: block;`);
        this.sineWave = new SineWave(this.elements.loadingCanvas.nativeElement as HTMLCanvasElement, { width: width, height: height });
    }

    addOnSubmitListener(callback: EventListener) {
        this.elements.container.addEventListener('click', callback);
    }

    startLoading() {
        this.elements.container.addClass('Loading').removeClass('Idle');
        this.sineWave.start();
    }

    stopLoading() {
        this.elements.container.addClass('Idle').removeClass('Loading');
        this.sineWave.stop();
    }
}
