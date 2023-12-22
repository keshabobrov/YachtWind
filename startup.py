from flask import Flask, render_template, request, json, jsonify
import db_access

app = Flask(__name__)


@app.route('/')
def home():
    return render_template("index.html")


@app.route('/init', methods=['POST'])
def user_initialization():
    user_telegram_id = request.json
    user = db_access.Users(user_telegram_id)
    if hasattr(user, 'user_id'):
        response = app.make_response(jsonify(user.user_role))
        response.set_cookie('user_id', str(user.user_id))
        return response, 200
    return jsonify(0), 200


# @app.route('/register', methods=['POST'])
# def user_creation():
#     json_input = request.json
#     user_telegram_id = json_input[3]['value']
#     user = db_access.Users(user_telegram_id)
#     if hasattr(user, 'user_id'):
#         return jsonify("User already in system! user_id: " + str(user.user_id)), 409
#     user.user_role = 'regular'
#     user.user_name = json_input[0]['value'] + " " + json_input[1]['value'] + " " + json_input[2]['value']
#     user.user_profile_type = True
#     user.setup()
#     return jsonify("User has been created!"), 200


# @app.route('/create_event', methods=['POST'])
# def event_create():
#     json_input = request.json
#     user_telegram_id = json_input[3]['value']
#     event = db_access.Events(user_telegram_id)
#     event.event_date = json_input[0]['value']
#     event.event_time = json_input[1]['value']
#     event.event_slot_num = json_input[2]['value']
#     res = event.create()
#     if res == "User not permitted!":
#         return jsonify(res), 401
#     return jsonify(res), 200


@app.route('/event_request', methods=['POST'])
def event_request():
    event_list = db_access.event_request()
    res = json.dumps(event_list, indent=1)
    print(res)
    return jsonify(res), 200


# @app.route('/team_parse', methods=['POST'])
# def teamParse():
#     users = []
#     event_id = request.json
#     event = db_access.teamParse(event_id)[0]
#     for index, x in enumerate(event[6:]):
#         if x is not None:
#             user = db_access.Users(x)
#             name = ""
#             space = 0
#             for n in user.Name:
#                 if space == 2:
#                     break
#                 name += n
#                 if n == " ":
#                     space += 1
#             users.insert(index, name)
#     return jsonify(users)


# @app.route('/enroll_event', methods=['POST'])
# def enrollEvent():
#     enroll_data = request.json
#     tgid = enroll_data[0]
#     event_id = enroll_data[1]
#     user = db_access.Users(tgid)
#     if not hasattr(user, 'UID'):
#         return jsonify(3)
#     res = db_access.enrollEvent(tgid, event_id)
#     return jsonify(res)


# @app.route('/stat_request', methods=['POST'])
# def getStat():
#     tgId = request.json
#     res = db_access.get_statistics(tgId)
#     uid_dict = []
#     date_dict = []
#     time_dict = []
#     for index, i in enumerate(res):
#         uid_dict.insert(index, str(i[0]))
#         date_dict.insert(index, str(i[1]))
#         time_dict.insert(index, str(i[2]))
#     result = uid_dict + date_dict + time_dict
#     return jsonify(result)

# @app.route('/stat_request', methods=['POST'])
# def getStat():
#     tgId = request.json
#     res = db_access.get_statistics(tgId)
#     total = res[0]
#     rating = res[1]
#     result = str(total) + "/" + str(rating)
#     return jsonify(result), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
