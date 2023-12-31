function overlayList(param) {
    if (param === 1) {
        document.getElementById('overlay_event_list').style.display = "flex";
        const user_role = sessionStorage.getItem('user_role')
        Telegram.WebApp.expand();
        if (user_role === "captain" || user_role === "admin") {
            Telegram.WebApp.MainButton.setParams({
                text: 'Новая тренировка',
                is_visible: true
            })
        }
    }
    if (param === 0) {
        document.getElementById('overlay_event_list').style.display = "none";
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

function overlayStats(param) {
    if (param === 1) {
        document.getElementById("overlay_stats").style.display = "flex";
        getStatistics()
    }
    if (param === 0) {
        document.getElementById("overlay_stats").style.display = "none";
    }
}

function overlayEvent(param) {
    if (param === 1) {
        document.getElementById('overlay_event').style.display = 'flex';
    }
    if (param === 0) {
        document.getElementById('overlay_event').style.display = 'none';
    }
}