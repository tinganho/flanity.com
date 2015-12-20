
declare module 'image-diff' {

    interface Options {

        /**
         * File path for actual image.
         */
        actualImage: string;

        /**
         * File path for expected image.
         */
        expectedImage: string;

        /**
         * File path for outputted diff image.
         */
        diffImage: string;
    }

    function imageDiff(options: Options, callback?: (err: Error, imagesAreSame: boolean) => void): void;
    export = imageDiff;
}