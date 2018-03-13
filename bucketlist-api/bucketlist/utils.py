"""This module contains utility function"""
import jwt, datetime
from functools import wraps
from flask import request, jsonify, make_response
from . import app
from .models import User

def add_response_headers(headers={}):
    """This decorator adds the headers passed in to the response"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            resp = make_response(f(*args, **kwargs))
            h = resp.headers
            for header, value in headers.items():
                h[header] = value
            return resp
        return decorated_function
    return decorator


def allow_cross_origin(f):
    @wraps(f)
    @add_response_headers({
        'Access-Control-Allow-Headers': app.config['TOKEN_NAME'] + ', Content-Type',
        'Access-Control-Allow-Origin': app.config['REQUESTS_ORIGIN'],
        'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, PUT, DELETE'
    })
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def authenticate(f):
    @wraps(f)
    def inner(*args, **kwargs):

        if request.method == 'OPTIONS':
            return f(None, *args, **kwargs)
        token = None
        if app.config['TOKEN_NAME'] in request.headers:
            token = request.headers[app.config['TOKEN_NAME']]

        if not token:
            token = request.args.get('token')

        if not token:
            return jsonify(message="Missing token"), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            
        except:
            return jsonify(message="Invalid token"), 401

        user = User.query.get(data['user_id'])
        now = datetime.datetime.utcnow()
        
        if not user:
            return jsonify(message="Invalid token"), 401

        if not token == user.token:
            return jsonify(message="Invalid token"), 401

        if now > user.token_expiry:
            return jsonify(message="Expired token"), 401

        if not user:
            return jsonify(message="Invalid token"), 401

        return f(user, *args, **kwargs)
    return inner

def get_request_body(request):
    """Returns the request body."""
    content_type = request.content_type
    
    if 'application/json' in content_type:
        return request.json
    return request.form

def get_user_id(request):
    """Gets user_id from the query string or from the request body, for POST requests."""
    if request.method == 'POST':
        return get_request_body(request).get('user_id')
    
    return request.args.get('user_id')

def get_pagination_params(request):
    limit = request.args.get('limit')
    page = request.args.get('page')
    
    try:
        limit = int(limit)
    except:
        limit = 12

    try:
        page = int(page)
    except:
         page = 0
    
    limit = 12 if limit < 0 else limit
    page = 0 if page < 0 else page

    return limit, page
