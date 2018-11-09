import React from 'react';
import { shallow } from 'enzyme';
import Login from '../components/Login';
import MockAdapter from 'axios-mock-adapter';

describe("Login component", () => {
    let wrapper = shallow(<Login />);
    const mock = new MockAdapter(wrapper.instance().xhr)
    mock.onPost('/auth/login')
    .reply(200, {
        "token": "thephJwyJgyI1T4AJARFHrWA", 
        "user": {
          "email": "user@example.com", 
          "first_name": "user", 
          "last_name": "user", 
          "user_name": "user"
        }
    })

    it("Should render", () => {
        expect(wrapper.find('.form-heading').text()).toContain("Sign in to your account")
    });

    it("Should disable submit button when form is submitted", () => {
       
        wrapper.find('#entry-form').simulate('submit', {
            preventDefault: () => {}
        });
        
        expect(wrapper.find('#entry-form button').props().disabled).toBe(true)
    })

    it("Can login correctly", () => {
        wrapper.instance().onSubmit({
            preventDefault: () => {}
        });
    })
});
