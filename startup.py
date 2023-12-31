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
        dictionary = {
            'user_role': user.user_role,
            'user_rank': user.user_rank,
            'user_total_events': user.user_total_events,
            'user_access_flag': user.user_access_flag
        }
        results = json.dumps(dictionary, indent=1)
        response = app.make_response(results)
        response.set_cookie('user_telegram_id', str(user.user_telegram_id))
        return response, 200
    return jsonify(0), 200


@app.route('/user_registration', methods=['POST'])
def user_registration():
    json_input = request.json
    user_telegram_id = json_input['user_telegram_id']
    user = db_access.Users(user_telegram_id)
    if hasattr(user, 'user_id'):
        return jsonify("User already in system! user_id: " + str(user.user_id)), 409
    user.user_name = json_input['lastName'] + " " + json_input['firstName'] + " " + json_input['middleName']
    if user.setup():
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


@app.route('/get_enrollment', methods=['POST'])
def team_request():
    event_id = request.json
    event_users = db_access.team_request(event_id)
    results = json.dumps(event_users, indent=1)
    return jsonify(results), 200


@app.route('/event_enroll', methods=['POST'])
def event_enroll():
    event_id = request.json
    user_telegram_id = request.cookies.get('user_telegram_id')
    user = db_access.Users(user_telegram_id)
    if not hasattr(user, 'user_id'):
        return jsonify('User not found'), 409
    results = db_access.event_enrollment(user, event_id)
    if results == 'no more slots':
        return jsonify(results), 200
    if results == 'success':
        return jsonify(results), 200
    if results == 'removed':
        return jsonify(results), 200
    return jsonify(results), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
