class userManager {
    constructor(controllingButton, eventType, permissionLevel, eventProperty) {
        this.controllingButton = controllingButton;
        this.eventType = eventType;
        this.permissionLevel = permissionLevel;
        this.eventProperty = eventProperty;
        this.propertyContainer = {
            eventType: eventType,
            eventProperty: eventProperty
        };
        this.load();
    }

    load() {
        this.showAttachedUsers();
        this.controllingButton.addEventListener('click', () => {
            userManagerOverlay.openOverlay();
        });
        document.querySelector('#user_search_button').addEventListener('click', () => {
            this.changeUserState(document.querySelector('#new_user_input').value);
        });
    }

    showAttachedUsers() {
        ajaxRequest(JSON.stringify(this.propertyContainer), '/get_user_list').then((value) => {
            const user_list_container = document.querySelector('#user_list_container');
            user_list_container.replaceChildren(document.createElement('div')); // Updating users container with team_list
            for (let i = 0; i < Object.keys(value).length; i++) {
                // Adding users to team_list_container one-by-one and assigning them an eventListener on checkbox click.
                const user_container = document.createElement('div');
                const text_box = document.createElement('div');
                const check_box = document.createElement('input');
                user_container.className = 'rows team_view';
                user_container.id = i;
                text_box.className = 'row_text';
                text_box.innerHTML = value[i]['user_name'];
                check_box.type = 'checkbox';
                if (value[i]['in_results'] == 1) {
                    check_box.checked = true;
                }
                check_box.addEventListener('change', () => {
                    this.changeUserState(text_box.innerHTML);
                });
                user_list_container.appendChild(user_container).appendChild(text_box);
                user_container.appendChild(check_box);
            };
        });
    }

    changeUserState(user_input) {
        this.propertyContainer['user_input'] = user_input;
        ajaxRequest(JSON.stringify(this.propertyContainer), '/change_user_state').then((value) => {
            if (value === "User not found") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("Такой пользователь не найден");
            }
            if (value === "Participation created") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                console.log("Пользователь добавлен в команду");
            }
            if (value === "Participation removed") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                console.log("Пользователь удален из команды");
            }
            this.showAttachedUsers();
        }).catch((value) => {
            if (value === "Specified user has no access to system") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("Добавляемый пользователь заблокирован");
            }
            if (value === "Insufficient privileges") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("У вас нет доступа к управлению командой");
            }
            else {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("Неизвестная ошибка: " + toString(value));
            }
        });
    }
}
