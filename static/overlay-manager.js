class overlayManager {
    constructor(id, onLoadFunc, buttonName, permissionLevel) {
        this.id = id;
        this.onLoadFunc = onLoadFunc;
        this.buttonName = buttonName;
        this.buttonVisibility = this.buttonName !== null;
        this.permissionLevel = permissionLevel;
    }
    static currentOverlay = null;
    openOverlay() {
        if (this.onLoadFunc) {
            this.onLoadFunc()
        }
        this.closeAllOverlays();
        document.querySelector(`#${this.id}`).style.display = "flex";
        overlayManager.currentOverlay = this.id
        this.setupButton();
    }
    closeAllOverlays() {
        const overlays = document.querySelectorAll('.overlay');
        overlays.forEach((overlay) => {
            overlay.style.display = 'none';
        });
    }
    setupButton() {
        if (this.buttonVisibility !== false && this.checkPermissions() >= this.permissionLevel) {
            Telegram.WebApp.MainButton.setParams({
                text: this.buttonName,
                is_visible: this.buttonVisibility
            });
        }
        else {
            Telegram.WebApp.MainButton.hide();
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
        return user_level;
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
    window.Telegram.WebApp.expand,
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
    "overlay_team",
    window.Telegram.WebApp.expand,
    "Создать",
    1
);


teamDetailsOverlay = new overlayManager(
    "overlay_team_view",
    null,
    null,
    0
);


teamParticipantsOverlay = new overlayManager(
    "overlay_team_participants",
    null,
    null,
    0
);


const teamCreationOverlay = new overlayManager(
    "overlay_team_creation",
    null,
    "Создать",
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