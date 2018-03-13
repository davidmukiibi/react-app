import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import ResetPasswordForm from '../components/forms/ResetPasswordForm';

describe("ResetPasswordForm", () => {
    it("Should render", () => {
        let root = shallow(<ResetPasswordForm />);
        expect(root.find('.o-title').text()).to.equal("Reset password")
    });
});
