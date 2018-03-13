from flask import Flask
from flask_migrate import Migrate, MigrateCommand
from flasgger import Swagger
import os
from .models import db

swagger = Swagger()
migrate = Migrate()

def create_app(testing):
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('APP_SECRET')
    app.config['REQUESTS_ORIGIN'] = os.getenv('REQUESTS_ORIGIN')
    app.config['TOKEN_NAME'] = 'X-Token'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

    if testing:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('TEST_DATABASE_URL')
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')

    db.init_app(app)
    migrate.init_app(app, db)
    swagger.init_app(app)

    with app.app_context():
        db.create_all()
    
    return app
