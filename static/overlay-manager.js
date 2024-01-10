class overlayManager {
    constructor(id, onLoadFunc, buttonName) {
        this.id = id;
        this.state = false;
        this.onLoadFunc = onLoadFunc;
        this.buttonName = buttonName;
        this.buttonVisibility = this.buttonName !== null;
    }
    changeState() {
        if (this.state === false) {
            document.querySelector(`#${this.id}`).style.display = "flex";
            this.setupButton();
        }
        else {
            document.querySelector(`#${this.id}`).style.display = "none";
        }
        this.state = !this.state;
    }
    setupButton() {
        if (this.buttonVisibility !== false) {
            Telegram.WebApp.MainButton.setParams({
                text: this.buttonName,
                is_visible: this.buttonVisibility
            })
        }
    }
}


const registrationOverlay = new overlayManager(
    id = 'overlay_registration',
    onLoadFunc = null,
    buttonName = "Зарегистрироваться"
);


const eventListOverlay = new overlayManager(
    id = 'overlay_event_list',
    onLoadFunc = null,
    buttonName = "Новая тренировка"
);


const eventCreateOverlay = new overlayManager(
    id = 'event_creation',
    onLoadFunc = null,
    buttonName = "Создать"
);


const teamListOverlay = new overlayManager(
    id = "overlay_teams",
    onLoadFunc = null,
    buttonName = null
);


const statisticsOverlay = new overlayManager(
    id = "overlay_stats",
    onLoadFunc = null,
    buttonName = null
);


const viewEventOverlay = new overlayManager(
    id = "overlay_event",
    onLoadFunc = null,
    buttonName = "Записаться"
);