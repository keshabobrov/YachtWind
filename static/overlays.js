function overlayEvents(param) {
    if (param === 1) {
        document.getElementById('overlay_enroll').style.display = "flex";
        Telegram.WebApp.expand();
        setup(get_id()).then((value) => {
            if (value === "captain" || value === "admin") {
                Telegram.WebApp.MainButton.setParams({
                    text: 'Создать событие',
                    is_visible: true
                })
            }
        })
    }
    if (param === 0) {
        document.getElementById('overlay_enroll').style.display = "none";
    }
}


function overlayCreation(param) {
    if (param === 1) {
        document.getElementById("event_creation").style.display = "flex";
    }
    if (param === 0) {
        document.getElementById("event_creation").style.display = "none";
        overlayEvents(1)
    }
}

function overlayTeams(param) {
    if (param === 1) {
        document.getElementById("overlay_teams").style.display = "flex";
    }
    if (param === 0) {
        document.getElementById("overlay_teams").style.display = "none";
    }
}