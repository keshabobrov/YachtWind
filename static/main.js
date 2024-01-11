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
    /** Функция идентифицирования пользователя. Отправляет на сервер id пользователя и возвращает
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
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success")
        alert("Событие создано!")
        location.reload()
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
        sessionStorage.setItem('page_date', page_date)
        for (let i = 0; i < events_results.length; i++) {
            const row = table.insertRow(i + 1);
            const event = events_results[i];
            const date = new Date(event.event_datetime)
            row.insertCell(0).innerHTML = event.event_author_name.split(' ').slice(0, 2).join(' ');
            row.insertCell(1).innerHTML = date.toLocaleTimeString("ru", {hour: "2-digit", minute: "2-digit"})
            row.insertCell(2).innerHTML = event.event_id;
            row.insertCell(3).innerHTML = date.toDateString();
            row.insertCell(4).innerHTML = event.event_remaining_slots;
            row.cells[0].className = "trainer_td";
            row.cells[1].className = "number_blue_box";
            row.cells[2].style.display = "none";
            row.cells[3].style.display = "none";
            row.cells[4].style.display = "none";
            if (date.toDateString() === page_date) {
                row.className = "rows"
            }
            else {
                row.className = "rows invisible"
            }
        }
        addRowHandlers()
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
                eventViewer();
            }
        }
        current_row.onclick = create_click_handler(current_row);
    }
}


function eventViewer() {
    viewEventOverlay.openOverlay()
    const table = document.getElementById("event_team_list");
    const event_id = sessionStorage.getItem('open_event_id');
    const date = new Date(sessionStorage.getItem('open_event_date'));
    document.getElementById("event_author_name").innerHTML = sessionStorage.getItem('open_event_author');
    document.getElementById("info_time").innerHTML = sessionStorage.getItem('open_event_time');
    document.getElementById("info_available").innerHTML = sessionStorage.getItem('open_event_remaining_slots');
    document.getElementById("info_date").innerHTML = date.toLocaleString("ru", {
        month: "long",
        day: "numeric",
        year: "numeric"
    })
    ajaxRequest(event_id, "/get_enrollment").then((value) => {
        const events_results = JSON.parse(value)
        for (let i = 0; i < events_results.length; i++) {
            const user_name = events_results[i].user_name
            const row = table.insertRow(i +1);
            row.insertCell(0).innerHTML = user_name;
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
    const button_overlay = sessionStorage.getItem('button_overlay')
    switch (button_overlay) {
        case "overlay_registration":
            userRegistration();
            break;
        case "overlay_event_list":
            eventCreateOverlay.openOverlay();
            break;
        case "event_creation":
            eventCreation()
            break;
        case "overlay_event":
            enrollEvent()
            break;
    }
})