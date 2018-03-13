import unittest, datetime
from bucketlist import create_app
import json

app = create_app(True)
from bucketlist.views import *

    
class TestUserModel(unittest.TestCase):

    def setUp(self):
        first_name = "John"
        last_name = 'Doe'
        username = 'jdoe'
        email = 'jdoe@example.com'
        password = 'theSecurePassword'

        with app.app_context():   
            db.create_all()
        
            user = User.query.filter_by(email = email).first()

            if user == None:
                user = User(first_name, last_name, username, email, password)

                db.session.add(user)
                db.session.commit()

                self.user = User.query.filter_by(email=user.email).first()
            else:
                self.user = user

        # Add a Bucket
        self.bucket_name = "Bucket 1"
        bucket_description = "Bucket 1's description"
        bucket = BucketList(self.bucket_name, bucket_description, owner = self.user)

        with app.app_context():
            db.session.add(bucket)
            db.session.commit()

            self.bucket = BucketList.query.filter_by(user_id = self.user.id).first()
        # Add a BucketItem
        self.title = "To do 1"
        description="To do description"
        due_date = datetime.date(2017, 7, 25)
        item = BucketItem(self.title, description, due_date, bucketlist=self.bucket)

        with app.app_context():
            db.session.add(bucket)
            db.session.commit()

            self.item = BucketItem.query.filter_by(bucketlist_id = self.bucket.id).first()

    # User

    def test_can_create_user(self):
        with app.app_context():
            created_user = User.query.get(self.user.id)
            self.assertEqual(self.user.email, created_user.email)
    
    def test_can_verify_password(self):
        self.assertTrue(self.user.verify_password('theSecurePassword'))
    
    def test_can_check_if_email_exists(self):
        with app.app_context():
            uname_exists1 = User.has_email('jdoe@example.com')
            self.assertTrue(uname_exists1)

            uname_exists2 = User.has_email('jbosco@example.com')
            self.assertFalse(uname_exists2)
    
    def test_can_check_if_username_exists(self):
        with app.app_context():
            uname_exists1 = User.has_username('jdoe')
            self.assertTrue(uname_exists1)

            uname_exists2 = User.has_username('jbosco')
            self.assertFalse(uname_exists2)
    
    def test_can_check_by_user_id_if_user_exists(self):
        with app.app_context():
            user_exists = User.user_exists(self.user.id)
            self.assertTrue(user_exists)

            user_exists = User.user_exists('3jdjd')
            self.assertFalse(user_exists)

    def test_can_delete_user(self):
        with app.app_context():
            user = User.query.get(self.user.id)
            db.session.delete(user)
            db.session.commit()

            deleted_user = User.query.get(self.user.id)
            
            self.assertIsNone(deleted_user)

    # # Bucket

    def test_can_add_bucket(self):
        self.assertEqual(self.bucket_name, self.bucket.name)
    
    def test_can_delete_bucket(self):
        with app.app_context():
            bucket_id = self.bucket.id

            db.session.delete(self.bucket)
            db.session.commit()

            bucket = BucketList.query.get(bucket_id)

            self.assertIsNone(bucket)
    
