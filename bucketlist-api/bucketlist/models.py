from passlib.hash import sha256_crypt
from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key = True)
    first_name = db.Column(db.String(255), nullable = False)
    last_name = db.Column(db.String(255), nullable = False)
    username = db.Column(db.String(255), unique = True, nullable = False)
    email = db.Column(db.String(255), unique = True, nullable = False)
    password_hash = db.Column(db.String(255), nullable = False)
    token = db.Column(db.String(255), nullable = True)
    token_expiry = db.Column(db.DateTime, nullable = True)
    password_reset_token = db.Column(db.String(255), nullable = True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    buckets = db.relationship('BucketList', backref=db.backref('owner', lazy=True))
    
    def __init__(self, first_name, last_name, username, email, password):
        self.first_name = first_name
        self.last_name = last_name
        self.username = username
        self.email = email
        self.set_password(password)

    def set_password(self, password):
        self.password_hash = sha256_crypt.hash(password)
    
    def verify_password(self, password):
        return sha256_crypt.verify(password, self.password_hash)
    
    def dict(self):
        result = dict()
        result['first_name'] = self.first_name
        result['last_name'] = self.last_name
        result['user_name'] = self.username
        result['email'] = self.email
        return result

    @staticmethod
    def has_email(email):
        user = User.query.filter_by(email = email).first()
        return False if user == None else True
    
    @staticmethod
    def has_username(username):
        user = User.query.filter_by(username = username).first()
        return False if user == None else True

    @staticmethod
    def user_exists(id):
        try:
            id = int(id)
        except:
            return False

        user = User.query.get(id)
        return False if user == None else True

class BucketList(db.Model):
    __tablename__ = "bucketlists"
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(140), nullable = False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    items = db.relationship('BucketItem', cascade="delete", backref = db.backref("bucketlist", lazy = True))

    def __init__(self, name, description, owner = None):
        self.name = name
        self.description = description
        self.owner = owner
    
    def dict(self):
        result = dict()
        result['id'] = self.id
        result['name'] = self.name
        result['description'] = self.description
        result['created_at'] = self.created_at
        return result
        
class BucketItem(db.Model):
    __tablename__ = "bucket_items"
    id = db.Column(db.Integer, primary_key = True)
    title = db.Column(db.String(140))
    description = db.Column(db.String(250))
    is_complete = db.Column(db.Boolean, default=False, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    bucketlist_id = db.Column(db.Integer, db.ForeignKey('bucketlists.id'))
    
    def __init__(self, title, description, due_date, bucketlist = None):
        self.title = title
        self.description = description
        self.bucketlist = bucketlist
        self.due_date = due_date

    def dict(self):
        result = dict()
        result['id'] = self.id
        result['title'] = self.title
        result['description'] = self.description
        result['is_complete'] = self.is_complete
        result['due_date'] = self.due_date
        result['created_at'] = self.created_at
        return result
