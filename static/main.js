function ajaxRequest(formData, url) {
    /** Функция, возвращающая Promise, выполняющая запросы на сервер. Получает на входе две переменные:
     * Данные для передачи и url-адрес запроса.*/
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: formData,
            success: function (response) {
                resolve(response);
            },
            error: function (response) {
            console.log("RQ: Error has been occurred");
                reject();
            }
        });
    });
}


function setup() {
    // TODO: REWRITE THIS LOGIC. TOO HEAVY.
    /** User identification. Отправляет на сервер id пользователя и возвращает
     * роль пользователя в системе или сообщение об отсутствии пользователя в системе.*/
    const telegram = window.Telegram.WebApp;
    const user_telegram_id = telegram.initDataUnsafe.user.id;
    return new Promise((resolve, reject) => {
        let url = "/init";
        let data = JSON.stringify(user_telegram_id);
        ajaxRequest(data, url).then((value) => {
            sessionStorage.setItem('user_role', value['user_role']);
            resolve (value);
        });
    });
}


function appStart() {
    setup().then((value) => {
        if (value === 0) {
            registrationOverlay.openOverlay();
            return;
        }
        if (value['user_role'] === "admin") {
            document.getElementById('administration').style.display = 'flex';
        }
        document.getElementById("user_total_events").innerHTML = value['user_total_events'];
        document.getElementById("user_rank").innerHTML = value['user_rank'];
        mainMenuOverlay.openOverlay();
    });
    showEvents();
    requestTeams();
}


function userRegistration() {
    /** Функция регистрации пользователя.
     * Данные на входе: форма
     * Данные на выходе: Сообщение: Пользователь уже зарегистрирован, успешная регистрация*/
    const user_data = new FormData(document.querySelector('#user_register_form'));
    const jsonObject = Object.fromEntries(user_data);
    const telegram = window.Telegram.WebApp;
    const user_telegram_id = telegram.initDataUnsafe.user.id;
    if (document.getElementById("lastName").value === "") {
        alert("Введите фамилию!")
        return
    }
    if (document.getElementById("firstName").value === "") {
        alert("Введите имя!")
        return
    }
    if (document.getElementById("middleName").value === "") {
        alert("Введите отчество!")
        return
    }
    jsonObject['user_telegram_id'] = user_telegram_id
    const request = JSON.stringify(jsonObject)
    const url = "/user_registration";
    ajaxRequest(request, url).then((value) => {
        location.reload()
    })
}


function requestTeams() {
    // Function for getting JSON object of Teams of current user.
    // Triggered on application startup.
    // Output:
    // HTML clickable rows for every Team found.
    //  EventListener triggering viewTeamDetails(clicked element) function.
    ajaxRequest(null, '/request_teams').then((value) => {
        if (!value) {
            return
        }
        const block_teams = document.querySelector('#block_teams');
        block_teams.replaceChildren(document.createElement('div'));
        for (let i = 0; i < value.length; i++) {
            const button_row = document.createElement('div');
            const button = document.createElement('button');
            button_row.className = 'rows teams';
            button.type = 'button';
            button.innerHTML = value[i]['team_name'];
            button.addEventListener('click', viewTeamDetails(value[i]));
            block_teams.appendChild(button_row).appendChild(button);
        }
    })
}


function viewTeamDetails(teamData) {
    // Function for showing details in HTML about selected Team.
    // Trigger: click on teamRow - requestTeams.
    // Input: JSON object with selected Team.
    // Output:
    //  1.EventListener for opening overlay with list of users in this Team:
    //      Call viewTeamUsers(team_id) function to show users in Team and add search button and checkboxes.
    //  2. EventListener for click on searchUser button: triggering searchUser() function.
    //     Passing userInput value from inputBox, team_id.
    //     Logically it should be in viewTeamUsers function, but when it's rerunning it's also creating new eventListeners.
    return () => {
        const searchUserButton = document.querySelector('#user_search_button');
        teamDetailsOverlay.openOverlay();
        const openOverlayButton = document.querySelector('#change_team_participants_button');
        document.querySelector('#team_view_name').innerHTML = teamData['team_name'];
        document.querySelector('#team_description_rectangle').innerHTML = teamData['team_description'];
        openOverlayButton.addEventListener('click', () => {
            viewTeamUsers(teamData['team_id']);
            teamParticipantsOverlay.openOverlay();
        });
        searchUserButton.addEventListener('click', () => {
            searchUser(document.querySelector('#new_user_input').value, teamData['team_id']);
        });
    };
}


function viewTeamUsers(team_id) {
    // This function showing everytime updated results with participants of viewing Team.
    // Trigger:
    //  1. ViewTeamDetails to load initial block with users,
    //  2. Result of searchUser to update table with users.
    // Input: int(team_id).
    // Output:
    //  1. EventListener for click on searchUser button: triggering searchUser() function.
    //      Passing userInput value from inputBox, team_id
    //  2. EventListener for click on checkbox: triggering searchUser() function.
    //      Passing div text value with selected user for deletion.
    ajaxRequest(null, '/request_teams').then((value) => {
        const team_list_block = document.querySelector('#team_list_block');
        let current_team = [];
        for (let i = 0; i < value.length; i++) { // Getting single Team with team_id from updated results.
            if (value[i]['team_id'] === team_id) {
                current_team = value[i];
            }
        }
        team_list_block.replaceChildren(document.createElement('div')); // Updating whole block with team_list
        for (let i = 0; i < Object.keys(current_team['users']).length; i++) {
            // Adding users to team_block one-by-one and assigning them an eventListener on checkbox click.
            const user_row = document.createElement('div');
            const text_box = document.createElement('div');
            const check_box = document.createElement('input');
            user_row.className = 'rows team_view';
            user_row.id = i;
            text_box.className = 'row_text';
            text_box.innerHTML = current_team['users'][i].substring(0, current_team['users'][i].lastIndexOf(" "));
            check_box.type = 'checkbox';
            check_box.checked = true;
            check_box.addEventListener('click', () => {
                searchUser(text_box.innerHTML, current_team['team_id']);
            });
            team_list_block.appendChild(user_row).appendChild(text_box);
            user_row.appendChild(check_box);
        }
    });
}


function searchUser(username, team_id) {
    // This function used to send request to backend to add/delete users from Team.
    // Trigger:
    //  1. EventListener on checkbox in row added in viewTeamUser - delete user.
    //  2. EventListener on searchButton added in viewTeamDetails - to add user.
    // Input: userInput (2 words with LastName, FirstName, not case-sensitive, word-order sensitive); team_id.
    // Output: call viewTeamUsers function to update existing list of users.
    const jsonObject = {};
    jsonObject['user_input'] = username
    jsonObject['team_id'] = team_id
    const request = JSON.stringify(jsonObject);
    ajaxRequest(request, '/add_team_user').then((value) => {
        if (value === "User not found") {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
            alert("Такой пользователь не найден");
        }
        if (value === "User successfully added") {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            alert("Пользователь добавлен в команду");
            viewTeamUsers(team_id);
        }
        if (value === "Participation was removed") {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            alert("Пользователь удален из команды");
            viewTeamUsers(team_id);
        }
    }).catch((value) => {
        if (value === "Adding user has no access to system") {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
            alert("Введенный пользователь заблокирован");
        }
        if (value === "Insufficient privileges") {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
            alert("У вас нет доступа к управлению командой");
        }
        else {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
            alert("Неизвестная ошибка");
        }
    });
}


function createTeam() {
    const formData = new FormData(document.querySelector('#team_creation_form'));
    const jsonObject = Object.fromEntries(formData);
    const url = "/create_team";
    const request = JSON.stringify(jsonObject);
    if (jsonObject['team_name_form'] === "") {
        alert("Введите название команды")
        return
    }
    ajaxRequest(request, url).then(() => {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        alert("Команда создана!");
        location.reload();
    }).catch(() => {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
        alert("Ошибка");
    });
}


function eventCreation() {
    /** Функция создания события. Отправляет данные формы и возвращает:
     * 1. Юзер не в системе 409
     * 2. Юзер не обладает полномочиями 401
     * 3. Событие создано 200
     * TODO: CHANGE RELOADING LOGIC*/
    const event_data = new FormData(document.querySelector('#event_create_form'))
    const jsonObject = Object.fromEntries(event_data)
    if (document.getElementById("slot_form").value < 1) {
        alert("Неверное число слотов для записи");
        return;
    }
    if (document.getElementById("datetime_form").value === "") {
        alert("Введите дату и время");
        return;
    }
    const data = JSON.stringify(jsonObject)
    const url = "/create_event";
    ajaxRequest(data, url).then((value) => {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        alert("Событие создано!");
        location.reload();
    });
}


function showEvents() {
    const formData = null
    const url = '/event_request'
    const table = document.getElementById('events_table');
    ajaxRequest(formData, url).then((value) => {
        const events_results = JSON.parse(value)
        const first_event_date = new Date(events_results[0].event_datetime);
        const page_date = first_event_date.toDateString()
        document.getElementById("date_picker_text").innerHTML = first_event_date.toLocaleString("ru", {
            month: "long",
            day: "numeric"
        })
        sessionStorage.setItem('page_date', page_date);
        // TODO: Consider objects for this.
        for (let i = 0; i < events_results.length; i++) {
            const row = table.insertRow(i + 1);
            const event = events_results[i];
            const date = new Date(event.event_datetime);
            row.insertCell(0).innerHTML = event.event_author_last_name + " " + event.event_author_first_name;
            row.insertCell(1).innerHTML = date.toLocaleTimeString("ru", {hour: "2-digit", minute: "2-digit"})
            row.insertCell(2).innerHTML = event.event_id;
            row.insertCell(3).innerHTML = date.toDateString();
            row.insertCell(4).innerHTML = event.event_remaining_slots;
            row.insertCell(5).innerHTML = event.event_boat_num;
            row.cells[0].className = "trainer_td";
            row.cells[1].className = "number_blue_box";
            row.cells[2].style.display = "none";
            row.cells[3].style.display = "none";
            row.cells[4].style.display = "none";
            row.cells[5].style.display = "none";
            if (date.toDateString() === page_date) {
                row.className = "rows";
            }
            else {
                row.className = "rows invisible";
            }
        }
        addRowHandlers();
    })
}


function listHandler(direction) {
    const table = document.getElementById("events_table");
    const page_date = (new Date (sessionStorage.getItem('page_date'))).toDateString();
    let dates_array = []
    for (let i = 1; i < table.rows.length; i++) {
        const date = new Date (table.rows[i].cells[3].innerHTML);
        dates_array.push(date.toDateString());
    }
    const currentIndex = dates_array.indexOf(page_date);
    if (direction === "-") {
        let newIndex = currentIndex - 1;
        while (newIndex >= 0) {
            let res = updateVisibility(table, page_date, dates_array, newIndex)
            if (res === 0) {
                return;
            }
            newIndex += 1;
        }
    }
    if (direction === "+") {
        let newIndex = currentIndex + 1;
        while (newIndex < dates_array.length) {
            let res = updateVisibility(table, page_date, dates_array, newIndex)
            if (res === 0) {return;}
            newIndex += 1;
        }
    }
}


function updateVisibility(table, page_date, dates_array, newIndex) {
    if (dates_array[newIndex] !== page_date) {
        const new_date = new Date(dates_array[newIndex]);
        document.getElementById("date_picker_text").innerHTML = new_date.toLocaleString("ru", {
            month: "long",
            day: "numeric"
        })
        sessionStorage.setItem('page_date', new_date.toDateString());
        for (let i = 1; i < table.rows.length; i++) {
            if (table.rows[i].cells[3].innerHTML === dates_array[newIndex]) {
                table.rows[i].className = "rows"
            }
            else {
                table.rows[i].className = "rows invisible"
            }
        }
        return 0;
    }
}


function addRowHandlers() {
    /** Функция обработчика нажатий на строки в таблице.
     * При нажатии вызывается функция eventViewer, которой передается строка.*/
    const table = document.getElementById("events_table");
    const rows = table.getElementsByTagName("tr");
    for (let i=1; i < rows.length; i++) {
        const current_row = rows[i];
        let create_click_handler = (row) => {
            return function () {
                viewEventOverlay.openOverlay();
                sessionStorage.setItem('open_event_author', current_row.cells[0].innerHTML);
                sessionStorage.setItem('open_event_time', current_row.cells[1].innerHTML);
                sessionStorage.setItem('open_event_id', current_row.cells[2].innerHTML);
                sessionStorage.setItem('open_event_date', current_row.cells[3].innerHTML);
                sessionStorage.setItem('open_event_remaining_slots', current_row.cells[4].innerHTML);
                sessionStorage.setItem('open_event_boat_num', current_row.cells[5].innerHTML);
                eventViewer();
            }
        }
        current_row.addEventListener('click', create_click_handler(current_row));
    }
}


function eventViewer() {
    viewEventOverlay.openOverlay()
    const table = document.getElementById("event_team_list");
    const event_id = sessionStorage.getItem('open_event_id');
    const date = new Date(sessionStorage.getItem('open_event_date'));
    const cells = document.querySelectorAll('.table_team');
    cells.forEach((cell) => {
        cell.innerHTML = '';
    });
    document.getElementById("event_author_name").innerHTML = sessionStorage.getItem('open_event_author');
    document.getElementById("info_time").innerHTML = sessionStorage.getItem('open_event_time');
    document.getElementById("info_available").innerHTML = sessionStorage.getItem('open_event_remaining_slots');
    document.getElementById("info_date").innerHTML = date.toLocaleString("ru", {
        month: "long",
        day: "numeric",
        year: "numeric"
    })
    if (sessionStorage.getItem('open_event_boat_num') !== "") {
        document.getElementById("boat_num").innerHTML = sessionStorage.getItem('open_event_boat_num');
    }
    else {
        document.getElementById("boat_num").innerHTML = "—"
    }
    ajaxRequest(event_id, "/request_enrollments").then((value) => {
        const events_results = JSON.parse(value)
        for (let i = 0; i < events_results.length; i++) {
            const user_last_name = events_results[i].user_last_name;
            const user_first_name = events_results[i].user_first_name;
            const row = table.insertRow(i +1);
            row.insertCell(0).innerHTML = user_last_name + " " + user_first_name;
            row.cells[0].className = "table_team";
        }
    });
}

function enrollEvent() {
    const event_id = sessionStorage.getItem('open_event_id');
    ajaxRequest(event_id, "/event_enroll").then((value) => {
        switch(value) {
            case "success":
                window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                alert("Вы записаны");
                break;
            case "removed":
                alert("Вы отменили запись");
                break;
            case "no more slots":
                alert("Команда уже набрана. Мест для записи нет");
                break;
            case "User not found":
                alert("Пользователь не найден");
                break;
            default:
                alert('Something went wrong');
        }
        location.reload();
    })
}


if (window.location.pathname === "/") {
    appStart()
}

Telegram.WebApp.MainButton.onClick(function () {
    switch (overlayManager.currentOverlay) {
        case "overlay_registration":
            userRegistration();
            break;
        case "overlay_team":
            teamCreationOverlay.openOverlay();
            break;
        case "overlay_team_creation":
            createTeam();
            break;
        case "overlay_event_list":
            eventCreateOverlay.openOverlay();
            break;
        case "event_creation":
            eventCreation();
            break;
        case "overlay_event":
            enrollEvent();
            break;
    }
})