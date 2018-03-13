import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import NewItemForm from '../components/forms/NewItemForm';

describe("NewItemForm", () => {
    it("Should render", () => {
        let root = shallow(<NewItemForm />);
        expect(root.find('.o-title').text()).to.contain("Create a new goal in")
    });
});
