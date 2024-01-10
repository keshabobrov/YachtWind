class overlayManager {
    constructor(id, onLoadFunc, buttonName, permissionLevel) {
        this.id = id;
        this.state = false;
        this.onLoadFunc = onLoadFunc;
        this.buttonName = buttonName;
        this.buttonVisibility = this.buttonName !== null;
        this.permissionLevel = permissionLevel;
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
            if (this.checkPermissions() < this.permissionLevel) {
                return;
            }
            Telegram.WebApp.MainButton.setParams({
                text: this.buttonName,
                is_visible: this.buttonVisibility
            });
            sessionStorage.setItem("button_overlay", this.id);
        }
    };
    checkPermissions() {
        const user_role = sessionStorage.getItem("user_role");
        let user_level = 0;
        switch (user_role) {
            case "captain":
                user_level = 1;
                break;
            case "admin":
                user_level = 2;
                break;
        }
        return user_level
    };
}


const registrationOverlay = new overlayManager(
    "overlay_registration",
    null,
    "Зарегистрироваться",
    0
);


const eventListOverlay = new overlayManager(
    "overlay_event_list",
    null,
    "Новая тренировка",
    1
);


const eventCreateOverlay = new overlayManager(
    "event_creation",
    null,
    "Создать",
    1
);


const teamListOverlay = new overlayManager(
    "overlay_teams",
    null,
    null,
    0
);


const statisticsOverlay = new overlayManager(
    "overlay_stats",
    null,
    null,
    0
);


const viewEventOverlay = new overlayManager(
    "overlay_event",
    null,
    "Записаться",
    0
);