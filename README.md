# YachtWind Telegram Web Application

This project is designed for a student sailing club to streamline training management. Previously, training sessions were organized through Telegram chats, which was cumbersome and inefficient. This web application allows instructors to easily schedule training sessions and enables students to effortlessly enroll in them. The application also provides features such as statistics, user management, maintenance reports and more.

## Prerequisites:
1. Python 3.11 or above
2. Docker
3. MySQL 8.0 or above
4. Nginx

## Libraries to install:
1. flask
2. mysql-connector-python
3. python-dotenv

## Database structure
### users:

| Field                  | Type         | Null | Key | Default | Extra          |
| ---------------------- | ------------ | ---- | --- | ------- | -------------- |
| user_id                | int          | NO   | PRI | NULL    | auto_increment |
| user_role              | varchar(7)   | NO   |     | regular |                |
| user_telegram_id       | varchar(20)  | NO   |     | NULL    |                |
| user_last_name         | varchar(255) | NO   |     | NULL    |                |
| user_first_name        | varchar(255) | NO   |     | NULL    |                |
| user_middle_name       | varchar(255) | NO   |     | NULL    |                |
| user_access_flag       | tinyint(1)   | NO   |     | 0       |                |
| user_registration_date | date         | NO   |     | NULL    |                |

### teams:

| Field             | Type         | Null | Key | Default   | Extra             |
| ----------------- | ------------ | ---- | --- | --------- | ----------------- |
| team_id           | int          | NO   | PRI | NULL      | auto_increment    |
| team_name         | varchar(20)  | NO   |     | NULL      |                   |
| team_description  | varchar(255) | YES  |     | NULL      |                   |
| team_creator_id   | varchar(20)  | NO   |     | NULL      |                   |
| team_status       | tinyint(1)   | NO   |     | 1         |                   |
| team_date_created | date         | NO   |     | curdate() | DEFAULT_GENERATED |

### events:

| Field               | Type        | Null | Key | Default | Extra          |
| ------------------- | ----------- | ---- | --- | ------- | -------------- |
| event_id            | int         | NO   | PRI | NULL    | auto_increment |
| event_datetime      | datetime    | NO   |     | NULL    |                |
| event_author_id     | varchar(20) | NO   |     | NULL    |                |
| event_creation_date | date        | NO   |     | NULL    |                |
| event_slot_num      | int         | NO   |     | NULL    |                |
| event_boat_num      | smallint    | YES  |     | NULL    |                |

### team_participations:

| Field            | Type | Null | Key | Default | Extra          |
| ---------------- | ---- | ---- | --- | ------- | -------------- |
| participation_id | int  | NO   | PRI | NULL    | auto_increment |
| user_id          | int  | NO   |     | NULL    |                |
| team_id          | int  | NO   |     | NULL    |                |

### enrollments:

| Field                   | Type     | Null | Key | Default           | Extra             |
| ----------------------- | -------- | ---- | --- | ----------------- | ----------------- |
| enrollment_id           | int      | NO   | PRI | NULL              | auto_increment    |
| user_id                 | int      | NO   |     | NULL              |                   |
| event_id                | int      | NO   |     | NULL              |                   |
| enrollment_datetime_utc | datetime | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
