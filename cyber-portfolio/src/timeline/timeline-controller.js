// timeline-controller.js

class TimelineController {
    constructor(timelineUI, timelineEvents) {
        this.timelineUI = timelineUI;
        this.timelineEvents = timelineEvents;
        this.currentStep = 0;
        this.steps = [];
    }

    init(steps) {
        this.steps = steps;
        this.renderTimeline();
        this.bindEvents();
    }

    renderTimeline() {
        this.timelineUI.render(this.steps);
    }

    bindEvents() {
        this.timelineUI.onStepClick((stepIndex) => {
            this.goToStep(stepIndex);
        });

        this.timelineEvents.onNext(() => {
            this.nextStep();
        });

        this.timelineEvents.onPrevious(() => {
            this.previousStep();
        });
    }

    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.updateScene();
        }
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateScene();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateScene();
        }
    }

    updateScene() {
        // Logic to update the 3D scene based on the current step
        const stepData = this.steps[this.currentStep];
        // Implement scene update logic here
    }
}

export default TimelineController;