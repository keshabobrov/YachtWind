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
    """Обработка пользовательских данных: инициализация, создание, чтение и т.д."""

    def __init__(self, user_telegram_id):
        self.user_telegram_id = user_telegram_id
        user_data = user_initialize(self.user_telegram_id)
        if user_data != 0:
            self.user_id = user_data['user_id']
            self.user_role = user_data['user_role']
            self.user_name = user_data['user_name']
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
        new_user = ("INSERT INTO users "
                    "(user_telegram_id, user_name, user_registration_date) "
                    "VALUES (%s, %s, %s)")

        user_data = (user_data.user_telegram_id, user_data.user_name, user_registration_date)
        cursor.execute(new_user, user_data)
        logging.info('DB: User has been created!')
        return True

    except:
        logging.error("DB: Exit code 1: error in database - user_create", exc_info=True)


@access_db
def user_initialize(user_telegram_id, cursor):
    """Первичная инициализация пользователя"""
    try:
        request_find_user = f"SELECT * FROM users WHERE user_telegram_id = {user_telegram_id}"
        cursor.execute(request_find_user)
        request_result = cursor.fetchall()
        if not request_result:
            return 0
        if len(request_result) >= 2:
            logging.warning('DB: Exit code 3: Multiple users found! ---  TgID: ' + str(user_telegram_id))
        return request_result[0]

    except:
        logging.error("DB: Exit code 2: error in database - user_initialize", exc_info=True)


@access_db
def user_statistics(user, cursor):
    try:
        request_get_statistics = ("SELECT user_rank, user_total_events FROM "
                                  "(SELECT RANK() OVER (ORDER BY total DESC) AS user_rank, "
                                  "count.total AS user_total_events, user_id FROM "
                                  "(SELECT COUNT(enrollments.enrollment_id) AS total, users.user_id FROM users "
                                  "LEFT JOIN enrollments ON users.user_id = enrollments.user_id "
                                  "GROUP BY users.user_id ORDER BY total DESC ) AS count "
                                  "ORDER BY user_rank) AS rank_table "
                                  f"WHERE user_id = {user.user_id};")
        cursor.execute(request_get_statistics)
        request_result = cursor.fetchone()
        return request_result

    except:
        logging.error("DB: Exit code 1: error in database - user_statistics", exc_info=True)


@access_db
def event_create(event, cursor):
    try:
        event_creation_date = date.today()
        new_event = ("INSERT INTO events "
                     "(event_datetime, event_author_id, event_creation_date, event_slot_num) "
                     "VALUES (%s, %s, %s, %s)")

        event_data = (event.event_datetime, event.event_author.user_id, event_creation_date, event.event_slot_num)
        cursor.execute(new_event, event_data)
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
        request_events = ("SELECT events.event_id, events.event_datetime, users.user_name AS event_author_name, "
                          "(events.event_slot_num - COUNT(enrollments.enrollment_id)) AS event_remaining_slots, "
                          "events.event_boat_num "
                          "FROM events JOIN users ON events.event_author_id = users.user_id "
                          "LEFT JOIN enrollments ON events.event_id = enrollments.event_id "
                          f"WHERE events.event_datetime >= \"{formatted_date}\" "
                          "GROUP BY events.event_id, users.user_name "
                          "ORDER BY events.event_datetime;"
                          )
        cursor.execute(request_events)
        result = cursor.fetchall()
        for event in result:
            event['event_datetime'] = event['event_datetime'].isoformat()
        return result

    except:
        logging.error("DB: Exit code 1: error in database - event_request", exc_info=True)


@access_db
def enrollment_request(event_id, cursor):
    try:
        request_teams = ("SELECT user_name FROM enrollments JOIN users ON enrollments.user_id=users.user_id "
                         f"WHERE event_id = {event_id}")
        cursor.execute(request_teams)
        request_result = cursor.fetchall()
        return request_result

    except:
        logging.error("DB: Exit code 1: error in database - enrollment_request", exc_info=True)


@access_db
def enrollment_create(user, event_id, cursor):
    try:
        request_available = ("SELECT (events.event_slot_num - COUNT(enrollments.enrollment_id)) AS remaining_slots, "
                             f"MAX(CASE WHEN enrollments.user_id = {user.user_id} THEN 1 ELSE 0 END) "
                             "AS user_already_enrolled "
                             "FROM events LEFT JOIN enrollments ON events.event_id = enrollments.event_id "
                             f"WHERE events.event_id = {event_id} GROUP BY events.event_id;")
        cursor.execute(request_available)
        request_result = cursor.fetchone()
        if request_result['user_already_enrolled'] == 1:
            request_remove = f"DELETE FROM enrollments WHERE user_id={user.user_id} AND event_id={event_id}"
            cursor.execute(request_remove)
            return "removed"
        elif request_result['remaining_slots'] == 0:
            return "no more slots"
        elif request_result['user_already_enrolled'] == 0:
            request_enroll = ("INSERT INTO enrollments (user_id, event_id) "
                              f"VALUES ({user.user_id}, {event_id})")
            cursor.execute(request_enroll)
            return "success"
        else:
            return "error"

    except:
        logging.error("DB: Exit code 1: error in database - read/write enrollment", exc_info=True)


@access_db
def team_create(team, cursor):
    try:
        team_create_request = ("INSERT INTO teams (team_name, team_description, team_creator_id) "
                            "VALUES (%s, %s, %s)")
        team_data = (team.team_name, team.team_description, team.team_creator_id)
        cursor.execute(team_create_request, team_data)
        return True
    except:
        logging.error("DB: Exit code 1: error in database - team_create", exc_info=True)
        return False


@access_db
def team_request(user, cursor):
    try:
        team_request_prompt = ("SELECT team_id, team_name, team_description, team_creator_id "
                               f"FROM teams WHERE team_creator_id={user.user_id}")
        print(team_request_prompt)
        cursor.execute(team_request_prompt)
        request_result = cursor.fetchall()
        return request_result
    except:
        logging.error("DB: Exit code 1: error in database - team_create", exc_info=True)
        return False
