class overlayManager {
    constructor(id, onLoadFunc, buttonName, permissionLevel) {
        this.id = id;
        this.state = false;
        this.onLoadFunc = onLoadFunc;
        this.buttonName = buttonName;
        this.buttonVisibility = this.buttonName !== null;
        this.permissionLevel = permissionLevel;
    }
    openOverlay() {
        this.closeAllOverlays()
        document.querySelector(`#${this.id}`).style.display = "flex";
        this.setupButton();
        this.state = !this.state;
    }
    closeAllOverlays() {
        const overlays = document.querySelectorAll('.overlay');
        overlays.forEach((overlay) => {
            overlay.style.display = 'none';
        });
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
        else {
            Telegram.WebApp.MainButton.hide()
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


const mainMenuOverlay = new overlayManager(
    "overlay_main_menu",
    null,
    null,
    0
);


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