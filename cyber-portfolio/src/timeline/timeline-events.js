// File: /cyber-portfolio/cyber-portfolio/src/timeline/timeline-events.js

class TimelineEvents {
    constructor(timelineController) {
        this.timelineController = timelineController;
        this.initEvents();
    }

    initEvents() {
        // Lắng nghe sự kiện click cho các nút trên timeline
        document.querySelectorAll('.timeline-button').forEach(button => {
            button.addEventListener('click', (event) => {
                this.handleTimelineButtonClick(event);
            });
        });

        // Lắng nghe sự kiện cuộn để cập nhật trạng thái timeline
        window.addEventListener('scroll', () => {
            this.updateTimelineOnScroll();
        });
    }

    handleTimelineButtonClick(event) {
        const targetId = event.target.dataset.targetId;
        this.timelineController.goToEvent(targetId);
    }

    updateTimelineOnScroll() {
        // Cập nhật trạng thái timeline dựa trên vị trí cuộn
        const scrollPosition = window.scrollY;
        this.timelineController.updateTimelineState(scrollPosition);
    }
}

// Xuất khẩu lớp TimelineEvents để sử dụng ở nơi khác
export default TimelineEvents;