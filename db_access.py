import mysql.connector
import logging
from datetime import date, datetime
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
                    level=getattr(logging, os.getenv('PROFILE'))
                    )


class Users:
    """Обработка пользовательских данных: инициализация, создание, чтение и т.д."""

    def __init__(self, user_telegram_id):
        self.user_telegram_id = user_telegram_id
        user_data = user_initialization(self.user_telegram_id)
        if user_data != 0:
            self.user_id = user_data['user_id']
            self.user_role = user_data['user_role']
            self.user_name = user_data['user_name']
            self.user_profile_type = user_data['user_profile_type']

    def setup(self):
        create_user(
            user_telegram_id=self.user_telegram_id,
            user_name=self.user_name,
            user_profile_type=self.user_profile_type,
            user_role=self.user_role
        )


class Events:
    """Класс для тренировок: создание, чтение"""

    def __init__(self):
        self.event_author = None
        self.event_id = None
        self.event_date = None
        self.event_time = None
        self.event_slot_num = None
        self.event_slot_available = None

    def create(self):
        if not hasattr(self.event_author, 'user_id'):
            return 'User not in system!'
        if self.event_author.user_role != 'admin' and self.event_author.user_role != 'captain':
            return 'User not permitted!'
        event_creation(
            event_author_id=self.event_author.user_id,
            event_date=self.event_date,
            event_time=self.event_time,
            event_slot_num=self.event_slot_num
        )
        return 'Event has been created!'


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


# def parse_slots(slot):
#     try:
#         k = 0
#         appointments = []
#         for i in slot[6:]:
#             if i is not None:
#                 appointments.insert(k, i)
#                 k += 1
#         return appointments
#     except:
#         logging.error("DB: Exit code 4: error in parse slots", exc_info=True)


@access_db
def create_user(user_role, user_telegram_id, user_name, user_profile_type, cursor):
    try:
        user_registration_date = date.today()
        new_user = ("INSERT INTO users "
                    "(user_role, user_telegram_id, user_name, user_profile_type, user_registration_date) "
                    "VALUES (%s, %s, %s, %s, %s)")

        user_data = (user_role, user_telegram_id, user_name, user_profile_type, user_registration_date)
        cursor.execute(new_user, user_data)
        logging.info('DB: User has been created!')

    except:
        logging.error("DB: Exit code 1: error in create_user", exc_info=True)


@access_db
def user_initialization(user_telegram_id, cursor):
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
        logging.error("DB: Exit code 2: error in user_initialization", exc_info=True)


# @access_db
# def event_creation(event_date, event_time, event_author_id, event_slot_num, cursor):
#     try:
#         event_creation_date = date.today()
#         new_event = ("INSERT INTO trainings "
#                      "(event_date, event_time, event_author_id, event_creation_date, event_slot_num) "
#                      "VALUES (%s, %s, %s, %s, %s)")
#
#         event_data = (event_date, event_time, event_author_id, event_creation_date, event_slot_num)
#         cursor.execute(new_event, event_data)
#         logging.info('DB: Event has been created!')
#
#     except:
#         logging.error("DB: Exit code 1: error in event_creation", exc_info=True)


@access_db
def event_request(cursor):
    try:
        today_date = date.today()
        formatted_date = today_date.strftime("%Y.%m.%d")
        request_events = ("SELECT * FROM events "
                          f"WHERE event_datetime >= \"{formatted_date}\" "
                          "ORDER BY event_datetime")
        cursor.execute(request_events)
        result = cursor.fetchall()
        for event in result:
            event['event_datetime'] = event['event_datetime'].isoformat()
            event['event_creation_date'] = event['event_creation_date'].isoformat()
        return result

    except:
        logging.error("DB: Exit code 1: error in event_request", exc_info=True)


# @access_db
# def teamParse(event_id, cursor):
#     try:
#         request_events = ("SELECT * FROM trainings"
#                           " WHERE UID = %s" % event_id)
#         cursor.execute(request_events)
#         request_result = cursor.fetchall()
#         return request_result
#
#     except:
#         logging.error("DB: Exit code 1: error in read_db_training", exc_info=True)

# TODO: REWRITE THIS BLOCK OF CODE
# @access_db
# def event_enrollment(user_telegram_id, event_id, cursor):
#     try:
#         request_events = ("SELECT * FROM trainings"
#                           " WHERE UID = %s" % event_id)
#         cursor.execute(request_events)
#         request_result = cursor.fetchone()
#         max = request_result[5] + 6
#         for index, i in enumerate(request_result[6:max]):
#             if str(i) == str(tgid):
#                 enroll_event = ("UPDATE trainings SET U%s" % (index + 1) + " = NULL" + " WHERE UID = %s" % event_id)
#                 cursor.execute(enroll_event)
#                 # try:
#                 #     # update_rating(tgid)
#                 # except:
#                 #     logging.error("Error in update_rating call", exc_info=True)
#                 return 1
#             if i is None:
#                 enroll_event = (
#                             "UPDATE trainings SET U%s" % (index + 1) + " = %s" % tgid + " WHERE UID = %s" % event_id)
#                 cursor.execute(enroll_event)
#                 # try:
#                 #     update_rating(tgid)
#                 # except:
#                 #     logging.error("Error in update_rating call", exc_info=True)
#                 return 0
#         return 2
#
#     except:
#         logging.error("DB: Exit code 1: error in read_db_training", exc_info=True)


# @access_db
# def get_statistics(tgId, cursor):
#     try:
#         today_date = date.today()
#         result = []
#         d1 = today_date.strftime("%Y.%m.%d")
#         rating_request = ("SELECT SumTrainings FROM users" +
#                           " WHERE TgID = \"%s\"" % tgId)
#         count_events = (
#                 "SELECT COUNT(*) FROM trainings" +
#                 " WHERE CONCAT_WS(\"\", U1, U2, U3, U4, U5, U6, U7, U8, U9, U10)" +
#                 " LIKE \"%s\"" % tgId + " OR creator_id = \"%s\"" % tgId
#         )
#         cursor.execute(count_events)
#         result.insert(0, cursor.fetchone()[0])
#         cursor.execute(rating_request)
#         result.insert(1, cursor.fetchone()[0])
#         return result
#     except:
#         logging.error("DB: Exit code 1: error in DB_get_statistics", exc_info=True)
