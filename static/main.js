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

function setup() {
    /** Функция идентифицирования пользователя. Отправляет на сервер id пользователя и возвращает
     * роль пользователя в системе или сообщение об отсутствии пользователя в системе.*/
        // TODO: Сделать автоматическое определение айди пользователя и выполнение функции при старте.
        // TODO: Перевод на страницу с регистрацией.
    let formData = JSON.stringify($("#initForm").serializeArray());
    let url = "/ident";
    ajaxRequest(formData, url).then((value) => {
        document.getElementById("response").innerHTML = value
        alert(value)
    });
};


function userRegistration() {
    /** Функция регистрации пользователя.
     * Данные на входе: форма
     * Данные на выходе: Сообщение: Пользователь уже зарегистрирован, успешная регистрация*/
    let formData = JSON.stringify($("#regForm").serializeArray());
    let url = "/register";
    ajaxRequest(formData, url).then((value) => {
        document.getElementById("response").innerHTML = value
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


function loadEvents() {
    /** Функция загрузки всех событий. Выполняется при загрузке страницы.
     * Отправляет запрос на сервер. Получает ответ в виде массива с только будущими событиями.
     * Сортировка по дате и времени.
     * Присваивает класс dynamicrows всем создаваемым строкам таблицы.
     * Вставляет строки в таблицу с событиями.*/
    let formData = ''
    let url = "/event_request"
    ajaxRequest(formData, url).then((value) => {
        let table = document.getElementById('eventlist')
        for (let i = 0; i < value[0]; i++) {
            let row = table.insertRow(i+1);
            let uid_row = value[i + 1]
            let user_row = value[i + 1 + value[0]]
            let date_row = value[i + 1 + value[0] * 2]
            let time_row = value[i + 1 + value[0] * 3]
            let all_slots_row = value[i + 1 + value[0] * 4]
            let slots_row = value[i + 1 + value[0] * 5]
            row.className = "dynamicrows"
            row.insertCell(0).innerHTML = user_row
            row.insertCell(1).innerHTML = date_row
            row.insertCell(2).innerHTML = time_row
            row.insertCell(3).innerHTML = all_slots_row
            row.insertCell(4).innerHTML = slots_row
            row.insertCell(5).innerHTML = uid_row
        }
        /** добавление обработчика нажатий на строки таблицы*/
        addRowHandlers()
    });
};


function addRowHandlers() {
    /** Функция обработчика нажатий на строки в таблице.
     * При нажатии активируется оверлэй и выполняется функция подгрузки данных.
     * Функции подгрузки данных передается целиком строка*/
  let table = document.getElementById("eventlist");
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

window.onload = loadEvents();