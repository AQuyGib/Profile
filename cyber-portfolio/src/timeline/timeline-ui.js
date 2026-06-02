// File: src/timeline/timeline-ui.js

class TimelineUI {
    constructor(controller) {
        this.controller = controller;
        this.timelineElement = document.createElement('div');
        this.timelineElement.className = 'timeline-ui';
        this.initUI();
    }

    initUI() {
        // Tạo thanh timeline
        const timelineHeader = document.createElement('h2');
        timelineHeader.innerText = 'Timeline Workflow';
        this.timelineElement.appendChild(timelineHeader);

        // Tạo các nút điều khiển
        const playButton = this.createButton('Play', this.controller.play);
        const pauseButton = this.createButton('Pause', this.controller.pause);
        const resetButton = this.createButton('Reset', this.controller.reset);

        this.timelineElement.appendChild(playButton);
        this.timelineElement.appendChild(pauseButton);
        this.timelineElement.appendChild(resetButton);

        // Thêm thanh timeline vào DOM
        document.body.appendChild(this.timelineElement);
    }

    createButton(label, onClick) {
        const button = document.createElement('button');
        button.innerText = label;
        button.onclick = onClick.bind(this.controller);
        return button;
    }

    updateProgress(progress) {
        // Cập nhật tiến độ của timeline
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${progress * 100}%`;
        this.timelineElement.appendChild(progressBar);
    }

    clear() {
        // Xóa giao diện timeline
        this.timelineElement.innerHTML = '';
    }
}

// Xuất khẩu lớp TimelineUI
export default TimelineUI;