import unittest, datetime
from bucketlist import create_app
import json, os

app = create_app(testing = True)
from bucketlist.views import *

with app.app_context():   
    db.drop_all()

class TestEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client
        self.user_data = {
            "first_name": "John",
            "last_name": "Doe",
            "username": "jdoe",
            "email": "jdoe@example.com",
            "password": "1234567890"
        }

        with app.app_context():   
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with app.app_context():
            db.session.expunge_all()
            db.session.close()
            db.drop_all()

    def test_config(self):
        self.assertEqual(os.getenv('TEST_DATABASE_URL'), app.config.get('SQLALCHEMY_DATABASE_URI'))

    def test_can_create_account(self):
        res = self.client().post('/auth/register', data = self.user_data)
        self.assertEqual(res.status_code, 201)
        self.assertIn(self.user_data["first_name"], res.data.decode())
    
    def test_can_login(self):
        res = self.client().post('/auth/login', data = self.user_data)
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data.decode())

    def test_can_logout(self):
        res = self.client().post('/auth/login', data = self.user_data)
        self.assertEqual(res.status_code, 200)

        token = self.login()
        res = self.client().post('/auth/logout', headers={"X-Token": token})
        self.assertEqual(res.status_code, 200)

    def test_can_reset_password(self):
        # login to get token
        token = self.login()

        # reset the password
        self.client().post('/auth/reset-password', data={"new_password": "0987654321", "old_password": "1234567890"}, headers={"X-Token": token})
        
        # logout
        res = self.client().post('/auth/logout', headers={"X-Token": token})
        # attempt loggin in with the password
        
        res = self.client().post('/auth/login', data = {"username": self.user_data['username'], 'password': '0987654321'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data.decode())

        # set the password back to the original
        # self.client().post('/auth/reset-password', data={"new_password": "1234567890", "old_password": "0987654321"}, headers={"X-Token": token})
        

    def test_can_create_bucket(self):
        token = self.login()
        res = self.client().post('/bucketlists', data={"name": "Bucket 1", "description":"73828h8"}, headers={"X-Token": token})
        self.assertEqual(res.status_code, 201)
        self.assertIn('id', res.data.decode())

        res = self.client().post('/bucketlists', data={}, headers={"X-Token": token})
        self.assertEqual(res.status_code, 400)

        res2 = self.client().post('/bucketlists', data={"name": "Bucket 1"}, headers={"X-Token": token})
        self.assertEqual(res2.status_code, 400)

    def test_can_retrieve_buckets(self):
        token = self.login()
        res = self.client().get('/bucketlists', headers={"X-Token": token})
        data = json.loads(res.data.decode())
        self.assertEqual(res.status_code, 200)

    def test_can_edit_bucket(self):
        token = self.login()
        res = self.client().get('/bucketlists', headers={"X-Token": token})
        buckets = json.loads(res.data.decode())
        res2 = self.client().put('/bucketlists/'+str(buckets['bucketlists'][0]['id']), data={'name':"The bucket"}, headers={"X-Token": token})
        self.assertEqual(res2.status_code, 200)

    def test_can_delete_bucket(self):
        token = self.login()
        res = self.client().post('/bucketlists', data={"name": "Bucket 2", "description":"73828h8"}, headers={"X-Token": token})
        buckets = json.loads(res.data.decode())
        res2 = self.client().delete('/bucketlists/'+str(buckets['id']), headers={"X-Token": token})
        self.assertEqual(res2.status_code, 200)

    def test_can_create_item(self):
        token = self.login()
        create_bucket_res = self.client().post('/bucketlists', data={"name": "Bucket with items 1", "description":"It has some items"}, headers={"X-Token": token})
        data = json.loads(create_bucket_res.data.decode())
        res = self.client().post('/bucketlists/'+str(data['id'])+'/items', data={'title': "Item 1", "description":"item 1 desc", "due_date": "2017/09/02"}, headers={"X-Token": token})
        self.assertEqual(res.status_code, 201)

    def test_can_edit_item(self):
        token = self.login()
        create_bucket_res = self.client().post('/bucketlists', data={"name": "Bucket with items 2", "description":"It has some items"}, headers={"X-Token": token})
        bucket_data = json.loads(create_bucket_res.data.decode())
        create_item_res = self.client().post('/bucketlists/'+str(bucket_data['id'])+'/items', data={'title': "Item", "description":"item 1 desc", "due_date": "2017/09/02"}, headers={"X-Token": token})
        item_data = json.loads(create_item_res.data.decode())
        edit_item_res = self.client().put('/bucketlists/'+str(bucket_data['id'])+'/items/'+str(item_data['id']), data={'title': "Cool item", "description":"item", "due_date": "2017/09/08"}, headers={"X-Token": token})
        
        self.assertEqual(edit_item_res.status_code, 200)
    
    def test_can_delete_item(self):
        token = self.login()
        create_bucket_res = self.client().post('/bucketlists', data={"name": "Bucket with items 22", "description":"It has some items"}, headers={"X-Token": token})
        bucket_data = json.loads(create_bucket_res.data.decode())
        create_item_res = self.client().post('/bucketlists/'+str(bucket_data['id'])+'/items', data={'title': "Item 6", "description":"item 1 desc", "due_date": "2017/09/02"}, headers={"X-Token": token})
        item_data = json.loads(create_item_res.data.decode())
        delete_item_res = self.client().delete('/bucketlists/'+str(bucket_data['id'])+'/items/'+str(item_data['id']), data={'title': "Cool item", "description":"item", "due_date": "2017/09/08"}, headers={"X-Token": token})
        
        self.assertEqual(delete_item_res.status_code, 200)

    def login(self):
        login_res = self.client().post('/auth/login', data = self.user_data)
        if login_res.status_code == 401:
             login_res = self.client().post('/auth/login', data = {"username":"jdoe", "password":"0987654321"})
        return json.loads(login_res.data.decode())['token']


if __name__ == '__main__':
    unittest.main()
