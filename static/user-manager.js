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
        this.userSearch();
        this.showAttachedUsers();
        this.controllingButton.addEventListener('click', () => {
            userManagerOverlay.openOverlay();
        });
    }

    userSearch() {
        /** 
         * Initializes a search box and sets up search functionalities.
        */
        const searchbox_container = document.querySelector('#searchbox_container');
        searchbox_container.className = 'rows team_view';
        searchbox_container.replaceChildren(document.createElement('div'));
        // Create the search box input element
        const searchbox = document.createElement('input');
        searchbox.type = 'input';
        searchbox.id = 'searchbox';
        searchbox.placeholder = 'Фамилия Имя';
        // Add event listeners for input changes and "Enter" key presses
        searchbox.addEventListener('input', userSearch);
        searchbox.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                this.changeUserState(searchbox.value);
            }
        })
        searchbox_container.appendChild(searchbox);
        // Create and append a submit button
        const submit_button = document.createElement('button');
        submit_button.id = 'searchbox_button';
        submit_button.type = 'submit';
        submit_button.addEventListener('click', () => {
            this.changeUserState(searchbox.value);
        })
        searchbox_container.appendChild(submit_button);
        /**
         * Executes a search operation on the user list based on the input in the search box.
        */
        function userSearch() {
            const user_list_container = document.querySelector('#user_list_container');
            const rows = user_list_container.querySelectorAll('div');
            rows.forEach((row) => {
                const name_box = row.querySelector('.row_text');
                if (!name_box) {return};
                const search_string = name_box.innerHTML.substring(0, searchbox.value.length);
                // Compare the search string with the input value in a case-insensitive manner
                if (search_string.toLowerCase() == searchbox.value.toLowerCase()) {
                    row.style.display = 'flex'; // Show the row if the search string matches
                }
                else {
                    row.style.display = 'none'; // Hide the row if the search string doesn't match
                }
            });
        }
    }

    showAttachedUsers() {
        ajaxRequest(JSON.stringify(this.propertyContainer), '/get_user_list').then((value) => {
            const user_list_container = document.querySelector('#user_list_container');
            user_list_container.replaceChildren(); // Updating users container with team_list
            for (let i = 0; i < Object.keys(value).length; i++) {
                // Adding users to team_list_container one-by-one and assigning them an eventListener on checkbox click.
                const user_container = document.createElement('div');
                const text_box = document.createElement('div');
                const check_box = document.createElement('input');
                user_container.className = 'rows users_view';
                user_container.id = i;
                text_box.className = 'row_text';
                text_box.innerHTML = value[i]['user_name'];
                check_box.type = 'checkbox';
                if (value[i]['is_editable'] == 0) {
                    check_box.disabled = true;
                }
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
            if (value.responseJSON === "Specified user has no access to system") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("Добавляемый пользователь заблокирован");
            }
            if (value.responseJSON === "Insufficient privileges") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("У вас нет доступа к управлению командой");
            }
            if (value.responseJSON === "Multiple results found. Not implemeted yet") {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("Найдено несколько пользователей. Вы не сможете добавить такого пользователя");
            }
            else {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                alert("Неизвестная ошибка: " + toString(value.responseJSON));
            }
        });
    }
}
