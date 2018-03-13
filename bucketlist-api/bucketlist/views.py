"""This module contains the routes for the application"""

from flask import request, jsonify, make_response, render_template
from sqlalchemy import func, or_, desc, and_
from dateutil.parser import parse
import re, datetime, jwt

from .utils import allow_cross_origin, authenticate, get_pagination_params, get_pagination_params, get_request_body
from . import app
from .models import db, BucketList, BucketItem, User

# public access
@app.route('/')
def index():
    return render_template("index.html")

@app.route("/auth/register", methods=['POST', 'OPTIONS'])
@allow_cross_origin
def register():
    """
	Registers new application user
    ---
    tags:
        - User account
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: user registration data
          in: body
          required: true
          description: Information about the new user.
          type: string
          schema:
            type: object
            required:
                - first_name
                - last_name
                - username
                - email
                - password
            properties:
                first_name:
                    type: string
                last_name:
                    type: string
                username:
                    type: string
                email:
                    type: string
                password:
                    type: string
    responses:
        201:
            description: Operation was successful
            schema:
              type: object
              properties:
                first_name:
                    type: string
                last_name:
                    type: string
                username:
                    type: string
        400:
            description: Invalid input
            schema:
              type: object
              properties:
                message:
                    type: string
                    description: A description of the error
                parameter:
                    type: string
                    description: The name of the missing property
        409:
            description: Duplicate username or email error
            schema:
              type: object
              properties:
                message:
                    type: string
                    description: A description of the error
                parameter:
                    type: string
                    description: The name of the duplicate parameter
    """

    if request.method == 'OPTIONS':
        return jsonify()

    body = get_request_body(request)
    
    first_name = body.get("first_name")
    last_name = body.get("last_name")
    username = body.get("username")
    email = body.get("email")
    password = body.get("password")

    if not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
        return jsonify(message = 'The email address is invalid', parameter = 'email'), 400

    if len(password) < 8:
        return jsonify(message = 'The password should be at least 8 characters long', parameter = 'password'), 400

    if not first_name:
         return jsonify(message = 'First name is missing', parameter = 'first_name'), 400

    if not last_name:
         return jsonify(message = 'Last name is missing', parameter = 'first_name'), 400

    if not username:
         return jsonify(message = 'Username is missing', parameter = 'username'), 400

    if not email:
         return jsonify(message = 'Email address is missing', parameter = 'email'), 400

    if not password:
         return jsonify(message = 'Password is missing', parameter = 'password'), 400

    email_exists = User.has_email(email)

    if email_exists:
        return jsonify(message = 'Email address already exists', parameter = 'email'), 409

    username_exists = User.has_username(username)

    if username_exists:
        return jsonify(message = 'Username already exists', parameter = 'username'), 409
    
    user = User(first_name, last_name, username, email, password)
    db.session.add(user)
    db.session.commit()

    created_user = User.query.filter_by(email = email).first()
    
    return jsonify(created_user.dict()), 201

@app.route("/auth/login", methods=['POST', 'OPTIONS'])
@allow_cross_origin
def login():
    """
    Logins in application user
    ---
    tags:
        - User account
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: user login data
          in: body
          required: true
          description: User login information
          type: object
          schema:
            type: object
            required:
                - username
                - password
            properties:
                username:
                    type: string
                password:
                    type: string
    responses:
        201:
            description: Operation was successful
            schema:
              type: object
              properties:
                token:
                    type: string
                user:
                    type: object
                    schema:
                        properties:
                            first_name:
                                type: string
                            last_name:
                                type: string
                            username:
                                type: string
        400:
            description: Missing property error
            schema:
              type: object
              properties:
                message:
                    type: string
                    description: A description of the error
                parameter:
                    type: string
                    description: The name of the missing property
        409:
            description: Duplicate username or email error
            schema:
              type: object
              properties:
                message:
                    type: string
                    description: A description of the error
                parameter:
                    type: string
                    description: The name of the duplicate parameter
    """
    
    if request.method == 'OPTIONS':
        return jsonify()

    auth = request.authorization

    if not auth:
        auth = get_request_body(request)
        username = auth.get('username')
        password = auth.get('password')
    else:
        username = auth.username
        password = auth.password

    if not username:
        return jsonify(message = 'Username is missing', parameter = 'username'), 400

    if not password:
        return jsonify(message = 'Password is missing', parameter = 'password'), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        user = User.query.filter_by(email=username).first()

    if not user:
        return jsonify(message = "Invalid login credentials"), 401

    if not user.verify_password(password):
        return jsonify(message = "Invalid login credentials"), 401

    # password matched login user
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=8*60)
    token = jwt.encode({'user_id':user.id, 'expiry':str(expiry)}, app.config['SECRET_KEY'], algorithm='HS256')
    token = token.decode('UTF-8')

    user.token = token
    user.token_expiry = expiry
    db.session.commit()

    return jsonify(token=token, user = user.dict())

@app.route("/auth/logout", methods=['POST', 'OPTIONS'])
@allow_cross_origin
@authenticate
def logout(user):
    """
    Logout application user
    ---
    tags:
        - User account
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          required: true
          description: User's token
          type: string

    responses:
        200:
            description: Operation was successful
            schema:
                type: object
        
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    if request.method == 'OPTIONS':
        return jsonify()

    expiry = datetime.datetime.utcnow() - datetime.timedelta(minutes=20)
    
    user.token_expiry = expiry
    db.session.commit()
    return jsonify(message='Logout was successful')

@app.route("/auth/reset-password", methods=['POST', 'OPTIONS'])
@allow_cross_origin
@authenticate
def reset_password(user):
    """
    Resets application user's password
    ---
    tags:
        - User account
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          required: true
          description: User's token
          type: string
        - name: payload
          in: body
          required: true
          description: User's token
          type: object
          schema:
            properties:
                old_password:
                    type: string
                new_password:
                    type: string
    responses:
        200:
            description: Operation was successful
            schema:
                type: object
        
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    if request.method == 'OPTIONS':
        return jsonify()

    body = get_request_body(request)
    old_password = body.get('old_password')
    new_password = body.get('new_password')

    if not old_password:
        return jsonify(message = 'Old password is missing', parameter='old_password'), 400

    if not new_password:
        return jsonify(message = 'New password is missing', parameter='new_password'), 400

    if not user.verify_password(old_password):
        return jsonify(message = 'Invalid old password'), 401

    user.set_password(new_password)
    db.session.commit()

    return jsonify(message="Password was changed successfully")

# private access

@app.route("/bucketlists", methods = ['GET', 'OPTIONS'])
@allow_cross_origin
@authenticate
def get_bucketlists(user):
    """
    Returns a list of bucketlists
    ---
    tags:
        - bucketlists
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: limit
          in: query
          required: false
          description: The number of results that should be returned
          type: integer
        - name: page
          in: query
          required: false
          description: The current page. Pages start from zero.
          type: integer
        - name: q
          in: query
          required: false
          description: The keywords to search.
          type: string
    security:
        - X-Token
    responses:
        200:
            description: Operation was successful
            schema:
                type: object
                properties:
                    id:
                        type: integer
                    name:
                        type: string
                    description:
                        type: string
                    
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """

    if request.method == 'OPTIONS' or not user:
        return jsonify()

    limit, page = get_pagination_params(request)
    query = request.args.get('q')

    offset = page * limit

    bucketlists = BucketList.query.filter(BucketList.user_id == user.id)

    if query:
        query = query.replace(' ', '%')
        bucketlists = bucketlists.filter(func.lower(BucketList.name).like('%' + func.lower(query) + '%'))
    
    bucketlists = bucketlists.order_by(desc(BucketList.created_at)).limit(limit).offset(offset)
    bucket_list = list()

    for bucketlist in bucketlists:
        _bucketlist = bucketlist.dict()
        bucket_list.append(_bucketlist)

    previous = '/bucketlists?limit={}'.format(limit)
    next = '/bucketlists?limit={}'.format(limit)

    if page >= 0:
        next = next + '&page={}'.format(page + 1)
        previous = previous + '&page={}'.format(page - 1)

    if page == 0:
        previous = ''

    return jsonify(bucketlists=bucket_list, paging=dict(previous=previous, next=next))

@app.route("/bucketlists", methods = ['POST', 'OPTIONS'])
@allow_cross_origin
@authenticate
def create_bucketlist(user):
    """
    Creates a new bucket
    ---
    tags:
        - bucketlists
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: payload
          in: body
          required: true
          description: The name and title of the new Bucket
          type: object
          schema:
            properties:
                name:
                    type: string
                description:
                    type: string
    security:
        - X-Token
    responses:
        201:
            description: Operation was successful
            schema:
                type: object
                properties:
                    id:
                        type: integer
                    name:
                        type: string
                    description:
                        type: string
                    created_at:
                        type: string
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    if request.method == 'OPTIONS':
        return jsonify()

    body = get_request_body(request)
    name = body.get('name')
    description = body.get('description')

    if not name:
        return jsonify(message='Bucket name is missing', parameter='name'), 400
    
    if not description:
        return jsonify(message='Bucket description is missing', parameter='description'), 400
    
    bucketlist = BucketList.query.filter(func.lower(BucketList.name) == func.lower(name)).first()
    
    if bucketlist:
        return jsonify(message='A bucket with that name already exists', parameter='name'), 400

    bucketlist = BucketList(name, description, owner = user)
    db.session.add(bucketlist)
    db.session.commit()

    return jsonify(bucketlist.dict()), 201

@app.route("/bucketlists/<int:id>", methods = ['GET', 'OPTIONS'])
@allow_cross_origin
@authenticate
def get_bucketlist(user, id):
    """
    Returns a bucket along with a list of its items
    ---
    tags:
        - bucketlists
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: id
          in: path
          type: integer
          required: true
          description: The id of the bucket
        - name: limit
          in: query
          required: false
          description: The number of results that should be returned
          type: integer
        - name: page
          in: query
          required: false
          description: The current page. Pages start from zero.
          type: integer
        - name: q
          in: query
          description: The keywords to search based on item title
          required: false
          type: string
    responses:
        200:
            description: Operation was successful
            schema:
                type: object
                properties:
                    id:
                        type: integer
                    name:
                        type: string
                    description:
                        type: string
                    items:
                        schema:
                            type: object
                            properties:
                                id:
                                    type: integer
                                title:
                                    type: string
                                description:
                                    type: string
                                due_date:
                                    type: string
                                is_complete:
                                    type: boolean
                                created_at:
                                    type: string
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    
    if request.method == 'OPTIONS' or not user:
        return jsonify()

    bucketlist = BucketList.query.filter_by(user_id = user.id, id = id).first()

    if bucketlist == None:
        return jsonify(message = 'The bucket you requested does not exist'), 404

    bucket_result = bucketlist.dict()
    bucket_result['items'] = list()
    limit, page = get_pagination_params(request)
    offset = limit * page
    query = request.args.get('q')
    items = BucketItem.query.filter(BucketItem.bucketlist_id == BucketList.id)

    if query:
        query = query.replace(' ', '%')
        items = items.filter(func.lower(BucketItem.title).like('%' + func.lower(query) + '%'))

    items = items.order_by(desc(BucketItem.created_at)).limit(limit).offset(offset)
    
    for item in items:
        bucket_result['items'].append(item.dict())

    previous = '/bucketlists/{}?limit={}'.format(id, limit)
    next = '/bucketlists/{}?limit={}'.format(id, limit)

    if page >= 0:
        next = next + '&page={}'.format(page + 1)
        previous = previous + '&page={}'.format(page - 1)

    if page == 0:
        previous = ''
    
    return jsonify(bucketlist = bucket_result, paging = dict(previous=previous, next=next))

@app.route("/bucketlists/<int:id>", methods = ['PUT', 'OPTIONS'])
@allow_cross_origin
@authenticate
def edit_bucketlist(user, id):
    """
    Edits a bucket
    ---
    tags:
        - bucketlists
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: id
          in: path
          type: integer
          required: true
          description: The id of the bucket
        - name: payload
          in: body
          required: true
          description: The name and title of the new Bucket
          type: object
          schema:
            properties:
                name:
                    type: string
                    required: false
                description:
                    type: string
                    required: false
    responses:
        200:
            description: Operation was successful
            schema:
                type: object
                properties:
                    id:
                        type: integer
                    name:
                        type: string
                    description:
                        type: string 
                    created_at:
                        type: string
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    
    if request.method == 'OPTIONS':
        return jsonify()
    
    body = get_request_body(request)
    name = body.get('name')
    description = body.get('description')
    bucketlist = BucketList.query.filter(and_(func.lower(BucketList.name) == func.lower(name)), BucketList.id != id).first()
    
    if bucketlist:
        return jsonify(message='A bucket with that name already exists', parameter='name'), 400

    bucketlist = BucketList.query.filter_by(user_id = user.id, id = id).first()

    if bucketlist == None:
        return jsonify(message = 'The bucket you requested does not exist'), 404
    
    

    if not body:
        return jsonify(message='At least one parameter is required', parameter=list("name", 'description')), 400

    if name:
        bucketlist.name = name
    if description:
        bucketlist.description = description

    db.session.commit()
    return jsonify(bucketlist.dict())

@app.route("/bucketlists/<int:id>", methods = ['DELETE', 'OPTIONS'])
@allow_cross_origin
@authenticate
def delete_bucketlist(user, id):
    """
    Deletes a bucket
    ---
    tags:
        - bucketlists
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: id
          in: path
          type: integer
          required: true
          description: The id of the bucket to delete
    responses:
        200:
            description: Operation was successful
            type: object
            schema:
                properties:
                    id:
                        type: integer
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    
    if request.method == 'OPTIONS':
        return jsonify()

    bucketlist = BucketList.query.filter_by(user_id = user.id, id = id).first()

    if bucketlist == None:
        return jsonify(message = 'The bucket you requested does not exist'), 404

    db.session.delete(bucketlist)
    db.session.commit()
    return jsonify(id=bucketlist.id) 

@app.route("/bucketlists/<int:id>/items", methods=['POST', 'OPTIONS'])
@allow_cross_origin
@authenticate
def add_bucket_item(user, id):
    """
    Creates a new bucket item
    ---
    tags:
        - Bucket items
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: id
          in: path
          type: integer
          required: true
        - name: payload
          in: body
          type: object
          description: Bucket item properties
          required: true
          schema:
            type: object
            properties:
                title: 
                    type: string
                description:
                    type: string
                due_date:
                    type: string
    responses:    
        201:
            description: Operation was successful
            schema:
                type: object
                properties:
                    id:
                        type: integer
                    title:
                        type: string
                    description:
                        type: string
                    due_date:
                        type: string
                    is_complete:
                        type: boolean
                    created_at:
                        type: string
                       
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    
    if request.method == 'OPTIONS':
        return jsonify()

    bucketlist = BucketList.query.filter_by(user_id = user.id, id = id).first()
    
    if bucketlist == None:
        return jsonify(error='The bucket you requested does not exist'), 404

    body = get_request_body(request)
    title = body.get('title')
    description = body.get('description')
    due_date = body.get('due_date')

    if title == None:
        return jsonify(message='Title is missing', parameter="title"), 400

    if description == None:
        return jsonify(message='Description is missing', parameter="description"), 400

    if due_date == None:
        return jsonify(message='Due date is missing', parameter="due_date"), 400

    try:
        parse(due_date)
    except:
        return jsonify(message='Due date is invalid', parameter="due_date"), 400

    item = BucketItem(title, description, due_date, bucketlist = bucketlist)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.dict()), 201

@app.route("/bucketlists/<int:bucketlist_id>/items/<int:item_id>", methods=['PUT', 'OPTIONS'])
@allow_cross_origin
@authenticate
def edit_bucket_item(user, bucketlist_id, item_id):
    """
    Edits an item in a specified bucket
    ---
    tags:
        - Bucket items
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: bucketlist_id
          in: path
          description: Bucket id
          required: true
          type: integer
        - name: item_id
          in: path
          description: Bucket item id
          type: integer
          required: true
        - name: payload
          in: body
          type: object
          description: Bucket item properties
          required: true
          schema:
            type: object
            properties:
                title: 
                    type: string
                description:
                    type: string
                due_date:
                    type: string
                is_complete:
                    type: boolean
    responses: 
        200:
            description: Operation was successful
            schema:
                type: object
                properties:
                    id:
                        type: integer
                    title:
                        type: string
                    description:
                        type: string
                    due_date:
                        type: string
                    is_complete:
                        type: boolean
                    created_at:
                        type: string   
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    
    if request.method == 'OPTIONS':
        return jsonify()

    bucketlist = BucketList.query.filter_by(user_id = user.id, id = bucketlist_id).first()
    
    if bucketlist == None:
        return jsonify(error='Bucket does not extist'), 404

    item = BucketItem.query.filter_by(bucketlist_id = bucketlist.id, id = item_id).first()

    if item == None:
        return jsonify(error='BucketItem does not extist'), 404

    body = get_request_body(request)
    title = body.get('title')
    description = body.get('description')
    is_complete = body.get('is_complete')
    due_date = body.get('due_date')
    
    try:
        is_complete = int(is_complete)
    except:
        is_complete = None

    if not body:
        return jsonify(message='Name or description is required', parameter=list("name", 'description')), 400

    if title:
        item.title = title

    if description:
        item.description = description

    if due_date:
        item.due_date = due_date
    
    if is_complete != None:
        print(bool(is_complete))
        item.is_complete = bool(is_complete)
    
    db.session.commit()
    
    return jsonify(item.dict())

@app.route("/bucketlists/<int:bucketlist_id>/items/<int:item_id>", methods=['DELETE', 'OPTIONS'])
@allow_cross_origin
@authenticate
def delete_bucket_item(user, bucketlist_id, item_id):
    """
    Deletes an item from a specified bucket
    ---
    tags:
        - Bucket items
    consumes:
        - "application/json"
    produces:
        - "application/json"
    parameters:
        - name: X-Token
          in: header
          description: The user's token
          required: true
          type: string
        - name: bucketlist_id
          in: path
          description: Bucket id
          required: true
          type: integer
        - name: item_id
          in: path
          description: Bucket item id
          type: integer
          required: true
    responses:
        200:
            description: Operation was successful
            type: object
            schema:
                properties:
                    id:
                        type: integer
        400:
            description: Parameter error
            schema:
                type: object
                properties:
                    message:
                        type: string
        401:
            description: Invalid token error
            schema:
                type: object
                properties:
                    message:
                        type: string
    """
    
    if request.method == 'OPTIONS':
        return jsonify()

    bucketlist = BucketList.query.filter_by(user_id = user.id, id = bucketlist_id).first()
    
    if bucketlist == None:
        return jsonify(error='The bucket you requested does not extist'), 404

    item = BucketItem.query.filter_by(bucketlist_id = BucketList.id, id = item_id).first()

    if item == None:
        return jsonify(error='Bucket item does not extist'), 404
    
    db.session.delete(item)
    db.session.commit()
    return jsonify(id=item.id)
