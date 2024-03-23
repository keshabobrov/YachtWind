from flask import Flask, render_template, request, json, jsonify
import db_access

app = Flask(__name__)


@app.route('/')
def home():
    return render_template("index.html")


@app.route('/init', methods=['POST'])
def user_initialization():
    user_telegram_id = request.json
    current_user = db_access.Users(user_telegram_id)
    if hasattr(current_user, 'user_id'):
        dictionary = {
            'user_role': current_user.user_role,
            'user_rank': current_user.user_rank,
            'user_total_events': current_user.user_total_events,
            'user_access_flag': current_user.user_access_flag
        }
        results = json.dumps(dictionary, indent=1)
        response = app.make_response(results)
        response.set_cookie('user_telegram_id', str(current_user.user_telegram_id))
        return response, 200
    return jsonify(0), 200


@app.route('/user_registration', methods=['POST'])
def user_registration():
    json_input = request.json
    user_telegram_id = json_input['user_telegram_id']
    current_user = db_access.Users(user_telegram_id)
    if hasattr(current_user, 'user_id'):
        return jsonify("User already in system! user_id: " + str(current_user.user_id)), 409
    current_user.user_last_name = json_input['lastName']
    current_user.user_first_name = json_input['firstName']
    current_user.user_middle_name = json_input['middleName']
    if current_user.setup():
        return jsonify("User has been created!"), 200
    else:
        return jsonify("Some error writing user"), 500


@app.route('/create_event', methods=['POST'])
def event_create():
    json_input = request.json
    user_telegram_id = request.cookies.get('user_telegram_id')
    event = db_access.Events()
    event.event_datetime = json_input['datetime_form']
    event.event_slot_num = json_input['slot_form']
    event.event_boat_num = json_input['boat_num_form']
    event.event_author = db_access.Users(user_telegram_id)
    results = event.create()
    if results == "User not permitted":
        return jsonify(results), 401
    if results == "User not found":
        return jsonify(results), 409
    if results == "Some error":
        return jsonify(results), 500
    return jsonify(results), 200


@app.route('/event_request', methods=['POST'])
def event_request():
    event_list = db_access.event_request()
    results = json.dumps(event_list, indent=1)
    return jsonify(results), 200


@app.route('/request_enrollments', methods=['POST'])
def request_enrollments():
    event_id = request.json
    event_users = db_access.enrollment_request(event_id)
    results = json.dumps(event_users, indent=1)
    return jsonify(results), 200


@app.route('/event_enroll', methods=['POST'])
def event_enroll():
    event_id = request.json
    user_telegram_id = request.cookies.get('user_telegram_id')
    current_user = db_access.Users(user_telegram_id)
    if not hasattr(current_user, 'user_id'):
        return jsonify('User not found'), 409
    results = db_access.enrollment_create(current_user, event_id)
    if results == 'no more slots':
        return jsonify(results), 200
    if results == 'success':
        return jsonify(results), 200
    if results == 'removed':
        return jsonify(results), 200
    return jsonify(results), 500


@app.route('/create_team', methods=['POST'])
def create_team():
    team_data = request.json
    current_user = db_access.Users(request.cookies.get('user_telegram_id'))
    new_team = db_access.Teams()
    new_team.team_name = team_data['team_name_form']
    new_team.team_description = team_data['team_description_form']
    new_team.team_creator_id = current_user.user_id
    result = db_access.team_create(new_team)
    if result:
        return jsonify('Team created!'), 200
    else:
        return jsonify("Some error creating team"), 500


@app.route('/request_teams', methods=['POST'])
def request_teams():
    user_telegram_id = request.cookies.get('user_telegram_id')
    current_user = db_access.Users(user_telegram_id)
    teams = db_access.team_request(current_user)
    if teams:
        return jsonify(teams), 200
    else:
        return jsonify("Some error in request teams"), 500


@app.route('/get_user_list', methods=['POST'])
def get_user_list():
    json_input = request.json
    user_telegram_id = request.cookies.get('user_telegram_id')
    current_user = db_access.Users(user_telegram_id)
    users = db_access.get_user_list(json_input, current_user)
    return jsonify(users), 200


@app.route('/change_user_state', methods=['POST'])
def change_user_state():
    json_input = request.json
    user_telegram_id = request.cookies.get('user_telegram_id')
    current_user = db_access.Users(user_telegram_id)
    if json_input['eventType'] == 'teamView':
        result = db_access.team_update_user(current_user, json_input)
        if result == 'Insufficient privileges':
            return jsonify(result), 401
        elif result == 'User not found':
            return jsonify(result), 200
        elif result == 'Specified user has no access to system':
            return jsonify(result), 409
        elif result == 'Participation removed' or result == 'Participation created':
            return jsonify(result), 200
        elif result == 'Multiple results found. Not implemeted yet':
            return jsonify(result), 500
        else:
            return jsonify('Some error in change_user_state', result), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
