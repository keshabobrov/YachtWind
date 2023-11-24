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


function request_events() {
    return new Promise((resolve, reject) => {
        let formData = '';
        let url = "/event_request";
        const array = new Map()
        ajaxRequest(formData, url).then((value) => {
            for (let i = 1; i <= value[0]; i++) {
                let uid_name = "uid_" + i;
                let user_name = "user_" + i;
                let date_name = "date_" + i;
                let time_name = "time_" + i;
                let all_sl_name = "all_sl_" + i;
                let free_sl_name = "free_sl_" + i;
                array.set(uid_name, value[i]);
                array.set(user_name, value[i + value[0]]);
                array.set(date_name, value[i + value[0] * 2]);
                array.set(time_name, value[i + value[0] * 3]);
                array.set(all_sl_name, value[i + value[0] * 4]);
                array.set(free_sl_name, value[i + value[0] * 5]);
            }
            resolve(array)
        });
    });
}


function get_id() {
    let telegram = window.Telegram.WebApp;
        try {
            const tgID = telegram.initDataUnsafe.user.id;
            return tgID;
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
        let url = "/ident";
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
     * 1. Юзер не в системе
     * 2. Юзер не обладает полномочиями
     * 3. Событие создано
     * Обновление страницы после выполнения кода.*/
    if (document.getElementById("slots_form").value <= 1 || document.getElementById("slots_form").value >= 10) {
        alert("Неверное число слотов для записи. (1-10)");
        return;
    }
    if (document.getElementById("date_form").value === "") {
        alert("Введите дату");
        return;
    }
    if (document.getElementById("time_form").value === "") {
        alert("Введите время");
        return;
    }
    let dict = $("#event_create_form").serializeArray();
    dict.push({
        name: "id",
        value: get_id()
    })
    let data = JSON.stringify(dict);
    let url = "/create_event";
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
    request_events().then((value) => {
        let table = document.getElementById('enroll_table');
        for (i=1; i <= (value.size / 6); i++) {
            let uid = value.get("uid_" + i);
            let user = value.get("user_" + i);
            user = user.split(' ').slice(0, 2).join(' ');
            let date = value.get("date_" + i);
            let time = value.get("time_" + i);
            let free_sl = value.get("free_sl_" + i);
            let row = table.insertRow(i);
            row.insertCell(0).innerHTML = user;
            row.insertCell(1).innerHTML = time.slice(0, -3);
            row.insertCell(2).innerHTML = free_sl;
            row.insertCell(3).innerHTML = date;
            row.insertCell(4).innerHTML = uid;
            row.className = "rows invisible";
            row.cells[2].style.display = "none";
            row.cells[3].style.display = "none";
            row.cells[4].style.display = "none";
            let cell_trainer = row.cells[0];
            let cell_time = row.cells[1];
            cell_time.className = "number_blue_box";
            cell_trainer.className = "trainer_td";
            if (date === value.get("date_1")) {
                row.className = "rows";
                let date = new Date(value.get("date_1"))
                document.getElementById("time_stamp").innerHTML = value.get("date_1")
                document.getElementById("date_picker_text").innerHTML = date.toLocaleString("ru", {
                    month: "long",
                    day: "numeric"
                })
            }
        }
        /** добавление обработчика нажатий на строки таблицы*/
        addRowHandlers()
    })
}

function updateVisiblity(table, date_vis, dates, newIndex) {
    if (dates[newIndex] !== date_vis) {
        const date = new Date(dates[newIndex])
        document.getElementById("date_picker_text").innerHTML = date.toLocaleString("ru", {
            month: "long",
            day: "numeric"
        })
        document.getElementById("time_stamp").innerHTML = dates[newIndex];
        for (let i = 1; i < table.rows.length; i++) {
            if (table.rows[i].cells[3].innerHTML !== dates[newIndex]) {
                table.rows[i].className = "rows invisible"
            }
            if (table.rows[i].cells[3].innerHTML === dates[newIndex]) {
                table.rows[i].className = "rows"
            }
        }
        return 0;
    }
}

function listHandler(direction) {
    const table = document.getElementById("enroll_table");
    const date_vis = document.getElementById("time_stamp").innerHTML;
    let dates = []
    for (let i = 1; i < table.rows.length; i++) {
        dates.push(table.rows[i].cells[3].innerHTML);
    }
    const currentIndex = dates.indexOf(date_vis);
    if (direction === 0) {
        let newIndex = currentIndex - 1;
        while (newIndex >= 0) {
            let res = updateVisiblity(table, date_vis, dates, newIndex)
            if (res === 0) {
                return;
            }
            newIndex += 1;
        }
    }
    if (direction === 1) {
        let newIndex = currentIndex + 1;
        while (newIndex < dates.length) {
            let res = updateVisiblity(table, date_vis, dates, newIndex)
            if (res === 0) {return;}
            newIndex += 1;
        }
    }
}


function addRowHandlers() {
    /** Функция обработчика нажатий на строки в таблице.
     * При нажатии вызывается функция eventViewer, которой передается строка.*/
    let table = document.getElementById("enroll_table");
    let rows = table.getElementsByTagName("tr");
    for (let i=1; i < rows.length; i++) {
        let current_row = rows[i];
        let create_click_handler = (row) => {
            return function () {
                document.getElementById("overlay_event").style.display = "flex";
                document.getElementById("overlay_enroll").style.display = "none";
                eventViewer(row);
            }
        }
        current_row.onclick = create_click_handler(current_row);
    }
}


function eventViewer(row) {
    let uid = row.cells[4].innerHTML;
    let table = document.getElementById("team_list");
    document.getElementById("info_trainer").innerHTML = row.cells[0].innerHTML;
    let date = new Date(row.cells[3].innerHTML);
    document.getElementById("info_date").innerHTML = date.toLocaleString("ru", {
        month: "long",
        day: "numeric",
        year: "numeric"
    })
    document.getElementById("info_time").innerHTML = row.cells[1].innerHTML;
    document.getElementById("info_available").innerHTML = row.cells[2].innerHTML;
    document.getElementById("info_uid").innerHTML = uid;
    ajaxRequest(uid, "/team_parse").then((value) => {
        for (let i = 0; i < value.length; i++) {
            let row = table.insertRow(i + 1);
            row.insertCell(0).innerHTML = value[i];
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


function clearTable() {
    let table = document.getElementById("team_list")
    for (let  i = 1; i < table.rows.length; i++) {
            table.deleteRow(i)
        }
    document.getElementById('overlay_event').style.display = 'none'
}

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