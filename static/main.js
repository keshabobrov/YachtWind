// function GetUserData() {
//     let registrationForm = document.getElementById('registrationFormId')
// //     let tg = window.Telegram.WebApp;
// //     alert('started 7');
// //     const data = tg.initDataUnsafe.user.id
// //     Telegram.WebApp.showAlert(data);
// //     alert("pressed!")
//     console.log(dataOne.value)
// }


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
                reject(alert('Error has been occurred'));
            }
        });
    });
}

function get_id() {
    let telegram = window.Telegram.WebApp;
        try {
            const tgID = telegram.initDataUnsafe.user.id;
            return tgID
        }
        catch (err) {
            // TODO: REMOVE THIS BEFORE PRODUCTION
            console.log("Telegram app not found!");
            const tgID = 12345678;
            return tgID
        };
}

function setup(tgID) {
    /** Функция идентифицирования пользователя. Отправляет на сервер id пользователя и возвращает
     * роль пользователя в системе или сообщение об отсутствии пользователя в системе.*/
        // TODO: Сделать автоматическое определение айди пользователя и выполнение функции при старте.
        // TODO: Перевод на страницу с регистрацией.
    return new Promise((resolve, reject) => {
        let url = "/ident";
        let data = JSON.stringify(tgID);
        ajaxRequest(data, url).then((value) => {
            resolve (value)
        });
    });
};


function userRegistration() {
    /** Функция регистрации пользователя.
     * Данные на входе: форма
     * Данные на выходе: Сообщение: Пользователь уже зарегистрирован, успешная регистрация*/
    let dict = $("#regForm").serializeArray()
    dict.push({
        name: "id",
        value: get_id()
    })
    let data = JSON.stringify(dict);
    let url = "/register";
    ajaxRequest(data, url).then((value) => {
        window.location.replace("/");
    }).catch((value) => {
        window.location.replace("/");
    });
};


function eventCreation() {
    /** Функция создания события. Отправляет данные формы и возвращает:
     * 1. Юзер не в системе
     * 2. Юзер не обладает полномочиями
     * 3. Событие создано
     * Обновление страницы после выполнения кода.*/
    let formData = JSON.stringify($("#eventCreationForm").serializeArray());
    let url = "/create_event";
    ajaxRequest(formData, url).then((value) => {
        location.reload()
    });
};

function appStart() {
    const tgID = get_id()
    // Promise to wait until role will be received.
    setup(tgID).then((role) => {
        if (role == 0) {
            window.location.replace("/reg_form")
        }
        if (role == "admin") {
            document.getElementById('administration').style.display = 'flex'
        }
        if (role == "admin") {
            document.getElementById('create_overlay').style.display = 'flex'
        }
    });
    loadEvents();
};


function loadEvents() {
    /** Функция загрузки всех событий. Выполняется при загрузке страницы.
     * Отправляет запрос на сервер. Получает ответ в виде массива с только будущими событиями.
     * Сортировка по дате и времени.
     * Присваивает класс dynamicrows всем создаваемым строкам таблицы.
     * Вставляет строки в таблицу с событиями.*/
    let formData = ''
    let url = "/event_request"
    ajaxRequest(formData, url).then((value) => {
        let table = document.getElementById('enroll_table')
        for (let i = 0; i < value[0]; i++) {
            let row = table.insertRow(i+1);
            let user_row = value[i + 1 + value[0]]
            // let date_row = value[i + 1 + value[0] * 2]
            let time_row = value[i + 1 + value[0] * 3]
            time_row = time_row.slice(0, -3)
            let lastIndex = user_row.lastIndexOf(" ")
            user_row = user_row.substring(0, lastIndex)
            let slots_row = value[i + 1 + value[0] * 5]
            row.className = "dynamicrows"
            row.insertCell(0).innerHTML = time_row
            row.insertCell(1).innerHTML = user_row
            row.insertCell(2).innerHTML = slots_row
            let cell_time = row.cells[0]
            let cell_trainer = row.cells[1]
            cell_time.className = "time_td"
            cell_trainer.className = "trainer_td"
        }
        /** добавление обработчика нажатий на строки таблицы*/
        addRowHandlers()
    });
};


function addRowHandlers() {
    /** Функция обработчика нажатий на строки в таблице.
     * При нажатии активируется оверлэй и выполняется функция подгрузки данных.
     * Функции подгрузки данных передается целиком строка*/
  let table = document.getElementById("enroll_table");
  let rows = table.getElementsByTagName("tr");
  for (i = 0; i < rows.length; i++) {
    let currentRow = table.rows[i];
    let createClickHandler = function(row) {
      return function() {
        let rowdata = row.getElementsByTagName("td");
        document.getElementById("overlay").style.display = "block";
        loadTeam(rowdata)
      };
    };
    currentRow.onclick = createClickHandler(currentRow);
  }
}


function loadTeam(rowdata) {
    /** Функция подгрузки команды и отображения данных в оверлее.
     * На входе получает сырую строку нажатой строки в таблице.
     * Создает строки внутренней таблицы с данными.
     * Удаляет предыдущие строки из таблице при закрытии оверлеея.*/
    let uid = rowdata[5].innerHTML;
    let table = document.getElementById("enroll_table");
    for (let i = 0; i < rowdata.length; i++) {
        table.getElementsByTagName("th")[i].innerHTML = rowdata[i].innerHTML;
    }
    ajaxRequest(uid, '/team_parse').then((value) => {
        let tableLen = document.getElementById('enroll_table').rows.length;
        /** Удаление предыдущих строк*/
        if (tableLen > 1) {
            for (let i = tableLen; i >= tableLen - 2; i--) {
                table.deleteRow(i-1);
            }
        }
        /** Добавление участников в таблицу*/
        for (let i = 0; i < value.length; i++) {
            let row = table.insertRow(i+1);
            row.insertCell(0).innerHTML = value[i]
        }
    })
};


function enrollEvent() {
    let table = document.getElementById("enroll_table");
    let uid = table.getElementsByTagName("th")[5].innerHTML;
    console.log(uid)
    let tgid = window.prompt('Tgid:')
    let array = [];
    array.unshift(tgid, uid)
    let data = JSON.stringify(array);
    ajaxRequest(data, "/enroll_event").then((value) => {
        alert(value);
        location.reload()
    })
}

if (window.location.pathname == "/") {appStart()}