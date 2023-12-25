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


function get_id() {
    let telegram = window.Telegram.WebApp;
        try {
            return  telegram.initDataUnsafe.user.id;
        }
        catch (err) {
            console.log("Telegram app not found!");
            // TODO: REMOVE BEFORE PRODUCTION
            return 12345678;
        }
}

function setup(tgID) {
    /** Функция идентифицирования пользователя. Отправляет на сервер id пользователя и возвращает
     * роль пользователя в системе или сообщение об отсутствии пользователя в системе.*/
    return new Promise((resolve, reject) => {
        let url = "/init";
        let data = JSON.stringify(tgID);
        ajaxRequest(data, url).then((value) => {
            resolve (value)
        });
    });
}


function userRegistration() {
    /** Функция регистрации пользователя.
     * Данные на входе: форма
     * Данные на выходе: Сообщение: Пользователь уже зарегистрирован, успешная регистрация*/
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
    let dict = $("#regForm").serializeArray()
    dict.push({
        name: "id",
        value: get_id()
    })
    let data = JSON.stringify(dict);
    let url = "/register";
    ajaxRequest(data, url).then((value) => {
        Telegram.WebApp.MainButton.hide()
        document.getElementById('overlay_registration').style.display = 'none'
        location.reload()
    }).catch((value) => {
        Telegram.WebApp.MainButton.hide()
        document.getElementById('overlay_registration').style.display = 'none'
        location.reload()
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
    if (document.getElementById("slot_form").value <= 1) {
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

function appStart() {
    const tgID = get_id()
    // Promise to wait until role will be received.
    setup(tgID).then((role) => {
        if (role === 0) {
            document.getElementById('overlay_registration').style.display = 'flex'
            Telegram.WebApp.MainButton.setParams({
                text: 'Зарегистрироваться',
                is_visible: true
            })
            return
        }
        if (role === "admin") {
            document.getElementById('administration').style.display = 'flex'
        }
    });
    showEvents();
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
                document.getElementById("overlay_event").style.display = "flex";
                document.getElementById("overlay_enroll").style.display = "none";
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
        Telegram.WebApp.MainButton.setParams({
            text: 'Записаться',
            is_visible: true
        })
    });
}

function enrollEvent(uid) {
    let tgId = get_id();
    let array = []
    array.unshift(tgId, uid);
    let data = JSON.stringify(array);
    ajaxRequest(data, "/enroll_event").then((value) => {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success")
        if (value === 0) {alert("Вы записаны")}
        if (value === 1) {alert("Вы отменили запись!")}
        if (value === 2) {alert("Команда уже набрана.")}
        if (value === 3) {alert("Пользователь не найден")}
        location.reload();
    })
}

function getStatistics() {
    const tgId = get_id()
    const formData = JSON.stringify(tgId);
    const url = "/stat_request"
    ajaxRequest(formData, url).then((value) => {
        document.getElementById("total_num").innerHTML = value.slice(0, value.indexOf("/"));
        document.getElementById("rating_num").innerHTML = value.slice(value.indexOf("/") + 1);
    })
}


// function clearTable() {
//     let table = document.getElementById("event_team_list")
//     for (let  i = 1; i < table.rows.length; i++) {
//             table.deleteRow(i)
//         }
//     document.getElementById('overlay_event').style.display = 'none'
// }

if (window.location.pathname === "/") {
    appStart()
    Telegram.WebApp.MainButton.hide()
}

Telegram.WebApp.MainButton.onClick(function () {
    let overlays = document.querySelectorAll(".overlay");
    let getCurrentOverlay = () => {
        for (let i = 0; i < overlays.length; i++) {
            if (overlays[i].style.display === "flex") {
                return overlays[i];
            }
        }
    }
    let currentOverlay = getCurrentOverlay().id;
    switch (currentOverlay) {
        case "overlay_enroll":
            setup(get_id()).then((value) => {
                if (value === "captain" || value === "admin") {
                    Telegram.WebApp.MainButton.setParams({
                        text: 'Создать событие',
                        is_visible: true
                    })
                    overlayCreation(1);
                    overlayEvents(0);
                }
            })
            break;
        case "event_creation":
            eventCreation()
            break;
        case "overlay_event":
            get_id()
            enrollEvent(document.getElementById("info_uid").innerHTML)
            break;
        case "overlay_registration":
            userRegistration()
    }
})