import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import { shallow } from 'enzyme';
import App from '../App';
import renderer from 'react-test-renderer';
import MockAdapter from 'axios-mock-adapter';

global.window = {};
global.history = {};

let store = {}
global.localStorage = {
    getItem: key => {
        return `{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHBpcnkiOiIyMDE3LTA5LTI3IDIwOjAyOjUyLjYxNjk0MSJ9.3Qgmdip-oluZKFlFsCTrqq16H8gwnVpQQyY2z4YzJSU","user":{"email":"jdoe@example.com","first_name":"john","last_name":"doe","user_name":"jdoe"}}`
    },
    setItem: (key, value) => {
        store[key] = value
    },
    removeItem: key => Reflect.deleteProperty(store, key)
}


describe("App", () => {
  let app = new App();
  const wrapper = shallow(<App />);

  const mock = new MockAdapter(wrapper.instance().xhr);
 
  mock.onGet('/bucketlists')
  .reply(200,{
    "bucketlists": [
      {
        "created_at": "Wed, 20 Sep 2017 12:37:11 GMT", 
        "description": "The best description ever", 
        "id": 1, 
        "name": "By awesome bucket"
      }
    ], 
    "paging": {
      "next": "/bucketlists?limit=12&page=1", 
      "previous": ""
    }
  }
  )

  mock.onPost('/bucketlists')
  .reply(201, {})

  mock.onGet(/\/bucketlists\/[0-9]+/)
  .reply(200, {
    "bucketlist": {
      "created_at": "Wed, 20 Sep 2017 12:37:11 GMT", 
      "description": "The best description ever", 
      "id": 18, 
      "items": [
        {
          "created_at": "Wed, 20 Sep 2017 12:49:39 GMT", 
          "description": "And check out some drunken monkeys.", 
          "due_date": "Tue, 03 Oct 2017 00:00:00 GMT", 
          "id": 1, 
          "is_complete": false, 
          "title": "Go to the zoo"
        }, 
        {
          "created_at": "Wed, 20 Sep 2017 12:48:26 GMT", 
          "description": "In ragged tight sweatpants.", 
          "due_date": "Fri, 29 Sep 2017 00:00:00 GMT", 
          "id": 2, 
          "is_complete": false, 
          "title": "Watch a 3D movie"
        }
      ], 
      "name": "By awesome bucket"
    }, 
    "paging": {
      "next": "/bucketlists/18?limit=12&page=1", 
      "previous": ""
    }
  }
  )

  mock.onPost(/\/bucketlists\/[0-9]+\/items/)
  .reply(201, {
    id: 1,
    title: "foobar"
  })

  beforeEach(() => {
    app.state = {};
    app.state.buckets = [
      {
        name:"Learning bucket", 
        id: 1,
        description: "This is where all the stuff to learn goes"
      }
    ];
  });

  mock.onDelete(/\/bucketlists\/[0-9]+\/items\/[0-9]+/)
  .reply(200, {id: 1})

  mock.onPut(/\/bucketlists\/[0-9]+\/items\/[0-9]+/)
  .reply(200, {id: 1, title: "bar"})

  mock.onPost('/auth/reset-password')
  .reply(200, {})

  mock.onPost('/auth/logout')
  .reply(200, {})
  
  it("Snapshot test", () => {
    const rendered = renderer.create(
      <MemoryRouter>
        <App />
    </MemoryRouter>
    );
    expect(rendered.toJSON()).toMatchSnapshot();
  });

  it("Can search", () => {
    let { state } = wrapper.instance();
    state.search = "kdk"
    
    state.currentBucket = {
        id: 1,
        items: [{id: 1}]
      }

    wrapper.instance().setState(state);
    
    wrapper.instance().onSearchKeyDown({
      keyCode: 13,
      preventDefault: () => {}
    })

    expect(wrapper.instance().state.isSearching).toBe(true)
  });

  it("Can toggle Search", () => {
    wrapper.instance().toggleSearch({
      preventDefault: () => {}
    })

    expect(wrapper.instance().state.showSearch).toBe(true)
  })

  it("Can remove bucket from state", () => {
    mock.onDelete(/bucketlists\/[0-9]+/)
    .reply(200, {id: 1})

    wrapper.instance().setState({
      buckets: [
        {
          id: 1
        }
      ]
    })

    wrapper.instance().onBucketDeleteClick({
      preventDefault: () => {}
    })
    .then(() => {
      expect(wrapper.instance().state.buckets.length).toBe(0)
    })

    
  })

  it("Typing in search input field works", () => {
    wrapper.instance().onSearchChange({
      target: {value: "foosearch"}
    })

    expect(wrapper.instance().state.search).toBe("foosearch")
  })

  describe("New bucket", () => {
      
      it("Should disable submit button when form is submitted", () => {
          wrapper.find('NewBucketForm').simulate('submit', {
            preventDefault: () => {}
          })

          expect(wrapper.find('NewBucketForm').props().isDisabled).toBe(true)
      })
      
  })

  describe("New item", () => {
    
    it("Should disable submit button when form is submitted", () => {
        wrapper.instance().setState({currentBucket: {
          id: 1
        }})

        wrapper.find('NewItemForm').simulate('submit', {
          preventDefault: () => {}
        })

        expect(wrapper.find('NewItemForm').props().isDisabled).toBe(true)
    })
    
    it("Can delete item", () => {
      const instance = wrapper.instance()
      instance.setState({currentBucket: {
        id: 2,
        items: [{id: 1}]
      }})
      
      wrapper.instance().onItemDelete(1)
      .then(() => {
        expect(instance.state.currentBucket.items.length).toBe(0)
      })
    })

    it("Can edit item", () => {
      const instance = wrapper.instance()
      instance.setState({currentBucket: {
        id: 1,
        items: [{id: 1, name: "foo"}]
      }})
      
      wrapper.instance().onItemEdit(1, {title: ''})
      .then(() => {
        expect(instance.state.currentBucket.items[0].title).toBe('bar')
      })
    })

    it("Can add new item", () => {
      let numOfItems = wrapper.instance().state.currentBucket.items.length
      wrapper.instance().onNewItemFormSubmit({
        preventDefault: () => {}
      })
      .then(() => {
        expect(wrapper.instance().state.currentBucket.items.length).toBe(numOfItems + 1)
      })
    })

    it("Can toggle item status", () => {
      wrapper.instance().setState({
        currentBucket: {
          id: 1,
          items: [{
            id: 1,
            is_complete: false
          }]
        }
      });

      wrapper.instance().toggleItem(1)
      .then(() => {
        expect(wrapper.instance().state.currentBucket.items[0].is_complete).toBe(true)
      })
    })
  })

  describe("Edit bucket", () => {
    
    it("Should disable submit button when form is submitted", () => {
        wrapper.instance().setState({currentBucket: {
          id: '927818'
        }})
        wrapper.find('EditBucketForm').simulate('submit', {
          preventDefault: () => {}
        })

        expect(wrapper.find('EditBucketForm').props().isDisabled).toBe(true)
    })
    
  })

  describe("Password reset", () => {
    it("Should disable submit button when form is submitted", () => {
         wrapper.instance().setState({
          resetPassword: {
            oldPassword: '', 
            newPassword: '1234567890', 
            newPasswordRepeat: '1234567890'
          }
        })

        wrapper.find('ResetPasswordForm').simulate('submit', {
          preventDefault: () => {}
        })

        expect(wrapper.find('ResetPasswordForm').props().isDisabled).toBe(true)
    })

    it("onChange works for checkboxes", () => {
      wrapper.instance().onPasswordResetChange({
        target: {
          name: "checkbox",
          type: "checkbox",
          checked: true
        }
      })
      expect(wrapper.instance().state.resetPassword.checkbox).toBe(true)
    })

    it("onChange works for non-checkboxes", () => {
      wrapper.instance().onPasswordResetChange({
        target: {
          name: "oldPassword",
          type: "text",
          value: "123"
        }
      })
      expect(wrapper.instance().state.resetPassword.oldPassword).toBe("123")
    })

    it("Should fail when paswords do not match", () => {
      wrapper.instance().setState({
        resetPassword: {
          oldPassword: '', 
          newPassword: '12345678jsk', 
          newPasswordRepeat: '1234567890'
        }
      })

      wrapper.find('ResetPasswordForm').simulate('submit', {
        preventDefault: () => {}
      })

      expect(wrapper.find('ResetPasswordForm').props().formClass).toBe('failed')
    })

    it("New password length should be < 8", () => {
      wrapper.instance().setState({
        resetPassword: {
          oldPassword: '', 
          newPassword: '1234567', 
          newPasswordRepeat: '1234567'
        }
      })

      wrapper.find('ResetPasswordForm').simulate('submit', {
        preventDefault: () => {}
      })

      expect(wrapper.find('ResetPasswordForm').props().formClass).toBe('failed')
    })
    
  });

  it("stopPropagation works", () => {
    const stopPropagation = jest.fn();
    wrapper.instance().stopPropagation({
      stopPropagation
    })

    expect(stopPropagation).toBeCalled()
  })

  it("Can logout", () => {
    wrapper.instance().logout()
   .then(() => {
      expect(wrapper.instance().state.redirectToLogin).toBe(true)
   })
  })

});
