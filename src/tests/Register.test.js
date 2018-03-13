import React from 'react';
import { shallow } from 'enzyme';
import Register from '../components/Register';
import MockAdapter from 'axios-mock-adapter';

describe("Register component", () => {
    const wrapper = shallow(<Register />);
    const apiMock = new MockAdapter(wrapper.instance().xhr)

    it("Should render", () => {
        
        expect(wrapper.find('.form-heading').text()).toContain("Create an account")
    });

    it("Should disable submit button when form is submitted", () => {
        wrapper.find('#entry-form').simulate('submit', {
            preventDefault: () => {}
        });
        
        expect(wrapper.find('#entry-form button').props().disabled).toBe(true)
    });

    it("Can register new user", () => {
        apiMock.onPost('/auth/register')
        .reply(201, {});

        wrapper.find('#entry-form').simulate('submit', {
            preventDefault: () => {}
        });
    })

    it("Handles invalid input", () => {
        apiMock.onPost('/auth/register')
        .reply(400, {});

    })
});
