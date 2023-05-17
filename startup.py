from flask import Flask, render_template, request, jsonify
import db_access

app = Flask(__name__)


@app.route('/')
def home():
    return render_template("index.html")


@app.route('/reg_form')
def reg_form():
    return render_template("registration.html")


@app.route('/ident', methods=['POST'])
def userIdent():
    tgid = request.json
    userinfo = db_access.Users(tgid)
    if hasattr(userinfo, 'UID'):
        return jsonify(userinfo.Role), 200
    return jsonify(0), 200


@app.route('/register', methods=['POST'])
def userRegistration():
    jsonData = request.json
    tgid = jsonData[3]['value']
    userinfo = db_access.Users(tgid)
    if hasattr(userinfo, 'UID'):
        return jsonify("User already in system! UID: " + str(userinfo.UID)), 409
    userinfo.Role = 'regular'
    userinfo.Name = jsonData[0]['value'] + " " + jsonData[1]['value'] + " " + jsonData[2]['value']
    userinfo.Access = True
    userinfo.user_setup()
    return jsonify("User has been created!"), 200


@app.route('/create_event', methods=['POST'])
def eventCreation():
    jsonData = request.json
    tgid = jsonData[3]['value']
    event = db_access.Trainings(tgid)
    event.event_date = jsonData[0]['value']
    event.event_time = jsonData[1]['value']
    event.user_slots = jsonData[2]['value']
    res = event.create()
    if res == "User not permitted!":
        return jsonify(res), 401
    return jsonify(res), 200


@app.route('/event_request', methods=['POST'])
def eventRequest():
    user_id_dict = []
    event_UID_dict = []
    user_name_dict = []
    event_data_dict = []
    event_time_dict = []
    all_slots_dict = []
    available_slots_dict = []
    quantity = []
    k = 0
    event_class_object = db_access.Trainings(0)
    event_list = event_class_object.request()
    for i in event_list:
        parse_slots = []
        event_UID_dict.insert(k, str(i[0]))
        user_id_dict.insert(k, str(i[1]))
        event_data_dict.insert(k, str(i[3]))
        event_time_dict.insert(k, str(i[4]))
        all_slots_dict.insert(k, str(i[5]))
        iter = 0
        for n in i[6:]:
            if n is not None:
                parse_slots.insert(iter, k)
                iter += 1
        slots_quantity = i[5] - len(parse_slots)
        available_slots_dict.insert(k, slots_quantity)
        k += 1
    for index, i in enumerate(user_id_dict):
        trainer = db_access.Users(i)
        user_name_dict.insert(index, trainer.Name)
    result = event_UID_dict + user_name_dict + event_data_dict + event_time_dict + all_slots_dict + available_slots_dict
    quantity.insert(0, len(user_id_dict))
    return jsonify(quantity + result), 200


@app.route('/team_parse', methods=['POST'])
def teamParse():
    users = []
    event_id = request.json
    event = db_access.teamParse(event_id)[0]
    for index, x in enumerate(event[6:]):
        if x is not None:
            user = db_access.Users(x)
            name = ""
            space = 0
            for n in user.Name:
                if space == 2:
                    break
                name += n
                if n == " ":
                    space += 1
            print(name)
            users.insert(index, name)
    return jsonify(users)


@app.route('/enroll_event', methods=['POST'])
def enrollEvent():
    enroll_data = request.json
    tgid = enroll_data[0]
    event_id = enroll_data[1]
    user = db_access.Users(tgid)
    if not hasattr(user, 'UID'):
        return jsonify(3)
    res = db_access.enrollEvent(tgid, event_id)
    return jsonify(res)


@app.route('/stat_request', methods=['POST'])
def getStat():
    tgId = request.json
    res = db_access.get_statistics(tgId)
    uid_dict = []
    date_dict = []
    time_dict = []
    for index, i in enumerate(res):
        uid_dict.insert(index, str(i[0]))
        date_dict.insert(index, str(i[1]))
        time_dict.insert(index, str(i[2]))
    result = uid_dict + date_dict + time_dict
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="localhost", port=8080, debug=True)
