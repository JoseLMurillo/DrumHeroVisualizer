export class ButtonManager {
    constructor(
        playback,
        elements
    ) {
        this.playback =
            playback;

        this.playButton =
            elements.playButton;

        this.pauseButton =
            elements.pauseButton;

        this.stopButton =
            elements.stopButton;

        this.backwardButton =
            elements.backwardButton;

        this.forwardButton =
            elements.forwardButton;

        this.timeline =
            elements.timeline;

        this.setupEvents();
    }

    setupEvents() {
        // PLAY
        this.playButton.addEventListener(
            "click",
            () => {

                this.playback.play();

            }
        );

        // PAUSE
        this.pauseButton.addEventListener(
            "click",
            () => {

                this.playback.pause();

            }
        );

        // STOP
        this.stopButton.addEventListener(
            "click",
            () => {

                this.playback.stop();

            }
        );

        // BACKWARD
        this.backwardButton.addEventListener(
            "click",
            () => {
                this.playback.backward(5);
            }
        );

        // FORWARD
        this.forwardButton.addEventListener(
            "click",
            () => {
                this.playback.forward(5);
            }
        );

        // TIMELINE
        this.timeline.addEventListener(
            "input",
            () => {
                this.playback.seek(
                    Number(
                        this.timeline.value
                    )
                );
            }
        );
    }

    updateUI() {
        this.timeline.value =
            this.playback.currentTime;
    }
}