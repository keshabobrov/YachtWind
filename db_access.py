import mysql.connector
import logging
from datetime import date
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env')
host = os.getenv('DB_HOST')
user = os.getenv('DB_USERNAME')
password = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
logging.basicConfig(filename='srv.log',
                    filemode='a+',
                    format='%(name)s :: %(asctime)s :: %(levelname)s :: %(message)s',
                    level=getattr(logging, os.getenv('PROFILE')))


class Users:
    def __init__(self, user_telegram_id):
        self.user_telegram_id = user_telegram_id
        user_data = user_initialize(self.user_telegram_id)
        if user_data != 0:
            self.user_id = user_data['user_id']
            self.user_role = user_data['user_role']
            self.user_last_name = user_data['user_last_name']
            self.user_first_name = user_data['user_first_name']
            self.user_middle_name = user_data['user_middle_name']
            self.user_access_flag = user_data['user_access_flag']
            statistics = user_statistics(self)
            self.user_rank = statistics['user_rank']
            self.user_total_events = statistics['user_total_events']

    def setup(self):
        if user_create(self):
            return True


class Events:
    """Класс для тренировок: создание, чтение"""

    def __init__(self):
        self.event_author = None
        self.event_id = None
        self.event_datetime = None
        self.event_slot_num = None
        self.event_slot_available = None
        self.event_boat_num = None

    def create(self):
        if not hasattr(self.event_author, 'user_id'):
            return 'User not logged in'
        if self.event_author.user_role != 'admin' and self.event_author.user_role != 'captain':
            return 'User not permitted'
        result = event_create(self)
        if not result:
            return 'Some error'
        return 'Event has been created!'


class Teams:
    def __init__(self):
        self.team_id = None
        self.team_name = None
        self.team_description = None
        self.team_creator_id = None
        self.team_users = None


def access_db(func):
    """
    Decorator for connection to mysql DB.
    It's setting up the connection and forwarding cursor to func
    """

    def connector(*args, **kwargs):
        db = mysql.connector.connect(host=host, user=user, password=password, database=database)
        cursor = db.cursor(dictionary=True)
        kwargs['cursor'] = cursor
        existence_code = func(*args, **kwargs)
        db.commit()
        cursor.close()
        db.close()
        return existence_code

    return connector


@access_db
def user_create(user_data, cursor):
    try:
        user_registration_date = date.today()
        prompt = ("INSERT INTO users "
                  "(user_telegram_id, user_last_name, user_first_name, user_middle_name, user_registration_date) "
                  "VALUES (%s, %s, %s, %s, %s)")

        user_data = (user_data.user_telegram_id, user_data.user_last_name,
                     user_data.user_first_name, user_data.user_middle_name, user_registration_date)
        cursor.execute(prompt, user_data)
        logging.info('DB: User has been created!')
        return True

    except:
        logging.error("DB: Exit code 1: error in database - user_create", exc_info=True)


@access_db
def user_initialize(user_telegram_id, cursor):
    """Первичная инициализация пользователя"""
    try:
        prompt = f"SELECT * FROM users WHERE user_telegram_id = {user_telegram_id}"
        cursor.execute(prompt)
        request_result = cursor.fetchall()
        if not request_result:
            return 0
        if len(request_result) >= 2:
            logging.warning('DB: Exit code 3: Multiple users found! ---  TgID: ' + str(user_telegram_id))
        return request_result[0]

    except:
        logging.error("DB: Exit code 2: error in database - user_initialize", exc_info=True)


@access_db
def user_statistics(current_user, cursor):
    try:
        prompt = ("SELECT user_rank, user_total_events FROM "
                  "(SELECT RANK() OVER (ORDER BY total DESC) AS user_rank, "
                  "count.total AS user_total_events, user_id FROM "
                  "(SELECT COUNT(enrollments.enrollment_id) AS total, users.user_id FROM users "
                  "LEFT JOIN enrollments ON users.user_id = enrollments.user_id "
                  "GROUP BY users.user_id ORDER BY total DESC ) AS count "
                  "ORDER BY user_rank) AS rank_table "
                  f"WHERE user_id = {current_user.user_id};")
        cursor.execute(prompt)
        request_result = cursor.fetchone()
        return request_result

    except:
        logging.error("DB: Exit code 1: error in database - user_statistics", exc_info=True)


@access_db
def event_create(event, cursor):
    try:
        event_creation_date = date.today()
        if event.event_boat_num == "":
            event.event_boat_num = None
        prompt = ("INSERT INTO events "
                  "(event_datetime, event_author_id, event_creation_date, event_slot_num, event_boat_num) "
                  "VALUES (%s, %s, %s, %s, %s)")

        event_data = (event.event_datetime, event.event_author.user_id, event_creation_date, event.event_slot_num, event.event_boat_num)
        cursor.execute(prompt, event_data)
        logging.info('DB: Event has been created!')
        return True

    except:
        logging.error("DB: Exit code 1: error in database - event_create", exc_info=True)
        return False


@access_db
def event_request(cursor):
    try:
        today_date = date.today()
        formatted_date = today_date.strftime("%Y.%m.%d")
        prompt = ("SELECT events.event_id, events.event_datetime, users.user_last_name AS event_author_last_name, "
                  "users.user_first_name AS event_author_first_name, "
                  "users.user_middle_name AS event_author_middle_name, "
                  "(events.event_slot_num - COUNT(enrollments.enrollment_id)) AS event_remaining_slots, "
                  "events.event_boat_num "
                  "FROM events JOIN users ON events.event_author_id = users.user_id "
                  "LEFT JOIN enrollments ON events.event_id = enrollments.event_id "
                  f"WHERE events.event_datetime >= \"{formatted_date}\" "
                  "GROUP BY events.event_id, users.user_last_name "
                  "ORDER BY events.event_datetime;")
        cursor.execute(prompt)
        result = cursor.fetchall()
        for event in result:
            event['event_datetime'] = event['event_datetime'].isoformat()
        return result

    except:
        logging.error("DB: Exit code 1: error in database - event_request", exc_info=True)


@access_db
def enrollment_request(event_id, cursor):
    try:
        prompt = ("SELECT user_last_name, user_first_name, user_middle_name FROM enrollments "
                  "JOIN users ON enrollments.user_id=users.user_id "
                  f"WHERE event_id = {event_id}")
        cursor.execute(prompt)
        request_result = cursor.fetchall()
        return request_result

    except:
        logging.error("DB: Exit code 1: error in database - enrollment_request", exc_info=True)


@access_db
def enrollment_create(current_user, event_id, cursor):
    try:
        prompt = ("SELECT (events.event_slot_num - COUNT(enrollments.enrollment_id)) AS remaining_slots, "
                  f"MAX(CASE WHEN enrollments.user_id = {current_user.user_id} THEN 1 ELSE 0 END) "
                  "AS user_already_enrolled "
                  "FROM events LEFT JOIN enrollments ON events.event_id = enrollments.event_id "
                  f"WHERE events.event_id = {event_id} GROUP BY events.event_id;")
        cursor.execute(prompt)
        request_result = cursor.fetchone()
        if request_result['user_already_enrolled'] == 1:
            request_remove = f"DELETE FROM enrollments WHERE user_id={current_user.user_id} AND event_id={event_id}"
            cursor.execute(request_remove)
            return "removed"
        elif request_result['remaining_slots'] == 0:
            return "no more slots"
        elif request_result['user_already_enrolled'] == 0:
            request_enroll = ("INSERT INTO enrollments (user_id, event_id) "
                              f"VALUES ({current_user.user_id}, {event_id})")
            cursor.execute(request_enroll)
            return "success"
        else:
            return "error"

    except:
        logging.error("DB: Exit code 1: error in database - read/write enrollment", exc_info=True)


@access_db
def team_create(team, cursor):
    try:
        prompt = ("INSERT INTO teams (team_name, team_description, team_creator_id) "
                  "VALUES (%s, %s, %s)")
        team_data = (team.team_name, team.team_description, team.team_creator_id)
        cursor.execute(prompt, team_data)
        return True
    except:
        logging.error("DB: Exit code 1: error in database - team_create", exc_info=True)
        return False


@access_db
def team_request(current_user, cursor):
    """
    Retrieve the teams associated with the current user.

    Users are considered associated with a team based on team creation or team participation.

    Args:
        current_user (User): An object representing the current user.

    Returns:
        list of dictionaries or None: 
            A list of dictionaries representing teams associated with the current user. 
            Each dictionary contains the following keys:
                - team_id (int): The ID of the team.
                - team_name (str): The name of the team.
                - team_description (str): Description of the team.
                - team_creator_id (int): The ID of the user who created the team.
                - team_date_created (datetime): The date and time when the team was created.
            Returns None if no teams are associated with the user.

    Raises:
        Exception: Any unexpected error during the execution of the function will be logged with details.
    """
    try:
        teams_request_prompt = ("SELECT DISTINCT teams.team_id, team_name,"
                                "team_description, team_creator_id, teams.team_date_created "
                                "FROM teams LEFT JOIN team_participations ON team_participations.team_id=teams.team_id "
                                f"WHERE team_creator_id={current_user.user_id} "
                                f"OR team_participations.user_id={current_user.user_id} "
                                "ORDER BY teams.team_date_created DESC;")
        cursor.execute(teams_request_prompt)
        teams = cursor.fetchall()
        if not teams:
            return None
        return teams
    except:
        logging.error("DB: Exit code 1: error in database - team_request", exc_info=True)
        return False


@access_db
def team_update_user(current_user, json_input, cursor):
    """
    Add or remove a user from a team based on the provided information.

    Args:
        current_user (User): An object representing the current user performing the action.
        json_input (dict): A dictionary containing the following keys:
            - eventType (str): Type of event indicating the purpose of the request.
            - eventProperty: The ID of the team to which the user will be added or removed.
            - user_input (str): The full name of the user to be added or removed, formatted as "Last Name First Name".
        cursor: A database cursor object used to execute SQL queries.

    Returns:
        str or False:
            - If the current user does not have sufficient privileges to perform the action, returns "Insufficient privileges".
            - If the specified user is not found in the database, returns "User not found".
            - If the specified user has no access to the system, returns "Specified user has no access to system".
            - If the user is already a member of the team and is removed, returns "Participation removed".
            - If the user is successfully added to the team, returns "Participation created".

    Raises:
        Exception: Any unexpected error during the execution of the function will be logged with details.
    
    Potencial issues:
        HACK: Any user can add first user to team, even not team creator. But this isn't implemented in frontend.
    """
    try:
        try:
            input_last_name = json_input['user_input'].split(" ")[0]
            input_first_name = json_input['user_input'].split(" ")[1]
        except:
            return "User not found"
        user_request_prompt = ("SELECT user_id, user_access_flag FROM users "
                               f"WHERE LOWER(user_last_name) = LOWER(\"{input_last_name}\") "
                               f"AND LOWER(user_first_name) = LOWER(\"{input_first_name}\");")
        cursor.execute(user_request_prompt) # Requesting list of users with matching last + first names.
        user_to_add = cursor.fetchone()
        if not user_to_add:
            return "User not found"
        elif user_to_add['user_access_flag'] == 0:
            logging.warning("User trying to add blocked user to team", exc_info=False)
            return "Specified user has no access to system"
        else: pass
        team_participation_prompt = ("SELECT team_participations.participation_id, team_participations.user_id, "
                                     "teams.team_creator_id FROM team_participations RIGHT JOIN teams ON "
                                     "team_participations.team_id = teams.team_id "
                                     f"WHERE team_participations.team_id = {json_input['eventProperty']};")
        cursor.execute(team_participation_prompt) # Finding all records in team_participations for provided team.
        team_users = cursor.fetchall()
        if not team_users: pass # Continue if no participations in provided team. Any user potencially can add first user to team!
        elif current_user.user_id != int(team_users[0]['team_creator_id']):
            logging.error("User trying to reach forbidden feature - add_to_team", exc_info=False)
            return "Insufficient privileges"
        for team_user in team_users:
            if team_user['user_id'] == user_to_add['user_id']:
                team_participation_remove = ("DELETE FROM team_participations "
                                             f"WHERE participation_id = {team_user['participation_id']};")
                cursor.execute(team_participation_remove)
                logging.info("User removed from some team", exc_info=False)
                return "Participation removed"
        team_participation_add = "INSERT INTO team_participations (user_id, team_id) VALUES (%s, %s);"
        cursor.execute(team_participation_add, (user_to_add['user_id'], json_input['eventProperty']))
        logging.info("User added to some team", exc_info=False)
        return "Participation created"
    except:
        logging.error("DB: Exit code 1: error in database - team_add_user", exc_info=True)
        return False


@access_db
def get_user_list(json_input, current_user, cursor):
    """
    Retrieve a list of users based on the provided criteria.

    Args:
        json_input (dict): A dictionary containing the following keys:
            - eventType (str): Type of event indicating the purpose of the request.
            - eventProperty: Data needed for the request, dependent on the eventType.

        current_user (User): An object representing the current user accessing the function.

        cursor: A database cursor object used to execute SQL queries.

    Returns:
        list of dictionaries or error str: 
            - If eventType is 'teamView', returns a list of users along with their participation status in a specific team.
            - If eventType is 'adminPanel' and current user has admin privileges, returns a list of all users with their roles and access flags.
            - If the current user does not have admin privileges in the 'adminPanel' eventType, returns a string indicating lack of permission.

    Raises:
        Exception: Any unexpected error during the execution of the function will be logged with details.
    """
    try:
        if json_input['eventType'] == 'teamView':
            prompt = ("SELECT CONCAT(user_last_name, \" \", user_first_name) AS user_name, "
                          f"MAX(IF(team_participations.team_id = {json_input['eventProperty']}, True, False)) as in_results " 
                          "FROM users LEFT JOIN team_participations ON users.user_id = team_participations.user_id "
                          "GROUP BY users.user_id;")
        elif json_input['eventType'] == 'adminPanel':
            if current_user.user_role != 'admin':
                logging.critical("DB: Exit code 3: error in user_permission. User trying to access forbidden data.", exc_info=False)
                return "User not permitted. Incident will be reported."
            prompt = ("SELECT CONCAT(user_last_name, \" \", user_first_name) AS user_name, "
                      "user_access_flag, user_id, user_role FROM users;")
        cursor.execute(prompt)
        users = cursor.fetchall()
        if current_user.user_role != 'admin':
            i = 0
            while i < len(users):
                if users[i]['in_results'] == 0: 
                    users.remove(users[i])
                    continue
                else:
                    i += 1
        return users
    except:
        logging.error("DB: Exit code 1: error in database - get_user_list", exc_info=True)
        return "Some error"
