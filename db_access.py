import mysql.connector
import logging
from datetime import date

host = "localhost"
user = "main_connector"
password = "***REMOVED***"
database = "yacht_db"
logging.basicConfig(filename='db_access.log',
                    filemode='a+',
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    level=logging.DEBUG)


class Users:
    """Класс работы с пользовательскими данными: инициализация, создание, чтение и т.д."""
    def __init__(self, TgId):
        self.TgId = TgId
        user_data = get_user_raw(self.TgId)
        if user_data != 0:
            self.UID = user_data[0]
            self.Role = user_data[1]
            self.Name = user_data[3]
            self.Access = user_data[4]

    def user_setup(self):
        write_new_user(
            TgId=self.TgId,
            Name=self.Name,
            Access=self.Access,
            Role=self.Role
        )


class Trainings:
    """Класс для тренировок: создание, чтение"""
    def __init__(self, TgId):
        self.user = Users(TgId)
        self.event_date = None
        self.event_time = None
        self.user_slots = None
        self.slot = None

    def create(self):
        if not hasattr(self.user, 'UID'):
            return 'User not in system!'
        if self.user.Role != 'admin' and self.user.Role != 'captain':
            return 'User not permitted!'
        training_creation(
            creator_id=self.user.TgId,
            event_date=self.event_date,
            event_time=self.event_time,
            user_slots=self.user_slots
        )
        return 'Event has been created!'

    def request(self):
        result = training_request()
        return result


def access_db(func):
    """
    Decorator for connection to mysql DB.
    It's setting up the connection and forwarding cursor to func
    """
    def connector(*args, **kwargs):
        db = mysql.connector.connect(host=host, user=user, password=password, database=database)
        cursor = db.cursor()
        kwargs['cursor'] = cursor
        existence_code = func(*args, **kwargs)
        db.commit()
        cursor.close()
        db.close()
        return existence_code
    return connector


def parse_slots(slot):
    try:
        k = 0
        appointments = []
        for i in slot[6:]:
            if i is not None:
                appointments.insert(k, i)
                k += 1
        return appointments
    except:
        logging.error("DB: Exit code 4: error in parse slots", exc_info=True)



@access_db
def write_new_user(TgId, Name, Access, Role, cursor):
    try:
        RegDate = date.today()
        new_user = ("INSERT INTO users "
                    "(Role, TgId, Name, Access, RegDate) "
                    "VALUES (%s, %s, %s, %s, %s)")

        user_data = (Role, TgId, Name, Access, RegDate)
        cursor.execute(new_user, user_data)
        logging.info('DB: User has been created!')

    except:
        logging.error("DB: Exit code 1: error in write_db", exc_info=True)

@access_db
def get_user_raw(TgId, cursor):
    """Первичная инициализация пользователя"""
    try:
        request_find_user = ("SELECT * FROM users "
                             "WHERE TgId = %s" % TgId)
        cursor.execute(request_find_user)
        request_result = cursor.fetchall()
        if not request_result: return 0
        if len(request_result) >= 2:
            logging.warning('DB: Exit code 3: Multiple users found! ---  TgID: ' + str(TgId))
        return request_result[0]

    except:
        logging.error("DB: Exit code 2: error in read_db", exc_info=True)


@access_db
def training_creation(creator_id, event_date, event_time, user_slots, cursor):
    try:
        RegDate = date.today()
        new_training = ("INSERT INTO trainings "
                    "(creator_id, creation_date, event_date, event_time, user_slots) "
                    "VALUES (%s, %s, %s, %s, %s)")

        training_data = (creator_id, RegDate, event_date, event_time, user_slots)
        cursor.execute(new_training, training_data)
        logging.info('DB: Training has been created!')

    except:
        logging.error("DB: Exit code 1: error in write_db", exc_info=True)


@access_db
def training_request(cursor):
    try:
        today_date = date.today()
        d1 = today_date.strftime("%Y.%m.%d")
        request_events = ("SELECT * FROM trainings"
                             " WHERE event_date >= \"%s\"" % d1 + " ORDER BY event_date, event_time")
        cursor.execute(request_events)
        request_result = cursor.fetchall()
        return request_result

    except:
        logging.error("DB: Exit code 1: error in read_db_training", exc_info=True)


@access_db
def teamParse(event_id, cursor):
    try:
        request_events = ("SELECT * FROM trainings"
                             " WHERE UID = %s" % event_id)
        cursor.execute(request_events)
        request_result = cursor.fetchall()
        return request_result

    except:
        logging.error("DB: Exit code 1: error in read_db_training", exc_info=True)

@access_db
def enrollEvent(tgid, event_id, cursor):
    try:
        request_events = ("SELECT * FROM trainings"
                             " WHERE UID = %s" % event_id)
        cursor.execute(request_events)
        request_result = cursor.fetchone()
        max = request_result[5] + 6
        for index, i in enumerate(request_result[6:max]):
            if i == tgid:
                enroll_event = ("UPDATE trainings SET U%s" % (index + 1) + " = NULL" + " WHERE UID = %s" % event_id)
                print(enroll_event)
                cursor.execute(enroll_event)
                return 1
            if i is None:
                enroll_event = ("UPDATE trainings SET U%s" % (index + 1) + " = %s" % tgid + " WHERE UID = %s" % event_id)
                cursor.execute(enroll_event)
                return 0
        return 2

    except:
        logging.error("DB: Exit code 1: error in read_db_training", exc_info=True)